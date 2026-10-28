using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuanTriKhachSanN5.Models;

public class Post
{
    public int Id { get; set; }

    [Required]
    [MaxLength(250)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Excerpt { get; set; }

    [MaxLength(1000)]
    public string? ImageUrl { get; set; }

    public bool IsPublished { get; set; } = false;

    public bool IsHot { get; set; } = false;

    [Required]
    [ForeignKey(nameof(Category))]
    public int CategoryId { get; set; }

    public Category? Category { get; set; }

    [Column("RoomTypeId")]
    public int? RoomTypeId { get; set; }

    public RoomType? RoomType { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}
