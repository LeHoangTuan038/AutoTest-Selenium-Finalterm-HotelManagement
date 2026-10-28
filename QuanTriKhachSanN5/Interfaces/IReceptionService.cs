// =========================================================================
// MODULE 4: RECEPTION - INTERFACES
// =========================================================================

using System.Collections.Generic;
using System.Threading.Tasks;
using QuanTriKhachSanN5.DTOs;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Interfaces
{
    public interface IReceptionService
    {
        Task CheckInBookingAsync(int bookingId, int roomId);
        Task<Order_Service> OrderServiceAsync(int bookingId, int serviceId, int quantity);
        Task<LossAndDamage> ReportDamageAsync(int bookingId, string description, decimal fineAmount);
        Task<CheckoutDto> CalculateCheckoutAsync(int bookingId);
    }
}