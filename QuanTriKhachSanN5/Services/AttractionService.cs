using Microsoft.EntityFrameworkCore;
using QuanTriKhachSanN5.Data;
using QuanTriKhachSanN5.DTOs.Attraction;
using QuanTriKhachSanN5.Interfaces;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Services;

public class AttractionService : IAttractionService
{
    private readonly ApplicationDbContext _db;

    public AttractionService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<AttractionDTO> CreateAsync(CreateAttractionDTO dto)
    {
        var entity = new Attraction
        {
            Name         = dto.Name.Trim(),
            Description  = dto.Description?.Trim(),
            Address      = dto.Location?.Trim(),
            DistanceKm   = dto.DistanceKm,
            MapEmbedLink = dto.MapEmbedLink?.Trim(),
            Latitude     = dto.Latitude,
            Longitude    = dto.Longitude,
            IsActive     = dto.IsActive ?? true,
            ImageUrl     = dto.ImageUrl,
            IsHot        = dto.IsHot ?? false
        };

        _db.Attractions.Add(entity);
        await _db.SaveChangesAsync();

        return Map(entity);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await _db.Attractions.FindAsync(id);
        if (entity is null)
            return false;

        _db.Attractions.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<AttractionDTO>> GetAllAsync()
    {
        var list = await _db.Attractions
            .AsNoTracking()
            .OrderByDescending(x => x.IsHot ?? false)
            .ThenBy(x => x.DistanceKm ?? 999)
            .ToListAsync();

        return list.Select(Map);
    }

    public async Task<AttractionDTO?> GetByIdAsync(int id)
    {
        var entity = await _db.Attractions.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);

        return entity is null ? null : Map(entity);
    }

    public async Task<bool> UpdateAsync(int id, CreateAttractionDTO dto)
    {
        var entity = await _db.Attractions.FindAsync(id);
        if (entity is null)
            return false;

        entity.Name         = dto.Name.Trim();
        entity.Description  = dto.Description?.Trim();
        entity.Address      = dto.Location?.Trim();
        entity.DistanceKm   = dto.DistanceKm;
        entity.MapEmbedLink = dto.MapEmbedLink?.Trim();
        entity.Latitude     = dto.Latitude;
        entity.Longitude    = dto.Longitude;
        entity.IsActive     = dto.IsActive ?? true;
        entity.ImageUrl     = dto.ImageUrl;
        entity.IsHot        = dto.IsHot ?? false;

        await _db.SaveChangesAsync();
        return true;
    }

    private static AttractionDTO Map(Attraction entity) =>
        new()
        {
            Id = entity.Id,
            Name = entity.Name,
            Description = entity.Description,
            DistanceKm = entity.DistanceKm,
            MapEmbedLink = entity.MapEmbedLink,
            Latitude = entity.Latitude,
            Longitude = entity.Longitude,
            Address = entity.Address,
            IsActive = entity.IsActive,
            ImageUrl = entity.ImageUrl,
            IsHot = entity.IsHot ?? false
        };
}

