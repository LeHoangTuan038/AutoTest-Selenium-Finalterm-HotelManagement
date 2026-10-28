using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuanTriKhachSanN5.Models;

public class AttractionImage
{
    public int Id { get; set; }

    [Required]
    public int AttractionId { get; set; }

    [ForeignKey(nameof(AttractionId))]
    public Attraction? Attraction { get; set; }

    [Required]
    [MaxLength(500)]
    public string ImageUrl { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? CloudinaryPublicId { get; set; } // For future deletion from Cloudinary

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsDeleted { get; set; } = false;
}
