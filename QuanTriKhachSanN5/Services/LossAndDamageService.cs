using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using QuanTriKhachSanN5.Data;
using QuanTriKhachSanN5.Interfaces;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Services
{
    public class LossAndDamageService : ILossAndDamageService
    {
        private readonly ApplicationDbContext _context;

        public LossAndDamageService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<LossAndDamage>> GetAllLossAndDamagesAsync()
        {
            // 🚨 BÙA CHÚ CẤP CAO: Ép C# phải kiểm tra NULL tuyệt đối trên mọi mặt trận
            var rawData = await _context
                .LossAndDamages.Select(ld => new
                {
                    Id = ld.Id,
                    BookingDetailId = ld.BookingDetailId,
                    RoomInventoryId = ld.RoomInventoryId,
                    Quantity = ld.Quantity,
                    PenaltyAmount = ld.PenaltyAmount,
                    // Dùng toán tử ba ngôi để ép Entity Framework dịch chuẩn 100% sang SQL
                    Description = ld.Description != null ? ld.Description : "Không có mô tả",
                    CreatedAt = ld.CreatedAt,
                    ImageUrl = ld.ImageUrl != null ? ld.ImageUrl : "",
                    Status = ld.Status != null ? ld.Status : "Chưa đền bù",
                })
                .ToListAsync();

            // Lắp ráp trả về cho Lễ tân
            return rawData
                .Select(x => new LossAndDamage
                {
                    Id = x.Id,
                    BookingDetailId = x.BookingDetailId,
                    RoomInventoryId = x.RoomInventoryId,
                    Quantity = x.Quantity,
                    PenaltyAmount = x.PenaltyAmount,
                    Description = x.Description,
                    CreatedAt = x.CreatedAt,
                    ImageUrl = x.ImageUrl,
                    Status = x.Status,
                })
                .ToList();
        }

        public async Task<LossAndDamage> GetLossAndDamageByIdAsync(int id)
        {
            return await _context.LossAndDamages.FindAsync(id);
        }

        public async Task<LossAndDamage> CreateLossAndDamageAsync(LossAndDamage report)
        {
            if (string.IsNullOrEmpty(report.Status))
            {
                report.Status = "Chưa đền bù";
            }

            _context.LossAndDamages.Add(report);
            await _context.SaveChangesAsync();
            return report;
        }

        public async Task<LossAndDamage> UpdateLossAndDamageAsync(int id, LossAndDamage model)
        {
            var data = await _context.LossAndDamages.FindAsync(id);
            if (data == null)
                return null;

            data.BookingDetailId = model.BookingDetailId;
            data.RoomInventoryId = model.RoomInventoryId;
            data.Quantity = model.Quantity;
            data.PenaltyAmount = model.PenaltyAmount;
            data.Description = model.Description;
            data.ImageUrl = model.ImageUrl;
            data.Status = model.Status;

            await _context.SaveChangesAsync();
            return data;
        }

        public async Task<bool> UpdateStatusAsync(int id, string status)
        {
            var data = await _context.LossAndDamages.FindAsync(id);
            if (data == null)
                return false;

            data.Status = status;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
