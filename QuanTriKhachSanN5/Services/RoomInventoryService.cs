// =========================================================================
// MODULE 3: ROOM INVENTORY - SERVICE (BẢN FULL OPTION ĐÃ FIX EQUIPMENT)
// =========================================================================

using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using QuanTriKhachSanN5.Data;
using QuanTriKhachSanN5.Interfaces;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Services
{
    public class RoomInventoryService : IRoomInventoryService
    {
        private readonly ApplicationDbContext _context;

        public RoomInventoryService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<object>> GetRoomsAsync()
        {
            var rooms = await _context.Rooms
                .Include(r => r.RoomType)
                .ToListAsync();

            var result = rooms.Select(r => new {
                Id = r.Id,
                RoomNumber = r.RoomNumber,
                Status = r.Status,
                RoomTypeName = r.RoomType != null ? r.RoomType.Name : "Chưa xác định"
            }).Cast<object>().ToList();

            return result;
        }

        public async Task<Room> GetRoomByIdAsync(int id)
        {
            return await _context
                .Rooms.Include(r => r.RoomType)
                .FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task UpdateRoomStatusAsync(int roomId, string status)
        {
            var room = await _context.Rooms.FindAsync(roomId);
            if (room != null)
            {
                room.Status = status;
                await _context.SaveChangesAsync();
            }
        }

        // =========================================================
        // CHÚ Ý: VẪN GIỮ HÀM NÀY NẾU CÓ DÙNG CHỖ KHÁC, NHƯNG NÓ LẤY TỪ EQUIPMENT
        // =========================================================
        public async Task<List<Equipment>> GetAmenitiesAsync() 
        {
            // Trả về danh sách Equipments thay vì Amenities cũ
            return await _context.Equipments.ToListAsync();
        }

        public async Task<List<Room_Inventory>> GetRoomInventoryAsync(int roomId)
        {
            return await _context.RoomInventories
                .Where(ri => ri.RoomId == roomId)
                .Include(ri => ri.Equipment) // ĐÃ SỬA AMENITY THÀNH EQUIPMENT
                .ToListAsync();
        }

        public async Task<List<Room_Inventory>> GetAllInventoriesAsync()
        {
            return await _context.RoomInventories
                .Include(ri => ri.Room)
                .Include(ri => ri.Equipment) // ĐÃ SỬA AMENITY THÀNH EQUIPMENT
                .ToListAsync();
        }

        public async Task AddRoomInventoryAsync(Room_Inventory inventory)
        {
            _context.RoomInventories.Add(inventory);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateRoomInventoryAsync(Room_Inventory inventory)
        {
            _context.RoomInventories.Update(inventory);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteRoomInventoryAsync(int id)
        {
            var inventory = await _context.RoomInventories.FindAsync(id);
            if (inventory != null)
            {
                _context.RoomInventories.Remove(inventory);
                await _context.SaveChangesAsync();
            }
        }

        public async Task AddRoomImageAsync(Room_Image image)
        {
            _context.Add(image); 
            await _context.SaveChangesAsync();
        }
    }
}
