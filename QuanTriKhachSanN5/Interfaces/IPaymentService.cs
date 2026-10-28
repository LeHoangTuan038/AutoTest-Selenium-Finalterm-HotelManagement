// =========================================================================
// MODULE 5: PAYMENT - INTERFACES
// =========================================================================

using System.Collections.Generic;
using System.Threading.Tasks;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Interfaces
{
    public interface IPaymentService
    {
        Task<Invoice> CreateInvoiceAsync(int bookingId);
        Task<Payment> ProcessPaymentAsync(int invoiceId, decimal amount, string method);
        Task<List<Payment>> GetPaymentsByInvoiceAsync(int invoiceId);
    }
}