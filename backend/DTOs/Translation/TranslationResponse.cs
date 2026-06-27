using System;

namespace backend.DTOs.Translation
{
    public class TranslationResponse
    {
        public int      Id           { get; set; }
        public int      NarrationId  { get; set; }
        public string   LanguageCode { get; set; } = string.Empty;
        public string   Content      { get; set; } = string.Empty;  // frontend đọc field này
        public bool     IsEdited     { get; set; }
        public DateTime CreatedAt    { get; set; }
        public DateTime UpdatedAt    { get; set; }
    }

    public class TranslationUpdateRequest
    {
        public string Content  { get; set; } = string.Empty;
        public bool   IsEdited { get; set; }
    }
}