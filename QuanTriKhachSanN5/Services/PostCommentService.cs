using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using QuanTriKhachSanN5.Data;
using QuanTriKhachSanN5.DTOs.Post;
using QuanTriKhachSanN5.Interfaces;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Services
{
    public class PostCommentService : IPostCommentService
    {
        private readonly ApplicationDbContext _context;

        public PostCommentService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<PostCommentDTO>> GetAllCommentsAsync()
        {
            return await _context.PostComments
                .Include(c => c.Post)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new PostCommentDTO
                {
                    Id = c.Id,
                    PostId = c.PostId,
                    GuestName = c.GuestName,
                    GuestEmail = c.GuestEmail,
                    Rating = c.Rating,
                    Content = c.Content,
                    IsApproved = c.IsApproved,
                    CreatedAt = c.CreatedAt,
                    PostTitle = c.Post != null ? c.Post.Title : "N/A"
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<PostCommentDTO>> GetApprovedCommentsByPostIdAsync(int postId)
        {
            return await _context.PostComments
                .Where(c => c.PostId == postId && c.IsApproved)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new PostCommentDTO
                {
                    Id = c.Id,
                    PostId = c.PostId,
                    GuestName = c.GuestName,
                    GuestEmail = c.GuestEmail,
                    Rating = c.Rating,
                    Content = c.Content,
                    IsApproved = c.IsApproved,
                    CreatedAt = c.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<PostCommentDTO> CreateCommentAsync(CreatePostCommentDTO dto)
        {
            var comment = new PostComment
            {
                PostId = dto.PostId,
                GuestName = dto.GuestName,
                GuestEmail = dto.GuestEmail,
                Rating = dto.Rating,
                Content = dto.Content,
                IsApproved = false // Chờ duyệt
            };

            _context.PostComments.Add(comment);
            await _context.SaveChangesAsync();

            return new PostCommentDTO
            {
                Id = comment.Id,
                PostId = comment.PostId,
                GuestName = comment.GuestName,
                GuestEmail = comment.GuestEmail,
                Rating = comment.Rating,
                Content = comment.Content,
                IsApproved = comment.IsApproved,
                CreatedAt = comment.CreatedAt
            };
        }

        public async Task<bool> ApproveCommentAsync(int id)
        {
            var comment = await _context.PostComments.FindAsync(id);
            if (comment == null) return false;

            comment.IsApproved = true;
            _context.PostComments.Update(comment);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteCommentAsync(int id)
        {
            var comment = await _context.PostComments.FindAsync(id);
            if (comment == null) return false;

            _context.PostComments.Remove(comment);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
