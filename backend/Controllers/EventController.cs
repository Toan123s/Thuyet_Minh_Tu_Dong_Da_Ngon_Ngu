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

    public EventController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    // ============================================
    // 📋 GET: api/events - LẤY DANH SÁCH
    // ============================================
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
                    "Sắp tới" => query.Where(e => e.StartDate > now),
                    "Đang mở" => query.Where(e => e.StartDate <= now && e.EndDate >= now),
                    "Đã kết thúc" => query.Where(e => e.EndDate < now),
                    _ => query
                };
            }

            var events = await query
                .Select(e => new EventResponseDto
                {
                    Id = e.Id,
                    Name = e.Name ?? "",
                    Description = e.Description ?? "",
                    Location = e.Location ?? "",
                    StartDate = e.StartDate,
                    EndDate = e.EndDate,
                    LogoUrl = e.LogoUrl ?? "",
                    QRCodeUrl = e.QRCodeUrl ?? "",
                    Status = GetEventStatus(e.StartDate, e.EndDate),
                    CreatedAt = e.CreatedAt,
                    TotalBooths = e.Booths.Count
                })
                .OrderByDescending(e => e.CreatedAt)
                .ToListAsync();

            return Ok(new { items = events, total = events.Count, page = 1, totalPages = 1 });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Lỗi server: {ex.Message}" });
        }
    }

    // ============================================
    // 📋 GET: api/events/{id} - CHI TIẾT + TỰ ĐỘNG TẠO QR
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

            // 🔥 QUAN TRỌNG: TỰ ĐỘNG TẠO QR CHO SỰ KIỆN CŨ
            if (string.IsNullOrEmpty(eventItem.QRCodeUrl))
            {
                Console.WriteLine($"🔧 Event {id} chưa có QR, đang tạo...");
                string qrUrl = await GenerateQRCodeForEvent(eventItem.Id);
                eventItem.QRCodeUrl = qrUrl;
                await _db.SaveChangesAsync();
                Console.WriteLine($"✅ Đã tạo QR cho event {id}: {qrUrl}");
                // Reload để lấy dữ liệu mới
                await _db.Entry(eventItem).ReloadAsync();
            }

            var response = new EventResponseDto
            {
                Id = eventItem.Id,
                Name = eventItem.Name ?? "",
                Description = eventItem.Description ?? "",
                Location = eventItem.Location ?? "",
                StartDate = eventItem.StartDate,
                EndDate = eventItem.EndDate,
                LogoUrl = eventItem.LogoUrl ?? "",
                QRCodeUrl = eventItem.QRCodeUrl ?? "",
                Status = GetEventStatus(eventItem.StartDate, eventItem.EndDate),
                CreatedAt = eventItem.CreatedAt,
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

            // 🔥 NẾU CHƯA CÓ QR → TỰ ĐỘNG TẠO
            if (string.IsNullOrEmpty(eventItem.QRCodeUrl))
            {
                Console.WriteLine($"🔧 Event {id} chưa có QR, đang tạo...");
                string qrUrl = await GenerateQRCodeForEvent(id);
                eventItem.QRCodeUrl = qrUrl;
                await _db.SaveChangesAsync();
                Console.WriteLine($"✅ Đã tạo QR cho event {id}");
            }

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
    private async Task<string> GenerateQRCodeForEvent(int eventId)
    {
        try
        {
            // 🔥 URL để nhúng vào QR Code
            string qrContent = $"http://localhost:5173/?event={eventId}";

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
    private string GetEventStatus(DateTime startDate, DateTime endDate)
    {
        var now = DateTime.UtcNow;
        if (now < startDate) return "Sắp tới";
        if (now >= startDate && now <= endDate) return "Đang mở";
        return "Đã kết thúc";
    }
}