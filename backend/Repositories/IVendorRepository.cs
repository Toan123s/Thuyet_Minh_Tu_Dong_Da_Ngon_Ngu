using System.Collections.Generic;
using System.Threading.Tasks;
using backend.Models;

namespace backend.Repositories
{
    public interface IVendorRepository
    {
        Task<Vendor> GetById(int id);
        Task<Vendor> GetByAccountId(int accountId);
        Task<IEnumerable<Vendor>> GetAll();
        Task<Vendor> Create(Vendor vendor);
        Task<Vendor> Update(Vendor vendor);
        Task<bool> Delete(int id);
    }
}