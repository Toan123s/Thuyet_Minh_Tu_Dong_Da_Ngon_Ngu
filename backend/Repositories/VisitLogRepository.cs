using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Repositories
{
    public class VisitLogRepository : IVisitLogRepository
    {
        private readonly AppDbContext _db;

        public VisitLogRepository(AppDbContext db)
        {
            _db = db;
        }

        public async Task<VisitLog> Create(VisitLog visitLog)
        {
            visitLog.VisitedAt = DateTime.UtcNow;
            _db.VisitLogs.Add(visitLog);
            await _db.SaveChangesAsync();
            return visitLog;
        }

        public async Task<IEnumerable<VisitLog>> GetByFilters(int? eventId, int? boothId, DateTime? fromDate, DateTime? toDate)
        {
            var query = _db.VisitLogs
                .Include(v => v.Booth)
                .ThenInclude(b => b.Event)
                .AsQueryable();

            if (boothId.HasValue)
                query = query.Where(v => v.BoothId == boothId.Value);

            if (eventId.HasValue)
                query = query.Where(v => v.Booth.EventId == eventId.Value);

            if (fromDate.HasValue)
                query = query.Where(v => v.VisitedAt >= fromDate.Value);

            if (toDate.HasValue)
                query = query.Where(v => v.VisitedAt <= toDate.Value);

            return await query.ToListAsync();
        }

        public async Task<IEnumerable<VisitLog>> GetByBoothId(int boothId)
        {
            return await _db.VisitLogs
                .Where(v => v.BoothId == boothId)
                .ToListAsync();
        }
    }
}