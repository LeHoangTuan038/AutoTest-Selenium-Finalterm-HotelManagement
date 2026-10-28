using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Role
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string? Description { get; set; }

    public ICollection<User_Role> UserRoles { get; set; } = new List<User_Role>();
    public ICollection<Role_Permission> RolePermissions { get; set; } = new List<Role_Permission>();
}
