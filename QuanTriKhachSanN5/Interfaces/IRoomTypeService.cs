using System.Collections.Generic;
using System.Threading.Tasks;
using QuanTriKhachSanN5.DTOs.RoomType;

namespace QuanTriKhachSanN5.Interfaces
{
    public interface IRoomTypeService
    {
        Task<IEnumerable<RoomTypeDTO>> GetAllRoomTypesAsync();
        Task<RoomTypeDTO?> GetRoomTypeByIdAsync(int id);
        Task<int> CreateRoomTypeAsync(CreateRoomTypeDTO dto);
        Task UpdateRoomTypeAsync(int id, RoomTypeDTO dto);
        Task DeleteRoomTypeAsync(int id);
    }
}

