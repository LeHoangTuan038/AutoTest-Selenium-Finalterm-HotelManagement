using System.Collections.Generic;
using System.Threading.Tasks;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Interfaces
{
    public interface ILossAndDamageService
    {
        Task<List<LossAndDamage>> GetAllLossAndDamagesAsync();
        Task<LossAndDamage> GetLossAndDamageByIdAsync(int id);
        Task<LossAndDamage> CreateLossAndDamageAsync(LossAndDamage report);
        Task<LossAndDamage> UpdateLossAndDamageAsync(int id, LossAndDamage model);
        Task<bool> UpdateStatusAsync(int id, string status);
    }
}