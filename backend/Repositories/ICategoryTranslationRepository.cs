using backend.Models;

namespace backend.Repositories
{
    public interface ICategoryTranslationRepository
    {
        Task<CategoryTranslation?> GetByCategoryIdAndLang(int categoryId, string languageCode);
        Task<CategoryTranslation> Create(CategoryTranslation entity);
    }
}
