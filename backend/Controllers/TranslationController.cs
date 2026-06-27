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

    // GET api/translations/{narrationId}?lang=en
    // Nếu chưa có bản dịch → tự động dịch và lưu luôn (không trả 404 nữa)
    [HttpGet("{narrationId}")]
    public async Task<IActionResult> GetOne(int narrationId, [FromQuery] string lang)
    {
        try
        {
            var result = await _service.GetOneAsync(narrationId, lang);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // PUT api/translations/{translationId}
    [HttpPut("{translationId}")]
    public async Task<IActionResult> UpdateManual(int translationId, [FromBody] TranslationUpdateRequest request)
    {
        try
        {
            var result = await _service.UpdateManualAsync(translationId, request);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { message = ex.Message }); }
    }

    // POST api/translations/generate
    [HttpPost("generate")]
    public async Task<IActionResult> GenerateOne([FromBody] GenerateRequest request)
    {
        try
        {
            var result = await _service.GenerateOneAsync(request.NarrationId, request.LanguageCode);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { message = ex.Message }); }
    }

    // POST api/translations/generate-all
    [HttpPost("generate-all")]
    public async Task<IActionResult> GenerateAll([FromBody] GenerateAllRequest request)
    {
        try
        {
            var result = await _service.GenerateAllAsync(request.NarrationId, request.Languages);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { message = ex.Message }); }
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