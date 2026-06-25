using System;

namespace backend.DTOs.Event  // 🔥 SỬA: đúng namespace
{
    public class EventRequestDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? Location { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? LogoUrl { get; set; }
    }
}