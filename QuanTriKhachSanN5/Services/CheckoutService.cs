using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using QuanTriKhachSanN5.Data;
using QuanTriKhachSanN5.DTOs;
using QuanTriKhachSanN5.Interfaces;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Services
{
    public class CheckoutService
    {
        // Nhớ kiểm tra lại tên QlyKhachSanContext xem đã đúng với tên file DB Context của bạn chưa nhé
        private readonly ApplicationDbContext _dbContext;
        private readonly HttpClient _httpClient;

        public CheckoutService(ApplicationDbContext dbContext, HttpClient httpClient)
        {
            _dbContext = dbContext;
            _httpClient = httpClient;
        }

        public async Task<Invoice> GenerateInvoiceAsync(int bookingId)
        {
            var m2Response = await _httpClient.GetAsync(
                $"http://m2-service.local/api/bookings/{bookingId}/costs"
            );
            m2Response.EnsureSuccessStatusCode();
            var m2Data = JsonSerializer.Deserialize<M2BookingCostDto>(
                await m2Response.Content.ReadAsStringAsync(),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
            );

            var m4Response = await _httpClient.GetAsync(
                $"http://m4-service.local/api/reception/{bookingId}/costs"
            );
            m4Response.EnsureSuccessStatusCode();
            var m4Data = JsonSerializer.Deserialize<M4ServiceCostDto>(
                await m4Response.Content.ReadAsStringAsync(),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
            );

            decimal roomTotal = m2Data!.RoomTotalCost;
            decimal serviceAndDamageTotal = m4Data!.ServicesCost + m4Data.DamageFee;
            decimal discount = m2Data.VoucherDiscount;
            decimal tax = 0;

            decimal finalTotal = roomTotal + serviceAndDamageTotal + tax - discount;
            finalTotal = finalTotal < 0 ? 0 : finalTotal;

            var invoice = new Invoice
            {
                BookingId = bookingId,
                TotalRoomAmount = roomTotal,
                TotalServiceAmount = serviceAndDamageTotal,
                DiscountAmount = discount,
                TaxAmount = tax,
                FinalTotal = finalTotal,
                Status = "Unpaid",
            };

            _dbContext.Invoices.Add(invoice);
            await _dbContext.SaveChangesAsync();

            return invoice;
        }

        public async Task<Payment> ProcessPaymentAsync(ProcessPaymentRequestDto request)
        {
            var invoice = await _dbContext.Invoices.FindAsync(request.InvoiceId);
            if (invoice == null)
                throw new Exception("Invoice not found");
            if (invoice.Status == "Paid")
                throw new Exception("This invoice is already paid.");

            var payment = new Payment
            {
                InvoiceId = request.InvoiceId,
                PaymentMethod = request.PaymentMethod,
                AmountPaid = request.AmountPaid,
                TransactionCode = request.TransactionId,
                PaymentDate = DateTime.Now,
            };

            _dbContext.Payments.Add(payment);

            invoice.Status = "Paid";

            _dbContext.Invoices.Update(invoice);
            await _dbContext.SaveChangesAsync();

            return payment;
        }
    }
}
