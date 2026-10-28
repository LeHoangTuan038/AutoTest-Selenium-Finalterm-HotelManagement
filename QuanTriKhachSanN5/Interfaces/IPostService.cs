using QuanTriKhachSanN5.DTOs.Post;

namespace QuanTriKhachSanN5.Interfaces;

public interface IPostService
{
    Task<IEnumerable<PostDTO>> GetAllAsync();
    Task<PostDTO?> GetByIdAsync(int id);
    Task<PostDTO?> GetByRoomTypeIdAsync(int roomTypeId);
    Task<IEnumerable<PostDTO>> GetByCategoryAsync(int categoryId);
    Task<PostDTO> CreateAsync(CreatePostDTO dto);
    Task<bool> UpdateAsync(int id, CreatePostDTO dto);
    Task<bool> DeleteAsync(int id);
}
