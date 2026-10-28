namespace QuanTriKhachSanN5.DTOs.Attraction;
 
public class AttractionDTO
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal? DistanceKm { get; set; }
    public string? Description { get; set; }
    public string? MapEmbedLink { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? Address { get; set; }
    public bool? IsActive { get; set; }
    public string? ImageUrl { get; set; }
    public bool? IsHot { get; set; }
}

