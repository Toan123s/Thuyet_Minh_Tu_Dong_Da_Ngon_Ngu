namespace backend.Models
{
    public class Narration
    {
        public int      Id        { get; set; }   // EF map → NarrationID (qua HasColumnName)
        public int      BoothId   { get; set; }   // EF map → BoothID
        public string   Title     { get; set; } = string.Empty;
        public string   Content   { get; set; } = string.Empty;  // nội dung gốc tiếng Việt
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Booth Booth { get; set; } = null!;
        public ICollection<Translation> Translations { get; set; } = new List<Translation>();
    }
}