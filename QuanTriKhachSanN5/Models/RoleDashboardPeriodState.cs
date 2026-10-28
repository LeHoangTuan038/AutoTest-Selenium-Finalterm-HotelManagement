using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuanTriKhachSanN5.Models;

[Table("Role_Dashboard_Period_States")]
public class RoleDashboardPeriodState
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("role_id")]
    public int RoleId { get; set; }

    [Column("role_name")]
    public string RoleName { get; set; } = null!;

    [Column("dashboard_code")]
    public string DashboardCode { get; set; } = null!;

    [Column("dashboard_title")]
    public string DashboardTitle { get; set; } = null!;

    [Column("period_type")]
    public string PeriodType { get; set; } = null!;

    [Column("period_key")]
    public string PeriodKey { get; set; } = null!;

    [Column("period_start")]
    public DateTime PeriodStart { get; set; }

    [Column("period_end")]
    public DateTime PeriodEnd { get; set; }

    [Column("dashboard_json")]
    public string DashboardJson { get; set; } = null!;

    [Column("comparison_json")]
    public string? ComparisonJson { get; set; }

    [Column("status")]
    public string Status { get; set; } = "OPEN";

    [Column("is_current")]
    public bool IsCurrent { get; set; }

    [Column("last_event_type")]
    public string? LastEventType { get; set; }

    [Column("last_event_source")]
    public string? LastEventSource { get; set; }

    [Column("last_event_ref_id")]
    public int? LastEventRefId { get; set; }

    [Column("version")]
    public int Version { get; set; } = 1;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("closed_at")]
    public DateTime? ClosedAt { get; set; }

    [Column("updated_by")]
    public int? UpdatedBy { get; set; }
}