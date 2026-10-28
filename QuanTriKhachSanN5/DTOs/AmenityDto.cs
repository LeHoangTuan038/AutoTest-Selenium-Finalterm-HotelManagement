namespace QuanTriKhachSanN5.DTOs
{
    public class AmenityDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Category { get; set; }
        public string? Unit { get; set; }
        public string? ImageUrl { get; set; }

        // 3 CỘT LOGIC ĂN TIỀN
        public int TotalQuantity { get; set; }      // 1. Tổng sở hữu (Trong hầm + Trong phòng)
        public int IssuedQuantity { get; set; }     // 2. Đã cấp (Tổng số lượng đang ở các phòng)
        public int AvailableQuantity { get; set; }  // 3. Có thể cấp (Total - Issued)
        
        public decimal? ImportPrice { get; set; }
    }
}