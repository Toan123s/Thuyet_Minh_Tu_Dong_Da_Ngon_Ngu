using ClosedXML.Excel;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;

namespace backend.Controllers;

[ApiController]
[Route("api/reports")]
public class ReportController : ControllerBase
{
    private readonly AppDbContext _db;

    private static readonly TimeZoneInfo VnZone =
        TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");

    private static DateTime VnNow   => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, VnZone);
    private static DateTime VnToday => VnNow.Date;

    private static DateTime ToUtc(DateTime vnDate)
        => TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(vnDate, DateTimeKind.Unspecified), VnZone);
    private static DateTime ToVnDate(DateTime utc)
        => TimeZoneInfo.ConvertTimeFromUtc(utc, VnZone).Date;

    public ReportController(AppDbContext db) { _db = db; }

    // ── Helper: tính khoảng thời gian ──────────────────────────
    private (DateTime fromUtc, DateTime toUtc) GetRange(string range)
    {
        var fromVn = range switch
        {
            "today" => VnToday,
            "month" => VnToday.AddDays(-30),
            _       => VnToday.AddDays(-7),   // week
        };
        return (ToUtc(fromVn), ToUtc(VnToday.AddDays(1)));
    }

    // GET /api/reports/summary?eventId=1&range=week
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(
        [FromQuery] int?   eventId = null,
        [FromQuery] string range   = "week")
    {
        var (fromUtc, toUtc) = GetRange(range);
        var query = _db.VisitLogs.Where(v => v.VisitedAt >= fromUtc && v.VisitedAt < toUtc);
        if (eventId.HasValue)
            query = query.Where(v => v.Booth.EventId == eventId);

        var total      = await query.CountAsync();
        var avgSecs    = total == 0 ? 0 : await query.AverageAsync(v => (double)v.Duration);

        // Ngôn ngữ phổ biến nhất
        var topLang = total == 0 ? null : await query
            .GroupBy(v => v.LanguageCode)
            .OrderByDescending(g => g.Count())
            .Select(g => g.Key)
            .FirstOrDefaultAsync();

        var langCount  = await query.Select(v => v.LanguageCode).Distinct().CountAsync();

        // Tính trung bình/ngày
        int days       = range switch { "today" => 1, "month" => 30, _ => 7 };
        var avgPerDay  = days == 0 ? 0 : Math.Round((double)total / days, 1);

        return Ok(new {
            total,
            avgDurationSec = (int)Math.Round(avgSecs),
            languages      = langCount,
            topLanguage    = topLang?.ToUpper(),
            totalLanguages = langCount,
            avgPerDay,
        });
    }

    // GET /api/reports/chart?eventId=1&range=week
    [HttpGet("chart")]
    public async Task<IActionResult> GetChart(
        [FromQuery] int?   eventId = null,
        [FromQuery] string range   = "week")
    {
        int days    = range switch { "today" => 1, "month" => 30, _ => 7 };
        var fromVn  = range == "today" ? VnToday : VnToday.AddDays(-days + 1);
        var (fromUtc, toUtc) = GetRange(range);

        var query = _db.VisitLogs.Where(v => v.VisitedAt >= fromUtc && v.VisitedAt < toUtc);
        if (eventId.HasValue)
            query = query.Where(v => v.Booth.EventId == eventId);

        var timestamps = await query.Select(v => v.VisitedAt).ToListAsync();
        var grouped    = timestamps
            .GroupBy(utc => ToVnDate(utc))
            .ToDictionary(g => g.Key, g => g.Count());

        var labels = Enumerable.Range(0, days)
            .Select(i => fromVn.AddDays(i).ToString("dd/MM")).ToList();
        var values = Enumerable.Range(0, days)
            .Select(i => grouped.TryGetValue(fromVn.AddDays(i), out var c) ? c : 0)
            .ToList();

        return Ok(new { labels, values });
    }

    // GET /api/reports/by-language?eventId=1
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
                label = g.Key,        // ← "label" để frontend dùng thống nhất
                languageCode = g.Key,
                count        = g.Count(),
                pct          = total == 0 ? 0.0 : Math.Round(g.Count() * 100.0 / total, 1),
            })
            .OrderByDescending(x => x.count)
            .ToListAsync();

        return Ok(data);
    }

    // GET /api/reports/by-device?eventId=1
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
                label      = g.Key,    // ← "label" để frontend dùng thống nhất
                deviceType = g.Key,
                count      = g.Count(),
                pct        = total == 0 ? 0.0 : Math.Round(g.Count() * 100.0 / total, 1),
            })
            .OrderByDescending(x => x.count)
            .ToListAsync();

        return Ok(data);
    }

    // GET /api/reports/by-booth?eventId=1
    [HttpGet("by-booth")]
    public async Task<IActionResult> GetByBooth([FromQuery] int? eventId = null)
    {
        var query = _db.VisitLogs.AsQueryable();
        if (eventId.HasValue)
            query = query.Where(v => v.Booth.EventId == eventId);

        var total = await query.CountAsync();
        var data  = await query
            .GroupBy(v => new { v.BoothId, v.Booth.BoothName, v.Booth.EventId })
            .Select(g => new {
                id          = g.Key.BoothId,
                name        = g.Key.BoothName,
                eventId     = g.Key.EventId,
                visits      = g.Count(),
                avgDur      = Math.Round(g.Average(v => (double)v.Duration), 1),
                pct         = total == 0 ? 0.0 : Math.Round(g.Count() * 100.0 / total, 1),
            })
            .OrderByDescending(x => x.visits)
            .ToListAsync();

        // Gắn eventName (join thêm ngoài LINQ để tránh EF phức tạp)
        var eventIds   = data.Select(d => d.eventId).Distinct().ToList();
        var eventNames = await _db.Events
            .Where(e => eventIds.Contains(e.Id))
            .ToDictionaryAsync(e => e.Id, e => e.Name);

        var result = data.Select(d => new {
            d.id,
            d.name,
            eventName  = eventNames.TryGetValue(d.eventId, out var n) ? n : "",
            d.visits,
            avgDuration = d.avgDur,
            d.pct,
        });

        return Ok(result);
    }

    // GET /api/reports/export?eventId=1&range=week
    [HttpGet("export")]
    public async Task<IActionResult> Export(
        [FromQuery] int?   eventId = null,
        [FromQuery] string range   = "week")
    {
        var (fromUtc, toUtc) = GetRange(range);
        int days   = range switch { "today" => 1, "month" => 30, _ => 7 };
        var fromVn = range == "today" ? VnToday : VnToday.AddDays(-days + 1);

        var query = _db.VisitLogs.Where(v => v.VisitedAt >= fromUtc && v.VisitedAt < toUtc);
        if (eventId.HasValue)
            query = query.Where(v => v.Booth.EventId == eventId);

        var total    = await query.CountAsync();
        var avgSecs  = total == 0 ? 0 : await query.AverageAsync(v => (double)v.Duration);
        var langData = await query
            .GroupBy(v => v.LanguageCode)
            .Select(g => new { lang = g.Key, count = g.Count(),
                pct = total == 0 ? 0.0 : Math.Round(g.Count() * 100.0 / total, 1) })
            .OrderByDescending(x => x.count).ToListAsync();
        var deviceData = await query
            .GroupBy(v => v.DeviceType)
            .Select(g => new { device = g.Key, count = g.Count(),
                pct = total == 0 ? 0.0 : Math.Round(g.Count() * 100.0 / total, 1) })
            .OrderByDescending(x => x.count).ToListAsync();
        var boothData = await query
            .GroupBy(v => new { v.BoothId, v.Booth.BoothName })
            .Select(g => new { name = g.Key.BoothName, visits = g.Count(),
                avgDur = Math.Round(g.Average(v => (double)v.Duration), 1) })
            .OrderByDescending(x => x.visits).ToListAsync();
        var stamps  = await query.Select(v => v.VisitedAt).ToListAsync();
        var grouped = stamps.GroupBy(utc => ToVnDate(utc))
                            .ToDictionary(g => g.Key, g => g.Count());

        using var wb = new XLWorkbook();
        var headerColor = XLColor.FromHtml("#6366F1");
        var lightPurple = XLColor.FromHtml("#EEF2FF");

        void StyleHeader(IXLRow row, int cols)
        {
            var r = row.Worksheet.Range(row.RowNumber(), 1, row.RowNumber(), cols);
            r.Style.Fill.BackgroundColor = headerColor;
            r.Style.Font.FontColor       = XLColor.White;
            r.Style.Font.Bold            = true;
        }

        // Sheet 1: Tổng quan
        var ws1 = wb.AddWorksheet("Tổng quan");
        ws1.Cell(1, 1).Value = "BÁO CÁO THUYẾT MINH ĐA NGÔN NGỮ";
        ws1.Cell(1, 1).Style.Font.Bold = true; ws1.Cell(1,1).Style.Font.FontSize = 14;
        ws1.Range(1,1,1,3).Merge();
        ws1.Cell(2, 1).Value = $"Xuất lúc: {VnNow:dd/MM/yyyy HH:mm} (giờ VN)";
        ws1.Range(2,1,2,3).Merge();
        ws1.Cell(3, 1).Value = $"Sự kiện: {(eventId.HasValue ? $"ID {eventId}" : "Tất cả")}  |  Khoảng: {range}";
        ws1.Range(3,1,3,3).Merge();

        int rw = 5;
        ws1.Cell(rw,1).Value = "Chỉ số"; ws1.Cell(rw,2).Value = "Giá trị";
        StyleHeader(ws1.Row(rw), 2);
        ws1.Cell(++rw,1).Value = "Tổng lượt nghe";         ws1.Cell(rw,2).Value = total;
        ws1.Cell(++rw,1).Value = "Thời lượng TB (giây)";   ws1.Cell(rw,2).Value = (int)Math.Round(avgSecs);
        ws1.Cell(++rw,1).Value = "Số ngôn ngữ";            ws1.Cell(rw,2).Value = langData.Count;
        ws1.Cell(++rw,1).Value = "Số gian hàng";           ws1.Cell(rw,2).Value = boothData.Count;
        ws1.Range(6,1,rw,2).Style.Fill.BackgroundColor = lightPurple;
        ws1.Columns().AdjustToContents();

        // Sheet 2: Theo ngày
        var ws2 = wb.AddWorksheet("Theo ngày");
        ws2.Cell(1,1).Value = "Ngày"; ws2.Cell(1,2).Value = "Lượt nghe";
        StyleHeader(ws2.Row(1), 2);
        for (int i = 0; i < days; i++)
        {
            var d = fromVn.AddDays(i);
            ws2.Cell(i+2,1).Value = d.ToString("dd/MM/yyyy");
            ws2.Cell(i+2,2).Value = grouped.TryGetValue(d, out var c) ? c : 0;
        }
        ws2.Columns().AdjustToContents();

        // Sheet 3: Theo ngôn ngữ
        var ws3 = wb.AddWorksheet("Theo ngôn ngữ");
        ws3.Cell(1,1).Value = "Ngôn ngữ"; ws3.Cell(1,2).Value = "Lượt nghe"; ws3.Cell(1,3).Value = "Tỷ lệ (%)";
        StyleHeader(ws3.Row(1), 3);
        for (int i = 0; i < langData.Count; i++)
        {
            ws3.Cell(i+2,1).Value = langData[i].lang?.ToUpper();
            ws3.Cell(i+2,2).Value = langData[i].count;
            ws3.Cell(i+2,3).Value = langData[i].pct;
        }
        ws3.Columns().AdjustToContents();

        // Sheet 4: Theo thiết bị
        var ws4 = wb.AddWorksheet("Theo thiết bị");
        ws4.Cell(1,1).Value = "Thiết bị"; ws4.Cell(1,2).Value = "Lượt nghe"; ws4.Cell(1,3).Value = "Tỷ lệ (%)";
        StyleHeader(ws4.Row(1), 3);
        for (int i = 0; i < deviceData.Count; i++)
        {
            ws4.Cell(i+2,1).Value = deviceData[i].device;
            ws4.Cell(i+2,2).Value = deviceData[i].count;
            ws4.Cell(i+2,3).Value = deviceData[i].pct;
        }
        ws4.Columns().AdjustToContents();

        // Sheet 5: Theo gian hàng
        var ws5 = wb.AddWorksheet("Theo gian hàng");
        ws5.Cell(1,1).Value = "#"; ws5.Cell(1,2).Value = "Gian hàng";
        ws5.Cell(1,3).Value = "Lượt nghe"; ws5.Cell(1,4).Value = "TB thời lượng (giây)";
        StyleHeader(ws5.Row(1), 4);
        for (int i = 0; i < boothData.Count; i++)
        {
            ws5.Cell(i+2,1).Value = i+1;
            ws5.Cell(i+2,2).Value = boothData[i].name;
            ws5.Cell(i+2,3).Value = boothData[i].visits;
            ws5.Cell(i+2,4).Value = boothData[i].avgDur;
        }
        ws5.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return File(ms.ToArray(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"BaoCao_{VnNow:yyyyMMdd_HHmm}.xlsx");
    }
}