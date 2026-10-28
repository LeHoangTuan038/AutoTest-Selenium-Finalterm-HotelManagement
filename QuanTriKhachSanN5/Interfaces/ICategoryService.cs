using QuanTriKhachSanN5.DTOs.Category;

namespace QuanTriKhachSanN5.Interfaces;

public interface ICategoryService
{
    Task<IEnumerable<CategoryDTO>> GetAllAsync();
    Task<CategoryDTO?> GetByIdAsync(int id);
    Task<CategoryDTO> CreateAsync(CreateCategoryDTO dto);
    Task<bool> UpdateAsync(int id, CreateCategoryDTO dto);
    Task<bool> DeleteAsync(int id);
}
