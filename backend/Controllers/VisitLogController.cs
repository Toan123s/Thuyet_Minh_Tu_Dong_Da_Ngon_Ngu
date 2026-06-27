using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/visitlogs")]
public class VisitLogController : ControllerBase
{
    private readonly AppDbContext _db;
    public VisitLogController(AppDbContext db) { _db = db; }

    // POST /api/visitlogs — Ghi lượt xem
    [HttpPost]
    public async Task<IActionResult> Log([FromBody] VisitLogRequest request)
    {
        var log = new VisitLog
        {
            BoothId      = request.BoothId,
            LanguageCode = request.LanguageCode ?? "vi",
            DeviceType   = request.DeviceType   ?? "Mobile",
            Duration     = request.DurationSec,
            // ✅ Đảm bảo Kind = Utc để .ToString("o") ra đúng "...Z"
            VisitedAt    = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
        };
        _db.VisitLogs.Add(log);
        await _db.SaveChangesAsync();
        return Ok(new { id = log.Id });
    }

    // GET /api/visitlogs/languages — Lấy danh sách ngôn ngữ đã dùng
    [HttpGet("languages")]
    public async Task<IActionResult> GetUsedLanguages()
    {
        var langs = await _db.VisitLogs
            .GroupBy(v => v.LanguageCode)
            .Select(g => new {
                languageCode = g.Key,
                count        = g.Count(),
            })
            .OrderByDescending(x => x.count)
            .ToListAsync();
        return Ok(langs);
    }
}

public class VisitLogRequest
{
    public int     BoothId      { get; set; }
    public string? LanguageCode { get; set; }
    public string? DeviceType   { get; set; }
    public int     DurationSec  { get; set; }
}