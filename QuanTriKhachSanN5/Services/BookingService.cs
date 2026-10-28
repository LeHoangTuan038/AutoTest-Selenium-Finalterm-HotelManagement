using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using QuanTriKhachSanN5.Data;
using QuanTriKhachSanN5.DTOs;
using QuanTriKhachSanN5.DTOs.Room;
using QuanTriKhachSanN5.Interfaces;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Services
{
    public class BookingService : IBookingService
    {
        private readonly ApplicationDbContext _context;

        public BookingService(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================================
        // THUẬT TOÁN 1: TÌM LOẠI PHÒNG TRỐNG CHO WEBSITE
        // =========================================================================
        public async Task<
            ApiResponse<List<AvailableRoomTypeResponseDTO>>
        > SearchAvailableRoomTypesAsync(SearchRoomRequestDTO request)
        {
            if (request.CheckInDate >= request.CheckOutDate)
            {
                return new ApiResponse<List<AvailableRoomTypeResponseDTO>>
                {
                    Success = false,
                    Message = "Ngày Check-out phải lớn hơn Check-in",
                };
            }

            // Dùng LINQ để thực thi câu Query đếm phòng trống
            var availableRoomTypes = await _context
                .RoomTypes.Where(rt =>
                    rt.CapacityAdults >= request.Adults && rt.CapacityChildren >= request.Children
                )
                .Select(rt => new
                {
                    RoomType = rt,
                    // Đếm tổng số phòng vật lý của loại này (Không tính phòng đang bảo trì)
                    TotalPhysicalRooms = _context.Rooms.Count(r =>
                        r.RoomTypeId == rt.Id && r.Status != "Maintenance"
                    ),

                    // Đếm số phòng đã bị đặt (Công thức Overlap)
                    BookedRoomsCount = _context
                        .BookingDetails.Where(bd =>
                            bd.RoomTypeId == rt.Id
                            && (bd.Booking.Status == "Confirmed" || bd.Booking.Status == "Checked_in" || bd.Booking.Status == "Đang ở")
                            && bd.CheckInDate.Date < request.CheckOutDate.Date
                            && bd.CheckOutDate.Date > request.CheckInDate.Date
                        ) // LOGIC OVERLAP CHÍNH LÀ ĐÂY
                        .Count(),
                })
                .Where(x => (x.TotalPhysicalRooms - x.BookedRoomsCount) > 0) // Chỉ lấy loại phòng còn dư
                .Select(x => new AvailableRoomTypeResponseDTO
                {
                    RoomTypeId = x.RoomType.Id,
                    Name = x.RoomType.Name,
                    BasePrice = x.RoomType.BasePrice,
                    AvailableCount = x.TotalPhysicalRooms - x.BookedRoomsCount, // Tính ra số phòng trống
                })
                .ToListAsync();

            return new ApiResponse<List<AvailableRoomTypeResponseDTO>>
            {
                Success = true,
                Message = "Tìm phòng thành công",
                Data = availableRoomTypes,
            };
        }

        // =========================================================================
        // THUẬT TOÁN 2: TÌM PHÒNG VẬT LÝ CHO LỄ TÂN (CHECK-IN)
        // =========================================================================
        public async Task<ApiResponse<List<Room>>> GetAvailablePhysicalRoomsAsync(
            int roomTypeId,
            DateTime checkIn,
            DateTime checkOut
        )
        {
            // 1. Lấy danh sách ID các phòng VẬT LÝ đã bị khóa trong khoảng thời gian này
            var bookedRoomIds = await _context.BookingDetails
                .Where(bd => bd.RoomTypeId == roomTypeId 
                          && (bd.Booking.Status == "Confirmed" || bd.Booking.Status == "Checked_in" || bd.Booking.Status == "Đang ở") 
                          && bd.RoomId > 0 // Chỉ xét những booking đã được Lễ tân gán số phòng
                          && bd.CheckInDate.Date < checkOut.Date 
                          && bd.CheckOutDate.Date > checkIn.Date) // LOGIC OVERLAP
                .Select(bd => bd.RoomId)
                .ToListAsync();

            // 2. Tìm các phòng thuộc Loại phòng này, nhưng ID KHÔNG NẰM TRONG danh sách đã đặt ở trên
            var availablePhysicalRooms = await _context
                .Rooms.Where(r =>
                    r.RoomTypeId == roomTypeId
                    && r.Status != "Maintenance"
                    && !bookedRoomIds.Contains(r.Id)
                ) // Tương đương lệnh NOT IN trong SQL
                .ToListAsync();

            return new ApiResponse<List<Room>>
            {
                Success = true,
                Message = "Lấy danh sách phòng vật lý thành công",
                Data = availablePhysicalRooms,
            };
        }
    }
}
