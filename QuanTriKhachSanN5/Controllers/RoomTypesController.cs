using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuanTriKhachSanN5.DTOs.RoomType;
using QuanTriKhachSanN5.Interfaces;

namespace QuanTriKhachSanN5.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RoomTypesController : ControllerBase
    {
        private readonly IRoomTypeService _roomTypeService;

        public RoomTypesController(IRoomTypeService roomTypeService)
        {
            _roomTypeService = roomTypeService;
        }

        // GET: api/RoomTypes - Lấy danh sách tất cả loại phòng (Admin, Receptionist)
        // GET: api/RoomTypes - Lấy danh sách tất cả loại phòng (Admin, Receptionist)
        [Authorize(Policy = "MANAGE_ROOMS")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RoomTypeDTO>>> GetRoomTypes()
        {
            var roomTypes = await _roomTypeService.GetAllRoomTypesAsync();
            return Ok(roomTypes);
        }

        // GET: api/RoomTypes/5 - Lấy chi tiết loại phòng (Mở cho tất cả mọi người xem bài viết & đánh giá)
        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<ActionResult<RoomTypeDTO>> GetRoomType(int id)
        {
            var roomType = await _roomTypeService.GetRoomTypeByIdAsync(id);
            if (roomType == null)
                return NotFound();
            return Ok(roomType);
        }

        // POST: api/RoomTypes - Tạo loại phòng mới (Admin only)
        [Authorize(Policy = "MANAGE_ROOMS")]
        [HttpPost]
        public async Task<ActionResult<RoomTypeDTO>> CreateRoomType(
            [FromBody] CreateRoomTypeDTO dto
        )
        {
            try
            {
                var id = await _roomTypeService.CreateRoomTypeAsync(dto);
                var newRoomType = await _roomTypeService.GetRoomTypeByIdAsync(id);
                return CreatedAtAction(nameof(GetRoomType), new { id = id }, newRoomType);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // PUT: api/RoomTypes/5 - Cập nhật loại phòng (Admin only)
        [Authorize(Policy = "MANAGE_ROOMS")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRoomType(int id, [FromBody] RoomTypeDTO dto)
        {
            if (id != dto.Id)
                return BadRequest("ID không khớp");

            try
            {
                await _roomTypeService.UpdateRoomTypeAsync(id, dto);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // DELETE: api/RoomTypes/5 - Xóa loại phòng (Admin only)
        [Authorize(Policy = "MANAGE_ROOMS")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRoomType(int id)
        {
            try
            {
                await _roomTypeService.DeleteRoomTypeAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // GET: api/RoomTypes/public - Dành cho khách hàng xem trên trang chủ (Không cần đăng nhập)
        [AllowAnonymous]
        [HttpGet("public")]
        public async Task<ActionResult<IEnumerable<RoomTypeDTO>>> GetPublicRoomTypes()
        {
            var roomTypes = await _roomTypeService.GetAllRoomTypesAsync();
            // Ở hệ thống thực tế, bạn có thể viết riêng một hàm GetActiveRoomTypesAsync() để chỉ lấy những phòng IsActive = true
            return Ok(roomTypes);
        }
    }
}
