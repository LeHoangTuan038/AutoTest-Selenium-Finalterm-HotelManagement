// =========================================================================
// MODULE 6: NHÂN SỰ & PHÂN QUYỀN (RBAC) - MODELS
// =========================================================================

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuanTriKhachSanN5.Models
{
    // Bảng Roles: Nhóm quyền
    public class Role
    {
        public int Id { get; set; }
        public string Name { get; set; } // Admin, Receptionist, etc.
        public ICollection<Role_Permission> RolePermissions { get; set; }
        public ICollection<User_Role> UserRoles { get; set; }
    }

    // Bảng Permissions: Quyền cụ thể
    public class Permission
    {
        public int Id { get; set; }
        public string Name { get; set; } // CreateBooking, ViewRooms, etc.
        public ICollection<Role_Permission> RolePermissions { get; set; }
    }

    // Bảng Role_Permissions: Liên kết Role và Permission
    public class Role_Permission
    {
        public int Id { get; set; }
        public int RoleId { get; set; }
        public Role Role { get; set; }
        public int PermissionId { get; set; }
        public Permission Permission { get; set; }
    }

    // Bảng User_Roles: Liên kết User và Role (many-to-many)
    public class User_Role
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; }
        public int RoleId { get; set; }
        public Role Role { get; set; }
    }

    // Bảng Audit_Logs: Log hệ thống (Đồng bộ cấu trúc cột thực tế trong SQL Server)
    [Table("Audit_Logs")]
    public class Audit_Log
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("user_id")]
        public int? UserId { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }

        [Column("role_name")]
        public string? RoleName { get; set; }

        [Column("log_date")]
        public DateTime LogDate { get; set; } = DateTime.UtcNow;

        [Column("log_data")]
        public string LogData { get; set; } = string.Empty;

        // Bọc NotMapped để tương thích hoàn toàn với các class gọi đến nó
        [NotMapped]
        public string Action 
        { 
            get => ExtractJson("action"); 
            set => UpdateJson("action", value); 
        }

        [NotMapped]
        public string TableName 
        { 
            get => ExtractJson("tableName"); 
            set => UpdateJson("tableName", value); 
        }

        [NotMapped]
        public int? RecordId 
        { 
            get => int.TryParse(ExtractJson("recordId"), out int r) ? r : null; 
            set => UpdateJson("recordId", value?.ToString() ?? ""); 
        }

        [NotMapped]
        public string? OldValue 
        { 
            get => ExtractJson("oldValue"); 
            set => UpdateJson("oldValue", value ?? ""); 
        }

        [NotMapped]
        public string? NewValue 
        { 
            get => ExtractJson("newValue"); 
            set => UpdateJson("newValue", value ?? ""); 
        }

        [NotMapped]
        public DateTime CreatedAt 
        { 
            get => LogDate; 
            set => LogDate = value; 
        }

        private string ExtractJson(string prop)
        {
            try {
                if (string.IsNullOrEmpty(LogData)) return "";
                using var doc = System.Text.Json.JsonDocument.Parse(LogData);
                if (doc.RootElement.TryGetProperty(prop, out var p)) return p.GetString() ?? p.ToString();
                return "";
            } catch { return ""; }
        }

        private void UpdateJson(string prop, string val)
        {
            try {
                var dict = new Dictionary<string, object>();
                if (!string.IsNullOrEmpty(LogData)) {
                    try { dict = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(LogData) ?? new(); } catch {}
                }
                dict[prop] = val;
                LogData = System.Text.Json.JsonSerializer.Serialize(dict);
            } catch {}
        }
    }
}
