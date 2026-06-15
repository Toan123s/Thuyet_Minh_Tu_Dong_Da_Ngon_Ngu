// MediaController.cs
using Microsoft.AspNetCore.Mvc;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api")]
public class MediaController : ControllerBase
{
    private readonly MediaService _service;
    public MediaController(MediaService service) { _service = service; }

    // ── Images ────────────────────────────────────────────────

    // GET /api/booths/:boothId/images
    [HttpGet("booths/{boothId}/images")]
    public async Task<IActionResult> GetImages(int boothId)
    {
        var result = await _service.GetImagesAsync(boothId);
        return Ok(result);
    }

    // POST /api/images
    [HttpPost("images")]
    public async Task<IActionResult> AddImage([FromBody] AddImageRequest request)
    {
        try
        {
            var result = await _service.AddImageAsync(request.BoothId, request.ImageUrl, request.Caption);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    // PUT /api/images/:id
    [HttpPut("images/{id}")]
    public async Task<IActionResult> UpdateCaption(int id, [FromBody] UpdateCaptionRequest request)
    {
        try
        {
            var result = await _service.UpdateImageCaptionAsync(id, request.Caption);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    // DELETE /api/images/:id
    [HttpDelete("images/{id}")]
    public async Task<IActionResult> DeleteImage(int id)
    {
        try
        {
            await _service.DeleteImageAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    // ── Videos ────────────────────────────────────────────────

    // GET /api/booths/:boothId/videos
    [HttpGet("booths/{boothId}/videos")]
    public async Task<IActionResult> GetVideos(int boothId)
    {
        var result = await _service.GetVideosAsync(boothId);
        return Ok(result);
    }

    // POST /api/videos
    [HttpPost("videos")]
    public async Task<IActionResult> AddVideo([FromBody] AddVideoRequest request)
    {
        try
        {
            var result = await _service.AddVideoAsync(request.BoothId, request.VideoUrl, request.Title);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    // DELETE /api/videos/:id
    [HttpDelete("videos/{id}")]
    public async Task<IActionResult> DeleteVideo(int id)
    {
        try
        {
            await _service.DeleteVideoAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }
}

public class AddImageRequest
{
    public int     BoothId  { get; set; }
    public string  ImageUrl { get; set; } = string.Empty;
    public string? Caption  { get; set; }
}

public class UpdateCaptionRequest
{
    public string? Caption { get; set; }
}

public class AddVideoRequest
{
    public int     BoothId  { get; set; }
    public string  VideoUrl { get; set; } = string.Empty;
    public string? Title    { get; set; }
}