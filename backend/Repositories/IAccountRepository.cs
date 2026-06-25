using System.Threading.Tasks;
using backend.Models;

namespace backend.Repositories
{
    public interface IAccountRepository
    {
        Task<Account> GetById(int id);
        Task<Account> GetByUsername(string username);
        Task<Account> Create(Account account);
        Task<bool> Update(Account account);
        Task<bool> Delete(int id);
    }
}