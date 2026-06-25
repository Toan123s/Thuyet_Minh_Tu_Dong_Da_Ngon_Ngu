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

    [HttpGet("{boothId}")]
    public async Task<IActionResult> GetByBoothId(int boothId)
    {
        var result = await _service.GetByBoothIdAsync(boothId);
        return Ok(result);
    }

    [HttpPost("{boothId}")]
    public async Task<IActionResult> Upsert(int boothId, [FromBody] NarrationRequest request)
    {
        var result = await _service.UpsertAsync(boothId, request);
        return Ok(result);
    }

    [HttpPut("{narrationId}")]
    public async Task<IActionResult> Update(int narrationId, [FromBody] NarrationRequest request)
    {
        try
        {
            var result = await _service.UpdateAsync(narrationId, request);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }
}