using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuanTriKhachSanN5.Data;
using QuanTriKhachSanN5.Interfaces;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Controllers;

[ApiController]
[Route("api/audit-logs")]
[Authorize]
public class AuditLogsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditBatchService _batchService;

    public AuditLogsController(ApplicationDbContext context, IAuditBatchService batchService)
    {
        _context = context;
        _batchService = batchService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AuditLogDto>>> GetAuditLogs(
        [FromQuery] int? userId = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 500
    )
    {
        var query = _context.AuditLogs.Include(al => al.User).AsQueryable();

        if (userId.HasValue)
            query = query.Where(al => al.UserId == userId.Value);

        if (fromDate.HasValue)
            query = query.Where(al => al.LogDate >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(al => al.LogDate <= toDate.Value);

        var total = await query.CountAsync();
        var logsDb = await query
            .OrderByDescending(al => al.LogDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var logs = logsDb.Select(al => new AuditLogDto
        {
            Id = al.Id,
            UserId = al.UserId,
            UserName = al.User != null ? al.User.FullName : null,
            RoleName = al.RoleName,
            Action = al.Action,
            TableName = al.TableName,
            RecordId = al.RecordId,
            OldValue = al.OldValue,
            NewValue = al.NewValue,
            CreatedAt = al.CreatedAt,
            LogData = al.LogData
        }).ToList();

        return Ok(
            new
            {
                Data = logs,
                Total = total,
                Page = page,
                PageSize = pageSize,
            }
        );
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AuditLogDto>> GetAuditLog(int id)
    {
        var auditLog = await _context
            .AuditLogs.Include(al => al.User)
            .FirstOrDefaultAsync(al => al.Id == id);

        if (auditLog == null)
            return NotFound();

        var dto = new AuditLogDto
        {
            Id = auditLog.Id,
            UserId = auditLog.UserId,
            UserName = auditLog.User != null ? auditLog.User.FullName : null,
            Action = auditLog.Action,
            TableName = auditLog.TableName,
            RecordId = auditLog.RecordId,
            OldValue = auditLog.OldValue,
            NewValue = auditLog.LogData, // Tra loi nguyen JSON logs de xem chi tiet
            CreatedAt = auditLog.CreatedAt
        };

        return Ok(dto);
    }

    /// <summary>
    /// Create batch audit log - accepts event payloads
    /// Saves as single Audit_Log using direct table columns
    /// </summary>
    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult> CreateBatchAuditLog([FromBody] object payload)
    {
        try
        {
            // Get current user info from JWT claim if authenticated
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int? userId = null;
            string roleName = "Unknown";

            if (int.TryParse(userIdClaim, out int parsedUserId))
            {
                userId = parsedUserId;
            }
            else
            {
                // Try to extract user email or user name from the JSON payload to resolve the real user!
                try
                {
                    var options = new JsonSerializerOptions { WriteIndented = false };
                    var jsonString = JsonSerializer.Serialize(payload, options);
                    using var doc = JsonDocument.Parse(jsonString);
                    var root = doc.RootElement;

                    string? email = null;
                    string? userName = null;

                    if (root.TryGetProperty("email", out var emailProp))
                    {
                        email = emailProp.GetString();
                    }
                    else if (root.TryGetProperty("events", out var eventsProp) && eventsProp.ValueKind == JsonValueKind.Array && eventsProp.GetArrayLength() > 0)
                    {
                        var firstEvent = eventsProp[0];
                        if (firstEvent.TryGetProperty("email", out var nestedEmailProp))
                            email = nestedEmailProp.GetString();
                        if (firstEvent.TryGetProperty("userName", out var nestedUserProp))
                            userName = nestedUserProp.GetString();
                    }

                    if (!string.IsNullOrEmpty(email))
                    {
                        var matchedUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
                        if (matchedUser != null)
                        {
                            userId = matchedUser.Id;
                        }
                    }
                    else if (!string.IsNullOrEmpty(userName))
                    {
                        var matchedUser = await _context.Users.FirstOrDefaultAsync(u => u.FullName == userName);
                        if (matchedUser != null)
                        {
                            userId = matchedUser.Id;
                        }
                    }
                }
                catch
                {
                    // Keep userId null if unresolved
                }
            }

            if (userId.HasValue)
            {
                var matchedUser = await _context.Users.Include(u => u.UserRoles).ThenInclude(ur => ur.Role).FirstOrDefaultAsync(u => u.Id == userId.Value);
                if (matchedUser != null)
                {
                    roleName = matchedUser.UserRoles?.FirstOrDefault()?.Role?.Name ?? "Unknown";
                }
            }

            if (payload != null)
            {
                var options = new JsonSerializerOptions { WriteIndented = false };
                var jsonString = JsonSerializer.Serialize(payload, options);
                using var doc = JsonDocument.Parse(jsonString);
                var root = doc.RootElement;

                if (root.TryGetProperty("events", out var eventsProp) && eventsProp.ValueKind == JsonValueKind.Array)
                {
                    foreach (var ev in eventsProp.EnumerateArray())
                    {
                        var eventObj = new
                        {
                            eventId = ev.TryGetProperty("eventId", out var evIdProp) ? evIdProp.GetString() : Guid.NewGuid().ToString("N").Substring(0, 8),
                            actionType = ev.TryGetProperty("actionType", out var actProp) ? actProp.GetString() : (ev.TryGetProperty("action", out var actProp2) ? actProp2.GetString() : "OTHER"),
                            targetTable = ev.TryGetProperty("targetTable", out var tblProp) ? tblProp.GetString() : (ev.TryGetProperty("module", out var modProp) ? modProp.GetString() : "System"),
                            status = ev.TryGetProperty("status", out var statProp) ? statProp.GetString() : "Success",
                            timestamp = ev.TryGetProperty("timestamp", out var tsProp) ? tsProp.GetString() : DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffffffZ")
                        };
                        await _batchService.AddEventAsync(userId ?? 0, roleName, eventObj);
                    }
                }
                else
                {
                    var eventObj = new
                    {
                        eventId = root.TryGetProperty("eventId", out var evIdProp) ? evIdProp.GetString() : Guid.NewGuid().ToString("N").Substring(0, 8),
                        actionType = root.TryGetProperty("actionType", out var actProp) ? actProp.GetString() : (root.TryGetProperty("action", out var actProp2) ? actProp2.GetString() : "OTHER"),
                        targetTable = root.TryGetProperty("targetTable", out var tblProp) ? tblProp.GetString() : (root.TryGetProperty("module", out var modProp) ? modProp.GetString() : "System"),
                        status = root.TryGetProperty("status", out var statProp) ? statProp.GetString() : "Success",
                        timestamp = root.TryGetProperty("timestamp", out var tsProp) ? tsProp.GetString() : DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffffffZ")
                    };
                    await _batchService.AddEventAsync(userId ?? 0, roleName, eventObj);
                }
            }

            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            return BadRequest($"Error saving batch log: {ex.Message}");
        }
    }
}

public class AuditLogDto
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public string? UserName { get; set; }
    public string? RoleName { get; set; }
    public string Action { get; set; } = string.Empty;
    public string TableName { get; set; } = string.Empty;
    public int? RecordId { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? LogData { get; set; }
}
