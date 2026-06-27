using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Repositories
{
    public class TranslationRepository : ITranslationRepository
    {
        private readonly AppDbContext _db;
        public TranslationRepository(AppDbContext db) { _db = db; }

        public async Task<Translation?> GetByNarrationIdAndLang(int narrationId, string languageCode)
            => await _db.Translations
                .FirstOrDefaultAsync(t => t.NarrationId == narrationId && t.LanguageCode == languageCode);

        public async Task<IEnumerable<Translation>> GetByNarrationId(int narrationId)
            => await _db.Translations
                .Where(t => t.NarrationId == narrationId)
                .ToListAsync();

        public async Task<Translation?> GetById(int id)
            => await _db.Translations.FindAsync(id);

        public async Task<Translation> Create(Translation t)
        {
            _db.Translations.Add(t);
            await _db.SaveChangesAsync();
            return t;
        }

        public async Task<Translation> Update(Translation t)
        {
            _db.Translations.Update(t);
            await _db.SaveChangesAsync();
            return t;
        }

        public async Task<bool> Delete(int id)
        {
            var t = await _db.Translations.FindAsync(id);
            if (t == null) return false;
            _db.Translations.Remove(t);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}