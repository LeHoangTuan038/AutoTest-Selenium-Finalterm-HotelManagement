using Microsoft.EntityFrameworkCore;
using QuanTriKhachSanN5.Data;
using QuanTriKhachSanN5.DTOs.Category;
using QuanTriKhachSanN5.Interfaces;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Services;

public class CategoryService : ICategoryService
{
    private readonly ApplicationDbContext _db;

    public CategoryService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<CategoryDTO> CreateAsync(CreateCategoryDTO dto)
    {
        var entity = new Category { Name = dto.Name.Trim(), Description = dto.Description?.Trim() };

        _db.Categories.Add(entity);
        await _db.SaveChangesAsync();

        return Map(entity);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await _db.Categories.FindAsync(id);
        if (entity is null)
            return false;

        _db.Categories.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<CategoryDTO>> GetAllAsync()
    {
        return await _db
            .Categories.AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => Map(x))
            .ToListAsync();
    }

    public async Task<CategoryDTO?> GetByIdAsync(int id)
    {
        var entity = await _db.Categories.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);

        return entity is null ? null : Map(entity);
    }

    public async Task<bool> UpdateAsync(int id, CreateCategoryDTO dto)
    {
        var entity = await _db.Categories.FindAsync(id);
        if (entity is null)
            return false;

        entity.Name = dto.Name.Trim();
        entity.Description = dto.Description?.Trim();

        await _db.SaveChangesAsync();
        return true;
    }

    private static CategoryDTO Map(Category entity) =>
        new()
        {
            Id = entity.Id,
            Name = entity.Name,
            Description = entity.Description,
        };
}
