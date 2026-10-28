using System.ComponentModel.DataAnnotations;

namespace QuanTriKhachSanN5.Models;

public class Category
{
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    public ICollection<Post> Posts { get; set; } = new List<Post>();
}
