using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.DTOs.Booth;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Controllers;

[ApiController]
[Route("api/booth-requests")]
public class BoothRequestController : ControllerBase
{
    private readonly AppDbContext _db;
    public BoothRequestController(AppDbContext db) { _db = db; }

    // POST: api/booth-requests
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] BoothRequestDto request)
    {
        var req = new BoothRequestModel
        {
            AccountId = request.AccountId,
            BoothName = request.BoothName ?? "",
            Description = request.Description ?? "",
            CategoryId = request.CategoryId,
            EventId = request.EventId,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            Radius = request.Radius ?? 15,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow,
        };

        _db.BoothRequests.Add(req);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Gửi yêu cầu thành công!", id = req.Id });
    }

    // GET: api/booth-requests/my/{accountId}
    [HttpGet("my/{accountId}")]
    public async Task<IActionResult> GetMyRequests(int accountId)
    {
        var reqs = await _db.BoothRequests
            .Include(r => r.Category)
            .Include(r => r.Event)
            .Where(r => r.AccountId == accountId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                r.Id,
                r.BoothName,
                r.Description,
                r.Status,
                r.CreatedAt,
                r.AdminNote,
                categoryName = r.Category != null ? r.Category.Name : null,
                eventName = r.Event != null ? r.Event.Name : null,
                r.Latitude,
                r.Longitude,
                r.Radius,
            })
            .ToListAsync();
        return Ok(reqs);
    }

    // GET: api/booth-requests
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status = null)
    {
        var query = _db.BoothRequests
            .Include(r => r.Account)
                .ThenInclude(a => a.Vendor)
            .Include(r => r.Category)
            .Include(r => r.Event)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(r => r.Status == status);

        var reqs = await query
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                r.Id,
                r.BoothName,
                r.Description,
                r.Status,
                r.CreatedAt,
                r.AdminNote,
                categoryName = r.Category != null ? r.Category.Name : null,
                eventName = r.Event != null ? r.Event.Name : null,
                companyName = r.Account.Vendor != null ? r.Account.Vendor.CompanyName : null,
                accountId = r.AccountId,
                r.Latitude,
                r.Longitude,
                r.Radius,
            })
            .ToListAsync();
        return Ok(reqs);
    }

    // PATCH: api/booth-requests/{id}/approve
    [HttpPatch("{id}/approve")]
    public async Task<IActionResult> Approve(int id, [FromBody] ReviewDto dto)
    {
        var req = await _db.BoothRequests
            .Include(r => r.Account)
            .ThenInclude(a => a.Vendor)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (req == null) return NotFound();

        req.Status = "Approved";
        req.ReviewedAt = DateTime.UtcNow;
        req.AdminNote = dto.AdminNote ?? "";

        // 🔥 SỬA: Lấy VendorId từ Account.Vendor
        var vendor = req.Account.Vendor;
        if (vendor == null)
        {
            return BadRequest(new { message = "Tài khoản này chưa có thông tin Vendor!" });
        }

        // Tạo booth thật
        var booth = new Booth
        {
            EventId = req.EventId ?? 0,
            VendorId = vendor.Id,  // 🔥 SỬA: dùng vendor.Id
            CategoryId = req.CategoryId,
            BoothName = req.BoothName ?? "",
            Description = req.Description ?? "",
            Latitude = req.Latitude ?? 0,
            Longitude = req.Longitude ?? 0,
            Radius = req.Radius ?? 15,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        };

        _db.Booths.Add(booth);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Đã duyệt và tạo booth thành công!", boothId = booth.Id });
    }

    // PATCH: api/booth-requests/{id}/reject
    [HttpPatch("{id}/reject")]
    public async Task<IActionResult> Reject(int id, [FromBody] ReviewDto dto)
    {
        var req = await _db.BoothRequests.FindAsync(id);
        if (req == null) return NotFound();

        req.Status = "Rejected";
        req.ReviewedAt = DateTime.UtcNow;
        req.AdminNote = dto.AdminNote ?? "";
        await _db.SaveChangesAsync();

        return Ok(new { message = "Đã từ chối yêu cầu." });
    }
}