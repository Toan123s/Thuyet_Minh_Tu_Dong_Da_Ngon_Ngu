// TranslationController.cs — paste đè toàn bộ (thêm using DTOs)
using Microsoft.AspNetCore.Mvc;
using backend.Services;
using backend.DTOs.Translation;

namespace backend.Controllers;

[ApiController]
[Route("api/translations")]
public class TranslationController : ControllerBase
{
    private readonly TranslationService _service;
    public TranslationController(TranslationService service) { _service = service; }

    [HttpGet("{narrationId}")]
    public async Task<IActionResult> GetOne(int narrationId, [FromQuery] string lang)
    {
        try
        {
            var result = await _service.GetOneAsync(narrationId, lang);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPut("{translationId}")]
    public async Task<IActionResult> UpdateManual(int translationId, [FromBody] TranslationUpdateRequest request)
    {
        try
        {
            var result = await _service.UpdateManualAsync(translationId, request);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost("generate")]
    public async Task<IActionResult> GenerateOne([FromBody] GenerateRequest request)
    {
        var result = await _service.GenerateOneAsync(request.NarrationId, request.LanguageCode);
        return Ok(result);
    }

    [HttpPost("generate-all")]
    public async Task<IActionResult> GenerateAll([FromBody] GenerateAllRequest request)
    {
        var result = await _service.GenerateAllAsync(request.NarrationId, request.Languages);
        return Ok(result);
    }
}

public class GenerateRequest
{
    public int    NarrationId  { get; set; }
    public string LanguageCode { get; set; } = string.Empty;
}

public class GenerateAllRequest
{
    public int          NarrationId { get; set; }
    public List<string> Languages   { get; set; } = new() { "en", "ja", "ko", "zh" };
}