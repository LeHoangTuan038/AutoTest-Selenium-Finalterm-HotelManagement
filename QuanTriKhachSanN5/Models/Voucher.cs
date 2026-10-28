using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuanTriKhachSanN5.Models
{
    [Table("Vouchers")]
    public class Voucher
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("code")]
        public string Code { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        [Column("discount_type")]
        public string DiscountType { get; set; } = "PERCENT"; // "PERCENT" or "FIXED_AMOUNT"

        [Required]
        [Column("discount_value")]
        public decimal DiscountValue { get; set; }

        [Column("min_booking_value")]
        public decimal? MinBookingValue { get; set; }

        [Column("valid_from")]
        public DateTime? ValidFrom { get; set; }

        [Column("valid_to")]
        public DateTime? ValidTo { get; set; }

        [Column("usage_limit")]
        public int? UsageLimit { get; set; }
    }
}
