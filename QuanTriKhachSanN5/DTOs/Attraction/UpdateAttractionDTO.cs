using System.ComponentModel.DataAnnotations;

namespace QuanTriKhachSanN5.DTOs.Attraction;

public class UpdateAttractionDTO
{
    [Required(ErrorMessage = "Tên điểm du lịch là bắt buộc")]
    [MaxLength(250, ErrorMessage = "Tên không quá 250 ký tự")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000, ErrorMessage = "Mô tả không quá 1000 ký tự")]
    public string? Description { get; set; }

    [MaxLength(500, ErrorMessage = "Địa chỉ không quá 500 ký tự")]
    public string? Location { get; set; }

    // Google Maps Integration
    [MaxLength(100)]
    public string? GooglePlaceId { get; set; }

    [Range(-90, 90, ErrorMessage = "Latitude phải từ -90 đến 90")]
    public double? Latitude { get; set; }

    [Range(-180, 180, ErrorMessage = "Longitude phải từ -180 đến 180")]
    public double? Longitude { get; set; }

    // Image management
    [MaxLength(500)]
    public string? MainImageUrl { get; set; }

    public List<string>? ImageUrlsToAdd { get; set; }

    public List<int>? ImageIdsToRemove { get; set; }
}
