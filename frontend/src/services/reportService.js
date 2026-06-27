// reportService.js
import apiClient from "./apiClient";

function buildParams({ eventId, range } = {}) {
  const p = new URLSearchParams();
  if (eventId) p.append("eventId", eventId);
  if (range)   p.append("range",   range);
  return p.toString() ? `?${p}` : "";
}

const reportService = {
  getSummary: ({ eventId, range } = {}) =>
    apiClient.get(`/reports/summary${buildParams({ eventId, range })}`),

  getChart: ({ eventId, range } = {}) =>
    apiClient.get(`/reports/chart${buildParams({ eventId, range })}`),

  // Backend trả: [{ label, languageCode, count, pct }]
  getByLanguage: ({ eventId } = {}) =>
    apiClient.get(`/reports/by-language${buildParams({ eventId })}`),

  // Backend trả: [{ label, deviceType, count, pct }]
  getByDevice: ({ eventId } = {}) =>
    apiClient.get(`/reports/by-device${buildParams({ eventId })}`),

  // Backend trả: [{ id, name, eventName, visits, avgDuration, pct }]
  getByBooth: ({ eventId } = {}) =>
    apiClient.get(`/reports/by-booth${buildParams({ eventId })}`),

  exportExcel: async ({ eventId, range } = {}) => {
    const url = `/reports/export${buildParams({ eventId, range })}`;
    const BASE = (import.meta?.env?.VITE_API_URL || "http://localhost:5069/api");
    const resp = await fetch(`${BASE}${url}`, { method: "GET" });
    if (!resp.ok) throw new Error("Lỗi xuất Excel");
    const blob = await resp.blob();
    const link = document.createElement("a");
    link.href     = URL.createObjectURL(blob);
    link.download = `BaoCao_${new Date().toISOString().slice(0,10)}.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);
  },
};

export default reportService;