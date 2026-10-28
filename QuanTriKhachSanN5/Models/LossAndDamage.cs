using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuanTriKhachSanN5.Models
{
    [Table("Loss_And_Damages")]
    public class LossAndDamage
    {
        public int Id { get; set; }

        [Column("booking_detail_id")]
        public int? BookingDetailId { get; set; }

        [Column("room_inventory_id")]
        public int? RoomInventoryId { get; set; }

        [Column("quantity")]
        public int Quantity { get; set; } = 1;

        [Column("penalty_amount")]
        public decimal PenaltyAmount { get; set; }

        [Column("description")]
        public string? Description { get; set; }

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }

        [Column("ImageUrl")]
        public string? ImageUrl { get; set; }

        [Column("status")]
        public string? Status { get; set; }

        [ForeignKey("BookingDetailId")]
        public BookingDetail? BookingDetail { get; set; }
    }
}
