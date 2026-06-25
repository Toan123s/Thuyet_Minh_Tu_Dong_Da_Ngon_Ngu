// reportService.js
import apiClient from "./apiClient";

const reportService = {
  // ── Dùng cho ReportPage ─────────────────────────────────────

  getSummary: ({ eventId = "", range = "week" } = {}) => {
    const q = new URLSearchParams();
    if (eventId) q.set("eventId", eventId);
    q.set("range", range);
    return apiClient.get(`/reports/summary?${q}`).then(res => ({
      totalListens:   res.total          ?? 0,
      avgPerDay:      res.avgDurationSec ?? 0,
      topLanguage:    "VI",
      totalLanguages: res.languages      ?? 0,
      avgDelta:       null,
      totalDelta:     null,
    }));
  },

  getChart: ({ eventId = "", range = "week" } = {}) => {
    const q = new URLSearchParams();
    if (eventId) q.set("eventId", eventId);
    q.set("range", range);
    return apiClient.get(`/reports/chart?${q}`);
  },

  getByLanguage: ({ eventId = "" } = {}) =>
    apiClient.get(`/reports/by-language?eventId=${eventId}`)
      .then(res =>
        (Array.isArray(res) ? res : []).map(item => ({
          label: item.languageCode?.toUpperCase() ?? "?",
          pct:   item.pct   ?? 0,
          count: item.count ?? 0,
        }))
      ),

  getByDevice: ({ eventId = "" } = {}) =>
    apiClient.get(`/reports/by-device?eventId=${eventId}`)
      .then(res =>
        (Array.isArray(res) ? res : []).map(item => ({
          label: item.deviceType ?? "?",
          pct:   item.pct        ?? 0,
          count: item.count      ?? 0,
        }))
      ),

  getByBooth: ({ eventId = "" } = {}) =>
    apiClient.get(`/reports/by-booth?eventId=${eventId}`)
      .then(res =>
        (Array.isArray(res) ? res : []).map((item, idx, arr) => ({
          id:          item.id     ?? idx,
          name:        item.name   ?? "",
          event:       item.event  ?? "",
          listens:     item.visits ?? 0,
          avgDuration: item.avgDur ?? 0,
          pct:         arr[0]?.visits
                         ? Math.round((item.visits / arr[0].visits) * 100)
                         : 0,
        }))
      ),

  exportExcel: ({ eventId = "", range = "week" } = {}) => {
    const q = new URLSearchParams({ eventId, range });
    return apiClient.get(`/reports/export?${q}`);
  },
};

export default reportService;