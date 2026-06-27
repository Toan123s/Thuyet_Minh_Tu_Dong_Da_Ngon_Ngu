using System;
using System.Collections.Generic;

namespace backend.Models
{
    public class Event
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string Location { get; set; } = string.Empty;

        public DateTime? StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        public string LogoUrl { get; set; } = string.Empty;

        public string? QRCodeUrl { get; set; }

        public DateTime? CreatedAt { get; set; }

        public ICollection<Booth> Booths { get; set; }
            = new List<Booth>();
    }
}