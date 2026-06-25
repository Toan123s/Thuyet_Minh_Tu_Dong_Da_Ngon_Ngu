using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Repositories
{
    public class AccountRepository : IAccountRepository
    {
        private readonly AppDbContext _db;

        public AccountRepository(AppDbContext db)
        {
            _db = db;
        }

        public async Task<Account> GetById(int id)
        {
            return await _db.Accounts
                .Include(a => a.Vendor)
                .FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task<Account> GetByUsername(string username)
        {
            return await _db.Accounts
                .Include(a => a.Vendor)
                .FirstOrDefaultAsync(a => a.Username == username);
        }

        public async Task<Account> Create(Account account)
        {
            _db.Accounts.Add(account);
            await _db.SaveChangesAsync();
            return account;
        }

        public async Task<bool> Update(Account account)
        {
            _db.Accounts.Update(account);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> Delete(int id)
        {
            var account = await _db.Accounts.FindAsync(id);
            if (account == null) return false;

            _db.Accounts.Remove(account);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}