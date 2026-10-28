using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuanTriKhachSanN5.Data;
using QuanTriKhachSanN5.Interfaces;

namespace QuanTriKhachSanN5.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VietQRController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IVietQRService _vietQRService;

        public VietQRController(ApplicationDbContext context, IVietQRService vietQRService)
        {
            _context = context;
            _vietQRService = vietQRService;
        }

        [HttpGet("{invoiceId}")]
        public async Task<IActionResult> GetQRByInvoiceId(int invoiceId)
        {
            var invoice = await _context.Invoices.FindAsync(invoiceId);
            if (invoice == null)
                return NotFound(new { message = "Không tìm thấy hóa đơn!" });

            var booking = await _context.Bookings.FindAsync(invoice.BookingId);
            var bookingCode = booking?.BookingCode ?? $"INV-{invoiceId}";

            var description = $"Thanh toan hoa don {bookingCode}";
            var response = _vietQRService.GenerateQR(invoice.FinalTotal ?? 0, description);

            return Ok(response);
        }
    }
}

