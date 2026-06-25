// MediaController.cs
using Microsoft.AspNetCore.Mvc;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api")]
public class MediaController : ControllerBase
{
    private readonly MediaService _service;
    private readonly IWebHostEnvironment _env;

    public MediaController(MediaService service, IWebHostEnvironment env)
    {
        _service = service;
        _env     = env;
    }

    // ── Images ────────────────────────────────────────────────

    // GET /api/booths/:boothId/images
    [HttpGet("booths/{boothId}/images")]
    public async Task<IActionResult> GetImages(int boothId)
    {
        var result = await _service.GetImagesAsync(boothId);
        return Ok(result);
    }

    // ✅ FIX: POST /api/images/upload — nhận file thật (multipart/form-data)
    // Frontend upload ảnh bằng FormData { file, boothId, caption }
    [HttpPost("images/upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadImage(
        [FromForm] IFormFile   file,
        [FromForm] int         boothId,
        [FromForm] string?     caption = null)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Không có file được gửi lên." });

        if (file.Length > 5 * 1024 * 1024)
            return BadRequest(new { message = "File quá lớn (giới hạn 5MB)." });

        var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
        if (!allowedTypes.Contains(file.ContentType.ToLower()))
            return BadRequest(new { message = "Chỉ chấp nhận file ảnh (jpg, png, gif, webp)." });

        try
        {
            // Lưu file vào wwwroot/images/
            var imagesDir = Path.Combine(_env.WebRootPath, "images");
            if (!Directory.Exists(imagesDir))
                Directory.CreateDirectory(imagesDir);

            var ext      = Path.GetExtension(file.FileName).ToLower();
            var fileName = $"{Guid.NewGuid():N}{ext}";
            var filePath = Path.Combine(imagesDir, fileName);

            using (var stream = System.IO.File.Create(filePath))
                await file.CopyToAsync(stream);

            // URL để frontend hiển thị
            var imageUrl = $"/images/{fileName}";

            var result = await _service.AddImageAsync(boothId, imageUrl, caption);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Lỗi lưu file: {ex.Message}" });
        }
    }

    // POST /api/images — nhận JSON {boothId, imageUrl, caption} (giữ lại để tương thích)
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
