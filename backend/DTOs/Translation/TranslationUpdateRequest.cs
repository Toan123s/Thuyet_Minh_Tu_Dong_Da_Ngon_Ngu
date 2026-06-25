namespace backend.DTOs.Translation
{
    public class TranslationUpdateRequest
    {
        public string Title   { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public bool   IsEdited { get; set; }
    }
}