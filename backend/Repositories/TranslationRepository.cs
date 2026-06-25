using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Repositories
{
    public class TranslationRepository : ITranslationRepository
    {
        private readonly AppDbContext _db;

        public TranslationRepository(AppDbContext db)
        {
            _db = db;
        }

        public async Task<Translation> GetByNarrationIdAndLang(int narrationId, string languageCode)
        {
            return await _db.Translations
                .FirstOrDefaultAsync(t => t.NarrationId == narrationId && t.LanguageCode == languageCode);
        }

        public async Task<IEnumerable<Translation>> GetByNarrationId(int narrationId)
        {
            return await _db.Translations
                .Where(t => t.NarrationId == narrationId)
                .ToListAsync();
        }

        public async Task<Translation> GetById(int id)
        {
            return await _db.Translations.FindAsync(id);
        }

        public async Task<Translation> Create(Translation translation)
        {
            translation.CreatedAt = System.DateTime.UtcNow;
            translation.UpdatedAt = System.DateTime.UtcNow;
            _db.Translations.Add(translation);
            await _db.SaveChangesAsync();
            return translation;
        }

        public async Task<Translation> Update(Translation translation)
        {
            translation.UpdatedAt = System.DateTime.UtcNow;
            _db.Translations.Update(translation);
            await _db.SaveChangesAsync();
            return translation;
        }

        public async Task<bool> Delete(int id)
        {
            var translation = await _db.Translations.FindAsync(id);
            if (translation == null) return false;

            _db.Translations.Remove(translation);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}