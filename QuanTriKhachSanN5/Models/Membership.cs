using System.ComponentModel.DataAnnotations.Schema;

namespace QuanTriKhachSanN5.Models
{
    [Table("Memberships")]
    public class Membership
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("tier_name")]
        public string TierName { get; set; } = string.Empty; // Bronze, Silver, Gold...

        [Column("min_points")]
        public int MinPoints { get; set; }

        [Column("discount_percent")]
        public decimal DiscountPercent { get; set; }
    }
}