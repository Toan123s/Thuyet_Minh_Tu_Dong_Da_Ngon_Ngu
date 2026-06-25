using System.Collections.Generic;
using System.Threading.Tasks;
using backend.Models;

namespace backend.Repositories
{
    public interface IVideoRepository
    {
        Task<IEnumerable<Video>> GetByBoothId(int boothId);
        Task<Video> GetById(int id);
        Task<Video> Create(Video video);
        Task<Video> Update(Video video);
        Task<bool> Delete(int id);
    }
}