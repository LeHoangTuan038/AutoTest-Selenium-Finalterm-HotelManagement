using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace QuanTriKhachSanN5.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ExampleRBACController : ControllerBase
    {
        // =========================================================================
        // Ví dụ 1: Cơ bản nhất - Chỉ Admin được gọi (Role-based)
        // =========================================================================
        [Authorize(Roles = "Admin")]
        [HttpDelete("system-config/{id}")]
        public IActionResult DeleteConfig(int id)
        {
            return Ok(
                new { Message = "Đã xóa cấu hình hệ thống (và Audit Log đã tự động lưu vết)." }
            );
        }

        // =========================================================================
        // Ví dụ 2: Lễ tân hoặc Admin đều được thao tác (Role-based mở rộng)
        // =========================================================================
        [Authorize(Roles = "Admin,Receptionist")]
        [HttpPost("checkin")]
        public IActionResult CheckInCustomer()
        {
            return Ok(new { Message = "Check-in thành công." });
        }

        // =========================================================================
        // Ví dụ 3: Cao cấp - Phân quyền theo Hành động thay vì Chức vụ (Policy-based)
        // Chỉ những ai (dù là Role gì) được cấp quyền MANAGE_ROOMS mới dùng được.
        // =========================================================================
        [Authorize(Policy = "MANAGE_ROOMS")]
        [HttpPut("rooms/pricing")]
        public IActionResult UpdateRoomPricing()
        {
            return Ok(new { Message = "Cập nhật bảng giá phòng thành công." });
        }
    }
}
