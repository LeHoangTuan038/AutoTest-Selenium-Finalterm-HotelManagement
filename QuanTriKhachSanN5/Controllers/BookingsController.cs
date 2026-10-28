using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuanTriKhachSanN5.Data;
using QuanTriKhachSanN5.DTOs;
using QuanTriKhachSanN5.Models;

using QuanTriKhachSanN5.Services;

namespace QuanTriKhachSanN5.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BookingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;

        public BookingsController(ApplicationDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllBookings()
        {
            var bookings = await _context
                .Bookings.Include(b => b.BookingDetails)
                .OrderByDescending(b => b.Id)
                .Select(b => new
                {
                    id = b.Id,
                    bookingCode = b.BookingCode,
                    guestName = b.GuestName,
                    guestEmail = b.GuestEmail,
                    checkInDate = b.BookingDetails.Any() ? b.BookingDetails.Min(d => d.CheckInDate) : (DateTime?)null,
                    checkOutDate = b.BookingDetails.Any() ? b.BookingDetails.Max(d => d.CheckOutDate) : (DateTime?)null,
                    totalAmount = b.BookingDetails.Sum(d => d.PricePerNight * EF.Functions.DateDiffDay(d.CheckInDate, d.CheckOutDate)),
                    status = b.Status
                })
                .ToListAsync();
            return Ok(bookings);
        }

        [HttpPost("available-rooms")]
        public async Task<IActionResult> GetAvailableRooms([FromBody] CheckAvailableRequest req)
        {
            var bookedRoomIds = await _context
                .BookingDetails.Where(bd =>
                    bd.CheckInDate.Date < req.CheckOut.Date
                    && bd.CheckOutDate.Date > req.CheckIn.Date
                    && bd.Booking != null 
                    && (bd.Booking.Status == "Confirmed" || bd.Booking.Status == "Checked_in" || bd.Booking.Status == "Đang ở")
                )
                .Where(bd => bd.RoomId != null)
                .Select(bd => bd.RoomId.Value)
                .ToListAsync();

            var availableRoomTypes = await _context
                .RoomTypes.Include(rt =>
                    rt.Rooms.Where(r => !bookedRoomIds.Contains(r.Id) && r.Status != "Maintenance")
                )
                .Where(rt => rt.CapacityAdults >= req.Adults)
                .ToListAsync();

            var result = availableRoomTypes
                .Where(rt => rt.Rooms != null && rt.Rooms.Any())
                .Select(rt => new
                {
                    RoomTypeId = rt.Id,
                    RoomTypeName = rt.Name,
                    PricePerNight = rt.BasePrice,
                    CapacityAdults = rt.CapacityAdults,
                    CapacityChildren = rt.CapacityChildren,
                    AvailableRooms = rt.Rooms != null ? (object)rt.Rooms.Select(r => new
                    {
                        r.Id,
                        r.RoomNumber,
                        r.Floor,
                    }).ToList() : (object)new List<object>()
                });
            return Ok(result);
        }

        [HttpGet("arrivals")]
        public async Task<IActionResult> GetArrivalsToday()
        {
            var today = DateTime.Today;

            var arrivals = await _context.Bookings
                .Include(b => b.BookingDetails!).ThenInclude(bd => bd.RoomType!)
                .Include(b => b.BookingDetails!).ThenInclude(bd => bd.Room!) 
                // Cho phép hiển thị cả Pending và Confirmed
                .Where(b => (b.Status == "Confirmed" || b.Status == "Pending") 
                         && b.BookingDetails.Any(bd => bd.CheckInDate.Date == today))
                .Select(b => new {
                    id = b.Id,
                    bookingCode = b.BookingCode,
                    guestName = b.GuestName,
                    guestPhone = b.GuestPhone,
                    roomTypeName = b.BookingDetails.FirstOrDefault().RoomType != null
                        ? b.BookingDetails.FirstOrDefault().RoomType.Name
                        : "N/A",

                    assignedRoomId = b.BookingDetails.FirstOrDefault().RoomId,
                    assignedRoomNumber = b.BookingDetails.FirstOrDefault().Room != null
                        ? b.BookingDetails.FirstOrDefault().Room.RoomNumber
                        : null,

                    checkInDate = b.BookingDetails.Min(d => d.CheckInDate),
                    checkOutDate = b.BookingDetails.Max(d => d.CheckOutDate),
                    status = b.Status,
                })
                .ToListAsync();

            return Ok(arrivals);
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequest req)
        {
            if (!req.SelectedRoomIds.Any())
                return BadRequest(new { message = "Vui lòng chọn ít nhất 1 phòng!" });

            // 🚨 KIỂM TRA OVERBOOKING: Kiểm tra xem các phòng này đã có ai đặt chưa trong tầm ngày này
            var overlappingBookings = await _context.BookingDetails
                .Where(bd => req.SelectedRoomIds.Contains(bd.RoomId ?? 0))
                .Where(bd => bd.CheckInDate.Date < req.CheckOut.Date 
                             && bd.CheckOutDate.Date > req.CheckIn.Date 
                             && bd.Booking != null 
                             && (bd.Booking.Status == "Confirmed" || bd.Booking.Status == "Checked_in" || bd.Booking.Status == "Đang ở"))
                .AnyAsync();

            if (overlappingBookings)
                return BadRequest(new { message = "Một hoặc nhiều phòng bạn chọn đã được người khác đặt trong khoảng thời gian này. Vui lòng chọn ngày khác hoặc phòng khác!" });

            string bookingCode = $"BK-{DateTime.Now:yyyyMMdd}-{new Random().Next(1000, 9999)}";

            var newBooking = new Booking
            {
                UserId = req.UserId,
                GuestName = req.GuestName,
                GuestPhone = req.GuestPhone,
                GuestEmail = req.GuestEmail,
                BookingCode = bookingCode,
                DepositAmount = req.DepositAmount,
                Status = "Pending", 
                VoucherId = req.VoucherId,
                BookingDetails = new List<BookingDetail>() 
            };

            foreach (var roomId in req.SelectedRoomIds)
            {
                var room = await _context
                    .Rooms.Include(r => r.RoomType)
                    .FirstOrDefaultAsync(r => r.Id == roomId);
                if (room != null && room.RoomType != null)
                {
                    newBooking.BookingDetails.Add(
                        new BookingDetail
                        {
                            RoomId = room.Id,
                            RoomTypeId = room.RoomTypeId,
                            CheckInDate = req.CheckIn,
                            CheckOutDate = req.CheckOut,
                            PricePerNight = room.RoomType.BasePrice,
                        }
                    );
                }
            }

            _context.Bookings.Add(newBooking);
            await _context.SaveChangesAsync();

            // 🚨 GỬI EMAIL THÔNG BÁO TẠO ĐƠN ĐẶT PHÒNG THÀNH CÔNG 🚨
            if (!string.IsNullOrEmpty(newBooking.GuestEmail))
            {
                try
                {
                    string emailSubject = $"Xác nhận đặt phòng thành công - Mã đơn: {newBooking.BookingCode}";
                    string emailBody = $@"
                    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);'>
                        <div style='background-color: #1890ff; color: white; padding: 20px; text-align: center;'>
                            <h2 style='margin: 0;'>Khách sạn N5 Luxury</h2>
                            <p style='margin: 5px 0 0;'>Xác nhận yêu cầu đặt phòng</p>
                        </div>
                        <div style='padding: 25px; color: #333;'>
                            <p>Xin chào <b>{newBooking.GuestName}</b>,</p>
                            <p>Cảm ơn bạn đã lựa chọn Khách sạn N5. Yêu cầu đặt phòng của bạn đã được ghi nhận thành công trên hệ thống với thông tin chi tiết như sau:</p>
                            <table style='width: 100%; border-collapse: collapse; margin: 20px 0;'>
                                <tr style='border-bottom: 1px solid #eee;'>
                                    <td style='padding: 10px 0; color: #666;'>Mã Đặt Phòng:</td>
                                    <td style='padding: 10px 0; font-weight: bold; color: #1890ff; text-align: right;'>{newBooking.BookingCode}</td>
                                </tr>
                                <tr style='border-bottom: 1px solid #eee;'>
                                    <td style='padding: 10px 0; color: #666;'>Ngày Nhận Phòng:</td>
                                    <td style='padding: 10px 0; font-weight: bold; text-align: right;'>{req.CheckIn:dd/MM/yyyy HH:mm}</td>
                                </tr>
                                <tr style='border-bottom: 1px solid #eee;'>
                                    <td style='padding: 10px 0; color: #666;'>Ngày Trả Phòng:</td>
                                    <td style='padding: 10px 0; font-weight: bold; text-align: right;'>{req.CheckOut:dd/MM/yyyy HH:mm}</td>
                                </tr>
                                <tr style='border-bottom: 1px solid #eee;'>
                                    <td style='padding: 10px 0; color: #666;'>Số Lượng Phòng:</td>
                                    <td style='padding: 10px 0; font-weight: bold; text-align: right;'>{req.SelectedRoomIds.Count} phòng</td>
                                </tr>
                            </table>
                            <p style='background-color: #f6ffed; border: 1px solid #b7eb8f; padding: 15px; border-radius: 8px; color: #52c41a; font-weight: bold; text-align: center;'>
                                Trạng thái đơn: Đang chờ xác nhận từ Lễ tân
                            </p>
                            <p style='margin-top: 25px; font-size: 14px; color: #777; text-align: center;'>
                                Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ hotline: <b>0123.456.789</b><br>
                                Chúc bạn có một kỳ nghỉ tuyệt vời!
                            </p>
                        </div>
                    </div>";
                    await _emailService.SendEmailAsync(newBooking.GuestEmail, emailSubject, emailBody);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[EMAIL ERROR]: {ex.Message}");
                }
            }

            return Ok(
                new { message = "Đặt phòng thành công!", bookingCode = newBooking.BookingCode }
            );
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateBookingStatus(int id, [FromBody] UpdateStatusDto req)
        {
            var booking = await _context
                .Bookings.Include(b => b.BookingDetails)
                .FirstOrDefaultAsync(b => b.Id == id);
            if (booking == null)
                return NotFound(new { message = "Không tìm thấy đơn!" });

            booking.Status = req.Status;

            foreach (var detail in booking.BookingDetails)
            {
                if (detail.RoomId.HasValue)
                {
                    var room = await _context.Rooms.FindAsync(detail.RoomId.Value);
                    if (room != null)
                    {
                        if (req.Status == "Checked_in")
                            room.Status = "Occupied";
                        else if (req.Status == "Completed" || req.Status == "Cancelled")
                        {
                            room.Status = "Available";
                            if (req.Status == "Completed")
                                room.CleaningStatus = "Dirty";
                        }
                    }
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thành công!" });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetBookingDetail(int id)
        {
            var booking = await _context
                .Bookings.Include(b => b.BookingDetails!)
                    .ThenInclude(bd => bd.Room!)
                .Include(b => b.BookingDetails!)
                    .ThenInclude(bd => bd.RoomType!)
                .FirstOrDefaultAsync(b => b.Id == id);
            if (booking == null)
                return NotFound();
            return Ok(
                new
                {
                    id = booking.Id,
                    bookingCode = booking.BookingCode,
                    guestName = booking.GuestName,
                    status = booking.Status,
                    details = booking.BookingDetails!.Select(d => new
                    {
                        roomId = d.RoomId,
                        roomNumber = d.Room?.RoomNumber,
                        roomTypeName = d.RoomType?.Name,
                        roomTypeId = d.RoomTypeId ?? (d.Room != null ? d.Room.RoomTypeId : (int?)null),
                        checkIn = d.CheckInDate,
                        checkOut = d.CheckOutDate,
                        pricePerNight = d.PricePerNight,
                    }),
                }
            );
        }

        // ==============================================================================
        // DANH SÁCH KHÁCH ĐANG LƯU TRÚ (IN-HOUSE)
        // ==============================================================================
        [HttpGet("in-house")]
        public async Task<IActionResult> GetInHouseGuests()
        {
            var inHouse = await _context
                .Bookings.Include(b => b.BookingDetails!)
                    .ThenInclude(bd => bd.Room!)
                // 🚨 Bao lô cả tiếng Anh lẫn tiếng Việt cho chắc cú
                .Where(b => b.Status == "Checked_in" || b.Status == "Đang ở")
                .Select(b => new
                {
                    id = b.Id,
                    bookingCode = b.BookingCode,
                    guestName = b.GuestName,
                    guestPhone = b.GuestPhone,
                    // Lấy danh sách số phòng khách đang ở
                    roomNumbers = b
                        .BookingDetails.Where(d => d.Room != null)
                        .Select(d => d.Room.RoomNumber)
                        .ToList(),
                    checkInDate = b.BookingDetails.Min(d => d.CheckInDate),
                    checkOutDate = b.BookingDetails.Max(d => d.CheckOutDate),
                })
                .ToListAsync();

            return Ok(inHouse);
        }
        [HttpPut("{id}/assign-room")]
        public async Task<IActionResult> AssignRoomToBooking(int id, [FromBody] AssignRoomDto req)
        {
            var booking = await _context.Bookings
                .Include(b => b.BookingDetails)
                .FirstOrDefaultAsync(b => b.Id == id);
            if (booking == null)
                return NotFound(new { message = "Không tìm thấy đơn đặt phòng!" });

            // Tìm chi tiết của đơn
            var detail = booking.BookingDetails.FirstOrDefault();
            if (detail == null)
            {
                return BadRequest(new { message = "Đơn hàng không có chi tiết đặt phòng!" });
            }

            // Gán RoomId được chọn
            detail.RoomId = req.RoomId;

            // Xác nhận trạng thái đơn đặt phòng
            booking.Status = "Confirmed";

            await _context.SaveChangesAsync();
            return Ok(new { message = "Gán phòng và xác nhận đặt phòng thành công!" });
        }
    }

    public class AssignRoomDto
    {
        public int RoomId { get; set; }
    }

    public class UpdateStatusDto
    {
        public string Status { get; set; }
    }
}
