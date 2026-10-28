// =========================================================================
// MODULE 6: HR & RBAC - INTERFACES
// =========================================================================

using System.Collections.Generic;
using System.Threading.Tasks;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Interfaces
{
    public interface IHRRBACService
    {
        Task<User> GetUserByIdAsync(int id);
        Task<List<Role>> GetRolesAsync();
        Task<List<Permission>> GetPermissionsByRoleAsync(int roleId);
        Task<bool> HasPermissionAsync(int userId, string permissionName);
        Task LogActionAsync(int userId, string action, string tableName, int recordId, string details);
    }
}