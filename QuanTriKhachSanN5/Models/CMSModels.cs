// =========================================================================
// MODULE 1: TRẢI NGHIỆM DU LỊCH & CMS - MODELS
// =========================================================================

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuanTriKhachSanN5.Models
{
    // Bảng Articles: Bài viết blog, thông tin phòng
    [Table("Articles")]
    public class Article
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [MaxLength(250)]
        [Column("title")]
        public string Title { get; set; } = string.Empty;

        [Required]
        [Column("content")]
        public string Content { get; set; } = string.Empty;

        [Column("category_id")]
        public int CategoryId { get; set; }

        [ForeignKey(nameof(CategoryId))]
        public Article_Category? Category { get; set; }

        [Column("author_id")]
        public int AuthorId { get; set; }

        [Required]
        [MaxLength(250)]
        [Column("slug")]
        public string Slug { get; set; } = string.Empty;

        [Column("thumbnail_url")]
        public string? ThumbnailUrl { get; set; }

        [Column("published_at")]
        public DateTime PublishedAt { get; set; }

        [Column("is_active")]
        public bool? IsActive { get; set; }
    }

    // Bảng Article_Categories: Danh mục bài viết
    [Table("Article_Categories")]
    public class Article_Category
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        [Column("name")]
        public string Name { get; set; } = string.Empty;

        public ICollection<Article>? Articles { get; set; }
    }
}
