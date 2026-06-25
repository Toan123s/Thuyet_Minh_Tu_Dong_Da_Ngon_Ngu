using System;

namespace backend.DTOs.Narration
{
    public class NarrationResponse
    {
        public int Id { get; set; }
        public int BoothId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime UpdatedAt { get; set; }
    }
}