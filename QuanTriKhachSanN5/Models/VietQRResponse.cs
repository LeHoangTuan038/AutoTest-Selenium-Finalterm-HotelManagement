namespace QuanTriKhachSanN5.Models
{
    public class VietQRResponse
    {
        public string QrImageUrl { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string AccountName { get; set; } = string.Empty;
        public string BankName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}

