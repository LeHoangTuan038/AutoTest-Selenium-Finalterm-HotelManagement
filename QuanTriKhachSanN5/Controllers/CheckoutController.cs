using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuanTriKhachSanN5.DTOs;
using QuanTriKhachSanN5.Services;

namespace QuanTriKhachSanN5.Controllers
{
    [ApiController]
    [Route("api/checkout")]
    public class CheckoutController : ControllerBase
    {
        private readonly CheckoutService _checkoutService;

        public CheckoutController(CheckoutService checkoutService)
        {
            _checkoutService = checkoutService;
        }

        [HttpPost("generate-invoice")]
        public async Task<IActionResult> GenerateInvoice(
            [FromBody] GenerateInvoiceRequestDto request
        )
        {
            try
            {
                var invoice = await _checkoutService.GenerateInvoiceAsync(request.BookingId);
                return Ok(new { Message = "Invoice generated successfully", Data = invoice });
            }
            catch (HttpRequestException ex)
            {
                return StatusCode(
                    503,
                    new { Error = "Lỗi khi gọi API Module 2 hoặc 4", Details = ex.Message }
                );
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpPost("process-payment")]
        public async Task<IActionResult> ProcessPayment([FromBody] ProcessPaymentRequestDto request)
        {
            try
            {
                var payment = await _checkoutService.ProcessPaymentAsync(request);
                return Ok(new { Message = "Payment processed successfully", Data = payment });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }
}
