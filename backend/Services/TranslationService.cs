using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.Models;
using backend.Repositories;
using backend.DTOs.Translation;

namespace backend.Services
{
    public class TranslationService
    {
        private readonly ITranslationRepository _translationRepo;

        public TranslationService(ITranslationRepository translationRepo)
        {
            _translationRepo = translationRepo;
        }

        public async Task<TranslationResponse> GetOneAsync(int narrationId, string languageCode)
        {
            var translation = await _translationRepo.GetByNarrationIdAndLang(narrationId, languageCode);
            if (translation == null)
                throw new KeyNotFoundException($"Không tìm thấy bản dịch cho ngôn ngữ {languageCode}");

            return new TranslationResponse
            {
                Id = translation.Id,
                NarrationId = translation.NarrationId,
                LanguageCode = translation.LanguageCode,
                Title = translation.Title,
                Content = translation.Content,
                IsEdited = translation.IsEdited,
                CreatedAt = translation.CreatedAt,
                UpdatedAt = translation.UpdatedAt
            };
        }

        public async Task<TranslationResponse> UpdateManualAsync(int translationId, TranslationUpdateRequest request)
        {
            var existing = await _translationRepo.GetById(translationId);
            if (existing == null)
                throw new KeyNotFoundException($"Không tìm thấy bản dịch với ID {translationId}");

            existing.Title = request.Title;
            existing.Content = request.Content;
            existing.IsEdited = request.IsEdited;
            existing.UpdatedAt = DateTime.UtcNow;

            var result = await _translationRepo.Update(existing);

            return new TranslationResponse
            {
                Id = result.Id,
                NarrationId = result.NarrationId,
                LanguageCode = result.LanguageCode,
                Title = result.Title,
                Content = result.Content,
                IsEdited = result.IsEdited,
                CreatedAt = result.CreatedAt,
                UpdatedAt = result.UpdatedAt
            };
        }

        public async Task<TranslationResponse> GenerateOneAsync(int narrationId, string languageCode)
        {
            var existing = await _translationRepo.GetByNarrationIdAndLang(narrationId, languageCode);
            if (existing != null)
            {
                return new TranslationResponse
                {
                    Id = existing.Id,
                    NarrationId = existing.NarrationId,
                    LanguageCode = existing.LanguageCode,
                    Title = existing.Title,
                    Content = existing.Content,
                    IsEdited = existing.IsEdited,
                    CreatedAt = existing.CreatedAt,
                    UpdatedAt = existing.UpdatedAt
                };
            }

            // TODO: Gọi Azure OpenAI để dịch
            var translation = new Translation
            {
                NarrationId = narrationId,
                LanguageCode = languageCode,
                Title = $"Dịch sang {languageCode}",
                Content = $"Nội dung dịch sang {languageCode}",
                IsEdited = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var result = await _translationRepo.Create(translation);

            return new TranslationResponse
            {
                Id = result.Id,
                NarrationId = result.NarrationId,
                LanguageCode = result.LanguageCode,
                Title = result.Title,
                Content = result.Content,
                IsEdited = result.IsEdited,
                CreatedAt = result.CreatedAt,
                UpdatedAt = result.UpdatedAt
            };
        }

        public async Task<List<TranslationResponse>> GenerateAllAsync(int narrationId, List<string> languages)
        {
            var results = new List<TranslationResponse>();

            foreach (var lang in languages)
            {
                var result = await GenerateOneAsync(narrationId, lang);
                results.Add(result);
            }

            return results;
        }
    }
}