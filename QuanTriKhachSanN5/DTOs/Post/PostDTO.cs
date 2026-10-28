namespace QuanTriKhachSanN5.DTOs.Post;

public class PostDTO
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Excerpt { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsPublished { get; set; }
    public bool IsHot { get; set; }
    public int CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public int? RoomTypeId { get; set; }
    public string? RoomTypeName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Helpers to match Article model structure in client views
    public object Category => new { id = CategoryId, name = CategoryName ?? "Chưa phân loại" };
    public string? ThumbnailUrl => ImageUrl;
    public DateTime PublishedAt => CreatedAt;
}
