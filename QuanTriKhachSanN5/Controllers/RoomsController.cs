using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuanTriKhachSanN5.Interfaces;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RoomsController : ControllerBase
    {
        private readonly IRoomService _roomService;

        public RoomsController(IRoomService roomService)
        {
            _roomService = roomService;
        }

        // --- 1. THÊM PHÒNG (CREATE) ---
        [Authorize(Policy = "MANAGE_ROOMS")]
        [HttpPost]
        public async Task<IActionResult> CreateRoom([FromBody] Room room)
        {
            // BƯỚC BẢO VỆ: Lấy danh sách phòng ra kiểm tra xem trùng tên không
            var allRooms = await _roomService.GetRoomsAsync();
            if (
                allRooms.Any(r => r.RoomNumber.Trim().ToLower() == room.RoomNumber.Trim().ToLower())
            )
            {
                // Nếu trùng -> Đuổi về ngay và luôn (Báo lỗi 400)
                return BadRequest(
                    new
                    {
                        message = $"Số phòng '{room.RoomNumber}' đã tồn tại trong hệ thống rồi ní ơi!",
                    }
                );
            }

            await _roomService.CreateRoomAsync(room);
            return CreatedAtAction(nameof(GetRoom), new { id = room.Id }, room);
        }

        // --- 2. LẤY DANH SÁCH PHÒNG (READ ALL) ---
        [Authorize(Policy = "MANAGE_ROOMS")]
        [HttpGet]
        public async Task<ActionResult<List<Room>>> GetRooms()
        {
            var rooms = await _roomService.GetRoomsAsync();
            return Ok(rooms);
        }

        // --- 3. LẤY 1 PHÒNG (READ ONE) ---
        [Authorize(Policy = "MANAGE_ROOMS")]
        [HttpGet("{id}")]
        public async Task<ActionResult<Room>> GetRoom(int id)
        {
            var room = await _roomService.GetRoomByIdAsync(id);
            if (room == null)
                return NotFound(new { message = "Không tìm thấy phòng!" });
            return Ok(room);
        }

        // --- 4. SỬA TOÀN BỘ THÔNG TIN PHÒNG (UPDATE) ---
        [Authorize(Policy = "MANAGE_ROOMS")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRoom(int id, [FromBody] Room room)
        {
            if (id != room.Id)
            {
                return BadRequest(
                    new { message = "ID trên đường dẫn và ID trong dữ liệu không khớp!" }
                );
            }

            // Gọi xuống Service để xử lý logic lưu Database
            await _roomService.UpdateRoomAsync(room);

            return NoContent(); // Cập nhật thành công, trả về 204
        }

        // --- 5. CẬP NHẬT TRẠNG THÁI NHANH (Cái này Lễ tân/Lao công hay xài) ---
        [Authorize(Policy = "MANAGE_ROOMS")]
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateRoomStatus(int id, [FromBody] string status)
        {
            await _roomService.UpdateRoomStatusAsync(id, status);
            return NoContent();
        }

        // --- 6. XÓA PHÒNG (DELETE) ---
        [Authorize(Policy = "MANAGE_ROOMS")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRoom(int id)
        {
            var room = await _roomService.GetRoomByIdAsync(id);
            if (room == null)
            {
                return NotFound(new { message = "Phòng này không tồn tại hoặc đã bị xóa!" });
            }

            try
            {
                // Thử xóa xem SQL có cho phép không
                await _roomService.DeleteRoomAsync(id);
                return NoContent();
            }
            catch (System.Exception)
            {
                // Nếu SQL quăng lỗi (do dính khóa ngoại Vật tư, Đặt phòng...) -> Báo lỗi 400 cho React
                return BadRequest(
                    new
                    {
                        message = "Không thể xóa! Phòng này đang chứa Vật tư hoặc có lịch Đặt phòng dính kèm. Hãy xóa dữ liệu liên quan trước!",
                    }
                );
            }
        }
    }
}
