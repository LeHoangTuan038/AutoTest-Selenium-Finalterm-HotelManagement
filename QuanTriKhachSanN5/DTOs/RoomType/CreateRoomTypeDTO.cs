using System.ComponentModel.DataAnnotations;

namespace QuanTriKhachSanN5.DTOs.RoomType
{
    public class CreateRoomTypeDTO
    {
        [Required(ErrorMessage = "Tên loại phòng là bắt buộc")]
        [StringLength(100, ErrorMessage = "Tên loại phòng không được quá 100 ký tự")]
        public string Name { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Mô tả không được quá 500 ký tự")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Giá cơ bản là bắt buộc")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Giá phải lớn hơn 0")]
        public decimal BasePrice { get; set; }

        [Required(ErrorMessage = "Sức chứa người lớn là bắt buộc")]
        [Range(1, 10, ErrorMessage = "Sức chứa người lớn từ 1-10")]
        public int CapacityAdults { get; set; }

        [Range(0, 5, ErrorMessage = "Sức chứa trẻ em từ 0-5")]
        public int CapacityChildren { get; set; } = 0;
        public double? SizeSqm { get; set; }
        public string? BedType { get; set; }
        public string? ViewType { get; set; }
        public bool IsActive { get; set; } = true;
        public string? Slug { get; set; }
        public string? Content { get; set; }
    }
}

