using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;
using backend.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/register")]
public class RegisterController : ControllerBase
{
    private readonly AccountService _accountService;
    private readonly AppDbContext   _db;

    public RegisterController(AccountService accountService, AppDbContext db)
    {
        _accountService = accountService;
        _db             = db;
    }

    /// <summary>POST /api/register — Tạo tài khoản Vendor mới</summary>
    [HttpPost]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var createRequest = new CreateAccountRequest
            {
                Username           = request.Username,
                Password           = request.Password,
                Email              = request.Email,
                Role               = "Vendor",
                CompanyName        = request.CompanyName,
                RepresentativeName = request.RepresentativeName,
                PhoneNumber        = request.PhoneNumber,
            };

            var result = await _accountService.CreateAsync(createRequest);
            return Ok(new { message = "Đăng ký thành công!", accountId = result.Id });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Có lỗi xảy ra, vui lòng thử lại." });
        }
    }

    /// <summary>POST /api/register/pay — Xác nhận thanh toán phí vendor</summary>
    [HttpPost("pay")]
    public async Task<IActionResult> ConfirmPayment([FromBody] VendorPayRequest request)
    {
        var vendor = await _db.Vendors
            .FirstOrDefaultAsync(v => v.AccountId == request.AccountId);

        if (vendor == null)
            return NotFound(new { message = "Không tìm thấy thông tin vendor." });

        vendor.IsPaid  = true;
        vendor.PaidAt  = DateTime.UtcNow;
        vendor.EventId = request.EventId;

        await _db.SaveChangesAsync();

        return Ok(new { message = "Thanh toán thành công! Tài khoản đã được kích hoạt." });
    }

    /// <summary>GET /api/register/status/:accountId — Kiểm tra trạng thái thanh toán</summary>
    [HttpGet("status/{accountId}")]
    public async Task<IActionResult> GetPaymentStatus(int accountId)
    {
        var vendor = await _db.Vendors
            .FirstOrDefaultAsync(v => v.AccountId == accountId);

        if (vendor == null)
            return NotFound(new { message = "Không tìm thấy vendor." });

        return Ok(new
        {
            isPaid  = vendor.IsPaid,
            paidAt  = vendor.PaidAt,
            eventId = vendor.EventId,
        });
    }
}

public class RegisterRequest
{
    public string Username           { get; set; } = string.Empty;
    public string Password           { get; set; } = string.Empty;
    public string Email              { get; set; } = string.Empty;
    public string CompanyName        { get; set; } = string.Empty;
    public string RepresentativeName { get; set; } = string.Empty;
    public string PhoneNumber        { get; set; } = string.Empty;
}

public class VendorPayRequest
{
    public int  AccountId { get; set; }
    public int? EventId   { get; set; }
}