using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using QuanTriKhachSanN5.Data;
using QuanTriKhachSanN5.DTOs;
using QuanTriKhachSanN5.Interfaces;
using QuanTriKhachSanN5.Models;

using QuanTriKhachSanN5.Services;

namespace QuanTriKhachSanN5.API.Services
{
    public class ReceptionService : IReceptionService
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;

        public ReceptionService(ApplicationDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        public async Task CheckInBookingAsync(int bookingId, int roomId)
        {
            var booking = await _context.Bookings.FindAsync(bookingId);

            // Lấy cả đơn Confirmed hoặc Pending đều cho phép Check-in
            if (booking != null)
            {
                var detail = await _context.BookingDetails.FirstOrDefaultAsync(bd =>
                    bd.BookingId == bookingId
                );
                if (detail != null)
                {
                    // 1. Cập nhật chi tiết đơn: Gán phòng cho khách
                    detail.RoomId = roomId;

                    // 2. Đổi trạng thái Booking thành Đang ở
                    booking.Status = "Checked_in";

                    // 3. 🚨 LOGIC MỚI: TÌM PHÒNG VẬT LÝ VÀ ĐỔI TRẠNG THÁI SANG CÓ KHÁCH 🚨
                    var room = await _context.Rooms.FindAsync(roomId);
                    if (room != null)
                    {
                        room.Status = "Occupied"; // Khớp với model Room.cs của ní
                    }

                    // Lưu tất cả thay đổi vào SQL cùng một lúc
                    await _context.SaveChangesAsync();

                    // 🚨 GỬI EMAIL THÔNG BÁO CHECK-IN THÀNH CÔNG 🚨
                    if (!string.IsNullOrEmpty(booking.GuestEmail))
                    {
                        try
                        {
                            string emailSubject = $"Thông báo Check-in thành công - Mã đơn: {booking.BookingCode}";
                            string emailBody = $@"
                            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);'>
                                <div style='background-color: #52c41a; color: white; padding: 20px; text-align: center;'>
                                    <h2 style='margin: 0;'>Khách sạn N5 Luxury</h2>
                                    <p style='margin: 5px 0 0;'>Thủ tục Check-in hoàn tất</p>
                                </div>
                                <div style='padding: 25px; color: #333;'>
                                    <p>Xin chào <b>{booking.GuestName}</b>,</p>
                                    <p>Thủ tục nhận phòng của bạn đã hoàn tất thành công. Dưới đây là thông tin chi tiết phòng của bạn:</p>
                                    <table style='width: 100%; border-collapse: collapse; margin: 20px 0;'>
                                        <tr style='border-bottom: 1px solid #eee;'>
                                            <td style='padding: 10px 0; color: #666;'>Mã Đặt Phòng:</td>
                                            <td style='padding: 10px 0; font-weight: bold; color: #1890ff; text-align: right;'>{booking.BookingCode}</td>
                                        </tr>
                                        <tr style='border-bottom: 1px solid #eee;'>
                                            <td style='padding: 10px 0; color: #666;'>Phòng Của Bạn:</td>
                                            <td style='padding: 10px 0; font-weight: bold; color: #52c41a; font-size: 18px; text-align: right;'>Phòng {room?.RoomNumber}</td>
                                        </tr>
                                        <tr style='border-bottom: 1px solid #eee;'>
                                            <td style='padding: 10px 0; color: #666;'>Giờ Nhận Phòng:</td>
                                            <td style='padding: 10px 0; font-weight: bold; text-align: right;'>{DateTime.Now:dd/MM/yyyy HH:mm}</td>
                                        </tr>
                                    </table>
                                    <p style='background-color: #e6f7ff; border: 1px solid #91d5ff; padding: 15px; border-radius: 8px; color: #1890ff; text-align: center;'>
                                        Wifi Miễn Phí: <b>N5_Luxury_Free</b> | Mật khẩu: <b>88888888</b>
                                    </p>
                                    <p style='margin-top: 25px; font-size: 14px; color: #777; text-align: center;'>
                                        Lễ tân trực 24/7. Vui lòng bấm phím 0 trên điện thoại bàn nếu cần hỗ trợ.<br>
                                        Chúc bạn có những trải nghiệm tuyệt vời tại khách sạn!
                                    </p>
                                </div>
                            </div>";
                            await _emailService.SendEmailAsync(booking.GuestEmail, emailSubject, emailBody);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"[EMAIL ERROR]: {ex.Message}");
                        }
                    }
                }
            }
        }

        public async Task<Order_Service> OrderServiceAsync(
            int bookingId,
            int serviceId,
            int quantity
        )
        {
            // 1. Tìm chính xác chi tiết phòng của khách
            var detailInfo = await _context.BookingDetails.FirstOrDefaultAsync(bd =>
                bd.BookingId == bookingId
            );
            if (detailInfo == null)
                throw new Exception("Không tìm thấy thông tin lưu trú của khách!");

            // 2. Tạo đơn dịch vụ mới (Khởi tạo TotalAmount = 0 để tránh lỗi 500)
            var order = new Order_Service
            {
                BookingDetailId = detailInfo.Id,
                OrderDate = DateTime.Now,
                Status = "Ordered",
                TotalAmount = 0m,
            };
            _context.OrderServices.Add(order);
            await _context.SaveChangesAsync();

            // 3. Tìm thông tin dịch vụ (giá tiền)
            var service = await _context.Services.FindAsync(serviceId);
            if (service == null)
                throw new Exception("Dịch vụ không tồn tại!");

            // 4. Tạo chi tiết dịch vụ
            var detail = new Order_Service_Detail
            {
                OrderServiceId = order.Id,
                ServiceId = serviceId,
                Quantity = quantity,
                UnitPrice = service.Price,
            };
            _context.OrderServiceDetails.Add(detail);

            // 5. 🚨 ĐÃ FIX LỖI CS0019: Xóa ?? 0m vì service.Price đã là decimal chuẩn
            order.TotalAmount = quantity * service.Price;

            await _context.SaveChangesAsync();
            return order;
        }

        public async Task<LossAndDamage> ReportDamageAsync(
            int bookingId,
            string description,
            decimal fineAmount
        )
        {
            var bookingDetail = await _context.BookingDetails.FirstOrDefaultAsync(bd =>
                bd.BookingId == bookingId
            );
            int detailId = bookingDetail != null ? bookingDetail.Id : 0;

            var damage = new LossAndDamage
            {
                BookingDetailId = detailId,
                Description = description,
                PenaltyAmount = fineAmount,
                Quantity = 1, // Gán mặc định là 1 để tránh lỗi NOT NULL
                CreatedAt = DateTime.Now,
                Status = "Pending",
                ImageUrl = ""
            };

            _context.LossAndDamages.Add(damage);
            await _context.SaveChangesAsync();
            return damage;
        }

        public async Task<CheckoutDto> CalculateCheckoutAsync(int bookingId)
        {
            var booking = await _context
                .Bookings.Include(b => b.BookingDetails)
                .FirstOrDefaultAsync(b => b.Id == bookingId);

            if (booking == null)
                throw new Exception("Booking not found");

            var detailIds = booking.BookingDetails.Select(bd => bd.Id).ToList();

            var services = await _context
                .OrderServices.Where(os =>
                    os.BookingDetailId != null && detailIds.Contains(os.BookingDetailId.Value)
                )
                .ToListAsync();
            var serviceIds = services.Select(s => s.Id).ToList();

            decimal serviceTotal = 0m;
            if (serviceIds.Any())
            {
                var orderDetails = await _context
                    .OrderServiceDetails.Where(d => serviceIds.Contains(d.OrderServiceId))
                    .ToListAsync();

                serviceTotal = orderDetails.Sum(d => d.Quantity * d.UnitPrice);
            }

            var damages = await _context
                .LossAndDamages.Where(l =>
                    l.BookingDetailId != null && detailIds.Contains(l.BookingDetailId.Value)
                )
                .ToListAsync();

            decimal roomTotal = booking.BookingDetails.Sum(bd => bd.PricePerNight);
            decimal damageTotal = damages.Sum(d => d.PenaltyAmount);
            decimal discount = 0m;

            return new CheckoutDto
            {
                BookingId = bookingId,
                RoomCharges = roomTotal,
                ServiceCharges = serviceTotal,
                DamageCharges = damageTotal,
                Discounts = discount,
                TotalAmount = roomTotal + serviceTotal + damageTotal - discount,
            };
        }
    }
}
