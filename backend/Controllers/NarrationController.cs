using Microsoft.AspNetCore.Mvc;
using backend.Services;
using backend.DTOs.Narration;

namespace backend.Controllers;

[ApiController]
[Route("api/narrations")]
public class NarrationController : ControllerBase
{
    private readonly NarrationService _service;
    public NarrationController(NarrationService service) { _service = service; }

    // GET api/narrations/{boothId}
    [HttpGet("{boothId}")]
    public async Task<IActionResult> GetByBoothId(int boothId)
    {
        try
        {
            var result = await _service.GetByBoothIdAsync(boothId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // POST api/narrations/{boothId}  — tạo mới hoặc cập nhật
    [HttpPost("{boothId}")]
    public async Task<IActionResult> Upsert(int boothId, [FromBody] NarrationRequest request)
    {
        try
        {
            var result = await _service.UpsertAsync(boothId, request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // PUT api/narrations/{narrationId}
    [HttpPut("{narrationId}")]
    public async Task<IActionResult> Update(int narrationId, [FromBody] NarrationRequest request)
    {
        try
        {
            var result = await _service.UpdateAsync(narrationId, request);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { message = ex.Message }); }
    }
}