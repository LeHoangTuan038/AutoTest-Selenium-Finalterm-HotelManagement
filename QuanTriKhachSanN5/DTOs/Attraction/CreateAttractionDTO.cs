using System.ComponentModel.DataAnnotations;

namespace QuanTriKhachSanN5.DTOs.Attraction;

public class CreateAttractionDTO
{
    [Required]
    [MaxLength(250)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [MaxLength(500)]
    public string? Location { get; set; }

    public decimal? DistanceKm { get; set; }

    [MaxLength(1000)]
    public string? MapEmbedLink { get; set; }

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }

    public string? ImageUrl { get; set; }

    public bool? IsHot { get; set; }

    public bool? IsActive { get; set; }
}
