using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuanTriKhachSanN5.DTOs.Review;
using QuanTriKhachSanN5.Interfaces;

namespace QuanTriKhachSanN5.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewService _reviewService;

        public ReviewsController(IReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        /// <summary>
        /// Lấy tất cả reviews (chỉ những reviews đã xác nhận)
        /// GET: api/reviews
        /// </summary>
        [AllowAnonymous]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ReviewDTO>>> GetAllReviews()
        {
            var reviews = await _reviewService.GetAllReviewsAsync();
            return Ok(reviews);
        }

        [AllowAnonymous]
        [HttpGet("roomtype/{roomTypeId:int}")]
        public async Task<ActionResult<IEnumerable<ReviewDTO>>> GetReviewsByRoomType(int roomTypeId)
        {
            var reviews = await _reviewService.GetReviewsByRoomTypeAsync(roomTypeId);
            return Ok(reviews);
        }

        [AllowAnonymous]
        [HttpGet("roomtype/{roomTypeId:int}/average-rating")]
        public async Task<ActionResult<object>> GetAverageRating(int roomTypeId)
        {
            var averageRating = await _reviewService.GetAverageRatingByRoomTypeAsync(roomTypeId);
            return Ok(new { roomTypeId, averageRating });
        }

        /// <summary>
        /// Lấy reviews của user hiện tại
        /// GET: api/reviews/my-reviews
        /// </summary>
        [Authorize]
        [HttpGet("my-reviews")]
        public async Task<ActionResult<IEnumerable<ReviewDTO>>> GetMyReviews()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized("User ID not found in token");

            var reviews = await _reviewService.GetUserReviewsAsync(userId);
            return Ok(reviews);
        }

        /// <summary>
        /// Lấy chi tiết một review
        /// GET: api/reviews/{id}
        /// </summary>
        [HttpGet("{id:int}")]
        public async Task<ActionResult<ReviewDTO>> GetReviewById(int id)
        {
            var review = await _reviewService.GetReviewByIdAsync(id);
            if (review == null)
                return NotFound("Review not found");

            return Ok(review);
        }

        /// <summary>
        /// Tạo review mới (với comment và rating)
        /// POST: api/reviews
        /// </summary>
        [Authorize]
        [HttpPost]
        public async Task<ActionResult<ReviewDTO>> CreateReview([FromBody] CreateReviewDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized("User ID not found in token");

            try
            {
                var review = await _reviewService.CreateReviewAsync(userId, dto);
                return CreatedAtAction(nameof(GetReviewById), new { id = review.Id }, review);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Cập nhật review (chỉ được phép update review của chính mình)
        /// PUT: api/reviews/{id}
        /// </summary>
        [Authorize]
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateReview(int id, [FromBody] UpdateReviewDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized("User ID not found in token");

            var updated = await _reviewService.UpdateReviewAsync(id, userId, dto);
            if (!updated)
                return NotFound("Review not found or you don't have permission to update it");

            return NoContent();
        }

        /// <summary>
        /// Xóa review (chỉ được phép xóa review của chính mình)
        /// DELETE: api/reviews/{id}
        /// </summary>
        [Authorize]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteReview(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized("User ID not found in token");

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            bool deleted;

            if (userRole == "Admin")
            {
                deleted = await _reviewService.DeleteReviewByAdminAsync(id);
            }
            else
            {
                deleted = await _reviewService.DeleteReviewAsync(id, userId);
            }

            if (!deleted)
                return NotFound("Review not found or you don't have permission to delete it");

            return NoContent();
        }
    }
}
