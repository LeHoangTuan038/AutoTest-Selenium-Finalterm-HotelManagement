using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Interfaces
{
    public interface IVietQRService
    {
        VietQRResponse GenerateQR(decimal amount, string description);
    }
}

