using System.Text.Json;

namespace QuanTriKhachSanN5.DTOs.Dashboard;

public class DashboardPeriodResponseDto
{
    public int Id { get; set; }
    public int RoleId { get; set; }
    public string RoleName { get; set; } = null!;
    public string DashboardCode { get; set; } = null!;
    public string DashboardTitle { get; set; } = null!;
    public string PeriodType { get; set; } = null!;
    public string PeriodKey { get; set; } = null!;
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public string Status { get; set; } = null!;
    public bool IsCurrent { get; set; }
    public int Version { get; set; }
    public DateTime UpdatedAt { get; set; }
    public JsonElement? Dashboard { get; set; }
    public JsonElement? Comparison { get; set; }
}

public class DashboardHistoryItemDto
{
    public int Id { get; set; }
    public string RoleName { get; set; } = null!;
    public string DashboardCode { get; set; } = null!;
    public string PeriodType { get; set; } = null!;
    public string PeriodKey { get; set; } = null!;
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public string Status { get; set; } = null!;
    public bool IsCurrent { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class DashboardRebuildRequestDto
{
    public string RoleName { get; set; } = null!;
    public string PeriodType { get; set; } = "MONTHLY";
    public DateTime? OccurredAtUtc { get; set; }
}

public class DashboardEventRequestDto
{
    public string EventType { get; set; } = null!;
    public DateTime? OccurredAtUtc { get; set; }
    public int? RefId { get; set; }
}