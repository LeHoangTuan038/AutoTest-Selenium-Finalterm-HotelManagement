using System.ComponentModel.DataAnnotations;

namespace QuanTriKhachSanN5.DTOs.Review
{
    public class CreateReviewDTO
    {
        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }

        [Required]
        public int RoomTypeId { get; set; }

        public int? BookingId { get; set; }

        [MaxLength(1000)]
        public string Comment { get; set; } = string.Empty;

        [Range(1, 5)]
        public int? Cleanliness { get; set; }

        [Range(1, 5)]
        public int? Comfort { get; set; }

        [Range(1, 5)]
        public int? ServiceQuality { get; set; }

        [Range(1, 5)]
        public int? ValueForMoney { get; set; }
    }
}
