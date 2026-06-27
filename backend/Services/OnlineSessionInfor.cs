using System.Collections.Concurrent;

namespace backend.Services
{
    public class OnlineSessionInfo
    {
        public string SessionId    { get; set; } = string.Empty;
        public int    BoothId      { get; set; }
        public string LanguageCode { get; set; } = "vi";
        public string DeviceType   { get; set; } = "Mobile";
        public DateTime FirstSeenAt { get; set; }
        public DateTime LastPingAt  { get; set; }
    }

    // ⚠ Đăng ký Singleton trong Program.cs.
    // Lưu trạng thái "đang online" hoàn toàn trong RAM (ConcurrentDictionary) —
    // KHÔNG cần thêm bảng/migration trong DB, vì đây là dữ liệu tức thời, chỉ
    // sống vài chục giây (mất khi restart server là chấp nhận được).
    //
    // Cơ chế: trang nghe của khách (BoothPage) gửi 1 "heartbeat" (ping) định kỳ
    // mỗi ~15s trong lúc audio đang phát. Nếu quá TTL (45s) không có ping mới
    // → coi như khách đã rời/đóng tab → tự động bị dọn khỏi danh sách "online".
    public class OnlineTrackerService
    {
        private static readonly TimeSpan Ttl = TimeSpan.FromSeconds(45);

        private readonly ConcurrentDictionary<string, OnlineSessionInfo> _sessions = new();

        public void Ping(string sessionId, int boothId, string? languageCode, string? deviceType)
        {
            var now = DateTime.UtcNow;
            _sessions.AddOrUpdate(
                sessionId,
                _ => new OnlineSessionInfo
                {
                    SessionId    = sessionId,
                    BoothId      = boothId,
                    LanguageCode = languageCode ?? "vi",
                    DeviceType   = deviceType   ?? "Mobile",
                    FirstSeenAt  = now,
                    LastPingAt   = now,
                },
                (_, existing) =>
                {
                    existing.BoothId      = boothId;
                    existing.LanguageCode = languageCode ?? existing.LanguageCode;
                    existing.DeviceType   = deviceType   ?? existing.DeviceType;
                    existing.LastPingAt   = now;
                    return existing;
                });
        }

        // Gọi khi khách bấm dừng nghe / rời trang chủ động — best-effort,
        // không bắt buộc (nếu khách đóng tab thẳng, session sẽ tự hết hạn sau TTL).
        public void Remove(string sessionId) => _sessions.TryRemove(sessionId, out _);

        public List<OnlineSessionInfo> GetOnline()
        {
            var cutoff = DateTime.UtcNow - Ttl;
            // Dọn session đã hết hạn ngay trong lúc đọc — khỏi cần 1 background job riêng.
            foreach (var kv in _sessions)
            {
                if (kv.Value.LastPingAt < cutoff)
                    _sessions.TryRemove(kv.Key, out _);
            }
            return _sessions.Values.ToList();
        }
    }
}