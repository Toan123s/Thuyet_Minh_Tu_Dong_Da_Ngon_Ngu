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
        private readonly IVendorRepository   _vendorRepo;
        private readonly IBoothRepository    _boothRepo;
        private readonly IVisitLogRepository _visitLogRepo;

        private static readonly TimeZoneInfo VnZone =
            TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");

        private static DateTime VnNow   => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, VnZone);
        private static DateTime VnToday => VnNow.Date;

        private static DateTime ToUtc(DateTime vnDate)
            => TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(vnDate, DateTimeKind.Unspecified), VnZone);

        private static DateTime ToVnDate(DateTime utc)
            => TimeZoneInfo.ConvertTimeFromUtc(utc, VnZone).Date;

        public VendorService(
            IVendorRepository vendorRepo,
            IBoothRepository boothRepo,
            IVisitLogRepository visitLogRepo)
        {
            _vendorRepo   = vendorRepo;
            _boothRepo    = boothRepo;
            _visitLogRepo = visitLogRepo;
        }

        public async Task<object> GetMeAsync(int accountId)
        {
            var vendor = await _vendorRepo.GetByAccountId(accountId)
                ?? throw new KeyNotFoundException("Khong tim thay thong tin vendor.");
            return new {
                vendor.Id, vendor.AccountId, vendor.CompanyName,
                vendor.RepresentativeName, vendor.PhoneNumber,
                vendor.Description, vendor.IsPaid,
            };
        }

        // ⚠ 1 tài khoản chủ quầy CHỈ gắn với 1 gian hàng duy nhất (đúng thực tế).
        // Gian hàng được ADMIN gán trực tiếp qua trang Quản lý gian hàng
        // (chọn Vendor trong dropdown khi tạo/sửa booth) — không còn flow
        // vendor tự "yêu cầu mở sạp" nữa.
        // Trả LIST tất cả booth — VendorController.GetMyBooths() dùng
        public async Task<object> GetMyBoothsAsync(int accountId)
        {
            var vendor = await _vendorRepo.GetByAccountId(accountId)
                ?? throw new KeyNotFoundException("Khong tim thay thong tin vendor.");
            var booths = await _boothRepo.GetAll();
            return booths
                .Where(b => b.VendorId == vendor.Id)
                .Select(b => new {
                    b.Id, b.BoothName, b.Description,
                    b.IsActive, b.CategoryId, b.CreatedAt,
                }).ToList();
        }

        // Trả 1 booth đầu tiên — VendorController.GetMyBooth() dùng
        public async Task<object?> GetMyBoothAsync(int accountId)
        {
            var vendor = await _vendorRepo.GetByAccountId(accountId)
                ?? throw new KeyNotFoundException("Khong tim thay thong tin vendor.");

            var booths = await _boothRepo.GetAll();
            var booth = booths.FirstOrDefault(b => b.VendorId == vendor.Id);
            if (booth == null) return null; // chưa được admin gán gian hàng

            return new {
                booth.Id, booth.BoothName, booth.Description,
                booth.IsActive, booth.CategoryId, booth.CreatedAt,
            };
        }

        public async Task<object> GetStatsTodayAsync(int accountId)
        {
            var vendor = await _vendorRepo.GetByAccountId(accountId)
                ?? throw new KeyNotFoundException("Khong tim thay thong tin vendor.");

            var booths = (await _boothRepo.GetAll())
                .Where(b => b.VendorId == vendor.Id).ToList();

            // Range UTC tuong ung voi ngay VN hom nay
            var todayUtcStart    = ToUtc(VnToday);
            var tomorrowUtcStart = ToUtc(VnToday.AddDays(1));

            var todayLogs = new List<VisitLog>();
            foreach (var booth in booths)
            {
                var logs = await _visitLogRepo.GetByBoothId(booth.Id);
                todayLogs.AddRange(logs.Where(l =>
                    l.VisitedAt >= todayUtcStart && l.VisitedAt < tomorrowUtcStart));
            }

            int totalListens   = todayLogs.Count;
            int totalLanguages = todayLogs.Select(l => l.LanguageCode).Distinct().Count();
            int avgDurationSec = totalListens > 0 ? (int)todayLogs.Average(l => l.Duration) : 0;

            return new {
                // Thẻ "Tổng số người nghe" bên vendor dashboard
                totalListeners  = totalListens,
                listensToday    = totalListens,
                totalLanguages,
                avgDurationSec,
            };
        }

        public async Task<object> GetBoothStatsAsync(int boothId, string range)
        {
            int days    = range == "30days" ? 30 : 7;
            var fromVn  = VnToday.AddDays(-days + 1);
            var fromUtc = ToUtc(fromVn);

            var allLogs = await _visitLogRepo.GetByBoothId(boothId);
            var logs    = allLogs.Where(l => l.VisitedAt >= fromUtc).ToList();

            // Group theo ngay VN
            var byDayGrouped = logs
                .GroupBy(l => ToVnDate(l.VisitedAt))
                .ToDictionary(g => g.Key, g => g.Count());

            var chartByDay = Enumerable.Range(0, days)
                .Select(i => {
                    var d = fromVn.AddDays(i);
                    return new {
                        date  = d.ToString("dd/MM"),
                        count = byDayGrouped.TryGetValue(d, out var c) ? c : 0,
                    };
                }).ToList();

            // Group theo gio VN
            var hourlyData = logs
                .GroupBy(l => TimeZoneInfo.ConvertTimeFromUtc(l.VisitedAt, VnZone).Hour)
                .Select(g => new { hour = $"{g.Key:D2}h", views = g.Count() })
                .OrderBy(x => x.hour)
                .ToList();

            var total = logs.Count;
            var langData = logs
                .GroupBy(l => l.LanguageCode)
                .Select(g => new {
                    languageCode = g.Key,
                    count        = g.Count(),
                    pct          = total > 0
                                   ? Math.Round((double)g.Count() / total * 100, 1) : 0,
                })
                .OrderByDescending(x => x.count)
                .ToList();

            return new {
                total,
                avgDurationSec = logs.Any() ? (int)logs.Average(l => l.Duration) : 0,
                topLanguage    = langData.FirstOrDefault()?.languageCode,
                hourlyData,
                langData,
                chartByDay,
            };
        }
    }
}