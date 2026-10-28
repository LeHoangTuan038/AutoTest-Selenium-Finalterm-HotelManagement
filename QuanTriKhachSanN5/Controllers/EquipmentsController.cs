using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuanTriKhachSanN5.Data; 
using QuanTriKhachSanN5.Models; 
using System;
using System.Linq;
using System.Threading.Tasks;

namespace QuanTriKhachSanN5.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EquipmentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public EquipmentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ==========================================
        // 1. LẤY TOÀN BỘ DANH SÁCH THIẾT BỊ/VẬT TƯ (GET)
        // ==========================================
        [HttpGet]
        public async Task<IActionResult> GetAllEquipments()
        {
            try
            {
                // Lấy danh sách, sắp xếp thằng nào mới thêm lên đầu tiên cho dễ nhìn
                var equipments = await _context.Equipments
                                               .OrderByDescending(e => e.Id)
                                               .ToListAsync();
                return Ok(equipments);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Lỗi khi lấy dữ liệu: " + ex.Message });
            }
        }

        // ==========================================
        // 2. LẤY CHI TIẾT 1 VẬT TƯ (GET BY ID)
        // ==========================================
        [HttpGet("{id}")]
        public async Task<IActionResult> GetEquipmentById(int id)
        {
            var equipment = await _context.Equipments.FindAsync(id);
            if (equipment == null) return NotFound(new { message = "Không tìm thấy thiết bị/vật tư này!" });
            
            return Ok(equipment);
        }

        // ==========================================
        // 3. THÊM MỚI VẬT TƯ (POST)
        // ==========================================
        [HttpPost]
        public async Task<IActionResult> CreateEquipment([FromBody] Equipment equipment)
        {
            try
            {
                // Tự động gán giờ tạo hệ thống
                equipment.CreatedAt = DateTime.Now;
                equipment.UpdatedAt = DateTime.Now;

                _context.Equipments.Add(equipment);
                await _context.SaveChangesAsync();

                // Trả về dữ liệu vừa tạo thành công
                return Ok(equipment); 
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Lỗi khi thêm mới: " + ex.InnerException?.Message ?? ex.Message });
            }
        }

        // ==========================================
        // 4. CẬP NHẬT/SỬA VẬT TƯ (PUT) - ĐÃ FIX LỖI COMPUTED COLUMN
        // ==========================================
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEquipment(int id, [FromBody] Equipment equipment)
        {
            if (id != equipment.Id) return BadRequest(new { message = "ID truyền vào không khớp với dữ liệu!" });

            try
            {
                // Tìm thằng cũ trong Database
                var existingItem = await _context.Equipments.FindAsync(id);
                if (existingItem == null) return NotFound(new { message = "Không tìm thấy thiết bị để cập nhật!" });

                // Cập nhật các trường thông thường
                existingItem.ItemCode = equipment.ItemCode;
                existingItem.Name = equipment.Name;
                existingItem.Category = equipment.Category;
                existingItem.Unit = equipment.Unit;
                existingItem.TotalQuantity = equipment.TotalQuantity;
                
                // 🛑 ĐÃ KHÓA LẠI: SQL Server sẽ tự tính các cột này, C# không được ghi đè
                // existingItem.InUseQuantity = equipment.InUseQuantity;
                // existingItem.DamagedQuantity = equipment.DamagedQuantity;
                // existingItem.InStockQuantity = equipment.InStockQuantity; 
                
                existingItem.LiquidatedQuantity = equipment.LiquidatedQuantity;
                existingItem.BasePrice = equipment.BasePrice;
                existingItem.DefaultPriceIfLost = equipment.DefaultPriceIfLost;
                existingItem.Supplier = equipment.Supplier;
                existingItem.IsActive = equipment.IsActive;
                existingItem.ImageUrl = equipment.ImageUrl;
                
                // Tự động cập nhật giờ sửa
                existingItem.UpdatedAt = DateTime.Now;

                // 🚨 ĐÃ XÓA DÒNG _context.Equipments.Update(existingItem); Ở ĐÂY NÈ! 🚨
                // Chỉ cần gọi SaveChangesAsync() là C# tự biết update những trường vừa sửa ở trên!
                await _context.SaveChangesAsync();

                return Ok(new { message = "Cập nhật vật tư thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Lỗi khi cập nhật: " + ex.InnerException?.Message ?? ex.Message });
            }
        }

        // ==========================================
        // 5. XÓA VẬT TƯ (DELETE)
        // ==========================================
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEquipment(int id)
        {
            try
            {
                var equipment = await _context.Equipments.FindAsync(id);
                if (equipment == null) return NotFound(new { message = "Không tìm thấy thiết bị để xóa!" });

                _context.Equipments.Remove(equipment);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Đã xóa vật tư thành công!" });
            }
            catch (Exception ex)
            {
                // Bắt lỗi nếu lỡ xóa trúng vật tư đang có trong phòng (dính khóa ngoại)
                return BadRequest(new { message = "Không thể xóa vật tư này (có thể do đang được gắn cho phòng). Chi tiết lỗi: " + ex.InnerException?.Message ?? ex.Message });
            }
        }
    }
}