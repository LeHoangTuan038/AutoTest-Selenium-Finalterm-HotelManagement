using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuanTriKhachSanN5.Data;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
[Authorize(Policy = "AdminOnly")] // Maps to ManageRoles permission
    public class UserRolesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UserRolesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/userroles - List all users with their roles (Admin only)
        [HttpGet]
        public async Task<ActionResult> GetUsersWithRoles()
        {
            var usersWithRoles = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .Select(u => new 
                {
                    u.Id,
                    u.Email,
                    Roles = u.UserRoles.Select(ur => ur.Role.Name)
                })
                .ToListAsync();

            return Ok(usersWithRoles);
        }

        // POST: api/userroles/assign - Assign role to user (Admin only)
        [HttpPost("assign")]
        public async Task<ActionResult> AssignRole([FromBody] AssignRoleDto dto)
        {
            if (await _context.UserRoles.AnyAsync(ur => ur.UserId == dto.UserId && ur.RoleId == dto.RoleId))
                return BadRequest("Role already assigned");

            var userRole = new User_Role
            {
                UserId = dto.UserId,
                RoleId = dto.RoleId
            };

            _context.UserRoles.Add(userRole);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Role assigned successfully" });
        }

        // DELETE: api/userroles/{userId}/{roleId} - Remove role from user (Admin only)
        [HttpDelete("{userId}/{roleId}")]
        public async Task<ActionResult> RemoveRole(int userId, int roleId)
        {
            var userRole = await _context.UserRoles
                .FirstOrDefaultAsync(ur => ur.UserId == userId && ur.RoleId == roleId);

            if (userRole == null)
                return NotFound("Role assignment not found");

            _context.UserRoles.Remove(userRole);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Role removed successfully" });
        }

        // GET: api/userroles/roles - Get all available roles
        [HttpGet("roles")]
        public async Task<ActionResult> GetRoles()
        {
            var roles = await _context.Roles.Select(r => new { r.Id, r.Name }).ToListAsync();
            return Ok(roles);
        }
    }

    public class AssignRoleDto
    {
        public int UserId { get; set; }
        public int RoleId { get; set; }
    }
}
