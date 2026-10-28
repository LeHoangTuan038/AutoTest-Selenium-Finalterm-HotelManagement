using System.Collections.Generic;
using System.Threading.Tasks;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Interfaces
{
    public interface IRoomInventoryService
    {
        Task<List<object>> GetRoomsAsync();
        Task<Room> GetRoomByIdAsync(int id);
        Task UpdateRoomStatusAsync(int roomId, string status);
        
        // Đổi Task<List<Amenity>> thành Task<List<Equipment>> ở đây
        Task<List<Equipment>> GetAmenitiesAsync(); 
        
        Task<List<Room_Inventory>> GetRoomInventoryAsync(int roomId);
        Task<List<Room_Inventory>> GetAllInventoriesAsync();
        Task AddRoomInventoryAsync(Room_Inventory inventory);
        Task UpdateRoomInventoryAsync(Room_Inventory inventory);
        Task DeleteRoomInventoryAsync(int id);
        Task AddRoomImageAsync(Room_Image image);
    }
}