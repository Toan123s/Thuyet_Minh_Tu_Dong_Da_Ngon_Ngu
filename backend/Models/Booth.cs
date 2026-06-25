using System;
using System.Collections.Generic;

namespace backend.Models
{
    public class Booth
    {
        public int Id { get; set; }
        public int EventId { get; set; }
        public int VendorId { get; set; }
       public int? CategoryId { get; set; }
        public string BoothName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public decimal Radius { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        
        public Event Event { get; set; } = null!;
        public Vendor Vendor { get; set; } = null!;
        public Category Category { get; set; } = null!;
        public Narration Narration { get; set; } = null!;
        public ICollection<Image> Images { get; set; } = new List<Image>();
        public ICollection<Video> Videos { get; set; } = new List<Video>();
        public ICollection<VisitLog> VisitLogs { get; set; } = new List<VisitLog>();
    }
}