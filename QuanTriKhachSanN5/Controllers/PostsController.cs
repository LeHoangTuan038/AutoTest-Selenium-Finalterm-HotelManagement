using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuanTriKhachSanN5.DTOs.Post;
using QuanTriKhachSanN5.Interfaces;

namespace QuanTriKhachSanN5.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PostsController : ControllerBase
{
    private readonly IPostService _postService;

    public PostsController(IPostService postService)
    {
        _postService = postService;
    }

    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<PostDTO>>> GetAll()
    {
        var posts = await _postService.GetAllAsync();
        return Ok(posts);
    }

    [AllowAnonymous]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<PostDTO>> GetById(int id)
    {
        var post = await _postService.GetByIdAsync(id);
        if (post is null)
            return NotFound();

        return Ok(post);
    }

    // LẤY BÀI VIẾT THEO LOẠI PHÒNG (Dành cho trang chi tiết phòng)
    [AllowAnonymous]
    [HttpGet("roomtype/{roomTypeId:int}")]
    public async Task<ActionResult<PostDTO>> GetByRoomType(int roomTypeId)
    {
        var post = await _postService.GetByRoomTypeIdAsync(roomTypeId);
        if (post is null)
            return NotFound(new { message = "Không tìm thấy bài viết cho loại phòng này." });

        return Ok(post);
    }

    // LẤY BÀI VIẾT THEO DANH MỤC
    [AllowAnonymous]
    [HttpGet("category/{categoryId:int}")]
    public async Task<ActionResult<IEnumerable<PostDTO>>> GetByCategory(int categoryId)
    {
        var posts = await _postService.GetByCategoryAsync(categoryId);
        return Ok(posts);
    }

    [HttpPost]
    public async Task<ActionResult<PostDTO>> Create([FromBody] CreatePostDTO dto)
    {
        var created = await _postService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreatePostDTO dto)
    {
        var updated = await _postService.UpdateAsync(id, dto);
        if (!updated)
            return NotFound();

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _postService.DeleteAsync(id);
        if (!deleted)
            return NotFound();

        return NoContent();
    }
}
