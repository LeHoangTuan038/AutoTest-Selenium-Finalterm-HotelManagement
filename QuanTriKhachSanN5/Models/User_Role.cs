using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("User_Roles")]
public class User_Role
{
    [Column("user_id")]
    public int UserId { get; set; }

    public User User { get; set; }

    [Column("role_id")]
    public int RoleId { get; set; }

    public Role Role { get; set; }
}
