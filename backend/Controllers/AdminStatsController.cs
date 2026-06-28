using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/admin")]
public class AdminStatsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly OnlineTrackerService _online;

    private static readonly TimeZoneInfo VnZone =
        TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");

    private static DateTime VnNow   => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, VnZone);
    private static DateTime VnToday => VnNow.Date;

    private static DateTime ToUtc(DateTime vnDate)
        => TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(vnDate, DateTimeKind.Unspecified), VnZone);
    private static DateTime ToVnDate(DateTime utc)
        => TimeZoneInfo.ConvertTimeFromUtc(utc, VnZone).Date;

    public AdminStatsController(AppDbContext db, OnlineTrackerService online)
    {
        _db     = db;
        _online = online;
    }

    // GET /api/admin/stats/summary
    // Trả về: totalEvents (TẤT CẢ), activeEvents (ĐANG MỞ), totalBooths, listensToday
    [HttpGet("stats/summary")]
    public async Task<IActionResult> GetSummary()
    {
        var now              = DateTime.UtcNow;
        var todayStartUtc    = ToUtc(VnToday);
        var tomorrowStartUtc = ToUtc(VnToday.AddDays(1));

        var totalEvents  = await _db.Events.CountAsync();

        // Sự kiện đang mở: StartDate <= now <= EndDate
        var activeEvents = await _db.Events.CountAsync(e =>
            e.StartDate != null && e.EndDate != null &&
            e.StartDate <= now && e.EndDate >= now);

        // Sự kiện sắp tới
        var upcomingEvents = await _db.Events.CountAsync(e =>
            e.StartDate != null && e.StartDate > now);

        var totalBooths  = await _db.Booths.CountAsync(b => b.IsActive);
        var listensToday = await _db.VisitLogs
            .CountAsync(v => v.VisitedAt >= todayStartUtc && v.VisitedAt < tomorrowStartUtc);

        // "Hành khách online" = số session đang active (heartbeat trong 45s gần nhất).
        // Frontend gửi ping mỗi 20s khi đang mở trang visitor bất kỳ.
        var onlineVisitors = _online.GetOnline().Count;

        return Ok(new {
            totalEvents,
            activeEvents,
            upcomingEvents,
            totalBooths,
            listensToday,
            onlineVisitors
        });
    }

    // GET /api/admin/stats/chart?range=7d
    [HttpGet("stats/chart")]
    public async Task<IActionResult> GetChart([FromQuery] string range = "7d")
    {
        int days    = range == "30d" ? 30 : 7;
        var fromVn  = VnToday.AddDays(-days + 1);
        var fromUtc = ToUtc(fromVn);
        var toUtc   = ToUtc(VnToday.AddDays(1));

        var timestamps = await _db.VisitLogs
            .Where(v => v.VisitedAt >= fromUtc && v.VisitedAt < toUtc)
            .Select(v => v.VisitedAt)
            .ToListAsync();

        var grouped = timestamps
            .GroupBy(utc => ToVnDate(utc))
            .ToDictionary(g => g.Key, g => g.Count());

        var labels = Enumerable.Range(0, days)
            .Select(i => fromVn.AddDays(i).ToString("dd/MM")).ToList();
        var values = Enumerable.Range(0, days)
            .Select(i => grouped.TryGetValue(fromVn.AddDays(i), out var c) ? c : 0)
            .ToList();

        return Ok(new { labels, values });
    }

    // GET /api/admin/stats/top-booths?date=today&limit=5
    [HttpGet("stats/top-booths")]
    public async Task<IActionResult> GetTopBooths(
        [FromQuery] string date  = "today",
        [FromQuery] int    limit = 5)
    {
        var fromUtc = date == "today"
            ? ToUtc(VnToday)
            : ToUtc(VnToday.AddDays(-7));
        var toUtc = ToUtc(VnToday.AddDays(1));

        var data = await _db.VisitLogs
            .Where(v => v.VisitedAt >= fromUtc && v.VisitedAt < toUtc)
            .GroupBy(v => new { v.BoothId, v.Booth.BoothName, v.Booth.EventId })
            .Select(g => new {
                boothId = g.Key.BoothId,
                name    = g.Key.BoothName,
                eventId = g.Key.EventId,
                listens = g.Count(),
            })
            .OrderByDescending(x => x.listens)
            .Take(limit)
            .ToListAsync();

        // Tính % so với booth đứng đầu
        var maxListens = data.FirstOrDefault()?.listens ?? 1;
        var result = data.Select(b => new {
            b.boothId,
            b.name,
            b.eventId,
            b.listens,
            pct = maxListens > 0 ? Math.Round(b.listens * 100.0 / maxListens) : 0
        });

        return Ok(result);
    }

    // GET /api/admin/activity?limit=5
    [HttpGet("activity")]
    public async Task<IActionResult> GetRecentActivity([FromQuery] int limit = 5)
    {
        var logs = await _db.VisitLogs
            .Include(v => v.Booth)
            .ThenInclude(b => b.Event)
            .OrderByDescending(v => v.VisitedAt)
            .Take(limit)
            .Select(v => new {
                v.Id,
                boothName    = v.Booth.BoothName,
                eventName    = v.Booth.Event != null ? v.Booth.Event.Name : "",
                v.LanguageCode,
                v.DeviceType,
                v.Duration,
                visitedAt    = DateTime.SpecifyKind(v.VisitedAt, DateTimeKind.Utc).ToString("o"),
            })
            .ToListAsync();

        return Ok(logs);
    }

    // POST /api/admin/online/ping — Frontend visitor gọi mỗi 20s để báo "đang online"
    // sessionId: UUID tạo 1 lần khi khách vào trang, giữ trong sessionStorage
    [HttpPost("online/ping")]
    public IActionResult Ping([FromBody] PingRequest req)
    {
        _online.Ping(req.SessionId, req.BoothId ?? 0, req.LanguageCode, req.DeviceType);
        return Ok();
    }

    // DELETE /api/admin/online/leave — Gọi khi khách đóng tab (beacon)
    [HttpDelete("online/leave/{sessionId}")]
    public IActionResult Leave(string sessionId)
    {
        _online.Remove(sessionId);
        return Ok();
    }
}

public record PingRequest(string SessionId, int? BoothId, string? LanguageCode, string? DeviceType);