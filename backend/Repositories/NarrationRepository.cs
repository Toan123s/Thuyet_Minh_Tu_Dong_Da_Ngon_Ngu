using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Repositories
{
    public class NarrationRepository : INarrationRepository
    {
        private readonly AppDbContext _db;

        public NarrationRepository(AppDbContext db)
        {
            _db = db;
        }

        public async Task<Narration> GetByBoothId(int boothId)
        {
            return await _db.Narrations
                .Include(n => n.Translations)
                .FirstOrDefaultAsync(n => n.BoothId == boothId);
        }

        public async Task<Narration> GetById(int id)
        {
            return await _db.Narrations
                .Include(n => n.Translations)
                .FirstOrDefaultAsync(n => n.Id == id);
        }

        public async Task<Narration> Create(Narration narration)
        {
            _db.Narrations.Add(narration);
            await _db.SaveChangesAsync();
            return narration;
        }

        public async Task<Narration> Update(Narration narration)
        {
            _db.Narrations.Update(narration);
            await _db.SaveChangesAsync();
            return narration;
        }

        public async Task<bool> Delete(int id)
        {
            var narration = await _db.Narrations.FindAsync(id);
            if (narration == null) return false;

            _db.Narrations.Remove(narration);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}