using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuanTriKhachSanN5.Models
{
    public class Review
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("user_id")]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }

        [Required]
        [Column("room_type_id")]
        public int RoomTypeId { get; set; }

        [ForeignKey("RoomTypeId")]
        public RoomType? RoomType { get; set; }

        [NotMapped]
        public int? BookingId { get; set; }

        [NotMapped]
        [ForeignKey("BookingId")]
        public Booking? Booking { get; set; }

        [Required]
        [Range(1, 5)]
        [Column("rating")]
        public int Rating { get; set; }

        [MaxLength(1000)]
        [Column("comment")]
        public string Comment { get; set; } = string.Empty;

        [NotMapped]
        public int? Cleanliness { get; set; } 
        [NotMapped]
        public int? Comfort { get; set; }
        [NotMapped]
        public int? ServiceQuality { get; set; }
        [NotMapped]
        public int? ValueForMoney { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [NotMapped]
        public DateTime? UpdatedAt { get; set; }
        [NotMapped]
        public bool IsVerified { get; set; } = false;
    }
}
