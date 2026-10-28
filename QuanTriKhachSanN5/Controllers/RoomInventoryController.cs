using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuanTriKhachSanN5.Interfaces;
using QuanTriKhachSanN5.Models;
using QuanTriKhachSanN5.Data;

namespace QuanTriKhachSanN5.Controllers
{
    // =========================================================
    // DTO: CLASS PHIÊN DỊCH DỮ LIỆU TỪ REACT GỬI LÊN
    // =========================================================
    public class AssignInventoryDto
    {
        public int RoomId { get; set; }
        public int AmenityId { get; set; }
        public int Quantity { get; set; }
        public bool IsActive { get; set; }
    }

    public class TransferOrCloneDto
    {
        public int SourceRoomId { get; set; }
        public int TargetRoomId { get; set; }
        public bool IsMove { get; set; }
        public List<TransferItemDto> Items { get; set; }
    }

    public class TransferItemDto
    {
        public int AmenityId { get; set; }
        public int Quantity { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class RoomInventoryController : ControllerBase
    {
        private readonly IRoomInventoryService _roomService;
        private readonly ApplicationDbContext _context;

        public RoomInventoryController(IRoomInventoryService roomService, ApplicationDbContext context)
        {
            _roomService = roomService;
            _context = context;
        }

        [Authorize(Policy = "MANAGE_INVENTORY")]
        [HttpGet("amenities")]
        public async Task<IActionResult> GetAmenities()
        {
            var equipments = await _context.Equipments.Where(e => e.IsActive == true).ToListAsync();
            return Ok(equipments);
        }

        [Authorize(Policy = "MANAGE_INVENTORY")]
        [HttpGet("rooms/{roomId}/inventory")]
        public async Task<IActionResult> GetRoomInventory(int roomId)
        {
            // TỰ ĐỘNG PHÂN TÁCH VẬT TƯ ĐIỆN TỬ BỊ GỘP CÓ SỐ LƯỢNG > 1 THÀNH CÁC DÒNG CÓ SỐ LƯỢNG = 1
            var databaseHasGroupedElectronics = await _context.RoomInventories
                .Include(ri => ri.Equipment)
                .AnyAsync(ri => ri.RoomId == roomId && ri.Equipment != null && ri.Equipment.Category == "Điện tử" && ri.Quantity > 1);

            if (databaseHasGroupedElectronics)
            {
                var groupedItems = await _context.RoomInventories
                    .Include(ri => ri.Equipment)
                    .Where(ri => ri.RoomId == roomId && ri.Equipment != null && ri.Equipment.Category == "Điện tử" && ri.Quantity > 1)
                    .ToListAsync();

                foreach (var item in groupedItems)
                {
                    int totalQty = item.Quantity;
                    // Sửa bản ghi hiện tại thành số lượng = 1
                    item.Quantity = 1;
                    _context.RoomInventories.Update(item);

                    // Thêm phần số lượng còn lại thành các bản ghi riêng lẻ, mỗi bản ghi số lượng = 1
                    for (int i = 1; i < totalQty; i++)
                    {
                        var splitItem = new Room_Inventory
                        {
                            RoomId = item.RoomId,
                            EquipmentId = item.EquipmentId,
                            Quantity = 1,
                            PriceIfLost = item.PriceIfLost,
                            IsActive = item.IsActive,
                            Note = item.Note,
                            ItemType = item.ItemType
                        };
                        _context.RoomInventories.Add(splitItem);
                    }
                }
                await _context.SaveChangesAsync();
            }

            var inventory = await _context.RoomInventories
                .Where(ri => ri.RoomId == roomId)
                .Include(ri => ri.Equipment) 
                .Select(ri => new {
                    id = ri.Id,
                    roomId = ri.RoomId,
                    amenityId = ri.EquipmentId, 
                    quantity = ri.Quantity,
                    isActive = ri.IsActive,
                    amenityName = ri.Equipment != null ? ri.Equipment.Name : "Không xác định",
                    
                    amenity = new {
                        name = ri.Equipment != null ? ri.Equipment.Name : "Không xác định",
                        price = ri.Equipment != null ? ri.Equipment.DefaultPriceIfLost : 0,
                        imageUrl = ri.Equipment != null ? ri.Equipment.ImageUrl : null
                    }
                })
                .ToListAsync();

            return Ok(inventory);
        }

        // =========================================================
        // 🚨 NÂNG CẤP 1: KIỂM TRA TỒN KHO TRƯỚC KHI THÊM 1 MÓN
        // =========================================================
        [Authorize(Policy = "MANAGE_INVENTORY")]
        [HttpPost("rooms/{roomId}/inventory")]
        public async Task<IActionResult> AssignEquipmentToRoom(int roomId, [FromBody] AssignInventoryDto dto)
        {
            if (roomId != dto.RoomId) return BadRequest(new { message = "ID phòng không khớp." });

            var equipment = await _context.Equipments.FindAsync(dto.AmenityId);
            if (equipment == null) return NotFound(new { message = "Không tìm thấy vật tư trong kho." });

            // LOGIC KIỂM TRA KHO: Tính số lượng đang rảnh rỗi
            int currentlyInUse = await _context.RoomInventories.Where(ri => ri.EquipmentId == dto.AmenityId).SumAsync(ri => ri.Quantity);
            int available = equipment.TotalQuantity - currentlyInUse;

            if (available < dto.Quantity)
                return BadRequest(new { message = $"Kho không đủ '{equipment.Name}'. Chỉ còn lại: {available} cái." });

            if (equipment.Category == "Điện tử")
            {
                var addedList = new List<Room_Inventory>();
                for (int i = 0; i < dto.Quantity; i++)
                {
                    var newInv = new Room_Inventory
                    {
                        RoomId = dto.RoomId,
                        EquipmentId = dto.AmenityId,
                        Quantity = 1,
                        PriceIfLost = equipment.DefaultPriceIfLost,
                        IsActive = true
                    };
                    _context.RoomInventories.Add(newInv);
                    addedList.Add(newInv);
                }
                await _context.SaveChangesAsync();
                return Ok(new { Message = "Đã gán vật tư điện tử cho phòng thành công!", Data = addedList.FirstOrDefault() });
            }
            else
            {
                var newInventory = new Room_Inventory
                {
                    RoomId = dto.RoomId,
                    EquipmentId = dto.AmenityId,
                    Quantity = dto.Quantity,
                    PriceIfLost = equipment.DefaultPriceIfLost,
                    IsActive = true
                };
                _context.RoomInventories.Add(newInventory);
                await _context.SaveChangesAsync();
                return Ok(new { Message = "Đã gán vật tư cho phòng thành công!", Data = newInventory });
            }
        }

        // =========================================================
        // 🚨 NÂNG CẤP 2: API THÊM HÀNG LOẠT (BULK INSERT) SIÊU NHANH
        // =========================================================
        [Authorize(Policy = "MANAGE_INVENTORY")]
        [HttpPost("rooms/{roomId}/inventory/bulk")]
        public async Task<IActionResult> AssignBulkEquipmentsToRoom(int roomId, [FromBody] List<AssignInventoryDto> dtos)
        {
            var inventoriesToAdd = new List<Room_Inventory>();

            foreach (var dto in dtos)
            {
                var equipment = await _context.Equipments.FindAsync(dto.AmenityId);
                if (equipment == null) continue;

                // Kiểm tra tồn kho cho từng món
                int currentlyInUse = await _context.RoomInventories.Where(ri => ri.EquipmentId == dto.AmenityId).SumAsync(ri => ri.Quantity);
                int available = equipment.TotalQuantity - currentlyInUse;

                if (available < dto.Quantity)
                {
                    return BadRequest(new { message = $"Kho không đủ '{equipment.Name}'. Chỉ còn: {available} cái." });
                }

                if (equipment.Category == "Điện tử")
                {
                    for (int i = 0; i < dto.Quantity; i++)
                    {
                        inventoriesToAdd.Add(new Room_Inventory
                        {
                            RoomId = roomId,
                            EquipmentId = dto.AmenityId,
                            Quantity = 1,
                            PriceIfLost = equipment.DefaultPriceIfLost,
                            IsActive = true
                        });
                    }
                }
                else
                {
                    inventoriesToAdd.Add(new Room_Inventory
                    {
                        RoomId = roomId,
                        EquipmentId = dto.AmenityId,
                        Quantity = dto.Quantity,
                        PriceIfLost = equipment.DefaultPriceIfLost,
                        IsActive = true
                    });
                }
            }

            if (!inventoriesToAdd.Any())
                return BadRequest(new { message = "Không có vật tư hợp lệ nào để thêm." });

            // AddRange giúp lưu 100 món đồ chỉ với 1 thao tác xuống DB, cực kỳ tối ưu!
            _context.RoomInventories.AddRange(inventoriesToAdd);
            await _context.SaveChangesAsync(); 

            return Ok(new { Message = $"Đã thêm thành công {inventoriesToAdd.Count} vật tư vào phòng!" });
        }

        [Authorize(Policy = "MANAGE_INVENTORY")]
        [HttpPost("transfer")]
        public async Task<IActionResult> TransferOrCloneInventory([FromBody] TransferOrCloneDto dto)
        {
            if (dto.SourceRoomId == dto.TargetRoomId)
                return BadRequest(new { message = "Phòng nguồn và phòng đích không được trùng nhau." });

            if (dto.Items == null || !dto.Items.Any())
                return BadRequest(new { message = "Danh sách vật tư chuyển giao trống." });

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                foreach (var item in dto.Items)
                {
                    if (item.Quantity <= 0) continue;

                    // 1. Tìm vật tư ở phòng nguồn
                    var sourceInventories = await _context.RoomInventories
                        .Where(ri => ri.RoomId == dto.SourceRoomId && ri.EquipmentId == item.AmenityId && ri.IsActive)
                        .ToListAsync();

                    int sourceTotalQty = sourceInventories.Sum(ri => ri.Quantity);
                    if (sourceTotalQty < item.Quantity)
                    {
                        return BadRequest(new { message = $"Phòng nguồn không đủ số lượng cho vật tư. Có: {sourceTotalQty}, Yêu cầu chuyển: {item.Quantity}" });
                    }

                    // 2. Nếu là "Di chuyển" (IsMove = true), trừ số lượng hoặc xóa bản ghi ở phòng nguồn
                    if (dto.IsMove)
                    {
                        int qtyToSubtract = item.Quantity;
                        foreach (var srcInv in sourceInventories.OrderBy(ri => ri.Quantity))
                        {
                            if (qtyToSubtract <= 0) break;
                            if (srcInv.Quantity <= qtyToSubtract)
                            {
                                qtyToSubtract -= srcInv.Quantity;
                                _context.RoomInventories.Remove(srcInv);
                            }
                            else
                            {
                                srcInv.Quantity -= qtyToSubtract;
                                qtyToSubtract = 0;
                                _context.RoomInventories.Update(srcInv);
                            }
                        }
                    }

                    // 3. Thêm hoặc cộng dồn vào phòng đích (Không cộng dồn nếu là Điện tử)
                    var equipment = await _context.Equipments.FindAsync(item.AmenityId);
                    if (equipment != null && equipment.Category == "Điện tử")
                    {
                        for (int k = 0; k < item.Quantity; k++)
                        {
                            var newInv = new Room_Inventory
                            {
                                RoomId = dto.TargetRoomId,
                                EquipmentId = item.AmenityId,
                                Quantity = 1,
                                PriceIfLost = equipment.DefaultPriceIfLost,
                                IsActive = true
                            };
                            _context.RoomInventories.Add(newInv);
                        }
                    }
                    else
                    {
                        var targetInventory = await _context.RoomInventories
                            .FirstOrDefaultAsync(ri => ri.RoomId == dto.TargetRoomId && ri.EquipmentId == item.AmenityId && ri.IsActive);

                        if (targetInventory != null)
                        {
                            targetInventory.Quantity += item.Quantity;
                            _context.RoomInventories.Update(targetInventory);
                        }
                        else
                        {
                            var newInv = new Room_Inventory
                            {
                                RoomId = dto.TargetRoomId,
                                EquipmentId = item.AmenityId,
                                Quantity = item.Quantity,
                                PriceIfLost = equipment != null ? equipment.DefaultPriceIfLost : 0,
                                IsActive = true
                            };
                            _context.RoomInventories.Add(newInv);
                        }
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = dto.IsMove ? "Đã di chuyển vật tư thành công!" : "Đã sao chép vật tư thành công!" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Lỗi hệ thống: " + ex.Message });
            }
        }

        [Authorize(Policy = "MANAGE_INVENTORY")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInventory(int id)
        {
            var item = await _context.RoomInventories.FindAsync(id);
            if (item != null)
            {
                _context.RoomInventories.Remove(item);
                await _context.SaveChangesAsync();
            }
            return NoContent(); 
        }

        [Authorize(Policy = "MANAGE_INVENTORY")]
        [HttpPut("restore/{id}")]
        public async Task<IActionResult> RestoreInventory(int id)
        {
            try
            {
                var inventory = await _context.RoomInventories.FindAsync(id);
                if (inventory == null) return NotFound(new { message = "Không tìm thấy vật tư này." });

                inventory.IsActive = true;
                _context.RoomInventories.Update(inventory);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Đã khôi phục vật tư thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Lỗi SQL: " + ex.Message });
            }
        }

        // =========================================================
        // CÁC API VỀ PHÒNG (GIỮ NGUYÊN)
        // =========================================================
        [Authorize(Policy = "MANAGE_INVENTORY")]
        [HttpGet("rooms")]
        public async Task<IActionResult> GetRooms()
        {
            try { return Ok(await _roomService.GetRoomsAsync()); }
            catch (Exception ex) { return StatusCode(500, new { message = "Lỗi Server: " + ex.Message }); }
        }

        [Authorize(Policy = "MANAGE_INVENTORY")]
        [HttpGet("rooms/{id}")]
        public async Task<ActionResult<Room>> GetRoom(int id)
        {
            var room = await _roomService.GetRoomByIdAsync(id);
            if (room == null) return NotFound();
            return Ok(room);
        }

        [Authorize(Policy = "MANAGE_INVENTORY")]
        [HttpPut("rooms/{id}/status")]
        public async Task<IActionResult> UpdateRoomStatus(int id, [FromBody] string status)
        {
            await _roomService.UpdateRoomStatusAsync(id, status);
            return NoContent();
        }

        [Authorize(Policy = "MANAGE_INVENTORY")]
        [HttpPut("rooms/{id}/mark-clean")]
        public async Task<IActionResult> MarkRoomAsClean(int id)
        {
            try
            {
                var room = await _context.Rooms.FindAsync(id);
                if (room == null) return NotFound(new { message = "Không tìm thấy phòng!" });

                room.Status = "Available";
                room.CleaningStatus = "Clean"; 
                _context.Rooms.Update(room);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Đã dọn phòng sạch sẽ!" });
            }
            catch (Exception ex) { return BadRequest(new { message = "Lỗi SQL: " + ex.Message }); }
        }
    }
}