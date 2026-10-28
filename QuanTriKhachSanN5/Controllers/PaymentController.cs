// =========================================================================
// MODULE 5: PAYMENT - CONTROLLER
// =========================================================================

using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuanTriKhachSanN5.Interfaces;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Controllers.Disabled
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentService _paymentService;

        public PaymentController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        [HttpPost("invoices")]
        public async Task<ActionResult<Invoice>> CreateInvoice([FromBody] int bookingId)
        {
            var invoice = await _paymentService.CreateInvoiceAsync(bookingId);
            return Ok(invoice);
        }

        [HttpPost("payments")]
        public async Task<ActionResult<Payment>> ProcessPayment([FromBody] PaymentRequest request)
        {
            var payment = await _paymentService.ProcessPaymentAsync(
                request.InvoiceId,
                request.Amount,
                request.Method
            );
            return Ok(payment);
        }

        [HttpGet("invoices/{invoiceId}/payments")]
        public async Task<ActionResult<List<Payment>>> GetPayments(int invoiceId)
        {
            var payments = await _paymentService.GetPaymentsByInvoiceAsync(invoiceId);
            return Ok(payments);
        }
    }

    // DTO cho request
    public class PaymentRequest
    {
        public int InvoiceId { get; set; }
        public decimal Amount { get; set; }
        public string Method { get; set; } // Cash, Card, etc.
    }
}
