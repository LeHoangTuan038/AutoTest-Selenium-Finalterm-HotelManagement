using System;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Services
{
    public class MomoService : IMomoService
    {
        private readonly HttpClient _httpClient;
        private readonly MomoOptionModel _options;

        public MomoService(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _options = new MomoOptionModel();
            config.GetSection("MoMoAPI").Bind(_options);
        }

        public async Task<MomoCreatePaymentResponse> CreatePaymentAsync(string orderId, long amount, string orderInfo)
        {
            var requestId = Guid.NewGuid().ToString();
            var extraData = "";

            // Xây dựng chuỗi chữ ký
            var rawHash = $"accessKey={_options.AccessKey}&amount={amount}&extraData={extraData}&ipnUrl={_options.NotifyUrl}&orderId={orderId}&orderInfo={orderInfo}&partnerCode={_options.PartnerCode}&redirectUrl={_options.ReturnUrl}&requestId={requestId}&requestType={_options.RequestType}";
            
            var signature = ComputeHmacSha256(rawHash, _options.SecretKey);

            var request = new MomoCreatePaymentRequest
            {
                partnerCode = _options.PartnerCode,
                partnerName = "IT CODE HOTEL",
                storeId = "MomoTestStore",
                requestId = requestId,
                amount = amount,
                orderId = orderId,
                orderInfo = orderInfo,
                redirectUrl = _options.ReturnUrl,
                ipnUrl = _options.NotifyUrl,
                requestType = _options.RequestType,
                extraData = extraData,
                lang = "vi",
                signature = signature
            };

            var requestContent = new StringContent(
                JsonSerializer.Serialize(request),
                Encoding.UTF8,
                "application/json"
            );

            var response = await _httpClient.PostAsync(_options.MomoApiUrl, requestContent);
            response.EnsureSuccessStatusCode();

            var responseString = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<MomoCreatePaymentResponse>(responseString);

            return result;
        }

        private string ComputeHmacSha256(string message, string secretKey)
        {
            byte[] keyByte = Encoding.UTF8.GetBytes(secretKey);
            byte[] messageBytes = Encoding.UTF8.GetBytes(message);
            using (var hmacsha256 = new HMACSHA256(keyByte))
            {
                byte[] hashmessage = hmacsha256.ComputeHash(messageBytes);
                string hex = BitConverter.ToString(hashmessage);
                hex = hex.Replace("-", "").ToLower();
                return hex;
            }
        }
    }
}
