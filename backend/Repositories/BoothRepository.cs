using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Data;

namespace backend.Repositories
{
    public interface IBoothRepository
    {
        Task<IEnumerable<Booth>> GetAll();
        Task<IEnumerable<Booth>> GetByEventId(int eventId);
        Task<Booth> GetById(int id);
        Task<Booth> Create(Booth booth);
        Task<Booth> Update(Booth booth);
        Task<bool> Delete(int id);
    }

    public class BoothRepository : IBoothRepository
    {
        private readonly AppDbContext _db;

        public BoothRepository(AppDbContext db)
        {
            _db = db;
        }

        public async Task<IEnumerable<Booth>> GetAll()
        {
            return await _db.Booths
                .Include(b => b.Event)
                .Include(b => b.Category)
                .Include(b => b.Vendor)
                .ToListAsync();
        }

        public async Task<IEnumerable<Booth>> GetByEventId(int eventId)
        {
            return await _db.Booths
                .Where(b => b.EventId == eventId)
                .Include(b => b.Event)
                .Include(b => b.Category)
                .Include(b => b.Vendor)
                .ToListAsync();
        }

        public async Task<Booth> GetById(int id)
        {
            return await _db.Booths
                .Include(b => b.Event)
                .Include(b => b.Category)
                .Include(b => b.Vendor)
                .Include(b => b.Narration)
                .Include(b => b.Images)
                .Include(b => b.Videos)
                .FirstOrDefaultAsync(b => b.Id == id);
        }

        public async Task<Booth> Create(Booth booth)
        {
            _db.Booths.Add(booth);
            await _db.SaveChangesAsync();
            return booth;
        }

        public async Task<Booth> Update(Booth booth)
        {
            _db.Booths.Update(booth);
            await _db.SaveChangesAsync();
            return booth;
        }

        public async Task<bool> Delete(int id)
        {
            var booth = await _db.Booths.FindAsync(id);
            if (booth == null) return false;

            _db.Booths.Remove(booth);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}