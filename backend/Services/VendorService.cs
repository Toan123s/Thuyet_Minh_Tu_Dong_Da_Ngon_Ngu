// VendorService.cs
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Repositories;

namespace backend.Services;

public class VendorService
{
    private readonly VendorRepository   _vendorRepo;
    private readonly VisitLogRepository _visitLogRepo;
    private readonly AppDbContext       _db;

    public VendorService(VendorRepository vendorRepo, VisitLogRepository visitLogRepo, AppDbContext db)
    {
        _vendorRepo   = vendorRepo;
        _visitLogRepo = visitLogRepo;
        _db           = db;
    }

    public async Task<object> GetMeAsync(int accountId)
    {
        var vendor = await _vendorRepo.GetByAccountIdAsync(accountId)
            ?? throw new KeyNotFoundException("Không tìm thấy thông tin vendor.");

        return new
        {
            vendor.Id,
            vendor.AccountId,
            vendor.CompanyName,
            vendor.RepresentativeName,
            vendor.PhoneNumber,
        };
    }

    public async Task<object> GetMyBoothsAsync(int accountId)
    {
        var vendor = await _vendorRepo.GetByAccountIdAsync(accountId)
            ?? throw new KeyNotFoundException("Không tìm thấy thông tin vendor.");

        var result = new List<object>();
        foreach (var b in vendor.Booths)
        {
            var listensToday = await _visitLogRepo.CountTodayByBoothAsync(b.Id);
            result.Add(new
            {
                b.Id,
                b.Name,
                b.IsActive,
                eventName = b.Event?.Name,
                listensToday,
            });
        }

        return result;
    }

    public async Task<object> GetStatsTodayAsync(int accountId)
    {
        var vendor = await _vendorRepo.GetByAccountIdAsync(accountId)
            ?? throw new KeyNotFoundException("Không tìm thấy thông tin vendor.");

        var totalBooths  = vendor.Booths.Count;
        var listensToday = 0;

        foreach (var b in vendor.Booths)
            listensToday += await _visitLogRepo.CountTodayByBoothAsync(b.Id);

        return new { totalBooths, listensToday, totalLanguages = 5 };
    }

    public async Task<object> GetBoothStatsAsync(int boothId, string range)
    {
        var from = range switch
        {
            "30days" => DateTime.UtcNow.Date.AddDays(-30),
            "month"  => new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1),
            _        => DateTime.UtcNow.Date.AddDays(-7),
        };

        var logs = await _db.VisitLogs
            .Where(v => v.BoothId == boothId && v.VisitedAt >= from)
            .ToListAsync();

        var total    = logs.Count;
        var avgSecs  = total == 0 ? 0 : (int)logs.Average(v => (double)v.Duration);
        var topLang  = logs
            .GroupBy(v => v.LanguageCode)
            .OrderByDescending(g => g.Count())
            .Select(g => g.Key)
            .FirstOrDefault() ?? "—";

        // Thống kê theo giờ
        var hourlyData = Enumerable.Range(0, 24)
            .Select(h => new
            {
                hour  = $"{h:D2}h",
                views = logs.Count(v => v.VisitedAt.Hour == h),
            })
            .Where(x => x.views > 0)
            .ToList();

        // Thống kê theo ngôn ngữ
        var langData = logs
            .GroupBy(v => v.LanguageCode)
            .Select(g => new
            {
                languageCode = g.Key,
                count        = g.Count(),
                pct          = total == 0 ? 0 : Math.Round(g.Count() * 100.0 / total, 1),
            })
            .OrderByDescending(x => x.count)
            .ToList();

        return new
        {
            total,
            avgDurationSec = avgSecs,
            topLanguage    = topLang,
            hourlyData,
            langData,
        };
    }
}