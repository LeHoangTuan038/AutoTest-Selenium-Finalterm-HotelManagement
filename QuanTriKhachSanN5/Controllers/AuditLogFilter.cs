using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using QuanTriKhachSanN5.Data;
using QuanTriKhachSanN5.Interfaces;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Filters
{
    public class AuditLogFilter : IAsyncActionFilter
    {
        private readonly ApplicationDbContext _context;
        private readonly IAuditBatchService _batchService;

        public AuditLogFilter(ApplicationDbContext context, IAuditBatchService batchService)
        {
            _context = context;
            _batchService = batchService;
        }

        public async Task OnActionExecutionAsync(
            ActionExecutingContext context,
            ActionExecutionDelegate next
        )
        {
            // 1. Trích xuất thông tin HTTP Request
            var method = context.HttpContext.Request.Method;
            var userIdClaim = context.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int.TryParse(userIdClaim, out int userId);

            // 2. Cho phép API (Controller) thực thi nghiệp vụ chính
            var resultContext = await next();

            // 3. Nếu API chạy THÀNH CÔNG và LÀ THAO TÁC THAY ĐỔI DỮ LIỆU (CUD)
            int actualStatusCode = resultContext.HttpContext.Response.StatusCode;
            if (resultContext.Result is Microsoft.AspNetCore.Mvc.Infrastructure.IStatusCodeActionResult statusCodeResult && statusCodeResult.StatusCode.HasValue)
            {
                actualStatusCode = statusCodeResult.StatusCode.Value;
            }

            if (
                resultContext.Exception == null
                && actualStatusCode >= 200 
                && actualStatusCode < 300
                && (method == "POST" || method == "PUT" || method == "DELETE")
            )
            {
                if (userId > 0) // Chỉ log nếu thao tác do user đã đăng nhập thực hiện
                {
                    var roleName =
                        context.HttpContext.User.FindFirst(ClaimTypes.Role)?.Value ?? "Unknown";
                    var controllerName =
                        context.RouteData.Values["controller"]?.ToString() ?? "Unknown";

                    var actionType =
                        method == "POST" ? "CREATE" : (method == "PUT" ? "UPDATE" : "DELETE");
                    var eventId = Guid.NewGuid().ToString("N").Substring(0, 8);
                    var eventObj = new
                    {
                        eventId,
                        actionType,
                        targetTable = controllerName,
                        status = "Success",
                        timestamp = DateTime.UtcNow,
                    };
                    await _batchService.AddEventAsync(userId, roleName, eventObj);
                }
            }
        }
    }
}
