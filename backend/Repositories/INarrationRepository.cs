using System.Threading.Tasks;
using backend.Models;

namespace backend.Repositories
{
    public interface INarrationRepository
    {
        Task<Narration?> GetByBoothId(int boothId);
        Task<Narration?> GetById(int id);
        Task<Narration> Create(Narration narration);
        Task<Narration> Update(Narration narration);
        Task<bool> Delete(int id);
    }
}