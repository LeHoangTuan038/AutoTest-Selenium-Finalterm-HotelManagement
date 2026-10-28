using System.ComponentModel.DataAnnotations;

namespace QuanTriKhachSanN5.DTOs.Post;

public class CreatePostDTO
{
    [Required]
    [MaxLength(250)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Excerpt { get; set; }

    [MaxLength(1000)]
    public string? ImageUrl { get; set; }

    [Required]
    public int CategoryId { get; set; }

    public int? RoomTypeId { get; set; }

    public bool IsPublished { get; set; } = false;

    public bool IsHot { get; set; } = false;
}
