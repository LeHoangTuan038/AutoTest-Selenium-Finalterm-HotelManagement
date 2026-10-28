using System.Collections.Generic;
using System.Threading.Tasks;
using QuanTriKhachSanN5.Models;
using QuanTriKhachSanN5.DTOs;

namespace QuanTriKhachSanN5.Interfaces
{
    public interface IAmenityService
    {
        Task<List<AmenityDto>> GetAllAmenitiesAsync();
        // Đổi Amenity thành Equipment ở đây
        Task<Equipment> GetAmenityByIdAsync(int id);
        Task<Equipment> CreateAmenityAsync(Equipment equipment);
        Task UpdateAmenityAsync(Equipment equipment);
        Task DeleteAmenityAsync(int id);
        Task ImportStockAsync(int id, int addedQuantity);
    }
}