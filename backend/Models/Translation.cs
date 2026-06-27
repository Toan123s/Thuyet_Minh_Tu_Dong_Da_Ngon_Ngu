namespace backend.Models
{
    public class Translation
    {
        public int      Id           { get; set; }   // EF map → TranslationID
        public int      NarrationId  { get; set; }   // EF map → NarrationID
        public string   LanguageCode { get; set; } = string.Empty;
        public string   Title        { get; set; } = string.Empty;
        public string   Content      { get; set; } = string.Empty;  // EF map → Content
        public bool     IsEdited     { get; set; } = false;         // EF map → IsEdited
        public DateTime CreatedAt    { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt    { get; set; } = DateTime.UtcNow;

        // Navigation
        public Narration Narration { get; set; } = null!;
    }
}