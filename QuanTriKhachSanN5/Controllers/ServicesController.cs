using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuanTriKhachSanN5.Data;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ServicesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ServicesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ==============================
        // LẤY DANH SÁCH SERVICES (công khai - cho trang chủ)
        // ==============================
        // GET: api/services
        [AllowAnonymous]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Service>>> GetServices()
        {
            // Status bị [NotMapped] nên không filter ở DB, lấy tất cả
            return await _context.Services.ToListAsync();
        }

        // ==============================
        // LẤY DỊCH VỤ NHÓM THEO DANH MỤC (cho trang chủ)
        // ==============================
        // GET: api/services/categories/public
        [AllowAnonymous]
        [HttpGet("categories/public")]
        public async Task<IActionResult> GetServicesByCategory()
        {
            var categories = await _context.ServiceCategories
                .Include(c => c.Services)
                .Select(c => new
                {
                    id = c.Id,
                    name = c.Name,
                    services = c.Services!.Select(s => new
                    {
                        id = s.Id,
                        name = s.Name,
                        price = s.Price,
                        unit = s.Unit,
                        categoryId = s.CategoryId
                    }).ToList()
                })
                .ToListAsync();

            return Ok(categories);
        }

        // ==============================
        // LẤY SERVICE THEO ID
        // ==============================
        // GET: api/services/5
        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<ActionResult<Service>> GetService(int id)
        {
            var service = await _context.Services.FindAsync(id);

            if (service == null)
            {
                return NotFound();
            }

            return service;
        }

        // ==============================
        // THÊM SERVICE
        // ==============================
        // POST: api/services
        [Authorize(Policy = "MANAGE_SERVICES")] // Chỉ Quản lý mới được tạo dịch vụ mới
        [HttpPost]
        public async Task<ActionResult<Service>> PostService(Service service)
        {
            // thêm dịch vụ vào database
            _context.Services.Add(service);

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetService), new { id = service.Id }, service);
        }

        // ==============================
        // SỬA SERVICE
        // ==============================
        // PUT: api/services/5
        [Authorize(Policy = "MANAGE_SERVICES")] // Chỉ Quản lý mới được sửa cấu hình
        [HttpPut("{id}")]
        public async Task<IActionResult> PutService(int id, Service service)
        {
            if (id != service.Id)
            {
                return BadRequest();
            }

            // cập nhật dữ liệu
            _context.Entry(service).State = EntityState.Modified;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // ==============================
        // DISABLE SERVICE (KHÔNG XOÁ)
        // ==============================
        // DELETE: api/services/5
        [Authorize(Policy = "MANAGE_SERVICES")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DisableService(int id)
        {
            var service = await _context.Services.FindAsync(id);

            if (service == null)
            {
                return NotFound();
            }

            // Không xoá dữ liệu
            // Chỉ chuyển trạng thái sang disable
            service.Status = 0;

            await _context.SaveChangesAsync();

            return Ok("Service đã được disable");
        }

        // ==============================
        // ENABLE SERVICE
        // ==============================
        // PUT: api/services/enable/5
        [Authorize(Policy = "MANAGE_SERVICES")]
        [HttpPut("enable/{id}")]
        public async Task<IActionResult> EnableService(int id)
        {
            var service = await _context.Services.FindAsync(id);

            if (service == null)
            {
                return NotFound();
            }

            // bật lại dịch vụ
            service.Status = 1;

            await _context.SaveChangesAsync();

            return Ok("Service đã được enable");
        }
    }
}
