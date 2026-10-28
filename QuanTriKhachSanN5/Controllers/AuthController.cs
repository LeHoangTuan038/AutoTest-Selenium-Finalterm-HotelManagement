using BCrypt.Net;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuanTriKhachSanN5.Data;
using QuanTriKhachSanN5.DTOs;
using QuanTriKhachSanN5.Models;
using QuanTriKhachSanN5.Services;
using System.Security.Claims;
using Microsoft.Extensions.Caching.Memory;

namespace QuanTriKhachSanN5.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly JwtService _jwt;
        private readonly IMemoryCache _cache;
        private readonly IEmailService _emailService;

        public AuthController(ApplicationDbContext context, JwtService jwt, IMemoryCache cache, IEmailService emailService)
        {
            _context = context;
            _jwt = jwt;
            _cache = cache;
            _emailService = emailService;
        }

        [HttpPost("send-otp")]
        public async Task<IActionResult> SendOtp([FromBody] SendOtpDTO dto)
        {
            if (string.IsNullOrEmpty(dto.Email))
                return BadRequest(new { message = "Email không được để trống!" });

            string email = dto.Email.Trim().ToLower();
            
            // Nếu là tài khoản test (@hotel.com), bỏ qua cấp OTP ngẫu nhiên, set cứng OTP là 123456
            if (email.EndsWith("@hotel.com"))
            {
                _cache.Set(email, "123456", TimeSpan.FromMinutes(5));
                return Ok(new { message = "Đã gửi mã OTP (Tài khoản Test: Mặc định là 123456)" });
            }

            // Nếu không phải @gmail.com thì chặn
            if (!email.EndsWith("@gmail.com"))
            {
                return BadRequest(new { message = "Chỉ chấp nhận đăng ký bằng tài khoản @gmail.com hoặc email test!" });
            }

            // Sinh mã OTP 6 số ngẫu nhiên
            var random = new Random();
            string otp = random.Next(100000, 999999).ToString();

            // Lưu vào Cache 5 phút
            _cache.Set(email, otp, TimeSpan.FromMinutes(5));

            // Gọi hàm gửi email
            string subject = "Mã xác nhận đăng ký tài khoản IT HOTEL";
            string body = $@"
                <h3>Chào bạn,</h3>
                <p>Cảm ơn bạn đã đăng ký tài khoản tại hệ thống IT HOTEL.</p>
                <p>Mã xác thực OTP của bạn là: <b style='font-size: 20px; color: #e6b83b;'>{otp}</b></p>
                <p>Mã này có hiệu lực trong vòng 5 phút.</p>
                <p>Trân trọng,<br>IT HOTEL Team</p>
            ";

            try
            {
                await _emailService.SendEmailAsync(email, subject, body);
                return Ok(new { message = "Mã OTP đã được gửi đến email của bạn!" });
            }
            catch (Exception ex)
            {
                // Nếu lỗi SMTP (do chưa điền mật khẩu thật), báo lỗi chi tiết
                return StatusCode(500, new { message = "Lỗi khi gửi email: " + ex.Message });
            }
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDTO dto)
        {
            if (string.IsNullOrEmpty(dto.Otp))
                return BadRequest(new { message = "Vui lòng nhập mã OTP!" });

            string email = dto.Email.Trim().ToLower();

            // 1. Kiểm tra OTP
            if (!_cache.TryGetValue(email, out string savedOtp))
            {
                return BadRequest(new { message = "Mã OTP đã hết hạn hoặc không tồn tại. Vui lòng lấy mã mới!" });
            }

            if (dto.Otp != savedOtp)
            {
                return BadRequest(new { message = "Mã OTP không chính xác!" });
            }

            // 2. Xóa OTP sau khi dùng thành công
            _cache.Remove(email);

            var exist = await _context.Users.FirstOrDefaultAsync(x => x.Email == dto.Email);
            if (exist != null)
                return BadRequest(new { message = "Email đã tồn tại!" });

            var user = new User
            {
                FullName = dto.Username,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Gán role Guest theo RBAC
            var guestRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Guest");
            if (guestRole != null)
            {
                _context.UserRoles.Add(new User_Role { UserId = user.Id, RoleId = guestRole.Id });
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Đăng ký thành công!" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDTO dto)
        {
            var user = await _context
                .Users.Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                        .ThenInclude(r => r.RolePermissions)
                            .ThenInclude(rp => rp.Permission)
                .FirstOrDefaultAsync(u => u.Email == dto.Email);

            // 1. TRẠM KIỂM SOÁT 1: Bắt buộc phải kiểm tra null ĐẦU TIÊN
            if (user == null)
                return Unauthorized(new { message = "Tài khoản hoặc mật khẩu không đúng!" });

            // 2. TRẠM KIỂM SOÁT 2: Kiểm tra mật khẩu
            bool check = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
            if (!check)
                return Unauthorized(new { message = "Tài khoản hoặc mật khẩu không đúng!" });

            // (Tùy chọn) TRẠM KIỂM SOÁT 3: Kiểm tra trạng thái tài khoản (Soft Delete)
            if (!user.IsActive)
            {
                return Unauthorized(new { message = "Tài khoản của bạn đã bị khóa!" });
            }

            // 3. Vượt qua hết mới bắt đầu lấy dữ liệu Role và Permission
            var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();

            var permissions = user
                .UserRoles.SelectMany(ur => ur.Role.RolePermissions)
                .Select(rp => rp.Permission.Name)
                .Distinct()
                .ToList();

            // Admin có toàn quyền
            if (roles.Contains("Admin"))
            {
                permissions = await _context.Permissions.Select(p => p.Name).ToListAsync();
            }

            // 4. Sinh Token
            var token = _jwt.GenerateToken(user, roles, permissions);

            // 5. Trả về đúng cấu trúc mà React Frontend đang chờ để lưu vào Zustand store
            return Ok(
                new
                {
                    token = token,
                    user = new
                    {
                        id = user.Id,
                        email = user.Email,
                        fullName = user.FullName,
                    },
                    permissions = permissions,
                }
            );
        }

        [HttpPost("google-login")]
        public async Task<IActionResult> GoogleLogin(GoogleLoginDTO dto)
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(dto.IdToken);

            var user = await _context.Users.FirstOrDefaultAsync(x => x.Email == payload.Email);

            if (user == null)
            {
                user = new User { Email = payload.Email, FullName = payload.Name };
                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                // Gán role Guest
                var guestRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Guest");
                if (guestRole != null)
                {
                    _context.UserRoles.Add(
                        new User_Role { UserId = user.Id, RoleId = guestRole.Id }
                    );
                    await _context.SaveChangesAsync();
                }
            }

            var roles = await _context
                .UserRoles.Where(ur => ur.UserId == user.Id)
                .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
                .ToListAsync();

            var permissions = await _context
                .UserRoles.Where(ur => ur.UserId == user.Id)
                .SelectMany(ur => ur.Role.RolePermissions)
                .Select(rp => rp.Permission.Name)
                .Distinct()
                .ToListAsync();

            // Admin có toàn quyền
            if (roles.Contains("Admin"))
            {
                permissions = await _context.Permissions.Select(p => p.Name).ToListAsync();
            }

            var token = _jwt.GenerateToken(user, roles, permissions);

            // Đồng bộ Response trả về giống hàm Login thường
            return Ok(
                new
                {
                    token = token,
                    user = new
                    {
                        id = user.Id,
                        email = user.Email,
                        fullName = user.FullName,
                        roleName = user.UserRoles.FirstOrDefault()?.Role.Name,
                    },
                    permissions = permissions,
                }
            );
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized(new { message = "Không tìm thấy thông tin user!" });

            var user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return NotFound(new { message = "User không tồn tại!" });

            // Thực hiện kiểm tra & tặng voucher sinh nhật ngay lập tức nếu hôm nay là sinh nhật
            await CheckAndAwardBirthdayVoucherAsync(user);

            var membership = await _context.Memberships
                .Where(m => m.Id == user.MembershipId)
                .FirstOrDefaultAsync();

            return Ok(new
            {
                id = user.Id,
                email = user.Email,
                fullName = user.FullName,
                phone = user.Phone,
                address = user.Address,
                dateOfBirth = user.DateOfBirth,
                avatarUrl = user.AvatarUrl, // Trả thêm avatarUrl
                points = user.Points,
                membership = membership != null ? new
                {
                    id = membership.Id,
                    tierName = membership.TierName,
                    minPoints = membership.MinPoints,
                    discountPercent = membership.DiscountPercent
                } : null,
                roleName = user.UserRoles.FirstOrDefault()?.Role.Name
            });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDTO dto)
        {
            if (string.IsNullOrEmpty(dto.Email))
                return BadRequest(new { message = "Email không được để trống!" });

            string email = dto.Email.Trim().ToLower();

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
            {
                return NotFound(new { message = "Không tìm thấy email này trong hệ thống!" });
            }

            var random = new Random();
            string otp = random.Next(100000, 999999).ToString();
            _cache.Set(email, otp, TimeSpan.FromMinutes(5));

            string subject = "Mã xác nhận khôi phục mật khẩu";
            string body = $@"
                <h3>Chào bạn,</h3>
                <p>Bạn đã yêu cầu đặt lại mật khẩu tại hệ thống IT HOTEL.</p>
                <p>Mã xác thực OTP của bạn là: <b style='font-size: 20px; color: #e6b83b;'>{otp}</b></p>
                <p>Mã này có hiệu lực trong vòng 5 phút.</p>
                <p>Trân trọng,<br>IT HOTEL Team</p>
            ";

            try
            {
                await _emailService.SendEmailAsync(email, subject, body);
                return Ok(new { message = "Đã gửi mã OTP khôi phục mật khẩu!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi gửi email: " + ex.Message });
            }
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDTO dto)
        {
            if (string.IsNullOrEmpty(dto.Email) || string.IsNullOrEmpty(dto.Otp) || string.IsNullOrEmpty(dto.NewPassword))
                return BadRequest(new { message = "Vui lòng nhập đầy đủ thông tin!" });

            string email = dto.Email.Trim().ToLower();

            if (!_cache.TryGetValue(email, out string savedOtp))
            {
                return BadRequest(new { message = "Mã OTP đã hết hạn hoặc không tồn tại. Vui lòng lấy mã mới!" });
            }

            if (dto.Otp != savedOtp)
            {
                return BadRequest(new { message = "Mã OTP không chính xác!" });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
                return NotFound(new { message = "Người dùng không tồn tại!" });

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            _cache.Remove(email);

            return Ok(new { message = "Đặt lại mật khẩu thành công!" });
        }

        [Authorize]
        [HttpPost("change-password-send-otp")]
        public async Task<IActionResult> ChangePasswordSendOtp()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized(new { message = "Không tìm thấy thông tin user!" });

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                return NotFound(new { message = "User không tồn tại!" });

            string email = user.Email;

            var random = new Random();
            string otp = random.Next(100000, 999999).ToString();
            _cache.Set(email, otp, TimeSpan.FromMinutes(5));

            string subject = "Mã xác nhận đổi mật khẩu";
            string body = $@"
                <h3>Chào bạn,</h3>
                <p>Bạn đã yêu cầu đổi mật khẩu tại hệ thống IT HOTEL.</p>
                <p>Mã xác thực OTP của bạn là: <b style='font-size: 20px; color: #e6b83b;'>{otp}</b></p>
                <p>Mã này có hiệu lực trong vòng 5 phút.</p>
                <p>Trân trọng,<br>IT HOTEL Team</p>
            ";

            try
            {
                await _emailService.SendEmailAsync(email, subject, body);
                return Ok(new { message = "Đã gửi mã OTP xác nhận đổi mật khẩu!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi gửi email: " + ex.Message });
            }
        }

        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDTO dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized(new { message = "Không tìm thấy thông tin user!" });

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                return NotFound(new { message = "User không tồn tại!" });

            if (!BCrypt.Net.BCrypt.Verify(dto.OldPassword, user.PasswordHash))
            {
                return BadRequest(new { message = "Mật khẩu cũ không chính xác!" });
            }

            if (!_cache.TryGetValue(user.Email, out string savedOtp))
            {
                return BadRequest(new { message = "Mã OTP đã hết hạn hoặc không tồn tại. Vui lòng lấy mã mới!" });
            }

            if (dto.Otp != savedOtp)
            {
                return BadRequest(new { message = "Mã OTP không chính xác!" });
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            _cache.Remove(user.Email);

            return Ok(new { message = "Đổi mật khẩu thành công!" });
        }

        [Authorize]
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] DTOs.Auth.UpdateProfileDTO dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized(new { message = "Không tìm thấy thông tin user!" });

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                return NotFound(new { message = "User không tồn tại!" });

            if (dto.FullName != null) user.FullName = dto.FullName;
            if (dto.Phone != null) user.Phone = dto.Phone;
            if (dto.Address != null) user.Address = dto.Address;
            if (dto.DateOfBirth != null) user.DateOfBirth = dto.DateOfBirth;
            if (dto.AvatarUrl != null) user.AvatarUrl = dto.AvatarUrl;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            // Kích hoạt kiểm tra & tặng voucher sinh nhật ngay lập tức nếu cập nhật trúng ngày sinh
            await CheckAndAwardBirthdayVoucherAsync(user);

            return Ok(new { message = "Cập nhật thông tin cá nhân thành công!" });
        }

        private async Task CheckAndAwardBirthdayVoucherAsync(User user)
        {
            if (user.DateOfBirth == null) return;

            var today = DateTime.UtcNow.AddHours(7); // Múi giờ Việt Nam (UTC+7)
            var birthDate = user.DateOfBirth.Value;

            // Kiểm tra trùng ngày và tháng sinh
            if (birthDate.Day == today.Day && birthDate.Month == today.Month)
            {
                // Kiểm tra xem năm nay đã nhận voucher sinh nhật chưa
                if (user.LastBirthdayVoucherYear != today.Year)
                {
                    // 1. Tạo mã voucher ngẫu nhiên độc nhất
                    var random = new Random();
                    string randSuffix = random.Next(1000, 9999).ToString();
                    string voucherCode = $"HPBD-{today.Year}-{user.Id}-{randSuffix}";

                    var voucher = new Voucher
                    {
                        Code = voucherCode,
                        DiscountType = "PERCENT",
                        DiscountValue = 25, // Giảm 25% sinh nhật
                        MinBookingValue = 0,
                        ValidFrom = DateTime.UtcNow,
                        ValidTo = DateTime.UtcNow.AddMonths(1), // Hạn dùng 1 tháng (30 ngày) kể từ ngày cấp
                        UsageLimit = 1
                    };

                    _context.Vouchers.Add(voucher);

                    // 2. Gửi Thư (Notification) vào hộp thư cá nhân
                    var notification = new Notification
                    {
                        UserId = user.Id,
                        Title = "Chúc mừng sinh nhật! 🎂🎁",
                        Content = $"Kính gửi Quý khách {user.FullName},\n\nKhách sạn IT HOTEL xin kính chúc Quý khách một ngày sinh nhật thật tràn đầy niềm vui, sức khỏe và hạnh phúc!\n\nNhân dịp đặc biệt này, chúng tôi xin gửi tặng Quý khách món quà ý nghĩa: Mã giảm giá giảm 25% cho lần đặt phòng tiếp theo của bạn.\n\n👉 Mã giảm giá của bạn: {voucherCode}\n(Mã có giá trị sử dụng 1 lần cho tất cả các phòng và có thời hạn sử dụng 1 tháng kể từ hôm nay).\n\nChúc bạn có một kỳ nghỉ thật tuyệt vời tại IT HOTEL!",
                        Type = "Birthday",
                        ReferenceLink = voucherCode,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.Notifications.Add(notification);

                    // 3. Cập nhật năm nhận voucher gần nhất để tránh đổi ngày sinh nhận tiếp
                    user.LastBirthdayVoucherYear = today.Year;
                    _context.Users.Update(user);

                    await _context.SaveChangesAsync();

                    // 4. Gửi email chúc mừng sinh nhật
                    string subject = "Chúc mừng sinh nhật & Quà tặng từ IT HOTEL! 🎂";
                    string body = $@"
                        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 24px; border-radius: 12px; background-color: #ffffff;'>
                            <div style='text-align: center; margin-bottom: 20px;'>
                                <span style='font-size: 48px;'>🎂</span>
                                <h2 style='color: #e6b83b; margin-top: 10px;'>CHÚC MỪNG SINH NHẬT!</h2>
                            </div>
                            <p>Chào <b>{user.FullName}</b>,</p>
                            <p>IT HOTEL xin gửi tới bạn lời chúc mừng sinh nhật chân thành nhất! Chúc bạn tuổi mới ngập tràn hạnh phúc, thành công và có nhiều chuyến đi thật tuyệt vời.</p>
                            <p>Đồng hành cùng ngày vui của bạn, chúng tôi xin gửi tặng món quà sinh nhật đặc biệt:</p>
                            <div style='background: linear-gradient(135deg, #fef3c7, #fde68a); border: 2px dashed #e6b83b; padding: 18px; border-radius: 8px; text-align: center; margin: 20px 0;'>
                                <span style='font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #78350f;'>Mã Giảm Giá Sinh Nhật 25%</span>
                                <div style='font-size: 26px; font-weight: bold; color: #b45309; margin: 8px 0;'>{voucherCode}</div>
                                <span style='font-size: 12px; color: #92400e;'>Hạn dùng: 1 tháng • Áp dụng 1 lần cho mọi loại phòng</span>
                            </div>
                            <p>Mã này cũng đã được lưu trong <b>mục thư cá nhân</b> trên tài khoản của bạn tại website.</p>
                            <p>Chúc bạn có một ngày sinh nhật thật ấm áp bên người thân yêu!</p>
                            <hr style='border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;'>
                            <p style='font-size: 12px; color: #64748b; text-align: center;'>IT HOTEL - Dịch vụ lưu trú chuyên nghiệp & đẳng cấp</p>
                        </div>
                    ";

                    try
                    {
                        await _emailService.SendEmailAsync(user.Email, subject, body);
                    }
                    catch
                    {
                        // Bỏ qua lỗi gửi email nếu SMTP chưa được cấu hình
                    }
                }
            }
        }
    }
}
