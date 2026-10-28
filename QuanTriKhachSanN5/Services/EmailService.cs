using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;

namespace QuanTriKhachSanN5.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string toEmail, string subject, string body);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            var server = _config["SmtpSettings:Server"];
            var port = int.Parse(_config["SmtpSettings:Port"]);
            var senderName = _config["SmtpSettings:SenderName"];
            var senderEmail = _config["SmtpSettings:SenderEmail"];
            var password = _config["SmtpSettings:Password"];

            // Nếu người dùng chưa cấu hình email thật, ta chỉ log ra console (Mock)
            if (string.IsNullOrEmpty(senderEmail) || senderEmail == "thay_bang_email_cua_ban@gmail.com")
            {
                Console.WriteLine("-----------------------------------------------------");
                Console.WriteLine($"[MOCK EMAIL] Gửi tới: {toEmail}");
                Console.WriteLine($"[MOCK EMAIL] Tiêu đề: {subject}");
                Console.WriteLine($"[MOCK EMAIL] Nội dung: {body}");
                Console.WriteLine("-----------------------------------------------------");
                return;
            }

            var message = new MailMessage();
            message.From = new MailAddress(senderEmail, senderName);
            message.To.Add(new MailAddress(toEmail));
            message.Subject = subject;
            message.Body = body;
            message.IsBodyHtml = true;

            using var client = new SmtpClient(server, port);
            client.Credentials = new NetworkCredential(senderEmail, password);
            client.EnableSsl = true;

            await client.SendMailAsync(message);
        }
    }
}
