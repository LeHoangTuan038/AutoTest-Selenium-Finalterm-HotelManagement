namespace QuanTriKhachSanN5.DTOs
{
    public class CheckoutDto
    {
        public int BookingId { get; set; }
        public decimal RoomCost { get; set; }
        public decimal ServicesCost { get; set; }
        public decimal DamageFee { get; set; }
        public decimal VoucherDiscount { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal RemainingAmount { get; set; }
        public decimal RoomCharges { get; set; }
        public decimal ServiceCharges { get; set; }
        public decimal DamageCharges { get; set; }
        public decimal Discounts { get; set; }
    }

    public class GenerateInvoiceRequestDto
    {
        public int BookingId { get; set; }
    }

    public class ProcessPaymentRequestDto
    {
        public int InvoiceId { get; set; }
        public string PaymentMethod { get; set; } = null!;
        public decimal AmountPaid { get; set; }
        public string TransactionId { get; set; }
    }

    public class M2BookingCostDto
    {
        public decimal RoomTotalCost { get; set; }
        public decimal VoucherDiscount { get; set; }
    }

    public class M4ServiceCostDto
    {
        public decimal ServicesCost { get; set; }
        public decimal DamageFee { get; set; }
    }
}