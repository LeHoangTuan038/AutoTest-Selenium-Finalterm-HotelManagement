using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using QuanTriKhachSanN5.Data;
using QuanTriKhachSanN5.DTOs.RoomType;
using QuanTriKhachSanN5.Interfaces;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Services
{
    public class RoomTypeService : IRoomTypeService
    {
        private readonly ApplicationDbContext _context;

        public RoomTypeService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<RoomTypeDTO>> GetAllRoomTypesAsync()
        {
            var roomTypes = await _context.RoomTypes.Include(rt => rt.Rooms).ToListAsync();

            return roomTypes.Select(rt => new RoomTypeDTO
            {
                Id = rt.Id,
                Name = rt.Name,
                Description = rt.Description,
                BasePrice = rt.BasePrice,
                CapacityAdults = rt.CapacityAdults,
                CapacityChildren = rt.CapacityChildren,
                TotalRooms = rt.Rooms?.Count(r => r.Status != "Maintenance") ?? 0,
            });
        }

        public async Task<RoomTypeDTO?> GetRoomTypeByIdAsync(int id)
        {
            var roomType = await _context
                .RoomTypes.Include(rt => rt.Rooms)
                .FirstOrDefaultAsync(rt => rt.Id == id);

            if (roomType == null)
                return null;

            return new RoomTypeDTO
            {
                Id = roomType.Id,
                Name = roomType.Name,
                Description = roomType.Description,
                BasePrice = roomType.BasePrice,
                CapacityAdults = roomType.CapacityAdults,
                CapacityChildren = roomType.CapacityChildren,
                TotalRooms = roomType.Rooms?.Count(r => r.Status != "Maintenance") ?? 0,
            };
        }

        public async Task<int> CreateRoomTypeAsync(CreateRoomTypeDTO dto)
        {
            if (await _context.RoomTypes.AnyAsync(rt => rt.Name == dto.Name))
            {
                throw new Exception($"Loại phòng '{dto.Name}' đã tồn tại");
            }

            var roomType = new RoomType
            {
                Name = dto.Name,
                Description = dto.Description,
                BasePrice = dto.BasePrice,
                CapacityAdults = dto.CapacityAdults,
                CapacityChildren = dto.CapacityChildren,
                // 👉 ĐẮP THÊM CÁC TRƯỜNG BỊ THIẾU VÀO ĐÂY:
                SizeSqm = dto.SizeSqm,
                BedType = dto.BedType,
                ViewType = dto.ViewType,
                IsActive = dto.IsActive,
                Slug = dto.Slug,
                Content = dto.Content,
            };

            _context.RoomTypes.Add(roomType);
            await _context.SaveChangesAsync();

            return roomType.Id;
        }

        public async Task UpdateRoomTypeAsync(int id, RoomTypeDTO dto)
        {
            var roomType = await _context.RoomTypes.FindAsync(id);
            if (roomType == null)
            {
                throw new Exception("Loại phòng không tồn tại");
            }

            if (await _context.RoomTypes.AnyAsync(rt => rt.Id != id && rt.Name == dto.Name))
            {
                throw new Exception($"Loại phòng '{dto.Name}' đã tồn tại");
            }

            roomType.Name = dto.Name;
            roomType.Description = dto.Description;
            roomType.BasePrice = dto.BasePrice;
            roomType.CapacityAdults = dto.CapacityAdults;
            roomType.CapacityChildren = dto.CapacityChildren;
            // 👉 ĐẮP THÊM CÁC TRƯỜNG BỊ THIẾU VÀO ĐÂY:
            roomType.SizeSqm = dto.SizeSqm;
            roomType.BedType = dto.BedType;
            roomType.ViewType = dto.ViewType;
            roomType.IsActive = dto.IsActive;
            roomType.Slug = dto.Slug;
            roomType.Content = dto.Content;

            await _context.SaveChangesAsync();
        }

        public async Task DeleteRoomTypeAsync(int id)
        {
            var roomType = await _context.RoomTypes.FindAsync(id);
            if (roomType == null)
            {
                throw new Exception("Loại phòng không tồn tại");
            }

            // Kiểm tra có phòng đang sử dụng không
            if (await _context.Rooms.AnyAsync(r => r.RoomTypeId == id))
            {
                throw new Exception("Không thể xóa loại phòng đang có phòng sử dụng");
            }

            _context.RoomTypes.Remove(roomType);
            await _context.SaveChangesAsync();
        }
    }
}
