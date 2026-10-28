using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuanTriKhachSanN5.Data;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RolesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RolesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 1. LẤY DANH SÁCH VAI TRÒ (Bảng bên ngoài)
        [HttpGet]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _context
                .Roles.Select(r => new
                {
                    id = r.Id,
                    name = r.Name,
                    description = r.Description,
                })
                .ToListAsync();
            return Ok(roles);
        }

        // 2. LẤY TẤT CẢ CÁC QUYỀN TRONG HỆ THỐNG (Để vẽ danh sách Checkbox)
        [HttpGet("permissions")]
        public async Task<IActionResult> GetAllPermissions()
        {
            var permissions = await _context
                .Permissions.Select(p => new { id = p.Id, name = p.Name }) // Name ở đây là "BOOKINGS_MANAGE", "INVOICES_MANAGE"...
                .ToListAsync();
            return Ok(permissions);
        }

        // 3. LẤY CÁC QUYỀN HIỆN CÓ CỦA 1 VAI TRÒ (Để tick sẵn vào Checkbox)
        [HttpGet("{roleId}/permissions")]
        public async Task<IActionResult> GetRolePermissions(int roleId)
        {
            var permissionIds = await _context
                .RolePermissions.Where(rp => rp.RoleId == roleId)
                .Select(rp => rp.PermissionId)
                .ToListAsync();
            return Ok(permissionIds);
        }

        // 4. LƯU LẠI QUYỀN MỚI (Khi bấm nút "Lưu thay đổi")
        [HttpPost("{roleId}/permissions")]
        public async Task<IActionResult> UpdateRolePermissions(
            int roleId,
            [FromBody] List<int> permissionIds
        )
        {
            // Bước A: Xóa sạch các quyền cũ của Role này
            var oldPermissions = _context.RolePermissions.Where(rp => rp.RoleId == roleId);
            _context.RolePermissions.RemoveRange(oldPermissions);

            // Bước B: Thêm lại các quyền mới được tick
            var newPermissions = permissionIds.Select(pId => new Role_Permission
            {
                RoleId = roleId,
                PermissionId = pId,
            });
            _context.RolePermissions.AddRange(newPermissions);

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật phân quyền thành công!" });
        }
    }
}
