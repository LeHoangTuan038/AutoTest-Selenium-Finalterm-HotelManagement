using System;

namespace QuanTriKhachSanN5.DTOs.Room
{
    public class SearchRoomRequestDTO
    {
        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public int Adults { get; set; }
        public int Children { get; set; }
    }
}