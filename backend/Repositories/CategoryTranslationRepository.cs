using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Repositories
{
    public class CategoryTranslationRepository : ICategoryTranslationRepository
    {
        private readonly AppDbContext _db;
        public CategoryTranslationRepository(AppDbContext db) { _db = db; }

        public async Task<CategoryTranslation?> GetByCategoryIdAndLang(int categoryId, string languageCode)
            => await _db.CategoryTranslations
                .FirstOrDefaultAsync(c => c.CategoryId == categoryId && c.LanguageCode == languageCode);

        public async Task<CategoryTranslation> Create(CategoryTranslation entity)
        {
            _db.CategoryTranslations.Add(entity);
            await _db.SaveChangesAsync();
            return entity;
        }
    }
}
