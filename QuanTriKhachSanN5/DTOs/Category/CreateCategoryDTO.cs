using System.ComponentModel.DataAnnotations;

namespace QuanTriKhachSanN5.DTOs.Category;

public class CreateCategoryDTO
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }
}
