using System.Threading.Tasks;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Services
{
    public interface IMomoService
    {
        Task<MomoCreatePaymentResponse> CreatePaymentAsync(string orderId, long amount, string orderInfo);
    }
}
