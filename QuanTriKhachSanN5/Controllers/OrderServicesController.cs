using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuanTriKhachSanN5.Data;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrderServicesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public OrderServicesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ============================================================
        // 1. LẤY TOÀN BỘ ĐƠN DỊCH VỤ
        // ============================================================
        [Authorize(Policy = "MANAGE_SERVICES")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Order_Service>>> GetAll()
        {
            return await _context
                .OrderServices.Include(o => o.Details!)
                    .ThenInclude(d => d.Service)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();
        }

        // ============================================================
        // 2. LẤY CHI TIẾT 1 ĐƠN HÀNG
        // ============================================================
        [Authorize]
        [HttpGet("{id}")]
        public async Task<ActionResult<Order_Service>> GetById(int id)
        {
            var order = await _context
                .OrderServices.Include(o => o.Details!)
                    .ThenInclude(d => d.Service!)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
                return NotFound("Không tìm thấy đơn dịch vụ.");

            return order;
        }

        // ============================================================
        // 3. TẠO ĐƠN DỊCH VỤ MỚI
        // ============================================================
        [Authorize(Policy = "MANAGE_SERVICES")]
        [HttpPost("order")]
        public async Task<IActionResult> CreateOrder([FromBody] OrderRequest request)
        {
            var bookingDetail = await _context.BookingDetails.FindAsync(request.BookingDetailId);

            if (bookingDetail == null)
                return BadRequest("Không tìm thấy thông tin đặt phòng.");

            var order = new Order_Service
            {
                BookingDetailId = request.BookingDetailId,
                BookingId = bookingDetail.BookingId,
                OrderDate = DateTime.Now,
                Status = "Pending",
                TotalAmount = 0,
                Details = new List<Order_Service_Detail>(),
            };

            decimal total = 0;

            if (request.Items != null && request.Items.Any())
            {
                foreach (var item in request.Items)
                {
                    var service = await _context.Services.FindAsync(item.ServiceId);
                    if (service == null)
                        continue;

                    var detail = new Order_Service_Detail
                    {
                        ServiceId = item.ServiceId,
                        Quantity = item.Quantity,
                        UnitPrice = service.Price,
                    };

                    order.Details.Add(detail);
                    total += item.Quantity * service.Price;
                }
            }

            order.TotalAmount = total;
            _context.OrderServices.Add(order);
            await _context.SaveChangesAsync();

            return Ok(order);
        }

        // ============================================================
        // 4. CẬP NHẬT TRẠNG THÁI
        // ============================================================
        [Authorize(Policy = "MANAGE_SERVICES")]
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] string status)
        {
            var order = await _context.OrderServices.FindAsync(id);
            if (order == null)
                return NotFound();

            order.Status = status;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Thành công" });
        }

        // ============================================================
        // 5. HỦY ĐƠN
        // ============================================================
        [Authorize(Policy = "MANAGE_SERVICES")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Cancel(int id)
        {
            var order = await _context.OrderServices.FindAsync(id);
            if (order == null)
                return NotFound();

            order.Status = "Cancelled";
            await _context.SaveChangesAsync();

            return Ok(order);
        }
    }

    // --- CÁC LỚP HỖ TRỢ (DTO) ---
    public class OrderRequest
    {
        public int BookingDetailId { get; set; }
        public List<OrderItemRequest> Items { get; set; } = new();
    }

    public class OrderItemRequest
    {
        public int ServiceId { get; set; }
        public int Quantity { get; set; }
    }
}
