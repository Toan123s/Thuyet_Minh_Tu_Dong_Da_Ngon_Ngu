using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Models;
using backend.Repositories;

namespace backend.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoryController : ControllerBase
{
    private readonly ICategoryRepository _repo;

    public CategoryController(ICategoryRepository repo)
    {
        _repo = repo;
    }

    // GET: api/categories — công khai, dùng cho dropdown Admin + filter trên Map
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var categories = await _repo.GetAll();
        return Ok(categories);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var category = await _repo.GetById(id);
        if (category == null) return NotFound(new { message = $"Không tìm thấy danh mục ID {id}" });
        return Ok(category);
    }

    // ── Các thao tác ghi chỉ Admin được dùng ──────────────────
    public class CategoryRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CategoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Tên danh mục không được để trống" });

        var category = new Category { Name = request.Name.Trim(), Description = request.Description };
        var created = await _repo.Create(category);
        return Ok(created);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] CategoryRequest request)
    {
        var category = await _repo.GetById(id);
        if (category == null) return NotFound(new { message = $"Không tìm thấy danh mục ID {id}" });

        category.Name = request.Name.Trim();
        category.Description = request.Description;
        var updated = await _repo.Update(category);
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _repo.Delete(id);
        if (!deleted) return NotFound(new { message = $"Không tìm thấy danh mục ID {id}" });
        return NoContent();
    }
}