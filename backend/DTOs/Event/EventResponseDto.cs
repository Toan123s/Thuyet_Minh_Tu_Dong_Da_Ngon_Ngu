using System;

namespace backend.DTOs.Event  // 🔥 SỬA: đúng namespace
{
    public class EventResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
        public string Location { get; set; } = "";
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string LogoUrl { get; set; } = "";
        public string QRCodeUrl { get; set; } = "";
        public string? Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public int TotalBooths { get; set; }
    }
}