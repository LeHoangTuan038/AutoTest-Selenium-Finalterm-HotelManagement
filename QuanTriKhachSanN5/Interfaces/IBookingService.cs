using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using QuanTriKhachSanN5.DTOs;
using QuanTriKhachSanN5.DTOs.Room;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Interfaces
{
    public interface IBookingService
    {
        // 1. Dành cho Guest (Website)
        Task<ApiResponse<List<AvailableRoomTypeResponseDTO>>> SearchAvailableRoomTypesAsync(SearchRoomRequestDTO request);
        
        // 2. Dành cho Receptionist (ERP)
        Task<ApiResponse<List<Room>>> GetAvailablePhysicalRoomsAsync(int roomTypeId, DateTime checkIn, DateTime checkOut);
    }
}