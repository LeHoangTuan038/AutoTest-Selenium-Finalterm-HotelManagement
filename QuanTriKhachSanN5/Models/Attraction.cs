using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuanTriKhachSanN5.Models;

[Table("Attractions")]
public class Attraction
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [MaxLength(250)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("distance_km")]
    public decimal? DistanceKm { get; set; }

    [MaxLength(1000)]
    [Column("description")]
    public string? Description { get; set; }

    [MaxLength(1000)]
    [Column("map_embed_link")]
    public string? MapEmbedLink { get; set; }

    [Column("latitude")]
    public decimal? Latitude { get; set; }

    [Column("longitude")]
    public decimal? Longitude { get; set; }

    [MaxLength(500)]
    [Column("address")]
    public string? Address { get; set; }

    [Column("is_active")]
    public bool? IsActive { get; set; } = true;

    [MaxLength(1000)]
    [Column("image_url")]
    public string? ImageUrl { get; set; }

    [Column("is_hot")]
    public bool? IsHot { get; set; } = false;
}

