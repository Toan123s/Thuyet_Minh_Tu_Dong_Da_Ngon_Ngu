using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.DTOs.Event;
using QRCoder;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Controllers;

[ApiController]
[Route("api/events")]
public class EventController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly IConfiguration _config;

    public EventController(AppDbContext db, IWebHostEnvironment env, IConfiguration config)
    {
        _db = db;
        _env = env;
        _config = config;
    }

    // ============================================
    // 📋 GET: api/events - LẤY DANH SÁCH
    // ============================================
    // GET /api/events/active-today — sự kiện đang diễn ra hôm nay (giờ VN)
    [HttpGet("active-today")]
    [AllowAnonymous]
    public async Task<IActionResult> GetActiveToday()
    {
        try
        {
            var vnNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow,
                TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time"));
            var today = vnNow.Date;

            var events = await _db.Events
                .Where(e => e.StartDate.HasValue && e.EndDate.HasValue
                    && e.StartDate.Value.Date <= today
                    && e.EndDate.Value.Date   >= today)
                .OrderByDescending(e => e.StartDate)
                .Select(e => new {
                    id          = e.Id,
                    name        = e.Name        ?? "",
                    description = e.Description ?? "",
                    location    = e.Location    ?? "",
                    startDate   = e.StartDate,
                    endDate     = e.EndDate,
                    qrCodeUrl   = e.QRCodeUrl,
                    totalBooths = e.Booths != null ? e.Booths.Count : 0,
                })
                .ToListAsync();

            return Ok(events);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Lỗi server: {ex.Message}" });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status = null)
    {
        try
        {
            var query = _db.Events.AsQueryable();
            var now = DateTime.UtcNow;

            if (!string.IsNullOrEmpty(status))
            {
                query = status switch
                {
                    "Sắp tới" => query.Where(e => e.StartDate != null && e.StartDate > now),
                    "Đang mở" => query.Where(e => e.StartDate != null && e.EndDate != null && e.StartDate <= now && e.EndDate >= now),
                    "Đã kết thúc" => query.Where(e => e.EndDate != null && e.EndDate < now),
                    _ => query
                };
            }

            // Không dùng Include + Select cùng lúc vì EF Core bỏ qua Include
            // → dùng subquery Count trực tiếp trong Select
            var events = await query
                .OrderByDescending(e => e.CreatedAt)
                .Select(e => new EventResponseDto
                {
                    Id          = e.Id,
                    Name        = e.Name        ?? "",
                    Description = e.Description ?? "",
                    Location    = e.Location    ?? "",
                    StartDate   = e.StartDate   ?? DateTime.MinValue,
                    EndDate     = e.EndDate     ?? DateTime.MinValue,
                    LogoUrl     = e.LogoUrl     ?? "",
                    QRCodeUrl   = e.QRCodeUrl   ?? "",
                    Status      = GetEventStatus(e.StartDate, e.EndDate),
                    CreatedAt   = e.CreatedAt   ?? DateTime.MinValue,
                    TotalBooths = e.Booths != null ? e.Booths.Count : 0,
                })
                .ToListAsync();

            return Ok(new { items = events, total = events.Count, page = 1, totalPages = 1 });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Lỗi server: {ex.Message}" });
        }
    }

    // ============================================
    // 📋 GET: api/events/{id} - CHI TIẾT
    // ============================================
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            var eventItem = await _db.Events
                .Include(e => e.Booths)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (eventItem == null)
            {
                return NotFound(new { message = $"Không tìm thấy sự kiện với ID {id}" });
            }

            var response = new EventResponseDto
            {
                Id = eventItem.Id,
                Name = eventItem.Name ?? "",
                Description = eventItem.Description ?? "",
                Location = eventItem.Location ?? "",
                StartDate = eventItem.StartDate ?? DateTime.MinValue,
                EndDate = eventItem.EndDate ?? DateTime.MinValue,
                LogoUrl = eventItem.LogoUrl ?? "",
                QRCodeUrl = eventItem.QRCodeUrl ?? "",
                Status = GetEventStatus(eventItem.StartDate, eventItem.EndDate),
                CreatedAt = eventItem.CreatedAt ?? DateTime.MinValue,
                TotalBooths = eventItem.Booths?.Count ?? 0
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Lỗi server: {ex.Message}" });
        }
    }

    // ============================================
    // ➕ POST: api/events - TẠO SỰ KIỆN MỚI + QR
    // ============================================
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] EventRequestDto request)
    {
        try
        {
            var eventItem = new Event
            {
                Name = request.Name ?? "",
                Description = request.Description ?? "",
                Location = request.Location ?? "",
                StartDate = request.StartDate.ToUniversalTime(),
                EndDate = request.EndDate.ToUniversalTime(),
                LogoUrl = request.LogoUrl ?? "",
                CreatedAt = DateTime.UtcNow
            };

            _db.Events.Add(eventItem);
            await _db.SaveChangesAsync();

            // 🔥 TỰ ĐỘNG TẠO QR NGAY KHI TẠO
            string qrUrl = await GenerateQRCodeForEvent(eventItem.Id);
            eventItem.QRCodeUrl = qrUrl;
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = eventItem.Id }, eventItem);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Lỗi tạo sự kiện: {ex.Message}" });
        }
    }

    // ============================================
    // ✏️ PUT: api/events/{id} - CẬP NHẬT
    // ============================================
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] EventRequestDto request)
    {
        try
        {
            var eventItem = await _db.Events.FindAsync(id);
            if (eventItem == null)
                return NotFound(new { message = $"Không tìm thấy sự kiện với ID {id}" });

            eventItem.Name = request.Name ?? "";
            eventItem.Description = request.Description ?? "";
            eventItem.Location = request.Location ?? "";
            eventItem.StartDate = request.StartDate.ToUniversalTime();
            eventItem.EndDate = request.EndDate.ToUniversalTime();
            eventItem.LogoUrl = request.LogoUrl ?? "";

            await _db.SaveChangesAsync();

            // 🔥 NẾU CHƯA CÓ QR → TẠO MỚI
            if (string.IsNullOrEmpty(eventItem.QRCodeUrl))
            {
                string qrUrl = await GenerateQRCodeForEvent(id);
                eventItem.QRCodeUrl = qrUrl;
                await _db.SaveChangesAsync();
            }

            return Ok(eventItem);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Lỗi cập nhật: {ex.Message}" });
        }
    }

    // ============================================
    // 🗑️ DELETE: api/events/{id} - XÓA (XÓA CẢ FILE QR)
    // ============================================
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var eventItem = await _db.Events
                .Include(e => e.Booths)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (eventItem == null)
                return NotFound(new { message = $"Không tìm thấy sự kiện với ID {id}" });

            if (eventItem.Booths.Any(b => b.IsActive))
            {
                return BadRequest(new { message = "Không thể xóa sự kiện vì có booth đang hoạt động!" });
            }

            // 🔥 XÓA FILE QR NẾU CÓ
            if (!string.IsNullOrEmpty(eventItem.QRCodeUrl))
            {
                string filePath = Path.Combine(_env.WebRootPath, eventItem.QRCodeUrl.TrimStart('/'));
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                    Console.WriteLine($"🗑️ Đã xóa file QR: {filePath}");
                }
            }

            _db.Events.Remove(eventItem);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Xóa sự kiện thành công!" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Lỗi xóa: {ex.Message}" });
        }
    }

    // ============================================
    // 📱 POST: api/events/{id}/generate-qr - TẠO QR THỦ CÔNG
    // ============================================
    [HttpPost("{id}/generate-qr")]
    public async Task<IActionResult> GenerateQR(int id)
    {
        try
        {
            var eventItem = await _db.Events.FindAsync(id);
            if (eventItem == null)
                return NotFound(new { message = $"Không tìm thấy sự kiện với ID {id}" });

            // Xóa QR cũ nếu có
            if (!string.IsNullOrEmpty(eventItem.QRCodeUrl))
            {
                string oldFilePath = Path.Combine(_env.WebRootPath, eventItem.QRCodeUrl.TrimStart('/'));
                if (System.IO.File.Exists(oldFilePath))
                {
                    System.IO.File.Delete(oldFilePath);
                }
            }

            // Tạo QR mới
            string qrUrl = await GenerateQRCodeForEvent(id);
            eventItem.QRCodeUrl = qrUrl;
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Tạo QR Code thành công!",
                qrCodeUrl = qrUrl,
                fullUrl = $"{Request.Scheme}://{Request.Host}{qrUrl}"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Lỗi tạo QR: {ex.Message}" });
        }
    }

    // ============================================
    // ⬇️ GET: api/events/{id}/qrcode - TẢI QR VỀ
    // ============================================
    [HttpGet("{id}/qrcode")]
    public async Task<IActionResult> GetQRCode(int id)
    {
        try
        {
            var eventItem = await _db.Events.FindAsync(id);
            if (eventItem == null)
                return NotFound(new { message = $"Không tìm thấy sự kiện với ID {id}" });

            string filePath = Path.Combine(_env.WebRootPath, eventItem.QRCodeUrl.TrimStart('/'));
            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new { message = "File QR Code không tồn tại!" });
            }

            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
            return File(fileBytes, "image/png", $"qrcode_event_{id}.png");
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Lỗi lấy QR: {ex.Message}" });
        }
    }

    // ============================================
    // 🔧 HÀM TẠO QR CODE
    // ============================================

    // 📱 POST: api/events/generate-global-qr
    // Tạo 1 QR DUY NHẤT không gắn với sự kiện nào.
    // Khách quét → vào /map → hiện TẤT CẢ booths active trong DB.
    // Dùng khi không có sự kiện nào đang mở, hoặc muốn 1 QR đặt cố định tại địa điểm.
    [HttpPost("generate-global-qr")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GenerateGlobalQR()
    {
        try
        {
            // Xác định frontend base URL (cùng logic với GenerateQRCodeForEvent)
            string frontendBase;
            var configuredUrl = _config["PublicFrontendUrl"];
            if (!string.IsNullOrWhiteSpace(configuredUrl)
                && Uri.TryCreate(configuredUrl, UriKind.Absolute, out var configuredUri))
            {
                frontendBase = configuredUri.GetLeftPart(UriPartial.Authority);
            }
            else
            {
                var referer = Request.Headers["Referer"].ToString();
                frontendBase = (!string.IsNullOrWhiteSpace(referer)
                                 && referer != "null"
                                 && Uri.TryCreate(referer, UriKind.Absolute, out var refererUri))
                    ? refererUri.GetLeftPart(UriPartial.Authority)
                    : "http://localhost:5173";
            }

            // URL không có ?event= → MapPage sẽ gọi /api/booths/all-active
            string qrContent = $"{frontendBase}/map";

            string fileName  = $"global_qr_{Guid.NewGuid().ToString().Substring(0, 8)}.png";
            string directory = Path.Combine(_env.WebRootPath, "qrcodes");
            if (!Directory.Exists(directory)) Directory.CreateDirectory(directory);
            string filePath  = Path.Combine(directory, fileName);

            using (var qrGenerator = new QRCodeGenerator())
            {
                var qrCodeData = qrGenerator.CreateQrCode(qrContent, QRCodeGenerator.ECCLevel.Q);
                var qrCode     = new PngByteQRCode(qrCodeData);
                byte[] bytes   = qrCode.GetGraphic(20);
                await System.IO.File.WriteAllBytesAsync(filePath, bytes);
            }

            string qrUrl = $"/qrcodes/{fileName}";
            Console.WriteLine($"✅ Đã tạo QR chung: {filePath} → {qrContent}");

            return Ok(new {
                qrCodeUrl = qrUrl,
                fullUrl   = $"{Request.Scheme}://{Request.Host}{qrUrl}",
                targetUrl = qrContent,
                note      = "QR này trỏ vào /map và hiện toàn bộ booths active, không gắn với sự kiện nào."
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Lỗi server: {ex.Message}" });
        }
    }

    private async Task<string> GenerateQRCodeForEvent(int eventId)
    {
        try
        {
            // 🔥 URL để nhúng vào QR Code — ưu tiên theo thứ tự:
            // 1) Config "PublicFrontendUrl" trong appsettings.json (admin set 1 lần,
            //    đáng tin cậy nhất — vd "http://192.168.1.50:5173" lúc test LAN,
            //    hoặc domain thật lúc deploy production).
            // 2) Header Referer — CHỈ dùng nếu nó là 1 URL tuyệt đối hợp lệ.
            //    ⚠ Một số trình duyệt gửi Referer là chữ "null" (literal) cho
            //    request AJAX cross-origin → nếu không kiểm tra, QR sẽ bị nhúng
            //    nguyên chữ "null" làm khách quét không vào được trang nào cả.
            // 3) Fallback cuối cùng: localhost (chỉ dùng được khi test trên
            //    chính máy chạy server, không quét được từ điện thoại khác).
            string frontendBase;
            var configuredUrl = _config["PublicFrontendUrl"];
            if (!string.IsNullOrWhiteSpace(configuredUrl)
                && Uri.TryCreate(configuredUrl, UriKind.Absolute, out var configuredUri))
            {
                frontendBase = configuredUri.GetLeftPart(UriPartial.Authority);
            }
            else
            {
                var referer = Request.Headers["Referer"].ToString();
                frontendBase = (!string.IsNullOrWhiteSpace(referer)
                                 && referer != "null"
                                 && Uri.TryCreate(referer, UriKind.Absolute, out var refererUri))
                    ? refererUri.GetLeftPart(UriPartial.Authority)
                    : "http://localhost:5173";
            }
            string qrContent = $"{frontendBase}/?event={eventId}";

            // 🔥 Tên file
            string fileName = $"event_{eventId}_{Guid.NewGuid().ToString().Substring(0, 8)}.png";

            // 🔥 Đường dẫn thư mục
            string directory = Path.Combine(_env.WebRootPath, "qrcodes");
            if (!Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
                Console.WriteLine($"📁 Đã tạo thư mục: {directory}");
            }

            string filePath = Path.Combine(directory, fileName);

            // 🔥 TẠO QR CODE THẬT BẰNG QRCoder
            using (var qrGenerator = new QRCodeGenerator())
            {
                var qrCodeData = qrGenerator.CreateQrCode(qrContent, QRCodeGenerator.ECCLevel.Q);
                var qrCode = new PngByteQRCode(qrCodeData);
                byte[] qrCodeBytes = qrCode.GetGraphic(20);
                await System.IO.File.WriteAllBytesAsync(filePath, qrCodeBytes);
            }

            Console.WriteLine($"✅ Đã tạo QR Code: {filePath}");
            return $"/qrcodes/{fileName}";
        }
        catch (Exception ex)
        {
            throw new Exception($"Lỗi tạo QR Code: {ex.Message}");
        }
    }

    // ============================================
    // 📊 HÀM TÍNH TRẠNG THÁI
    // ============================================
    // Đổi thành static: hàm này không đụng tới bất kỳ field/instance
    // nào của Controller, nên không cần "this". Quan trọng hơn: khi
    // dùng trong .Select() của LINQ-to-Entities, EF Core sẽ KHÔNG
    // cảnh báo "client projection contains a reference to a constant
    // expression... through the instance method" (cảnh báo này từng
    // xuất hiện vì EF Core phải giữ tham chiếu tới CHÍNH INSTANCE
    // Controller để gọi được instance method, có nguy cơ leak nếu
    // Controller bị giữ sống lâu hơn cần thiết).
    private static string GetEventStatus(DateTime? startDate, DateTime? endDate)
    {
        if (startDate == null || endDate == null) return "Chưa xác định";
        var now = DateTime.UtcNow;
        if (now < startDate) return "Sắp tới";
        if (now >= startDate && now <= endDate) return "Đang mở";
        return "Đã kết thúc";
    }
}