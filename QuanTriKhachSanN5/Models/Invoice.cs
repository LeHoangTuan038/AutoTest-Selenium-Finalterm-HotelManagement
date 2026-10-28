using System.ComponentModel.DataAnnotations.Schema;

namespace QuanTriKhachSanN5.Models
{
    [Table("Invoices")]
    public class Invoice
    {
        public int Id { get; set; }

        [Column("booking_id")]
        public int BookingId { get; set; }

        [Column("total_room_amount")]
        public decimal? TotalRoomAmount { get; set; }

        [Column("total_service_amount")]
        public decimal? TotalServiceAmount { get; set; }

        [Column("discount_amount")]
        public decimal? DiscountAmount { get; set; }

        [Column("tax_amount")]
        public decimal? TaxAmount { get; set; }

        [Column("final_total")]
        public decimal? FinalTotal { get; set; }

        [Column("status")]
        public string Status { get; set; }

        [ForeignKey("BookingId")]
        public Booking? Booking { get; set; }
    }
}
