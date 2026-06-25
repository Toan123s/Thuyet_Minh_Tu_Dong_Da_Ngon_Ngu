using System.Collections.Generic;
using System.Threading.Tasks;
using backend.Models;

namespace backend.Repositories
{
    public interface ITranslationRepository
    {
        Task<Translation> GetByNarrationIdAndLang(int narrationId, string languageCode);
        Task<IEnumerable<Translation>> GetByNarrationId(int narrationId);
        Task<Translation> GetById(int id);
        Task<Translation> Create(Translation translation);
        Task<Translation> Update(Translation translation);
        Task<bool> Delete(int id);
    }
}