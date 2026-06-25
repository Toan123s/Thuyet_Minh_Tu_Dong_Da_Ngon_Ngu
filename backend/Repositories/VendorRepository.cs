using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Repositories
{
    public class VendorRepository : IVendorRepository
    {
        private readonly AppDbContext _db;

        public VendorRepository(AppDbContext db)
        {
            _db = db;
        }

        public async Task<Vendor> GetById(int id)
        {
            return await _db.Vendors
                .Include(v => v.Account)
                .Include(v => v.Booths)
                .FirstOrDefaultAsync(v => v.Id == id);
        }

        public async Task<Vendor> GetByAccountId(int accountId)
        {
            return await _db.Vendors
                .Include(v => v.Account)
                .Include(v => v.Booths)
                .FirstOrDefaultAsync(v => v.AccountId == accountId);
        }

        public async Task<IEnumerable<Vendor>> GetAll()
        {
            return await _db.Vendors
                .Include(v => v.Account)
                .Include(v => v.Booths)
                .ToListAsync();
        }

        public async Task<Vendor> Create(Vendor vendor)
        {
            _db.Vendors.Add(vendor);
            await _db.SaveChangesAsync();
            return vendor;
        }

        public async Task<Vendor> Update(Vendor vendor)
        {
            _db.Vendors.Update(vendor);
            await _db.SaveChangesAsync();
            return vendor;
        }

        public async Task<bool> Delete(int id)
        {
            var vendor = await _db.Vendors.FindAsync(id);
            if (vendor == null) return false;

            _db.Vendors.Remove(vendor);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}