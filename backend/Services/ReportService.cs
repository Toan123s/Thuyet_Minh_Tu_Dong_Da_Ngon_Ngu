// ReportService.cs — paste đè toàn bộ (Booth.Name → Booth.BoothName)
using backend.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class ReportService
{
    private readonly AppDbContext _db;
    public ReportService(AppDbContext db) { _db = db; }

    public async Task<object> GetSummaryAsync(int? eventId, DateTime? from, DateTime? to)
    {
        var query = _db.VisitLogs.Include(v => v.Booth).AsQueryable();
        if (eventId.HasValue) query = query.Where(v => v.Booth.EventId == eventId);
        if (from.HasValue)    query = query.Where(v => v.VisitedAt >= from);
        if (to.HasValue)      query = query.Where(v => v.VisitedAt <= to);
        var total   = await query.CountAsync();
        var avgDur  = total == 0 ? 0 : await query.AverageAsync(v => (double)v.Duration);
        var langs   = await query.Select(v => v.LanguageCode).Distinct().CountAsync();
        return new { total, avgDurationSec = Math.Round(avgDur), languages = langs };
    }

    public async Task<object> GetChartAsync(int? eventId, DateTime? from, DateTime? to)
    {
        var query = _db.VisitLogs.Include(v => v.Booth).AsQueryable();
        if (eventId.HasValue) query = query.Where(v => v.Booth.EventId == eventId);
        if (from.HasValue)    query = query.Where(v => v.VisitedAt >= from);
        if (to.HasValue)      query = query.Where(v => v.VisitedAt <= to);
        var data = await query
            .GroupBy(v => v.VisitedAt.Date)
            .Select(g => new { date = g.Key, count = g.Count() })
            .OrderBy(x => x.date)
            .ToListAsync();
        return data;
    }

    public async Task<object> GetByLanguageAsync(int? eventId)
    {
        var query = _db.VisitLogs.Include(v => v.Booth).AsQueryable();
        if (eventId.HasValue) query = query.Where(v => v.Booth.EventId == eventId);
        var total = await query.CountAsync();
        return await query.GroupBy(v => v.LanguageCode)
            .Select(g => new { languageCode = g.Key, count = g.Count(), pct = total == 0 ? 0 : Math.Round(g.Count() * 100.0 / total, 1) })
            .OrderByDescending(x => x.count).ToListAsync();
    }

    public async Task<object> GetByDeviceAsync(int? eventId)
    {
        var query = _db.VisitLogs.Include(v => v.Booth).AsQueryable();
        if (eventId.HasValue) query = query.Where(v => v.Booth.EventId == eventId);
        var total = await query.CountAsync();
        return await query.GroupBy(v => v.DeviceType)
            .Select(g => new { deviceType = g.Key, count = g.Count(), pct = total == 0 ? 0 : Math.Round(g.Count() * 100.0 / total, 1) })
            .OrderByDescending(x => x.count).ToListAsync();
    }

    public async Task<object> GetByBoothAsync(int? eventId)
    {
        var query = _db.VisitLogs.Include(v => v.Booth).AsQueryable();
        if (eventId.HasValue) query = query.Where(v => v.Booth.EventId == eventId);
        return await query.GroupBy(v => new { v.BoothId, v.Booth.BoothName })
            .Select(g => new { id = g.Key.BoothId, name = g.Key.BoothName, visits = g.Count(), avgDur = Math.Round(g.Average(v => (double)v.Duration), 1) })
            .OrderByDescending(x => x.visits).ToListAsync();
    }
}