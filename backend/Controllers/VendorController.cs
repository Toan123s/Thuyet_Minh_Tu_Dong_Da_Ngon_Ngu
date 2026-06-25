// VendorController.cs
using Microsoft.AspNetCore.Mvc;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/vendor")]
public class VendorController : ControllerBase
{
    private readonly VendorService _service;

    public VendorController(VendorService service)
    {
        _service = service;
    }

    private int GetAccountId()
    {
        var claim = User.Claims.FirstOrDefault(c => c.Type == "accountId")
            ?? User.Claims.FirstOrDefault(c => c.Type == "sub");

        if (claim == null || !int.TryParse(claim.Value, out var id))
            throw new UnauthorizedAccessException("Không xác định được tài khoản.");

        return id;
    }

    // GET /api/vendor/me
    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        try
        {
            return Ok(await _service.GetMeAsync(GetAccountId()));
        }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { message = ex.Message }); }
        catch (KeyNotFoundException ex)        { return NotFound(new { message = ex.Message }); }
    }

    // GET /api/vendor/booths
    [HttpGet("booths")]
    public async Task<IActionResult> GetMyBooths()
    {
        try
        {
            return Ok(await _service.GetMyBoothsAsync(GetAccountId()));
        }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { message = ex.Message }); }
        catch (KeyNotFoundException ex)        { return NotFound(new { message = ex.Message }); }
    }

    // GET /api/vendor/stats/today
    [HttpGet("stats/today")]
    public async Task<IActionResult> GetStatsToday()
    {
        try
        {
            return Ok(await _service.GetStatsTodayAsync(GetAccountId()));
        }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { message = ex.Message }); }
        catch (KeyNotFoundException ex)        { return NotFound(new { message = ex.Message }); }
    }

    // GET /api/vendor/stats/:boothId?range=7days
    [HttpGet("stats/{boothId}")]
    public async Task<IActionResult> GetBoothStats(int boothId, [FromQuery] string range = "7days")
    {
        try
        {
            return Ok(await _service.GetBoothStatsAsync(boothId, range));
        }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }
}