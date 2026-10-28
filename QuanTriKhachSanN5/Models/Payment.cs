using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuanTriKhachSanN5.Models
{
    [Table("Payments")]
    public class Payment
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("invoice_id")]
        public int? InvoiceId { get; set; }

        [StringLength(50)]
        [Column("payment_method")]
        public string? PaymentMethod { get; set; }

        [Column("amount_paid")]
        public decimal AmountPaid { get; set; }

        [StringLength(100)]
        [Column("transaction_code")]
        public string? TransactionCode { get; set; }

        [Column("payment_date")]
        public DateTime? PaymentDate { get; set; } = DateTime.Now;
    }
}
