using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuanTriKhachSanN5.Models
{
    public class Room
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [Column("room_number")]
        public string RoomNumber { get; set; }

        [Column("status")]
        public string Status { get; set; } // Available, Occupied, Maintenance

        [Column("floor")]
        public int Floor { get; set; }

        [Column("cleaning_status")]
        public string CleaningStatus { get; set; } // Clean, Inspecting...

        [Column("extension_number")]
        public string? ExtensionNumber { get; set; }

        // KHOÁ NGOẠI
        [Column("room_type_id")]
        public int RoomTypeId { get; set; }
        public RoomType? RoomType { get; set; }
    }
}
