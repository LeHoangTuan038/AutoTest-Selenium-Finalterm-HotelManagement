using System;
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
    public class InvoicesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly QuanTriKhachSanN5.Services.IMomoService _momoService;

        public InvoicesController(ApplicationDbContext context, QuanTriKhachSanN5.Services.IMomoService momoService)
        {
            _context = context;
            _momoService = momoService;
        }

        // ====================================================================
        // LẤY DANH SÁCH TẤT CẢ HÓA ĐƠN (CHO TRANG LỊCH SỬ)
        // ====================================================================
        [HttpGet]
        public async Task<IActionResult> GetAllInvoices()
        {
            try
            {
                // Lấy toàn bộ hóa đơn, sắp xếp hóa đơn mới nhất lên đầu tiên
                var invoices = await _context
                    .Invoices.OrderByDescending(i => i.Id)
                    .Select(i => new
                    {
                        id = i.Id,
                        bookingId = i.BookingId,
                        finalTotal = i.FinalTotal,
                        status = i.Status,
                    })
                    .ToListAsync();

                return Ok(invoices);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi Server: " + ex.Message });
            }
        }

        [HttpGet("report")]
        public async Task<IActionResult> GetAccountingReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var query = _context.Invoices
                    .Include(i => i.Booking)
                    .AsQueryable();

                if (startDate.HasValue)
                {
                    query = query.Where(i => i.Booking != null && i.Booking.BookingDetails.Any(bd => bd.CheckInDate >= startDate.Value));
                }
                if (endDate.HasValue)
                {
                    query = query.Where(i => i.Booking != null && i.Booking.BookingDetails.Any(bd => bd.CheckOutDate <= endDate.Value));
                }

                var invoices = await query
                    .OrderByDescending(i => i.Id)
                    .Select(i => new
                    {
                        id = i.Id,
                        bookingId = i.BookingId,
                        bookingCode = i.Booking != null ? i.Booking.BookingCode : "N/A",
                        guestName = i.Booking != null ? (i.Booking.GuestName ?? "Khách vãng lai") : "Khách vãng lai",
                        guestPhone = i.Booking != null ? (i.Booking.GuestPhone ?? "") : "",
                        totalRoomAmount = i.TotalRoomAmount ?? 0m,
                        totalServiceAmount = i.TotalServiceAmount ?? 0m,
                        discountAmount = i.DiscountAmount ?? 0m,
                        taxAmount = i.TaxAmount ?? 0m,
                        finalTotal = i.FinalTotal ?? 0m,
                        status = i.Status,
                        createdDate = i.Booking != null && i.Booking.BookingDetails.Any()
                            ? i.Booking.BookingDetails.Min(bd => bd.CheckInDate)
                            : DateTime.UtcNow
                    })
                    .ToListAsync();

                return Ok(invoices);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi tải báo cáo kế toán: " + ex.Message });
            }
        }

        [HttpGet("preview/{bookingId}")]
        public async Task<IActionResult> GetInvoicePreview(int bookingId)
        {
            var booking = await _context
                .Bookings.Include(b => b.BookingDetails!)
                    .ThenInclude(bd => bd.Room)
                .Include(b => b.BookingDetails!)
                    .ThenInclude(bd => bd.RoomType)
                .FirstOrDefaultAsync(b => b.Id == bookingId);

            if (booking == null)
                return NotFound(new { message = "Không tìm thấy đơn!" });

            var detailIds = booking.BookingDetails.Select(bd => bd.Id).ToList();

            // 1. TÍNH TIỀN PHÒNG
            decimal depositAmount = booking.DepositAmount ?? 0m;
            decimal totalRoomAmount = 0;
            var roomDetailsList = new List<object>();

            foreach (var detail in booking.BookingDetails)
            {
                int nights = (detail.CheckOutDate.Date - detail.CheckInDate.Date).Days;
                if (nights <= 0)
                    nights = 1;
                decimal roomTotal = detail.PricePerNight * nights;
                totalRoomAmount += roomTotal;

                roomDetailsList.Add(
                    new
                    {
                        roomNumber = detail.Room?.RoomNumber,
                        roomTypeName = detail.RoomType?.Name,
                        nights = nights,
                        pricePerNight = detail.PricePerNight,
                        lineTotal = roomTotal,
                    }
                );
            }

            // 2. LẤY CHI TIẾT DỊCH VỤ (MINI BAR) TÁCH RỜI
            var serviceDetails = await _context
                .OrderServiceDetails.Include(osd => osd.Service)
                .Include(osd => osd.OrderService)
                .Where(osd =>
                    osd.OrderService.BookingDetailId != null
                    && detailIds.Contains(osd.OrderService.BookingDetailId.Value)
                )
                .Select(osd => new
                {
                    serviceName = osd.Service != null ? osd.Service.Name : "Dịch vụ",
                    quantity = osd.Quantity,
                    unitPrice = osd.UnitPrice,
                    total = osd.Quantity * osd.UnitPrice,
                })
                .ToListAsync();

            decimal totalServiceAmount = serviceDetails.Sum(s => s.total);

            // 3. LẤY CHI TIẾT ĐỀN BÚ / PHỤ THU TÁCH RỜI
            var penaltyDetails = await _context
                .LossAndDamages.Where(ld =>
                    ld.BookingDetailId != null && detailIds.Contains(ld.BookingDetailId.Value)
                )
                .Select(ld => new
                {
                    itemName = ld.Description ?? "Phạt / Đền bù",
                    quantity = 1,

                    penaltyAmount = ld.PenaltyAmount,
                })
                .ToListAsync();

            decimal totalPenaltyAmount = penaltyDetails.Sum(p => p.penaltyAmount);

            // 4. TỔNG KẾT
            decimal discountAmount = 0m;
            if (booking.VoucherId.HasValue)
            {
                var voucher = await _context.Vouchers.FindAsync(booking.VoucherId.Value);
                if (voucher != null)
                {
                    if (voucher.DiscountType == "PERCENT")
                    {
                        discountAmount = totalRoomAmount * ((decimal)voucher.DiscountValue / 100m);
                    }
                    else if (voucher.DiscountType == "AMOUNT" || voucher.DiscountType == "FIXED")
                    {
                        discountAmount = (decimal)voucher.DiscountValue;
                    }
                    
                    if (discountAmount > totalRoomAmount)
                    {
                        discountAmount = totalRoomAmount;
                    }
                }
            }

            decimal totalServicesAndPenalties = totalServiceAmount + totalPenaltyAmount;
            decimal totalRoomAfterDiscount = totalRoomAmount - discountAmount;
            decimal taxAmount = (totalRoomAfterDiscount + totalServicesAndPenalties) * 0.08m;
            decimal finalTotal =
                totalRoomAfterDiscount + totalServicesAndPenalties + taxAmount - depositAmount;

            return Ok(
                new
                {
                    bookingId = booking.Id,
                    bookingCode = booking.BookingCode,
                    depositAmount = depositAmount,
                    guestName = booking.GuestName,
                    totalRoomAmount = totalRoomAmount,
                    totalServiceAmount = totalServiceAmount, // Gửi riêng lẻ
                    totalPenaltyAmount = totalPenaltyAmount, // Gửi riêng lẻ
                    discountAmount = discountAmount,
                    taxAmount = taxAmount,
                    finalTotal = finalTotal,
                    roomDetails = roomDetailsList,
                    serviceDetails = serviceDetails, // 🚨 TRẢ VỀ MẢNG CHI TIẾT CHO REACT MAP RA BẢNG
                    penaltyDetails = penaltyDetails, // 🚨 TRẢ VỀ MẢNG CHI TIẾT ĐỀN BÙ
                    note = $"Ghi nhận tiêu thụ hợp lệ",
                }
            );
        }

        // ====================================================================
        // ĐỌC THÔNG TIN HÓA ĐƠN ĐỂ IN (DÙNG LẠI LOGIC CỦA PREVIEW)
        // ====================================================================
        [HttpGet("{invoiceId}")]
        public async Task<IActionResult> GetInvoiceById(int invoiceId)
        {
            var invoice = await _context.Invoices.FindAsync(invoiceId);
            if (invoice == null)
                return NotFound(new { message = "Không tìm thấy hóa đơn!" });

            var booking = await _context
                .Bookings.Include(b => b.BookingDetails!)
                    .ThenInclude(bd => bd.Room)
                .Include(b => b.BookingDetails!)
                    .ThenInclude(bd => bd.RoomType)
                .FirstOrDefaultAsync(b => b.Id == invoice.BookingId);

            if (booking == null)
                return NotFound(new { message = "Không tìm thấy đơn!" });

            var detailIds = booking.BookingDetails.Select(bd => bd.Id).ToList();

            // 1. CHI TIẾT PHÒNG
            decimal depositAmount = booking.DepositAmount ?? 0m;
            decimal calculatedRoomAmount = 0;
            var roomDetailsList = new List<object>();

            foreach (var detail in booking.BookingDetails)
            {
                int nights = (detail.CheckOutDate.Date - detail.CheckInDate.Date).Days;
                if (nights <= 0)
                    nights = 1;
                decimal roomTotal = detail.PricePerNight * nights;
                calculatedRoomAmount += roomTotal;

                roomDetailsList.Add(
                    new
                    {
                        roomNumber = detail.Room?.RoomNumber,
                        roomTypeName = detail.RoomType?.Name,
                        nights = nights,
                        pricePerNight = detail.PricePerNight,
                        lineTotal = roomTotal,
                    }
                );
            }

            // 2. CHI TIẾT DỊCH VỤ (MINI BAR)
            var serviceDetails = await _context
                .OrderServiceDetails.Include(osd => osd.Service)
                .Include(osd => osd.OrderService)
                .Where(osd =>
                    osd.OrderService.BookingDetailId != null
                    && detailIds.Contains(osd.OrderService.BookingDetailId.Value)
                )
                .Select(osd => new
                {
                    serviceName = osd.Service != null ? osd.Service.Name : "Dịch vụ",
                    quantity = osd.Quantity,
                    unitPrice = osd.UnitPrice,
                    total = osd.Quantity * osd.UnitPrice,
                })
                .ToListAsync();

            // 3. CHI TIẾT ĐỀN BÙ
            var penaltyDetails = await _context
                .LossAndDamages.Where(ld =>
                    ld.BookingDetailId != null && detailIds.Contains(ld.BookingDetailId.Value)
                )
                .Select(ld => new
                {
                    itemName = ld.Description ?? "Phạt / Đền bù",
                    quantity = 1,
                    penaltyAmount = ld.PenaltyAmount,
                })
                .ToListAsync();

            decimal totalPenaltyAmount = penaltyDetails.Sum(p => p.penaltyAmount);

            // Sử dụng các giá trị thực tế đã chốt lưu trữ trong hóa đơn
            decimal totalRoomAmount = invoice.TotalRoomAmount ?? calculatedRoomAmount;
            decimal totalServiceAmount = invoice.TotalServiceAmount ?? serviceDetails.Sum(s => s.total);
            decimal discountAmount = invoice.DiscountAmount ?? 0m;
            decimal taxAmount = invoice.TaxAmount ?? 0m;
            decimal finalTotal = invoice.FinalTotal ?? 0m;

            return Ok(
                new
                {
                    bookingId = booking.Id,
                    bookingCode = booking.BookingCode,
                    depositAmount = depositAmount,
                    guestName = booking.GuestName,
                    totalRoomAmount = totalRoomAmount,
                    totalServiceAmount = totalServiceAmount - totalPenaltyAmount, // Tách dịch vụ riêng (trừ đi phạt nếu bị gom)
                    totalPenaltyAmount = totalPenaltyAmount,
                    discountAmount = discountAmount,
                    taxAmount = taxAmount,
                    finalTotal = finalTotal,
                    roomDetails = roomDetailsList,
                    serviceDetails = serviceDetails,
                    penaltyDetails = penaltyDetails,
                    status = invoice.Status, // Trả về trạng thái lưu trữ thực tế
                    note = $"Hóa đơn đã chốt dữ liệu",
                }
            );
        }

        // ====================================================================
        // NÚT BỎ HÓA ĐƠN (HOÀN TÁC TRẢ PHÒNG)
        // ====================================================================
        [HttpPost("cancel/{invoiceId}")]
        public async Task<IActionResult> CancelInvoice(int invoiceId)
        {
            // 1. Tìm hóa đơn và thông tin đặt phòng đi kèm
            var invoice = await _context
                .Invoices.Include(i => i.Booking)
                    .ThenInclude(b => b.BookingDetails)
                .FirstOrDefaultAsync(i => i.Id == invoiceId);

            if (invoice == null)
                return NotFound(new { message = "Không tìm thấy hóa đơn!" });
            if (invoice.Status == "Cancelled")
                return BadRequest(new { message = "Hóa đơn này đã bị hủy từ trước!" });

            // 2. Đánh dấu hóa đơn là đã hủy (Không xóa hẳn để còn lưu log đối soát)
            invoice.Status = "Cancelled";

            // 3. Khôi phục trạng thái Đơn đặt phòng
            if (invoice.Booking != null)
            {
                invoice.Booking.Status = "Checked_in"; // Về lại Đang ở

                // 4. Khôi phục trạng thái Phòng vật lý
                foreach (var detail in invoice.Booking.BookingDetails)
                {
                    if (detail.RoomId.HasValue)
                    {
                        var room = await _context.Rooms.FindAsync(detail.RoomId.Value);
                        if (room != null)
                        {
                            room.Status = "Occupied"; // Khóa phòng lại màu đỏ
                            // Xóa cờ báo Dơ (Dirty) vì khách vẫn đang ở
                            if (room.CleaningStatus == "Dirty")
                                room.CleaningStatus = "Clean";
                        }
                    }
                }
            }

            await _context.SaveChangesAsync();
            return Ok(
                new { message = "Đã hủy hóa đơn và khôi phục phòng về danh sách Trả phòng!" }
            );
        }

        [HttpPost("checkout/{bookingId}")]
        public async Task<IActionResult> CheckoutAndCreateInvoice(int bookingId)
        {
            var booking = await _context
                .Bookings.Include(b => b.BookingDetails)
                .FirstOrDefaultAsync(b => b.Id == bookingId);
            if (booking == null)
                return NotFound(new { message = "Không tìm thấy đơn!" });
            if (booking.Status == "Completed")
                return BadRequest(new { message = "Đơn này đã checkout rồi!" });

            // 🌟 1. CẬP NHẬT NGÀY CHECKOUT THỰC TẾ & TRẠNG THÁI PHÒNG TRƯỚC KHI TÍNH TOÁN TIỀN 🌟
            foreach (var detail in booking.BookingDetails)
            {
                // Nếu khách trả phòng sớm hơn dự kiến, cập nhật lại ngày trả phòng thực tế là thời điểm hiện tại
                if (detail.CheckOutDate > DateTime.Now)
                {
                    detail.CheckOutDate = DateTime.Now;
                }

                if (detail.RoomId.HasValue)
                {
                    var room = await _context.Rooms.FindAsync(detail.RoomId.Value);
                    if (room != null)
                    {
                        room.Status = "Available";
                        room.CleaningStatus = "Dirty";
                    }
                }
            }

            var detailIds = booking.BookingDetails.Select(bd => bd.Id).ToList();

            // 🌟 2. TÍNH TOÁN TIỀN PHÒNG DỰA TRÊN NGÀY CHECKOUT THỰC TẾ ĐÃ CẬP NHẬT 🌟
            decimal totalRoomAmount = booking.BookingDetails.Sum(d =>
                d.PricePerNight
                * (
                    (d.CheckOutDate.Date - d.CheckInDate.Date).Days <= 0
                        ? 1
                        : (d.CheckOutDate.Date - d.CheckInDate.Date).Days
                )
            );

            decimal totalServiceAmount = await _context
                .OrderServices.Where(os =>
                    os.BookingDetailId != null && detailIds.Contains(os.BookingDetailId.Value)
                )
                .SumAsync(os => os.TotalAmount);

            decimal totalPenaltyAmount = await _context
                .LossAndDamages.Where(ld =>
                    ld.BookingDetailId != null && detailIds.Contains(ld.BookingDetailId.Value)
                )
                .SumAsync(ld => ld.PenaltyAmount);

            decimal discountAmount = 0m;
            if (booking.VoucherId.HasValue)
            {
                var voucher = await _context.Vouchers.FindAsync(booking.VoucherId.Value);
                if (voucher != null)
                {
                    if (voucher.DiscountType == "PERCENT")
                    {
                        discountAmount = totalRoomAmount * ((decimal)voucher.DiscountValue / 100m);
                    }
                    else if (voucher.DiscountType == "AMOUNT" || voucher.DiscountType == "FIXED")
                    {
                        discountAmount = (decimal)voucher.DiscountValue;
                    }
                    
                    if (discountAmount > totalRoomAmount)
                    {
                        discountAmount = totalRoomAmount;
                    }
                }
            }

            decimal totalServicesCombined = totalServiceAmount + totalPenaltyAmount;
            decimal totalRoomAfterDiscount = totalRoomAmount - discountAmount;
            decimal taxAmount = (totalRoomAfterDiscount + totalServicesCombined) * 0.08m;
            decimal depositAmount = booking.DepositAmount ?? 0m;
            decimal finalTotal = totalRoomAfterDiscount + totalServicesCombined + taxAmount - depositAmount;

            var newInvoice = new Invoice
            {
                BookingId = booking.Id,
                TotalRoomAmount = totalRoomAmount,
                TotalServiceAmount = totalServicesCombined, // Gom chung lưu db theo thiết kế cũ
                DiscountAmount = discountAmount,
                TaxAmount = taxAmount,
                FinalTotal = finalTotal,
                Status = "Pending",
            };
            _context.Invoices.Add(newInvoice);

            booking.Status = "Completed";

            await _context.SaveChangesAsync();
            return Ok(
                new { message = "Checkout và xuất hóa đơn thành công!", invoiceId = newInvoice.Id }
            );
        }

        // ====================================================================
        // XÁC NHẬN ĐÃ THANH TOÁN (LỄ TÂN XÁC NHẬN)
        // ====================================================================
        [HttpPost("confirm-payment/{invoiceId}")]
        public async Task<IActionResult> ConfirmPayment(int invoiceId)
        {
            var invoice = await _context.Invoices.FindAsync(invoiceId);
            if (invoice == null)
                return NotFound(new { message = "Không tìm thấy hóa đơn!" });
            if (invoice.Status == "Paid")
                return BadRequest(new { message = "Hóa đơn này đã được thanh toán!" });
            if (invoice.Status == "Cancelled")
                return BadRequest(new { message = "Không thể xác nhận hóa đơn đã hủy!" });

            invoice.Status = "Paid";

            // 🌟 TÍCH LUỸ ĐIỂM VÀ TỰ ĐỘNG THĂNG HẠNG THÀNH VIÊN KHI THANH TOÁN THÀNH CÔNG 🌟
            if (invoice.BookingId > 0)
            {
                var booking = await _context.Bookings.FindAsync(invoice.BookingId);
                if (booking != null && booking.UserId.HasValue)
                {
                    var user = await _context.Users.FindAsync(booking.UserId.Value);
                    if (user != null)
                    {
                        // Quy đổi chuẩn: 10,000 đ thanh toán thực tế = 1 điểm tích lũy
                        int earnedPoints = (int)((invoice.FinalTotal ?? 0) / 10000);
                        if (earnedPoints > 0)
                        {
                            user.Points += earnedPoints;

                            // Tìm hạng thành viên cao nhất phù hợp với điểm số mới
                            var newMembership = await _context.Memberships
                                .Where(m => user.Points >= m.MinPoints)
                                .OrderByDescending(m => m.MinPoints)
                                .FirstOrDefaultAsync();

                            if (newMembership != null)
                            {
                                user.MembershipId = newMembership.Id;
                            }
                        }
                    }
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Xác nhận thanh toán thành công!", invoiceId = invoice.Id });
        }

        // ====================================================================
        // TẠO YÊU CẦU THANH TOÁN MOMO
        // ====================================================================
        [HttpPost("create-momo-payment/{bookingId}")]
        public async Task<IActionResult> CreateMomoPayment(int bookingId)
        {
            var booking = await _context
                .Bookings.Include(b => b.BookingDetails)
                .FirstOrDefaultAsync(b => b.Id == bookingId);
            if (booking == null)
                return NotFound(new { message = "Không tìm thấy đơn!" });

            var detailIds = booking.BookingDetails.Select(bd => bd.Id).ToList();

            decimal totalRoomAmount = booking.BookingDetails.Sum(d =>
                d.PricePerNight
                * (
                    (d.CheckOutDate.Date - d.CheckInDate.Date).Days <= 0
                        ? 1
                        : (d.CheckOutDate.Date - d.CheckInDate.Date).Days
                )
            );

            decimal totalServiceAmount = await _context
                .OrderServices.Where(os =>
                    os.BookingDetailId != null && detailIds.Contains(os.BookingDetailId.Value)
                )
                .SumAsync(os => os.TotalAmount);

            decimal totalPenaltyAmount = await _context
                .LossAndDamages.Where(ld =>
                    ld.BookingDetailId != null && detailIds.Contains(ld.BookingDetailId.Value)
                )
                .SumAsync(ld => ld.PenaltyAmount);

            decimal totalServicesCombined = totalServiceAmount + totalPenaltyAmount;
            decimal taxAmount = (totalRoomAmount + totalServicesCombined) * 0.08m;
            decimal depositAmount = booking.DepositAmount ?? 0m;
            decimal finalTotal = totalRoomAmount + totalServicesCombined + taxAmount - depositAmount;

            long amountToPay = (long)Math.Round(finalTotal);
            if (amountToPay <= 0) amountToPay = 1000; // MoMo requires at least 1000 VND

            string orderInfo = $"Thanh toan hoa don {booking.BookingCode}";
            string orderId = booking.BookingCode + "_" + DateTime.Now.Ticks.ToString();

            var response = await _momoService.CreatePaymentAsync(orderId, amountToPay, orderInfo);

            if (response != null && response.resultCode == 0)
            {
                return Ok(new
                {
                    payUrl = response.payUrl,
                    qrCodeUrl = response.qrCodeUrl,
                    deeplink = response.deeplink,
                    amount = amountToPay
                });
            }

            return BadRequest(new { message = "Lỗi kết nối đến cổng thanh toán MoMo: " + (response?.message ?? "Unknown error") });
        }
    }
}
