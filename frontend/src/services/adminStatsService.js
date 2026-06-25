// adminStatsService.js
import apiClient from "./apiClient";

const adminStatsService = {
  getSummary: () =>
    apiClient.get("/admin/stats/summary").then(res => ({
      events:       res.totalEvents    ?? 0,
      booths:       res.totalBooths    ?? 0,
      listensToday: res.listensToday   ?? 0,
      eventsDelta:  null,
      boothsDelta:  null,
      listensDelta: null,
    })),

  getChart: (range = "7d") =>
    apiClient.get(`/admin/stats/chart?range=${range}`),

  getTopBooths: (limit = 5) =>
    apiClient.get(`/admin/stats/top-booths?date=today&limit=${limit}`)
      .then(res =>
        (Array.isArray(res) ? res : []).map((b, idx, arr) => ({
          id:     b.boothId,
          name:   b.name,
          event:  b.event ?? "",
          visits: b.listens ?? 0,
          pct:    arr[0]?.listens
                    ? Math.round((b.listens / arr[0].listens) * 100)
                    : 0,
        }))
      ),
};

export default adminStatsService;