using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Data;

namespace backend.Repositories
{
    public interface IEventRepository
    {
        Task<IEnumerable<Event>> GetAll(string? status = null);
        Task<Event> GetById(int id);
        Task<Event> Create(Event eventItem);
        Task<Event> Update(Event eventItem);
        Task<bool> Delete(int id);
    }

    public class EventRepository : IEventRepository
    {
        private readonly AppDbContext _db;

        public EventRepository(AppDbContext db)
        {
            _db = db;
        }

        public async Task<IEnumerable<Event>> GetAll(string? status = null)
        {
            var query = _db.Events.Include(e => e.Booths).AsQueryable();

            // 🔥 SỬA: tính toán status thay vì dùng property Status
            if (!string.IsNullOrEmpty(status))
            {
                var now = DateTime.UtcNow;
                query = status switch
                {
                    "Sắp tới" => query.Where(e => e.StartDate > now),
                    "Đang mở" => query.Where(e => e.StartDate <= now && e.EndDate >= now),
                    "Đã kết thúc" => query.Where(e => e.EndDate < now),
                    _ => query
                };
            }

            return await query.OrderByDescending(e => e.CreatedAt).ToListAsync();
        }

        public async Task<Event> GetById(int id)
        {
            return await _db.Events
                .Include(e => e.Booths)
                .FirstOrDefaultAsync(e => e.Id == id);
        }

        public async Task<Event> Create(Event eventItem)
        {
            _db.Events.Add(eventItem);
            await _db.SaveChangesAsync();
            return eventItem;
        }

        public async Task<Event> Update(Event eventItem)
        {
            _db.Events.Update(eventItem);
            await _db.SaveChangesAsync();
            return eventItem;
        }

        public async Task<bool> Delete(int id)
        {
            var eventItem = await _db.Events.FindAsync(id);
            if (eventItem == null) return false;

            _db.Events.Remove(eventItem);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}