using System.Collections.Generic;
using System.Threading.Tasks;
using QuanTriKhachSanN5.DTOs.Post;

namespace QuanTriKhachSanN5.Interfaces
{
    public interface IPostCommentService
    {
        Task<IEnumerable<PostCommentDTO>> GetAllCommentsAsync();
        Task<IEnumerable<PostCommentDTO>> GetApprovedCommentsByPostIdAsync(int postId);
        Task<PostCommentDTO> CreateCommentAsync(CreatePostCommentDTO dto);
        Task<bool> ApproveCommentAsync(int id);
        Task<bool> DeleteCommentAsync(int id);
    }
}
