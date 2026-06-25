using System;

namespace backend.DTOs.Translation
{
    public class TranslationUpdateResponse
    {
        public int Id { get; set; }
        public int NarrationId { get; set; }
        public string LanguageCode { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public bool IsEdited { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}