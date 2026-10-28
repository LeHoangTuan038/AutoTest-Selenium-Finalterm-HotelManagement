using Microsoft.EntityFrameworkCore;
using QuanTriKhachSanN5.Data;
using QuanTriKhachSanN5.DTOs.Review;
using QuanTriKhachSanN5.Interfaces;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Services
{
    public class ReviewService : IReviewService
    {
        private readonly ApplicationDbContext _context;

        public ReviewService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ReviewDTO>> GetAllReviewsAsync()
        {
            return await _context
                .Reviews.Include(r => r.User)
                .Include(r => r.RoomType)
                // .Where(r => r.IsVerified) // Tạm thời bỏ qua vì DB chưa có cột này
                .Select(r => new ReviewDTO
                {
                    Id = r.Id,
                    UserId = r.UserId,
                    Username = r.User != null ? r.User.FullName : "Khách",
                    RoomTypeId = r.RoomTypeId,
                    RoomTypeName = r.RoomType != null ? r.RoomType.Name : "Loại phòng",
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt,
                    UpdatedAt = r.UpdatedAt,
                    IsVerified = true, // Giả định là true vì chưa có cột kiểm chứng
                })
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<ReviewDTO>> GetReviewsByRoomTypeAsync(int roomTypeId)
        {
            return await _context
                .Reviews.Include(r => r.User)
                .Include(r => r.RoomType)
                .Where(r => r.RoomTypeId == roomTypeId)
                .Select(r => new ReviewDTO
                {
                    Id = r.Id,
                    UserId = r.UserId,
                    Username = r.User != null ? r.User.FullName : "Khách",
                    RoomTypeId = r.RoomTypeId,
                    RoomTypeName = r.RoomType != null ? r.RoomType.Name : "Loại phòng",
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt,
                    UpdatedAt = r.UpdatedAt,
                    IsVerified = true,
                })
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<ReviewDTO>> GetUserReviewsAsync(int userId)
        {
            return await _context
                .Reviews.Include(r => r.User)
                .Include(r => r.RoomType)
                .Where(r => r.UserId == userId)
                .Select(r => new ReviewDTO
                {
                    Id = r.Id,
                    UserId = r.UserId,
                    Username = r.User != null ? r.User.FullName : "Khách",
                    RoomTypeId = r.RoomTypeId,
                    RoomTypeName = r.RoomType != null ? r.RoomType.Name : "Loại phòng",
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt,
                    UpdatedAt = r.UpdatedAt,
                    IsVerified = true,
                })
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<ReviewDTO?> GetReviewByIdAsync(int id)
        {
            var review = await _context
                .Reviews.Include(r => r.User)
                .Include(r => r.RoomType)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (review == null)
                return null;

            return new ReviewDTO
            {
                Id = review.Id,
                UserId = review.UserId,
                Username = review.User.FullName,
                RoomTypeId = review.RoomTypeId,
                RoomTypeName = review.RoomType.Name,
                Rating = review.Rating,
                Comment = review.Comment,
                Cleanliness = review.Cleanliness,
                Comfort = review.Comfort,
                ServiceQuality = review.ServiceQuality,
                ValueForMoney = review.ValueForMoney,
                CreatedAt = review.CreatedAt,
                UpdatedAt = review.UpdatedAt,
                IsVerified = review.IsVerified,
            };
        }

        public async Task<ReviewDTO> CreateReviewAsync(int userId, CreateReviewDTO dto)
        {
            // 1. KIỂM TRA USER
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                throw new Exception("Người dùng không tồn tại.");

            // 2. KIỂM TRA LOẠI PHÒNG
            var roomType = await _context.RoomTypes.FindAsync(dto.RoomTypeId);
            if (roomType == null)
                throw new Exception("Loại phòng không tồn tại.");

            // 3. KIỂM TRA ĐIỀU KIỆN ĐÁNH GIÁ: PHẢI CÓ ĐƠN ĐẶT PHÒNG HOÀN THÀNH (HOẶC ĐANG Ở)
            // Tìm bất kỳ booking nào của user này, thuộc loại phòng này và có trạng thái Completed hoặc Checked_out
            var hasExperienced = await _context.Bookings
                .Include(b => b.BookingDetails)
                .AnyAsync(b => b.UserId == userId && 
                               (b.Status == "Completed" || b.Status == "Checked_out" || b.Status == "Hoàn thành") &&
                               b.BookingDetails.Any(bd => bd.RoomTypeId == dto.RoomTypeId));

            if (!hasExperienced)
            {
                throw new Exception("Bạn chỉ có thể đánh giá sau khi đã trải nghiệm và thanh toán dịch vụ tại phòng này.");
            }

            // 4. TẠO ĐÁNH GIÁ (Bỏ qua các cột nâng cao chưa có trong DB)
            var review = new Review
            {
                UserId = userId,
                RoomTypeId = dto.RoomTypeId,
                BookingId = dto.BookingId, // Có thể null nếu user đánh giá chung cho loại phòng đã ở
                Rating = dto.Rating,
                Comment = dto.Comment,
                // Cleanliness = dto.Cleanliness, // Tạm thời bỏ qua
                // Comfort = dto.Comfort,
                // ServiceQuality = dto.ServiceQuality,
                // ValueForMoney = dto.ValueForMoney,
                // IsVerified = true, // Tạm thời bỏ qua vì DB chưa có cột IsVerified
                CreatedAt = DateTime.UtcNow,
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            return new ReviewDTO
            {
                Id = review.Id,
                UserId = review.UserId,
                Username = user.FullName,
                RoomTypeId = review.RoomTypeId,
                RoomTypeName = roomType.Name,
                Rating = review.Rating,
                Comment = review.Comment,
                Cleanliness = review.Cleanliness,
                Comfort = review.Comfort,
                ServiceQuality = review.ServiceQuality,
                ValueForMoney = review.ValueForMoney,
                CreatedAt = review.CreatedAt,
                UpdatedAt = review.UpdatedAt,
                IsVerified = review.IsVerified,
            };
        }

        public async Task<bool> UpdateReviewAsync(int id, int userId, UpdateReviewDTO dto)
        {
            var review = await _context.Reviews.FirstOrDefaultAsync(r =>
                r.Id == id && r.UserId == userId
            );

            if (review == null)
                return false;

            if (dto.Rating.HasValue)
                review.Rating = dto.Rating.Value;

            if (!string.IsNullOrEmpty(dto.Comment))
                review.Comment = dto.Comment;

            if (dto.Cleanliness.HasValue)
                review.Cleanliness = dto.Cleanliness;

            if (dto.Comfort.HasValue)
                review.Comfort = dto.Comfort;

            if (dto.ServiceQuality.HasValue)
                review.ServiceQuality = dto.ServiceQuality;

            if (dto.ValueForMoney.HasValue)
                review.ValueForMoney = dto.ValueForMoney;

            review.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteReviewAsync(int id, int userId)
        {
            var review = await _context.Reviews.FirstOrDefaultAsync(r =>
                r.Id == id && r.UserId == userId
            );

            if (review == null)
                return false;

            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteReviewByAdminAsync(int id)
        {
            var review = await _context.Reviews.FindAsync(id);
            if (review == null)
                return false;

            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<double> GetAverageRatingByRoomTypeAsync(int roomTypeId)
        {
            var reviews = await _context
                .Reviews.Where(r => r.RoomTypeId == roomTypeId) // && r.IsVerified: tạm bỏ vì DB chưa có cột này ([NotMapped])
                .ToListAsync();

            if (!reviews.Any())
                return 0;

            var totalRating = reviews.Sum(r =>
            {
                var ratings = new List<int> { r.Rating };
                if (r.Cleanliness.HasValue)
                    ratings.Add(r.Cleanliness.Value);
                if (r.Comfort.HasValue)
                    ratings.Add(r.Comfort.Value);
                if (r.ServiceQuality.HasValue)
                    ratings.Add(r.ServiceQuality.Value);
                if (r.ValueForMoney.HasValue)
                    ratings.Add(r.ValueForMoney.Value);
                return ratings.Average();
            });

            return Math.Round(totalRating / reviews.Count, 2);
        }
    }
}
