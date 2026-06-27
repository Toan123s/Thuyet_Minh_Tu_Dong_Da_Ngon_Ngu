using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using System.Web;
using backend.Models;
using backend.Repositories;
using backend.DTOs.Translation;

namespace backend.Services
{
    public class TranslationService
    {
        private readonly ITranslationRepository _translationRepo;
        private readonly INarrationRepository   _narrationRepo;
        private readonly IHttpClientFactory     _httpFactory;

        public TranslationService(
            ITranslationRepository translationRepo,
            INarrationRepository   narrationRepo,
            IHttpClientFactory     httpFactory)
        {
            _translationRepo = translationRepo;
            _narrationRepo   = narrationRepo;
            _httpFactory     = httpFactory;
        }

        // ── Google Translate miễn phí, không cần key ────────────────
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
                return result;
            }
            catch
            {
                // Nếu Google Translate lỗi → trả lại text gốc thay vì crash
                return text;
            }
        }

        // ── Lấy 1 bản dịch — nếu chưa có thì TỰ DỊCH và lưu luôn ──
        // Không bao giờ throw 404 nữa, frontend không cần lo
        public async Task<TranslationResponse> GetOneAsync(int narrationId, string languageCode)
        {
            var t = await _translationRepo.GetByNarrationIdAndLang(narrationId, languageCode);
            if (t != null) return MapToResponse(t);

            // Chưa có → tự động dịch và lưu DB
            return await GenerateOneAsync(narrationId, languageCode);
        }

        // ── Vendor sửa thủ công ─────────────────────────────────────
        public async Task<TranslationResponse> UpdateManualAsync(int translationId, TranslationUpdateRequest request)
        {
            var existing = await _translationRepo.GetById(translationId);
            if (existing == null)
                throw new KeyNotFoundException($"Không tìm thấy bản dịch với ID {translationId}.");

            existing.Content   = request.Content;
            existing.IsEdited  = true;
            existing.UpdatedAt = DateTime.UtcNow;

            var result = await _translationRepo.Update(existing);
            return MapToResponse(result);
        }

        // ── Dịch 1 ngôn ngữ cụ thể, lưu DB ─────────────────────────
        public async Task<TranslationResponse> GenerateOneAsync(int narrationId, string languageCode)
        {
            // Đã có trong DB → trả về luôn, không dịch lại
            var existing = await _translationRepo.GetByNarrationIdAndLang(narrationId, languageCode);
            if (existing != null) return MapToResponse(existing);

            // Lấy nội dung gốc tiếng Việt
            var narration = await _narrationRepo.GetById(narrationId);
            if (narration == null)
                throw new KeyNotFoundException($"Không tìm thấy narration ID {narrationId}.");

            // Dịch nội dung
            var translatedContent = await GoogleTranslateAsync(narration.Content, languageCode);

            // Lưu vào DB
            var newRow = new Translation
            {
                NarrationId  = narrationId,
                LanguageCode = languageCode,
                Content      = translatedContent,
                IsEdited     = false,
                CreatedAt    = DateTime.UtcNow,
                UpdatedAt    = DateTime.UtcNow,
            };

            var result = await _translationRepo.Create(newRow);
            return MapToResponse(result);
        }

        // ── Dịch tất cả ngôn ngữ song song ──────────────────────────
        public async Task<List<TranslationResponse>> GenerateAllAsync(int narrationId, List<string> languages)
        {
            var tasks   = languages.ConvertAll(lang => GenerateOneAsync(narrationId, lang));
            var results = await Task.WhenAll(tasks);
            return new List<TranslationResponse>(results);
        }

        // ── Map sang DTO ─────────────────────────────────────────────
        private static TranslationResponse MapToResponse(Translation t) => new()
        {
            Id           = t.Id,
            NarrationId  = t.NarrationId,
            LanguageCode = t.LanguageCode,
            Content      = t.Content,
            IsEdited     = t.IsEdited,
            CreatedAt    = t.CreatedAt,
            UpdatedAt    = t.UpdatedAt,
        };
    }
}