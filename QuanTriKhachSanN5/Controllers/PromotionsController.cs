using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuanTriKhachSanN5.DTOs.Promotion;
using QuanTriKhachSanN5.Interfaces;

namespace QuanTriKhachSanN5.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PromotionsController : ControllerBase
    {
        private readonly IPromotionService _promotionService;

        public PromotionsController(IPromotionService promotionService)
        {
            _promotionService = promotionService;
        }

        [HttpPost("calculate")]
        public async Task<IActionResult> CalculateDiscount([FromBody] CalculateDiscountDTO dto)
        {
            var finalAmount = await _promotionService.CalculateFinalAmountAsync(dto);
            return Ok(
                new
                {
                    OriginalAmount = dto.OriginalAmount,
                    FinalAmount = finalAmount,
                    DiscountAmount = dto.OriginalAmount - finalAmount,
                }
            );
        }
    }
}
