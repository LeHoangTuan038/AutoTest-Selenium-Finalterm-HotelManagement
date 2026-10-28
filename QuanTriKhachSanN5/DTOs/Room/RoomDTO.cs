namespace QuanTriKhachSanN5.DTOs.Room
{
    public class RoomDTO
    {
        public int Id { get; set; }
        public string RoomNumber { get; set; }
        public int RoomTypeId { get; set; }
        public string? RoomTypeName { get; set; }
        public decimal? RoomTypeBasePrice { get; set; }
    }
}
