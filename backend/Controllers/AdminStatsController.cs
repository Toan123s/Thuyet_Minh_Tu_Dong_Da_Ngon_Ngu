using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;

namespace backend.Controllers;

[ApiController]
[Route("api/admin")]
public class AdminStatsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminStatsController(AppDbContext db)
    {
        _db = db;
    }

    // GET /api/admin/stats/summary
    [HttpGet("stats/summary")]
    public async Task<IActionResult> GetSummary()
    {
        var today = DateTime.UtcNow.Date;

        var totalEvents  = await _db.Events.CountAsync();
        var totalBooths  = await _db.Booths.CountAsync(b => b.IsActive);
        var listensToday = await _db.VisitLogs
            .CountAsync(v => v.VisitedAt.Date == today);

        return Ok(new { totalEvents, totalBooths, listensToday });
    }

    // GET /api/admin/stats/chart?range=7d
    [HttpGet("stats/chart")]
    public async Task<IActionResult> GetChart([FromQuery] string range = "7d")
    {
        int days = range == "30d" ? 30 : 7;
        var from = DateTime.UtcNow.Date.AddDays(-days + 1);

        var logs = await _db.VisitLogs
            .Where(v => v.VisitedAt.Date >= from)
            .GroupBy(v => v.VisitedAt.Date)
            .Select(g => new { date = g.Key, count = g.Count() })
            .ToListAsync();

        var labels = Enumerable.Range(0, days)
            .Select(i => from.AddDays(i).ToString("dd/MM")).ToList();
        var values = Enumerable.Range(0, days)
            .Select(i => logs.FirstOrDefault(l => l.date == from.AddDays(i))?.count ?? 0)
            .ToList();

        return Ok(new { labels, values });
    }

    // GET /api/admin/stats/top-booths?date=today&limit=5
    [HttpGet("stats/top-booths")]
    public async Task<IActionResult> GetTopBooths(
        [FromQuery] string date  = "today",
        [FromQuery] int    limit = 5)
    {
        var from = date == "today"
            ? DateTime.UtcNow.Date
            : DateTime.UtcNow.Date.AddDays(-7);

        var data = await _db.VisitLogs
            .Where(v => v.VisitedAt >= from)
            .GroupBy(v => new { v.BoothId, v.Booth.BoothName })
            .Select(g => new {
                boothId = g.Key.BoothId,
                name    = g.Key.BoothName,
                listens = g.Count(),
            })
            .OrderByDescending(x => x.listens)
            .Take(limit)
            .ToListAsync();

        return Ok(data);
    }

    // GET /api/admin/activity?limit=5
    [HttpGet("activity")]
    public async Task<IActionResult> GetRecentActivity([FromQuery] int limit = 5)
    {
        var logs = await _db.VisitLogs
            .Include(v => v.Booth)
            .OrderByDescending(v => v.VisitedAt)
            .Take(limit)
            .Select(v => new {
                v.Id,
                boothName  = v.Booth.BoothName,
                v.LanguageCode,
                v.DeviceType,
                v.Duration,
                v.VisitedAt,
            })
            .ToListAsync();

        return Ok(logs);
    }
}