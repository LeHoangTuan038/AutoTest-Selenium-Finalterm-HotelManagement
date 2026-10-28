using QuanTriKhachSanN5.DTOs.Promotion;

namespace QuanTriKhachSanN5.Interfaces
{
    public interface IPromotionService
    {
        Task<decimal> CalculateFinalAmountAsync(CalculateDiscountDTO dto);
    }
}