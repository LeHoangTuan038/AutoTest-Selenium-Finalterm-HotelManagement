using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using QuanTriKhachSanN5.Models;

[Table("Users")]
public class User
{
    [Column("id")]
    public int Id { get; set; }

    [Column("full_name")]
    public string FullName { get; set; } = string.Empty;

    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [Column("phone")]
    public string? Phone { get; set; }

    [Column("password_hash")]
    public string PasswordHash { get; set; } = string.Empty;

    [Column("status")]
    public bool IsActive { get; set; } = true;

    [Column("avatar_url")]
    public string? AvatarUrl { get; set; }

    [Column("address")]
    public string? Address { get; set; }

    [Column("points")]
    public int Points { get; set; } = 0;

    [Column("date_of_birth")]
    public DateTime? DateOfBirth { get; set; }

    [Column("last_birthday_voucher_year")]
    public int? LastBirthdayVoucherYear { get; set; }

    [Column("membership_id")]
    public int? MembershipId { get; set; }

    public Membership? Membership { get; set; }

    public ICollection<User_Role> UserRoles { get; set; } = new List<User_Role>();
    public ICollection<User_Permission> UserPermissions { get; set; } = new List<User_Permission>();
}
