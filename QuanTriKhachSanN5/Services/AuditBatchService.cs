using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using QuanTriKhachSanN5.Data;
using QuanTriKhachSanN5.Interfaces;
using QuanTriKhachSanN5.Models;

namespace QuanTriKhachSanN5.Services
{
    public class AuditLogEvent
    {
        public string eventId { get; set; }
        public string actionType { get; set; }
        public string targetTable { get; set; }
        public string status { get; set; }
        public string timestamp { get; set; }
    }

    public class AuditLogData
    {
        public int TotalEvents { get; set; }
        public List<AuditLogEvent> Events { get; set; } = new();
    }

    public class AuditBatchService : IAuditBatchService
    {
        private readonly ApplicationDbContext _context;

        public AuditBatchService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task AddEventAsync(int userId, string role, object eventObj)
        {
            try
            {
                // Parse properties dynamically from incoming payload
                string eventId = Guid.NewGuid().ToString("N").Substring(0, 8);
                string actionType = "OTHER";
                string targetTable = "System";
                string status = "Success";
                string timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffffffZ");

                if (eventObj != null)
                {
                    var options = new JsonSerializerOptions { WriteIndented = false };
                    var jsonString = JsonSerializer.Serialize(eventObj, options);
                    using var doc = JsonDocument.Parse(jsonString);
                    var root = doc.RootElement;

                    if (root.TryGetProperty("eventId", out var evIdProp))
                        eventId = evIdProp.GetString() ?? eventId;

                    if (root.TryGetProperty("actionType", out var actProp))
                        actionType = actProp.GetString() ?? "OTHER";
                    else if (root.TryGetProperty("action", out var actProp2))
                        actionType = actProp2.GetString() ?? "OTHER";

                    if (root.TryGetProperty("targetTable", out var tblProp))
                        targetTable = tblProp.GetString() ?? "System";
                    else if (root.TryGetProperty("module", out var modProp))
                        targetTable = modProp.GetString() ?? "System";

                    if (root.TryGetProperty("status", out var statusProp))
                        status = statusProp.GetString() ?? "Success";

                    if (root.TryGetProperty("timestamp", out var timeProp))
                    {
                        if (timeProp.ValueKind == JsonValueKind.String)
                            timestamp = timeProp.GetString() ?? timestamp;
                        else if (timeProp.ValueKind == JsonValueKind.Number)
                            timestamp = DateTimeOffset.FromUnixTimeMilliseconds(timeProp.GetInt64()).UtcDateTime.ToString("yyyy-MM-ddTHH:mm:ss.fffffffZ");
                    }
                }

                var newEvent = new AuditLogEvent
                {
                    eventId = eventId,
                    actionType = actionType,
                    targetTable = targetTable,
                    status = status,
                    timestamp = timestamp
                };

                // Find if there is an existing log for today for this role
                var today = DateTime.UtcNow.Date;
                var existingLog = await _context.AuditLogs
                    .FirstOrDefaultAsync(al => al.RoleName == role && al.LogDate.Date == today);

                if (existingLog != null)
                {
                    // Update existing log
                    AuditLogData logData = null;
                    try
                    {
                        if (!string.IsNullOrEmpty(existingLog.LogData))
                        {
                            logData = JsonSerializer.Deserialize<AuditLogData>(existingLog.LogData);
                        }
                    }
                    catch { }

                    if (logData == null)
                    {
                        logData = new AuditLogData();
                    }

                    logData.Events.Add(newEvent);
                    logData.TotalEvents = logData.Events.Count;

                    existingLog.LogData = JsonSerializer.Serialize(logData, new JsonSerializerOptions { WriteIndented = false });
                    existingLog.UserId = userId == 0 ? (int?)null : userId; // Update with latest user doing the action
                    existingLog.LogDate = DateTime.UtcNow; // update date/time of last event if desired
                    _context.AuditLogs.Update(existingLog);
                }
                else
                {
                    // Create new log
                    var logData = new AuditLogData
                    {
                        TotalEvents = 1,
                        Events = new List<AuditLogEvent> { newEvent }
                    };

                    var auditLog = new Audit_Log
                    {
                        UserId = userId == 0 ? (int?)null : userId,
                        RoleName = role,
                        LogDate = DateTime.UtcNow,
                        LogData = JsonSerializer.Serialize(logData, new JsonSerializerOptions { WriteIndented = false })
                    };

                    _context.AuditLogs.Add(auditLog);
                }

                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Fallback safe log
                var fallbackLog = new Audit_Log
                {
                    UserId = userId == 0 ? (int?)null : userId,
                    RoleName = role,
                    LogDate = DateTime.UtcNow,
                    LogData = $"{{\"TotalEvents\":1,\"Events\":[{{\"eventId\":\"error\",\"actionType\":\"ERROR\",\"targetTable\":\"System\",\"status\":\"{ex.Message}\",\"timestamp\":\"{DateTime.UtcNow:yyyy-MM-ddTHH:mm:ss.fffffffZ}\"}}]}}"
                };
                _context.AuditLogs.Add(fallbackLog);
                await _context.SaveChangesAsync();
            }
        }
    }
}
