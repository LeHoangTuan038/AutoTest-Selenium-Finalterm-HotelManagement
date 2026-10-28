using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuanTriKhachSanN5.Data;
using QuanTriKhachSanN5.Interfaces;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LossAndDamagesController : ControllerBase
    {
        private readonly ILossAndDamageService _lossService;
        private readonly ApplicationDbContext _context;

        // Tiêm thêm ApplicationDbContext để truy vấn chéo dữ liệu
        public LossAndDamagesController(
            ILossAndDamageService lossService,
            ApplicationDbContext context
        )
        {
            _lossService = lossService;
            _context = context;
        }

        [Authorize(Policy = "MANAGE_INVENTORY")]
        [HttpPost]
        public async Task<IActionResult> ReportLoss([FromBody] LossAndDamage report)
        {
            try
            {
                report.CreatedAt = DateTime.Now;
                if (string.IsNullOrEmpty(report.Status))
                    report.Status = "Chưa đền bù";

                // 2. Tìm vật tư thuộc phòng nào
                var roomInventory = await _context.RoomInventories.FindAsync(
                    report.RoomInventoryId
                );
                if (roomInventory == null)
                    return BadRequest(
                        new { message = "Lỗi: Không tìm thấy vật tư này trong cơ sở dữ liệu." }
                    );

                // 3. Truy xuất hóa đơn gần nhất của phòng này
                var currentBooking = await _context
                    .BookingDetails.Where(bd => bd.RoomId == roomInventory.RoomId)
                    .OrderByDescending(bd => bd.CheckOutDate)
                    .FirstOrDefaultAsync();

                // 4. Xử lý logic khóa ngoại (BookingDetailId)
                if (currentBooking != null)
                {
                    report.BookingDetailId = currentBooking.Id;
                }
                else
                {
                    var fallbackBooking = await _context.BookingDetails.FirstOrDefaultAsync();
                    if (fallbackBooking == null)
                        return BadRequest(
                            new
                            {
                                message = "Lỗi DB: Bảng Booking_Details đang trống, không thể tạo khóa ngoại.",
                            }
                        );

                    report.BookingDetailId = fallbackBooking.Id;
                }

                // 5. Lưu Biên bản đền bù vào SQL
                var createdReport = await _lossService.CreateLossAndDamageAsync(report);

                // =========================================================
                // 6. FIX LỖI TỰ KHÔI PHỤC: Cập nhật trạng thái vật tư thành "Đã hỏng" (false)
                // =========================================================
                roomInventory.IsActive = false;
                _context.RoomInventories.Update(roomInventory);
                await _context.SaveChangesAsync();

                return Ok(createdReport);
            }
            catch (Exception ex)
            {
                var exactError = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return BadRequest(new { message = exactError });
            }
        }

        [Authorize(Policy = "MANAGE_INVENTORY")]
        [HttpGet]
        public async Task<IActionResult> GetAllLossAndDamages()
        {
            try
            {
                var rawData = await _lossService.GetAllLossAndDamagesAsync();

                var data = rawData
                    .Select(ld => new
                    {
                        Id = ld.Id,
                        BookingDetailId = ld.BookingDetailId,
                        RoomInventoryId = ld.RoomInventoryId,
                        Quantity = ld.Quantity,
                        PenaltyAmount = ld.PenaltyAmount,
                        Description = ld.Description,
                        CreatedAt = ld.CreatedAt,
                        ImageUrl = ld.ImageUrl,
                        Status = ld.Status,
                    })
                    .ToList();

                return Ok(data);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi Server: " + ex.Message });
            }
        }

        [Authorize(Policy = "MANAGE_INVENTORY")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] LossAndDamage model)
        {
            var updatedData = await _lossService.UpdateLossAndDamageAsync(id, model);

            if (updatedData == null)
            {
                return NotFound(new { message = "Không tìm thấy biên bản này!" });
            }

            return Ok(updatedData);
        }

        [Authorize(Policy = "MANAGE_INVENTORY")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Disable(int id)
        {
            var success = await _lossService.UpdateStatusAsync(id, "Đã hủy");

            if (!success)
                return NotFound();

            return Ok(new { message = "Đã hủy biên bản!" });
        }

        [Authorize(Policy = "MANAGE_INVENTORY")]
        [HttpPut("enable/{id}")]
        public async Task<IActionResult> Enable(int id)
        {
            var success = await _lossService.UpdateStatusAsync(id, "Chưa đền bù");

            if (!success)
                return NotFound();

            return Ok(new { message = "Đã khôi phục biên bản!" });
        }

        [Authorize(Policy = "MANAGE_INVENTORY")]
        [HttpPut("status/{id}")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] string status)
        {
            var success = await _lossService.UpdateStatusAsync(id, status);
            if (!success)
                return NotFound();

            // 2. LOGIC VÀNG: Nếu Lễ tân "Hủy", tự động khôi phục vật tư thành Hoạt động tốt
            if (status == "Đã hủy" || status == "Hủy")
            {
                var lossReport = await _context.LossAndDamages.FindAsync(id);
                if (lossReport != null)
                {
                    var inventory = await _context.RoomInventories.FindAsync(
                        lossReport.RoomInventoryId
                    );
                    if (inventory != null)
                    {
                        inventory.IsActive = true;
                        _context.RoomInventories.Update(inventory);
                        await _context.SaveChangesAsync();
                    }
                }
            }

            return Ok(new { message = "Cập nhật trạng thái thành công!" });
        }
    }
}
