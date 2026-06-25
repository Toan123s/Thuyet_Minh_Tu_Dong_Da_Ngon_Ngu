using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend.Models;
using backend.Repositories;

namespace backend.Services
{
    public class VendorService
    {
        private readonly IVendorRepository    _vendorRepo;
        private readonly IBoothRepository     _boothRepo;
        private readonly IVisitLogRepository  _visitLogRepo;

        public VendorService(
            IVendorRepository vendorRepo,
            IBoothRepository boothRepo,
            IVisitLogRepository visitLogRepo)
        {
            _vendorRepo   = vendorRepo;
            _boothRepo    = boothRepo;
            _visitLogRepo = visitLogRepo;
        }

        // GET /api/vendor/me
        public async Task<object> GetMeAsync(int accountId)
        {
            var vendor = await _vendorRepo.GetByAccountId(accountId)
                ?? throw new KeyNotFoundException("Không tìm thấy thông tin vendor.");

            return new
            {
                vendor.Id,
                vendor.AccountId,
                vendor.CompanyName,
                vendor.RepresentativeName,
                vendor.PhoneNumber,
                vendor.Description,
                vendor.IsPaid,
            };
        }

        // GET /api/vendor/booths
        public async Task<object> GetMyBoothsAsync(int accountId)
        {
            var vendor = await _vendorRepo.GetByAccountId(accountId)
                ?? throw new KeyNotFoundException("Không tìm thấy thông tin vendor.");

            var booths = await _boothRepo.GetAll();
            var myBooths = booths
                .Where(b => b.VendorId == vendor.Id)
                .Select(b => new
                {
                    b.Id,
                    b.BoothName,
                    b.Description,
                    b.IsActive,
                    b.CategoryId,
                    b.CreatedAt,
                })
                .ToList();

            return myBooths;
        }

        // GET /api/vendor/stats/today
        public async Task<object> GetStatsTodayAsync(int accountId)
        {
            var vendor = await _vendorRepo.GetByAccountId(accountId)
                ?? throw new KeyNotFoundException("Không tìm thấy thông tin vendor.");

            var booths = (await _boothRepo.GetAll())
                .Where(b => b.VendorId == vendor.Id)
                .ToList();

            var today = DateTime.UtcNow.Date;
            int totalListens = 0;

            foreach (var booth in booths)
            {
                var logs = await _visitLogRepo.GetByBoothId(booth.Id);
                totalListens += logs.Count(l => l.VisitedAt.Date == today);
            }

            return new
            {
                activeBooths  = booths.Count(b => b.IsActive),
                listensToday  = totalListens,
            };
        }

        // GET /api/vendor/stats/:boothId
        public async Task<object> GetBoothStatsAsync(int boothId, string range)
        {
            int days = range == "30days" ? 30 : 7;
            var from = DateTime.UtcNow.Date.AddDays(-days + 1);

            var logs = (await _visitLogRepo.GetByBoothId(boothId))
                .Where(l => l.VisitedAt.Date >= from)
                .ToList();

            var byDay = Enumerable.Range(0, days)
                .Select(i =>
                {
                    var date = from.AddDays(i);
                    return new
                    {
                        date  = date.ToString("dd/MM"),
                        count = logs.Count(l => l.VisitedAt.Date == date),
                    };
                }).ToList();

            var byLanguage = logs
                .GroupBy(l => l.LanguageCode)
                .Select(g => new { language = g.Key, count = g.Count() })
                .ToList();

            return new
            {
                totalListens   = logs.Count,
                avgDuration    = logs.Any() ? logs.Average(l => l.Duration) : 0,
                chart          = byDay,
                languages      = byLanguage,
            };
        }
    }
}