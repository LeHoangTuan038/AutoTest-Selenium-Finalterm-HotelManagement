using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuanTriKhachSanN5.DTOs.Attraction;
using QuanTriKhachSanN5.Interfaces;

namespace QuanTriKhachSanN5.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AttractionsController : ControllerBase
{
    private readonly IAttractionService _attractionService;

    public AttractionsController(IAttractionService attractionService)
    {
        _attractionService = attractionService;
    }

    // GET: api/Attractions — Công khai cho cả khách và admin
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AttractionDTO>>> GetAll()
    {
        var attractions = await _attractionService.GetAllAsync();
        return Ok(attractions);
    }

    // GET: api/Attractions/{id}
    [AllowAnonymous]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<AttractionDTO>> GetById(int id)
    {
        var attraction = await _attractionService.GetByIdAsync(id);
        if (attraction is null)
            return NotFound(new { message = "Không tìm thấy điểm tham quan." });

        return Ok(attraction);
    }

    // POST: api/Attractions — Chỉ Admin
    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<AttractionDTO>> Create([FromBody] CreateAttractionDTO dto)
    {
        var created = await _attractionService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    // PUT: api/Attractions/{id} — Chỉ Admin
    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateAttractionDTO dto)
    {
        var updated = await _attractionService.UpdateAsync(id, dto);
        if (!updated)
            return NotFound(new { message = "Không tìm thấy điểm tham quan để cập nhật." });

        return NoContent();
    }

    // DELETE: api/Attractions/{id} — Chỉ Admin
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _attractionService.DeleteAsync(id);
        if (!deleted)
            return NotFound(new { message = "Không tìm thấy điểm tham quan để xóa." });

        return NoContent();
    }
}
