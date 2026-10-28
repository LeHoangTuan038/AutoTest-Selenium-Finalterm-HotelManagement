using System;
using System.Collections.Generic;

namespace QuanTriKhachSanN5.DTOs
{
    public class CheckAvailableRequest
    {
        public DateTime CheckIn { get; set; }
        public DateTime CheckOut { get; set; }
        public int Adults { get; set; } = 1;
        public int Children { get; set; } = 0;
    }

    public class CreateBookingRequest
    {
        public string GuestName { get; set; }
        public string GuestPhone { get; set; }
        public string GuestEmail { get; set; }
        public DateTime CheckIn { get; set; }
        public DateTime CheckOut { get; set; }
        public List<int> SelectedRoomIds { get; set; } 
        public int? UserId { get; set; }
        public decimal DepositAmount { get; set; }
        public int? VoucherId { get; set; }
    }

    // 🚨 THÊM THẰNG NÀY VÀO ĐÂY LÀ HẾT LỖI 🚨
    public class UpdateStatusDto
    {
        public string Status { get; set; }
    }
}