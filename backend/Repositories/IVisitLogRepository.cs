using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.Models;

namespace backend.Repositories
{
    public interface IVisitLogRepository
    {
        Task<VisitLog> Create(VisitLog visitLog);
        Task<IEnumerable<VisitLog>> GetByFilters(int? eventId, int? boothId, DateTime? fromDate, DateTime? toDate);
        Task<IEnumerable<VisitLog>> GetByBoothId(int boothId);
    }
}