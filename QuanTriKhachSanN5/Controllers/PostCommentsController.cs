using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuanTriKhachSanN5.DTOs.Post;
using QuanTriKhachSanN5.Interfaces;

namespace QuanTriKhachSanN5.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PostCommentsController : ControllerBase
    {
        private readonly IPostCommentService _commentService;

        public PostCommentsController(IPostCommentService commentService)
        {
            _commentService = commentService;
        }

        // Lấy tất cả bình luận cho Admin duyệt
        [Authorize(Policy = "MANAGE_CONTENT")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PostCommentDTO>>> GetAll()
        {
            var comments = await _commentService.GetAllCommentsAsync();
            return Ok(comments);
        }

        // Lấy bình luận đã duyệt của 1 bài viết (Public)
        [AllowAnonymous]
        [HttpGet("post/{postId:int}")]
        public async Task<ActionResult<IEnumerable<PostCommentDTO>>> GetApprovedByPost(int postId)
        {
            var comments = await _commentService.GetApprovedCommentsByPostIdAsync(postId);
            return Ok(comments);
        }

        // Tạo bình luận mới (Khách vãng lai cũng có thể tạo, nhưng sẽ ở trạng thái Chờ duyệt)
        [AllowAnonymous]
        [HttpPost]
        public async Task<ActionResult<PostCommentDTO>> Create([FromBody] CreatePostCommentDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var created = await _commentService.CreateCommentAsync(dto);
            return Ok(created);
        }

        // Admin duyệt bình luận
        [Authorize(Policy = "MANAGE_CONTENT")]
        [HttpPut("{id:int}/approve")]
        public async Task<IActionResult> Approve(int id)
        {
            var success = await _commentService.ApproveCommentAsync(id);
            if (!success)
            {
                return NotFound(new { message = "Không tìm thấy bình luận" });
            }
            return Ok(new { message = "Đã duyệt bình luận" });
        }

        // Admin xóa bình luận
        [Authorize(Policy = "MANAGE_CONTENT")]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _commentService.DeleteCommentAsync(id);
            if (!success)
            {
                return NotFound(new { message = "Không tìm thấy bình luận" });
            }
            return Ok(new { message = "Đã xóa bình luận" });
        }
    }
}
