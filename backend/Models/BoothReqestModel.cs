using System;

namespace backend.Models
{
    public class BoothRequestModel
    {
        public int Id { get; set; }
        public int AccountId { get; set; }
        public int CategoryId { get; set; }
        public int? EventId { get; set; }
        public string BoothName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public decimal? Radius { get; set; }
        public string Status { get; set; } = string.Empty;
        public string AdminNote { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }
        
        public Account Account { get; set; } = null!;
        public Category Category { get; set; } = null!;
        public Event Event { get; set; } = null!;
    }
}