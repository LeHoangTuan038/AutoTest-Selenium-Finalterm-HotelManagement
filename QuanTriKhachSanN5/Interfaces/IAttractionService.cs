using QuanTriKhachSanN5.DTOs.Attraction;

namespace QuanTriKhachSanN5.Interfaces;

public interface IAttractionService
{
    Task<IEnumerable<AttractionDTO>> GetAllAsync();
    Task<AttractionDTO?> GetByIdAsync(int id);
    Task<AttractionDTO> CreateAsync(CreateAttractionDTO dto);
    Task<bool> UpdateAsync(int id, CreateAttractionDTO dto);
    Task<bool> DeleteAsync(int id);
}
