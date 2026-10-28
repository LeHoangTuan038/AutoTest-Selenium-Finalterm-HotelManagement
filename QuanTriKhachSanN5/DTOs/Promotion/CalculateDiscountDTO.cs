namespace QuanTriKhachSanN5.DTOs.Promotion
{
    public class CalculateDiscountDTO
    {
        public decimal OriginalAmount { get; set; }
        public string VoucherCode { get; set; }
        public int? MembershipId { get; set; }
    }
}