using System.ComponentModel.DataAnnotations;

namespace QuanTriKhachSanN5.DTOs.RoomType
{
    public class RoomTypeDTO
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public decimal BasePrice { get; set; }

        public int CapacityAdults { get; set; }

        public int CapacityChildren { get; set; }

        // Computed field
        public int TotalRooms { get; set; }
        public double? SizeSqm { get; set; }
        public string? BedType { get; set; }
        public string? ViewType { get; set; }
        public bool IsActive { get; set; } = true;
        public string? Slug { get; set; }
        public string? Content { get; set; }
    }
}

