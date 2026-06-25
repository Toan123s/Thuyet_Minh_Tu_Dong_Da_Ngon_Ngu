using System.Collections.Generic;
using System.Threading.Tasks;
using backend.Models;

namespace backend.Repositories
{
    public interface IImageRepository
    {
        Task<IEnumerable<Image>> GetByBoothId(int boothId);
        Task<Image> GetById(int id);
        Task<Image> Create(Image image);
        Task<Image> Update(Image image);
        Task<bool> Delete(int id);
    }
}