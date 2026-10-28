using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuanTriKhachSanN5.Data;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VouchersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public VouchersController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Lấy tất cả các mã voucher (Admin)
        /// GET: api/Vouchers
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAllVouchers()
        {
            var vouchers = await _context.Vouchers
                .OrderByDescending(v => v.Id)
                .ToListAsync();
            return Ok(vouchers);
        }

        /// <summary>
        /// Tạo một mã voucher mới (Admin)
        /// POST: api/Vouchers
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> CreateVoucher([FromBody] Voucher voucher)
        {
            if (string.IsNullOrEmpty(voucher.Code))
                return BadRequest(new { message = "Mã voucher không được để trống!" });

            voucher.Code = voucher.Code.Trim().ToUpper();

            var exists = await _context.Vouchers.AnyAsync(v => v.Code == voucher.Code);
            if (exists)
                return BadRequest(new { message = "Mã voucher này đã tồn tại trong hệ thống!" });

            _context.Vouchers.Add(voucher);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetVoucherById), new { id = voucher.Id }, voucher);
        }

        /// <summary>
        /// Lấy chi tiết một voucher theo ID
        /// GET: api/Vouchers/{id}
        /// </summary>
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetVoucherById(int id)
        {
            var voucher = await _context.Vouchers.FindAsync(id);
            if (voucher == null)
                return NotFound(new { message = "Không tìm thấy voucher!" });

            return Ok(voucher);
        }

        /// <summary>
        /// Cập nhật thông tin voucher (Admin)
        /// PUT: api/Vouchers/{id}
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateVoucher(int id, [FromBody] Voucher dto)
        {
            var voucher = await _context.Vouchers.FindAsync(id);
            if (voucher == null)
                return NotFound(new { message = "Không tìm thấy voucher!" });

            if (!string.IsNullOrEmpty(dto.Code))
            {
                var codeUpper = dto.Code.Trim().ToUpper();
                var exists = await _context.Vouchers.AnyAsync(v => v.Code == codeUpper && v.Id != id);
                if (exists)
                    return BadRequest(new { message = "Mã voucher mới này đã trùng với mã khác!" });
                
                voucher.Code = codeUpper;
            }

            voucher.DiscountType = dto.DiscountType;
            voucher.DiscountValue = dto.DiscountValue;
            voucher.MinBookingValue = dto.MinBookingValue;
            voucher.ValidFrom = dto.ValidFrom;
            voucher.ValidTo = dto.ValidTo;
            voucher.UsageLimit = dto.UsageLimit;

            _context.Vouchers.Update(voucher);
            await _context.SaveChangesAsync();

            return Ok(voucher);
        }

        /// <summary>
        /// Xóa voucher (Admin)
        /// DELETE: api/Vouchers/{id}
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteVoucher(int id)
        {
            var voucher = await _context.Vouchers.FindAsync(id);
            if (voucher == null)
                return NotFound(new { message = "Không tìm thấy voucher!" });

            _context.Vouchers.Remove(voucher);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// Admin custom gửi mã giảm giá và thư tay cho người dùng
        /// POST: api/Vouchers/send-custom
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPost("send-custom")]
        public async Task<IActionResult> SendCustomVoucher([FromBody] SendCustomVoucherDTO dto)
        {
            if (dto.UserIds == null || !dto.UserIds.Any())
                return BadRequest(new { message = "Vui lòng chọn ít nhất một người nhận!" });

            if (string.IsNullOrEmpty(dto.Title) || string.IsNullOrEmpty(dto.Content))
                return BadRequest(new { message = "Tiêu đề và nội dung thư không được để trống!" });

            // Xác minh mã voucher nếu có gửi kèm mã
            if (!string.IsNullOrEmpty(dto.VoucherCode))
            {
                var vCode = dto.VoucherCode.Trim().ToUpper();
                var vExists = await _context.Vouchers.AnyAsync(v => v.Code == vCode);
                if (!vExists)
                    return BadRequest(new { message = $"Mã giảm giá '{dto.VoucherCode}' không tồn tại trên hệ thống!" });
            }

            // Gửi thư cho từng user
            foreach (var userId in dto.UserIds)
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null) continue;

                var notif = new Notification
                {
                    UserId = userId,
                    Title = dto.Title,
                    Content = dto.Content,
                    Type = "Promotion",
                    ReferenceLink = dto.VoucherCode?.Trim().ToUpper(),
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Notifications.Add(notif);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã gửi thư và quà tặng khuyến mãi thành công tới người nhận!" });
        }

        /// <summary>
        /// Kiểm tra tính hợp lệ của mã giảm giá cho khách
        /// GET: api/Vouchers/check/{code}
        /// </summary>
        [HttpGet("check/{code}")]
        public async Task<IActionResult> CheckVoucher(string code, [FromQuery] decimal? totalPrice = null)
        {
            if (string.IsNullOrEmpty(code))
                return BadRequest(new { message = "Mã giảm giá không được để trống!" });

            var codeUpper = code.Trim().ToUpper();
            var voucher = await _context.Vouchers.FirstOrDefaultAsync(v => v.Code == codeUpper);

            if (voucher == null)
                return NotFound(new { message = "Mã giảm giá không tồn tại trên hệ thống!" });

            var today = DateTime.UtcNow;

            if (voucher.ValidFrom.HasValue && voucher.ValidFrom.Value > today)
                return BadRequest(new { message = "Mã giảm giá chưa đến thời gian áp dụng!" });

            if (voucher.ValidTo.HasValue && voucher.ValidTo.Value < today)
                return BadRequest(new { message = "Mã giảm giá đã quá hạn sử dụng!" });

            if (totalPrice.HasValue && voucher.MinBookingValue.HasValue && totalPrice.Value < (decimal)voucher.MinBookingValue.Value)
                return BadRequest(new { message = $"Mã này chỉ áp dụng cho đơn đặt phòng từ {voucher.MinBookingValue.Value:N0}đ trở lên!" });

            if (voucher.UsageLimit.HasValue)
            {
                var usedCount = await _context.Bookings.CountAsync(b => b.VoucherId == voucher.Id && b.Status != "Cancelled");
                if (usedCount >= voucher.UsageLimit.Value)
                    return BadRequest(new { message = "Mã giảm giá này đã hết lượt sử dụng!" });
            }

            return Ok(new
            {
                id = voucher.Id,
                code = voucher.Code,
                discountType = voucher.DiscountType,
                discountValue = voucher.DiscountValue,
                minBookingValue = voucher.MinBookingValue
            });
        }
    }

    public class SendCustomVoucherDTO
    {
        public List<int> UserIds { get; set; } = new List<int>();
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? VoucherCode { get; set; }
    }
}
