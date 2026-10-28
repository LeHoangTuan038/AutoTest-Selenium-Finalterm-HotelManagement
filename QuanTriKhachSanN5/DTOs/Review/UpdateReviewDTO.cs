using System.ComponentModel.DataAnnotations;

namespace QuanTriKhachSanN5.DTOs.Review
{
    public class UpdateReviewDTO
    {
        [Range(1, 5)]
        public int? Rating { get; set; }

        [MaxLength(1000)]
        public string Comment { get; set; }

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
