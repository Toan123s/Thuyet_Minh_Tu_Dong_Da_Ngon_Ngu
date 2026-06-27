using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.DTOs.Booth;
using backend.Helpers;

namespace backend.Controllers;

[ApiController]
[Route("api/booths")]
public class BoothController : ControllerBase
{
    private readonly AppDbContext _db;
    public BoothController(AppDbContext db) { _db = db; }

    // ✅ GET: api/booths — lấy tất cả (Admin dùng cho BoothManagementPage)
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int?    eventId      = null,
        [FromQuery] int?    categoryId   = null,
        [FromQuery] string? search       = null,
        [FromQuery] int     page         = 1,
        [FromQuery] int     pageSize     = 20)
    {
        try
        {
            var query = _db.Booths
                .Include(b => b.Event)
                .Include(b => b.Category)
                .Include(b => b.Vendor)
                .AsQueryable();

            if (eventId.HasValue)
                query = query.Where(b => b.EventId == eventId.Value);

            if (categoryId.HasValue)
                query = query.Where(b => b.CategoryId == categoryId.Value);

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(b => b.BoothName != null && b.BoothName.Contains(search));

            var total = await query.CountAsync();
            var active = await query.CountAsync(b => b.IsActive);

            var items = await query
                .OrderByDescending(b => b.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(b => new
                {
                    b.Id,
                    name        = b.BoothName,
                    b.Description,
                    b.Latitude,
                    b.Longitude,
                    b.Radius,
                    b.IsActive,
                    b.EventId,
                    b.VendorId,
                    b.CategoryId,
                    b.CreatedAt,
                    eventName    = b.Event != null ? b.Event.Name : null,
                    categoryName = b.Category != null ? b.Category.Name : null,
                    vendorName   = b.Vendor != null ? b.Vendor.CompanyName : null,
                })
                .ToListAsync();

            return Ok(new { items, total, active, page, pageSize, totalPages = (int)Math.Ceiling(total / (double)pageSize) });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Lỗi server: {ex.Message}" });
        }
    }

    // GET: api/booths/event/{eventId} — visitor/vendor dùng
    [HttpGet("event/{eventId}")]
    public async Task<IActionResult> GetByEventId(int eventId)
    {
        try
        {
            var booths = await _db.Booths
                .Where(b => b.EventId == eventId && b.IsActive)
                .Include(b => b.Category)
                .Include(b => b.Vendor)
                .Select(b => new
                {
                    b.Id,
                    BoothName    = b.BoothName,
                    b.Description,
                    b.Latitude,
                    b.Longitude,
                    b.Radius,
                    b.IsActive,
                    CategoryName = b.Category != null ? b.Category.Name : null,
                    VendorName   = b.Vendor != null ? b.Vendor.CompanyName : null
                })
                .ToListAsync();

            return Ok(booths);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Lỗi server: {ex.Message}" });
        }
    }

    // GET: api/booths/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            var booth = await _db.Booths
                .Include(b => b.Category)
                .Include(b => b.Vendor)
                .Include(b => b.Narration)
                .Include(b => b.Images)
                .Include(b => b.Videos)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (booth == null)
                return NotFound(new { message = $"Không tìm thấy gian hàng ID {id}" });

            // Trả DTO thay vì raw Model để tránh circular reference
            return Ok(new
            {
                id           = booth.Id,
                boothName    = booth.BoothName,
                description  = booth.Description,
                latitude     = booth.Latitude,
                longitude    = booth.Longitude,
                radius       = booth.Radius,
                isActive     = booth.IsActive,
                categoryName = booth.Category?.Name,
                vendorName   = booth.Vendor?.CompanyName,
                narration    = booth.Narration == null ? null : new
                {
                    id        = booth.Narration.Id,
                    title     = booth.Narration.Title,
                    content   = booth.Narration.Content,
                    updatedAt = booth.Narration.UpdatedAt,
                },
                images = booth.Images.Select(img => new
                {
                    id        = img.Id,
                    filePath  = img.FilePath,
                    caption   = img.Caption,
                    sortOrder = img.SortOrder,
                }).OrderBy(i => i.sortOrder).ToList(),
                videos = booth.Videos.Select(v => new
                {
                    id       = v.Id,
                    videoUrl = v.VideoUrl,
                    title    = v.Title,
                }).ToList(),
            });
        }
        catch (Exception ex)
        {
            // Tạm thời trả về chi tiết đầy đủ (kể cả InnerException) để xác
            // định chính xác cột/bảng nào gây lỗi "Data is Null" — sau khi
            // xác định xong nên thu lại chỉ trả ex.Message cho gọn & an toàn.
            var detail = ex.InnerException?.Message ?? ex.Message;
            return StatusCode(500, new {
                message = $"Lỗi server: {ex.Message}",
                inner   = detail,
                stack   = ex.StackTrace,
            });
        }
    }

    // ✅ POST: api/booths — tạo gian hàng mới
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBoothRequest request)
    {
        try
        {
            // ⚠ 1 tài khoản chủ quầy CHỈ được gắn với 1 gian hàng duy nhất
            var alreadyHasBooth = await _db.Booths.AnyAsync(b => b.VendorId == request.VendorId);
            if (alreadyHasBooth)
                return Conflict(new { message = "Vendor này đã được gán cho 1 gian hàng khác — mỗi tài khoản chủ quầy chỉ được gán 1 gian hàng." });

            var booth = new Booth
            {
                EventId     = request.EventId,
                VendorId    = request.VendorId,
                CategoryId  = request.CategoryId,
                BoothName   = request.Name,
                Description = request.Description,
                Latitude    = request.Latitude,
                Longitude   = request.Longitude,
                Radius      = request.Radius,
                IsActive    = true,
                CreatedAt   = DateTime.UtcNow,
            };
            _db.Booths.Add(booth);
            await _db.SaveChangesAsync();
            return Ok(new { booth.Id, message = "Tạo gian hàng thành công" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Lỗi tạo gian hàng: {ex.Message}" });
        }
    }

    // ✅ PUT: api/booths/{id} — cập nhật
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateBoothRequest request)
    {
        try
        {
            var booth = await _db.Booths.FindAsync(id);
            if (booth == null)
                return NotFound(new { message = $"Không tìm thấy gian hàng ID {id}" });

            // ⚠ 1 tài khoản chủ quầy CHỈ được gắn với 1 gian hàng duy nhất
            var alreadyHasBooth = await _db.Booths.AnyAsync(b => b.VendorId == request.VendorId && b.Id != id);
            if (alreadyHasBooth)
                return Conflict(new { message = "Vendor này đã được gán cho 1 gian hàng khác — mỗi tài khoản chủ quầy chỉ được gán 1 gian hàng." });

            booth.EventId     = request.EventId;
            booth.VendorId    = request.VendorId;
            booth.CategoryId  = request.CategoryId;
            booth.BoothName   = request.Name;
            booth.Description = request.Description;
            booth.Latitude    = request.Latitude;
            booth.Longitude   = request.Longitude;
            booth.Radius      = request.Radius;

            await _db.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thành công" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Lỗi cập nhật: {ex.Message}" });
        }
    }

    // ✅ DELETE: api/booths/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var booth = await _db.Booths.FindAsync(id);
            if (booth == null)
                return NotFound(new { message = $"Không tìm thấy gian hàng ID {id}" });

            _db.Booths.Remove(booth);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Đã xóa gian hàng" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Lỗi xóa: {ex.Message}" });
        }
    }

    // POST: api/booths/nearest
    [HttpPost("nearest")]
    public async Task<IActionResult> FindNearest([FromBody] NearestBoothRequest request)
    {
        try
        {
            var booths = await _db.Booths
                .Where(b => b.EventId == request.EventId && b.IsActive)
                .ToListAsync();

            if (!booths.Any())
                return NotFound(new { message = "Không có booth nào trong sự kiện này!" });

            var nearest = booths
                .Select(b => new
                {
                    Booth    = b,
                    Distance = HaversineHelper.CalculateDistance(
                        (double)request.Latitude, (double)request.Longitude,
                        (double)b.Latitude,       (double)b.Longitude)
                })
                .OrderBy(x => x.Distance)
                .First();

            bool isWithin = nearest.Distance <= (double)nearest.Booth.Radius;

            return Ok(new NearestBoothResponse
            {
                BoothId          = nearest.Booth.Id,
                BoothName        = nearest.Booth.BoothName ?? "",
                Distance         = (decimal)nearest.Distance,
                IsWithinGeofence = isWithin,
                GeofenceRadius   = nearest.Booth.Radius
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Lỗi server: {ex.Message}" });
        }
    }
}

// DTO tạo/sửa booth
public class CreateBoothRequest
{
    public int      EventId     { get; set; }
    public int      VendorId    { get; set; }   // int, không nullable
    public int?     CategoryId  { get; set; }   // nullable OK (Booth.CategoryId là int?)
    public string   Name        { get; set; } = string.Empty;
    public string?  Description { get; set; }
    public decimal  Latitude    { get; set; }
    public decimal  Longitude   { get; set; }
    public decimal  Radius      { get; set; } = 15;
}