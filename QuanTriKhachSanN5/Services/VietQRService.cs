using System.Web;
using Microsoft.Extensions.Options;
using QuanTriKhachSanN5.Interfaces;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Services
{
    public class VietQRService : IVietQRService
    {
        private readonly VietQRConfig _config;

        public VietQRService(IOptions<VietQRConfig> options)
        {
            _config = options.Value;
        }

        public VietQRResponse GenerateQR(decimal amount, string description)
        {
            // Dùng API miễn phí img.vietqr.io để sinh QR chuẩn VietQR (EMVCo)
            // Format: https://img.vietqr.io/image/{bankId}-{accountNo}-{template}.png?amount={amount}&addInfo={description}&accountName={accountName}
            var amountValue = ((long)amount).ToString();
            var addInfo = HttpUtility.UrlEncode(description);
            var accountName = HttpUtility.UrlEncode(_config.AccountName);

            var qrImageUrl = $"https://img.vietqr.io/image/{_config.BankId}-{_config.AccountNo}-{_config.Template}.png?amount={amountValue}&addInfo={addInfo}&accountName={accountName}";

            return new VietQRResponse
            {
                QrImageUrl = qrImageUrl,
                Amount = amount,
                AccountName = _config.AccountName,
                BankName = GetBankName(_config.BankId),
                Description = description
            };
        }

        private static string GetBankName(string bankId)
        {
            // Một số mã ngân hàng phổ biến
            return bankId switch
            {
                "970422" => "MB Bank",
                "970436" => "Vietcombank",
                "970418" => "BIDV",
                "970405" => "Agribank",
                "970448" => "OCB",
                "970407" => "Techcombank",
                _ => "Ngân hàng"
            };
        }
    }
}

