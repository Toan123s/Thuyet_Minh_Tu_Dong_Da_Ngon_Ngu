// adminStatsService.js
import apiClient from "./apiClient";

const adminStatsService = {
  // GET /api/admin/stats/summary
  // Backend trả: { totalEvents, activeEvents, upcomingEvents, totalBooths, listensToday }
  getSummary: () =>
    apiClient.get("/admin/stats/summary").then(res => ({
      // Dashboard dùng "sự kiện đang mở" — không phải tổng tất cả
      events:        res.activeEvents   ?? 0,
      totalEvents:   res.totalEvents    ?? 0,
      upcomingEvents:res.upcomingEvents ?? 0,
      booths:        res.totalBooths    ?? 0,
      listensToday:  res.listensToday   ?? 0,
      onlineVisitors:res.onlineVisitors ?? 0,
      eventsDelta:   `${res.totalEvents ?? 0} tổng cộng`,
      boothsDelta:   null,
      listensDelta:  null,
    })),

  getChart: (range = "7d") =>
    apiClient.get(`/admin/stats/chart?range=${range}`),

  getTopBooths: (limit = 5) =>
    apiClient.get(`/admin/stats/top-booths?date=today&limit=${limit}`)
      .then(res =>
        (Array.isArray(res) ? res : []).map(b => ({
          id:     b.boothId,
          name:   b.name,
          event:  b.eventName ?? "",
          visits: b.listens   ?? 0,
          pct:    b.pct       ?? 0,
        }))
      ),
};

export default adminStatsService;