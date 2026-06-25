using System;

namespace backend.Models
{
    public class Translation
    {
        public int Id { get; set; }
        public int NarrationId { get; set; }
        public string LanguageCode { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;        // ← Đã sửa
        public string Content { get; set; } = string.Empty;      // ← Đã sửa
        public bool IsEdited { get; set; } = false;              // ← Đã sửa
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow; // ← THÊM MỚI

        public Narration Narration { get; set; } = null!;
    }
}