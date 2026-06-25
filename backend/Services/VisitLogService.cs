// VisitLogService.cs — paste đè toàn bộ (CreateAsync → Create)
using backend.Models;
using backend.Repositories;

namespace backend.Services;

public class VisitLogService
{
    private readonly VisitLogRepository _repo;
    public VisitLogService(VisitLogRepository repo) { _repo = repo; }

    public async Task<object> LogVisitAsync(VisitLogRequest request)
    {
        var log = new VisitLog
        {
            BoothId      = request.BoothId,
            LanguageCode = request.LanguageCode ?? "vi",
            DeviceType   = request.DeviceType   ?? "Mobile",
            Duration     = request.DurationSec,
            VisitedAt    = DateTime.UtcNow,
        };
        var created = await _repo.Create(log);
        return new { created.Id, created.BoothId, created.VisitedAt };
    }
}

public class VisitLogRequest
{
    public int     BoothId      { get; set; }
    public string? LanguageCode { get; set; }
    public string? DeviceType   { get; set; }
    public int     DurationSec  { get; set; }
}