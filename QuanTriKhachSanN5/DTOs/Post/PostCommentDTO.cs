using System;
using System.ComponentModel.DataAnnotations;

namespace QuanTriKhachSanN5.DTOs.Post
{
    public class PostCommentDTO
    {
        public int Id { get; set; }
        public int PostId { get; set; }
        public string GuestName { get; set; } = string.Empty;
        public string GuestEmail { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string Content { get; set; } = string.Empty;
        public bool IsApproved { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? PostTitle { get; set; }
    }

    public class CreatePostCommentDTO
    {
        [Required(ErrorMessage = "Mã bài viết là bắt buộc")]
        public int PostId { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập tên của bạn")]
        public string GuestName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng nhập email")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        public string GuestEmail { get; set; } = string.Empty;

        [Required]
        [Range(1, 5, ErrorMessage = "Đánh giá từ 1 đến 5 sao")]
        public int Rating { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập nội dung bình luận")]
        public string Content { get; set; } = string.Empty;
    }
}
