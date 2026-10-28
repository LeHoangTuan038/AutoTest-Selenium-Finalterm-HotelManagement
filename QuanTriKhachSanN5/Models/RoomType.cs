using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuanTriKhachSanN5.Models
{
    [Table("Room_Types")]
    public class RoomType
    {
        [Key]
        [Column("id")] // Ép chữ thường theo SQL
        public int Id { get; set; }

        [Required]
        [Column("name")] // Ép chữ thường
        public string Name { get; set; } = string.Empty;

        [Column("base_price")]
        public decimal BasePrice { get; set; }

        [Column("capacity_adults")]
        public int CapacityAdults { get; set; }

        [Column("capacity_children")]
        public int CapacityChildren { get; set; }

        [Column("description")] // Ép chữ thường
        public string? Description { get; set; }

        [NotMapped]
        [Column("size_sqm")]
        public double? SizeSqm { get; set; }

        [NotMapped]
        [Column("bed_type")]
        public string? BedType { get; set; }

        [NotMapped]
        [Column("view_type")]
        public string? ViewType { get; set; }

        [NotMapped]
        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [NotMapped]
        [Column("slug")] // Ép chữ thường
        public string? Slug { get; set; }

        [NotMapped]
        [Column("content")] // Ép chữ thường
        public string? Content { get; set; }

        // Navigation properties
        public ICollection<Room>? Rooms { get; set; }
    }
}
