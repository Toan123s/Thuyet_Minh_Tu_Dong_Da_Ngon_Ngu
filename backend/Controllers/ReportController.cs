// ReportController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;

namespace backend.Controllers;

[ApiController]
[Route("api/reports")]
public class ReportController : ControllerBase
{
    private readonly AppDbContext _db;

    public ReportController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(
        [FromQuery] int?   eventId = null,
        [FromQuery] string range   = "week")
    {
        var from  = GetFromDate(range);
        var query = _db.VisitLogs.Where(v => v.VisitedAt >= from);
        if (eventId.HasValue)
            query = query.Where(v => v.Booth.EventId == eventId);

        var total     = await query.CountAsync();
        var avgSecs   = total == 0 ? 0 : await query.AverageAsync(v => (double)v.Duration);
        var languages = await query.Select(v => v.LanguageCode).Distinct().CountAsync();

        return Ok(new { total, avgDurationSec = Math.Round(avgSecs), languages });
    }

    [HttpGet("chart")]
    public async Task<IActionResult> GetChart(
        [FromQuery] int?   eventId = null,
        [FromQuery] string range   = "week")
    {
        int days = range == "month" ? 30 : 7;
        var from = DateTime.UtcNow.Date.AddDays(-days + 1);

        var query = _db.VisitLogs.Where(v => v.VisitedAt.Date >= from);
        if (eventId.HasValue)
            query = query.Where(v => v.Booth.EventId == eventId);

        var logs = await query
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

    [HttpGet("by-language")]
    public async Task<IActionResult> GetByLanguage([FromQuery] int? eventId = null)
    {
        var query = _db.VisitLogs.AsQueryable();
        if (eventId.HasValue)
            query = query.Where(v => v.Booth.EventId == eventId);

        var total = await query.CountAsync();
        var data  = await query
            .GroupBy(v => v.LanguageCode)
            .Select(g => new {
                languageCode = g.Key,
                count        = g.Count(),
                pct          = total == 0 ? 0 : Math.Round(g.Count() * 100.0 / total, 1),
            })
            .OrderByDescending(x => x.count)
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("by-device")]
    public async Task<IActionResult> GetByDevice([FromQuery] int? eventId = null)
    {
        var query = _db.VisitLogs.AsQueryable();
        if (eventId.HasValue)
            query = query.Where(v => v.Booth.EventId == eventId);

        var total = await query.CountAsync();
        var data  = await query
            .GroupBy(v => v.DeviceType)
            .Select(g => new {
                deviceType = g.Key,
                count      = g.Count(),
                pct        = total == 0 ? 0 : Math.Round(g.Count() * 100.0 / total, 1),
            })
            .OrderByDescending(x => x.count)
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("by-booth")]
    public async Task<IActionResult> GetByBooth([FromQuery] int? eventId = null)
    {
        var query = _db.VisitLogs.AsQueryable();
        if (eventId.HasValue)
            query = query.Where(v => v.Booth.EventId == eventId);

        var data = await query
            .GroupBy(v => new { v.BoothId, v.Booth.BoothName })
            .Select(g => new {
                id     = g.Key.BoothId,
                name   = g.Key.BoothName,
                visits = g.Count(),
                avgDur = Math.Round(g.Average(v => (double)v.Duration), 1),
            })
            .OrderByDescending(x => x.visits)
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("export")]
    public IActionResult Export(
        [FromQuery] int?   eventId = null,
        [FromQuery] string range   = "week")
    {
        return Ok(new { message = "Export chưa được hỗ trợ." });
    }

   private static DateTime GetFromDate(string range) => range switch
    {
        "today" => DateTime.UtcNow.Date,
        "month" => DateTime.UtcNow.Date.AddDays(-30),
        _       => DateTime.UtcNow.Date.AddDays(-7),
    };
 }