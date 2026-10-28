using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("Role_Permissions")]
public class Role_Permission
{
    [Column("role_id")]
    public int RoleId { get; set; }
    public Role Role { get; set; }

    [Column("permission_id")]
    public int PermissionId { get; set; }
    public Permission Permission { get; set; }
}
