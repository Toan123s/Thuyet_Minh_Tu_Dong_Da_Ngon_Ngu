using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

// ─── Language Registry Controller ──────────────────────────────
// Danh sách ngôn ngữ hiển thị trong dropdown là TOÀN CỤC (chung cho mọi
// khách), KHÔNG lưu riêng theo từng người. Mặc định luôn có vi + en.
// Khi 1 khách quét QR mà ngôn ngữ điện thoại khác — và hệ thống có sẵn
// bản dịch UI cho ngôn ngữ đó (xem Catalog) — ngôn ngữ đó được thêm vào
// danh sách chung, để từ đó MỌI khách khác cũng thấy nó trong dropdown.
[ApiController]
[Route("api/languages")]
public class LanguageController : ControllerBase
{
    private readonly AppDbContext _db;
    public LanguageController(AppDbContext db) { _db = db; }

    // Chỉ những ngôn ngữ trong danh mục này mới được tự thêm vào hệ thống —
    // vì đây là những ngôn ngữ app ĐÃ CÓ bản dịch UI sẵn (xem frontend
    // src/lang.js). Tránh thêm rác các locale lạ (vd "th", "de"...) mà
    // app chưa có chữ nào để hiển thị.
    public static readonly Dictionary<string, (string Label, string Flag)> Catalog = new()
    {
        ["vi"] = ("Tiếng Việt", "🇻🇳"),
        ["en"] = ("English",    "🇬🇧"),
        ["ja"] = ("日本語",      "🇯🇵"),
        ["ko"] = ("한국어",      "🇰🇷"),
        ["zh"] = ("中文",        "🇨🇳"),
        ["fr"] = ("Français",   "🇫🇷"),
    };

    // GET /api/languages — luôn trả TOÀN BỘ ngôn ngữ trong Catalog
    // Không phụ thuộc vào SupportedLanguages table nữa — dropdown luôn có đủ 6 ngôn ngữ
    [HttpGet]
    public IActionResult GetAll()
    {
        var list = Catalog.Select(kv => new {
            code  = kv.Key,
            label = kv.Value.Label,
            flag  = kv.Value.Flag,
        }).ToList();
        return Ok(list);
    }

    // POST /api/languages/detect   body: { "code": "ja" }
    // Gọi mỗi khi 1 khách quét QR mới (không phải mỗi lần đổi ngôn ngữ thủ
    // công) — idempotent: gọi lại nhiều lần với cùng code không sao.
    [HttpPost("detect")]
    public async Task<IActionResult> Detect([FromBody] DetectLanguageRequest? req)
    {
        var code = req?.Code?.Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(code) || !Catalog.ContainsKey(code))
            return Ok(new { added = false, reason = "unsupported_code" });

        var exists = await _db.SupportedLanguages.AnyAsync(x => x.Code == code);
        if (!exists)
        {
            var (label, flag) = Catalog[code];
            _db.SupportedLanguages.Add(new SupportedLanguage
            {
                Code    = code,
                Label   = label,
                Flag    = flag,
                AddedAt = DateTime.UtcNow,
            });
            await _db.SaveChangesAsync();
        }

        var list = await _db.SupportedLanguages
            .OrderBy(x => x.AddedAt)
            .Select(x => new { code = x.Code, label = x.Label, flag = x.Flag })
            .ToListAsync();

        return Ok(new { added = !exists, languages = list });
    }
}

public record DetectLanguageRequest(string? Code);