using QuanTriKhachSanN5.DTOs.Review;

namespace QuanTriKhachSanN5.Interfaces
{
    public interface IReviewService
    {
        Task<IEnumerable<ReviewDTO>> GetAllReviewsAsync();
        Task<IEnumerable<ReviewDTO>> GetReviewsByRoomTypeAsync(int roomTypeId);
        Task<IEnumerable<ReviewDTO>> GetUserReviewsAsync(int userId);
        Task<ReviewDTO?> GetReviewByIdAsync(int id);
        Task<ReviewDTO> CreateReviewAsync(int userId, CreateReviewDTO dto);
        Task<bool> UpdateReviewAsync(int id, int userId, UpdateReviewDTO dto);
        Task<bool> DeleteReviewAsync(int id, int userId);
        Task<bool> DeleteReviewByAdminAsync(int id);
        Task<double> GetAverageRatingByRoomTypeAsync(int roomTypeId);
    }
}
