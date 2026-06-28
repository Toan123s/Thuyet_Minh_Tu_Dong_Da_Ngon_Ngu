using System.Net.Http;
using System.Text.Json;
using System.Web;
using backend.Models;
using backend.Repositories;

namespace backend.Services
{
    public class CategoryTranslationService
    {
        private readonly ICategoryTranslationRepository _repo;
        private readonly IHttpClientFactory _httpFactory;

        public CategoryTranslationService(ICategoryTranslationRepository repo, IHttpClientFactory httpFactory)
        {
            _repo = repo;
            _httpFactory = httpFactory;
        }

        // ── Google Translate miễn phí, không cần key (giống TranslationService) ──
        private async Task<string> GoogleTranslateAsync(string text, string targetLang)
        {
            if (string.IsNullOrWhiteSpace(text)) return text;
            try
            {
                var encoded  = HttpUtility.UrlEncode(text);
                var url      = $"https://translate.googleapis.com/translate_a/single" +
                               $"?client=gtx&sl=vi&tl={targetLang}&dt=t&q={encoded}";
                var http     = _httpFactory.CreateClient();
                var response = await http.GetStringAsync(url);

                var json   = JsonDocument.Parse(response);
                var parts  = json.RootElement[0];
                var result = "";
                foreach (var part in parts.EnumerateArray())
                {
                    var chunk = part[0].GetString();
                    if (!string.IsNullOrEmpty(chunk)) result += chunk;
                }
                return string.IsNullOrWhiteSpace(result) ? text : result;
            }
            catch
            {
                return text; // lỗi mạng/API -> trả nguyên văn, không crash
            }
        }

        // Tên gốc trong DB luôn là tiếng Việt (vd "Di tích - Lịch sử").
        // lang == "vi" -> trả nguyên văn, không tốn lượt dịch.
        // Ngôn ngữ khác -> lấy cache DB, chưa có thì dịch rồi lưu lại
        // (lần sau ai chọn lại ngôn ngữ đó sẽ lấy thẳng từ DB, không dịch lại).
        public async Task<string> GetTranslatedNameAsync(int categoryId, string originalName, string languageCode)
        {
            var lang = string.IsNullOrWhiteSpace(languageCode) ? "vi" : languageCode.ToLowerInvariant();
            if (lang == "vi" || string.IsNullOrWhiteSpace(originalName)) return originalName;

            var cached = await _repo.GetByCategoryIdAndLang(categoryId, lang);
            if (cached != null) return cached.Name;

            var translated = await GoogleTranslateAsync(originalName, lang);

            await _repo.Create(new CategoryTranslation
            {
                CategoryId   = categoryId,
                LanguageCode = lang,
                Name         = translated,
                CreatedAt    = DateTime.UtcNow,
                UpdatedAt    = DateTime.UtcNow,
            });

            return translated;
        }
    }
}
