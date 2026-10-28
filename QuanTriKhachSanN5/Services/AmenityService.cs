using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using QuanTriKhachSanN5.Data;
using QuanTriKhachSanN5.DTOs; 
using QuanTriKhachSanN5.Interfaces;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Services
{
    public class AmenityService : IAmenityService
    {
        private readonly ApplicationDbContext _context;

        public AmenityService(ApplicationDbContext context)
        {
            _context = context;
        }

        // 1. LẤY DANH SÁCH KÈM LOGIC TÍNH TOÁN (DÙNG CHO TRANG KHO VẬT TƯ)
        public async Task<List<AmenityDto>> GetAllAmenitiesAsync()
        {
            // Chuyển sang lấy dữ liệu từ bảng Equipments mới
            return await _context.Equipments
                .Select(e => new AmenityDto
                {
                    Id = e.Id,
                    Name = e.Name,
                    Category = e.Category,
                    Unit = e.Unit,
                    ImageUrl = e.ImageUrl,
                    ImportPrice = e.BasePrice, // Map BasePrice sang ImportPrice cho DTO
                    TotalQuantity = e.TotalQuantity,
                    
                    // Tính số lượng đã cấp dựa trên EquipmentId
                    IssuedQuantity = _context.RoomInventories
                        .Where(ri => ri.EquipmentId == e.Id)
                        .Sum(ri => (int?)ri.Quantity) ?? 0,

                    // Tính số lượng khả dụng thực tế trong kho
                    AvailableQuantity = e.TotalQuantity - (_context.RoomInventories
                        .Where(ri => ri.EquipmentId == e.Id)
                        .Sum(ri => (int?)ri.Quantity) ?? 0)
                })
                .ToListAsync();
        }

        public async Task<Equipment> GetAmenityByIdAsync(int id)
        {
            return await _context.Equipments.FindAsync(id);
        }

        public async Task<Equipment> CreateAmenityAsync(Equipment equipment)
        {
            _context.Equipments.Add(equipment);
            await _context.SaveChangesAsync();
            return equipment;
        }

        public async Task UpdateAmenityAsync(Equipment equipment)
        {
            _context.Equipments.Update(equipment);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAmenityAsync(int id)
        {
            var equipment = await _context.Equipments.FindAsync(id);
            if (equipment != null)
            {
                _context.Equipments.Remove(equipment);
                await _context.SaveChangesAsync();
            }
        }

        // HÀM NHẬP KHO
        public async Task ImportStockAsync(int id, int addedQuantity)
        {
            var equipment = await _context.Equipments.FindAsync(id);
            if (equipment != null)
            {
                equipment.TotalQuantity = equipment.TotalQuantity + addedQuantity;
                await _context.SaveChangesAsync();
            }
        }
    }
}
