using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/admin/accounts")] 
public class AccountController : ControllerBase
{
    private readonly AccountService _service;

    public AccountController(AccountService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int     page     = 1,
        [FromQuery] int     pageSize = 10,
        [FromQuery] string? role     = null,
        [FromQuery] string? status   = null,
        [FromQuery] string? search   = null)
    {
        var result = await _service.GetAllAsync(page, pageSize, role, search);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        try { return Ok(await _service.GetByIdAsync(id)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAccountRequest request)
    {
        try
        {
            var result = await _service.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateAccountRequest request)
    {
        try { return Ok(await _service.UpdateAsync(id, request)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try { await _service.DeleteAsync(id); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> SetStatus(int id, [FromQuery] bool isActive)
    {
        try
        {
            await _service.SetStatusAsync(id, isActive);
            return Ok(new { message = isActive ? "Đã mở khóa tài khoản." : "Đã khóa tài khoản." });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    // ✅ FIX: Đổi từ [HttpPost] → [HttpPatch] để khớp với frontend gọi PATCH
    [HttpPatch("{id}/reset-password")]
    public async Task<IActionResult> ResetPassword(int id)
    {
        try
        {
            var request = new ResetPasswordRequest { NewPassword = Guid.NewGuid().ToString("N")[..10] + "A1!" };
            await _service.ResetPasswordAsync(id, request);
            return Ok(new { message = "Đặt lại mật khẩu thành công." });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }
}
