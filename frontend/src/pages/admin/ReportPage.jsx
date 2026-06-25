// ReportPage.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import StatCard from "../../components/StatCard/StatCard";
import Toast, { useToast } from "../../components/Toast/Toast";
import reportService from "../../services/reportService";
import eventService from "../../services/eventService";
import "./ReportPage.css";

const IconChevron    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>;
const IconDownload   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;
const IconBarChart   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" /></svg>;
const IconGlobe      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>;
const IconPhone      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>;
const IconList       = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>;
const IconHeadphone  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" /><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></svg>;
const IconClock      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;

function formatDuration(seconds) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")} phút`;
}

function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const [hovered, setHovered] = useState(null);
  return (
    <div className="rp-chart">
      <div className="rp-chart__bars">
        {data.map((d, i) => {
          const h = Math.round((d.value / max) * 100);
          const isHov = hovered === i;
          return (
            <div key={`${d.day}-${i}`} className="rp-chart__col"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}>
              {isHov && <div className="rp-chart__tooltip">{d.value.toLocaleString()}</div>}
              <div className={`rp-chart__bar ${isHov ? "rp-chart__bar--hovered" : ""}`}
                style={{ height: `${h}%` }} />
              <span className="rp-chart__label">{d.day}</span>
            </div>
          );
        })}
      </div>
      <div className="rp-chart__y-axis">
        {[max, Math.round(max / 2), 0].map((v, i) => (
          <span key={i}>{v > 0 ? v.toLocaleString() : "0"}</span>
        ))}
      </div>
    </div>
  );
}

function HBarList({ items, colorVar }) {
  return (
    <div className="rp-hbar-list">
      {items.map((item, i) => (
        <div key={`${item.label}-${i}`} className="rp-hbar-item">
          <span className="rp-hbar-label">{item.label}</span>
          <div className="rp-hbar-track">
            <div className="rp-hbar-fill"
              style={{ width: `${item.pct}%`, background: colorVar ?? "var(--color-primary,#6366f1)" }} />
          </div>
          <span className="rp-hbar-pct">{item.pct}%</span>
        </div>
      ))}
    </div>
  );
}

const SkeletonBlock = ({ h = 180 }) => (
  <div className="rp-skeleton" style={{ height: h }} />
);

export default function ReportPage() {
  const navigate = useNavigate();
  const { toasts, showToast } = useToast();

  const [events,     setEvents]     = useState([]);
  const [eventId,    setEventId]    = useState("");
  const [range,      setRange]      = useState("week");
  const [exporting,  setExporting]  = useState(false);

  const [summary,    setSummary]    = useState(null);
  const [chartData,  setChartData]  = useState([]);
  const [langData,   setLangData]   = useState([]);
  const [deviceData, setDeviceData] = useState([]);
  const [boothData,  setBoothData]  = useState([]);

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingChart,   setLoadingChart]   = useState(true);
  const [loadingLang,    setLoadingLang]    = useState(true);
  const [loadingDevice,  setLoadingDevice]  = useState(true);
  const [loadingBooth,   setLoadingBooth]   = useState(true);

  // ── Fetch danh sách sự kiện ────────────────────────────────
  useEffect(() => {
    eventService
      .getAll({ pageSize: 100 })
      .then((res) => setEvents(res.items ?? []))
      .catch(() => setEvents([]));
  }, []);

  // ── Fetch tất cả data báo cáo ──────────────────────────────
  const fetchAll = useCallback(() => {
    const params = { eventId: eventId || undefined, range };

    setLoadingSummary(true);
    reportService.getSummary(params)
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoadingSummary(false));

    setLoadingChart(true);
    reportService.getChart(params)
      .then((res) => {
        const normalized = res.labels
          ? res.labels.map((day, i) => ({ day, value: res.values[i] ?? 0 }))
          : [];
        setChartData(normalized);
      })
      .catch(() => setChartData([]))
      .finally(() => setLoadingChart(false));

    setLoadingLang(true);
    reportService.getByLanguage(params)
      .then(setLangData)
      .catch(() => setLangData([]))
      .finally(() => setLoadingLang(false));

    setLoadingDevice(true);
    reportService.getByDevice(params)
      .then(setDeviceData)
      .catch(() => setDeviceData([]))
      .finally(() => setLoadingDevice(false));

    setLoadingBooth(true);
    reportService.getByBooth(params)
      .then(setBoothData)
      .catch(() => setBoothData([]))
      .finally(() => setLoadingBooth(false));
  }, [eventId, range]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleExport() {
    setExporting(true);
    try {
      await reportService.exportExcel({ eventId, range });
      showToast("Xuất Excel thành công!", "success");
    } catch (err) {
      showToast(err.message || "Không thể xuất Excel.", "error");
    } finally {
      setExporting(false);
    }
  }

  const totalListens = chartData.reduce((s, d) => s + (d.value ?? 0), 0);

  return (
    <Layout>
      <div className="rp-page">
        <Toast toasts={toasts} />

        {/* Header */}
        <div className="rp-header">
          <div className="rp-header__left">
            <button className="rp-back-btn" onClick={() => navigate("/admin/dashboard")}>
              <IconChevron style={{ transform: "rotate(180deg)" }} /> Dashboard
            </button>
            <h1 className="rp-title">Báo cáo & Thống kê</h1>
          </div>
          <button className="rp-btn rp-btn--primary" onClick={handleExport} disabled={exporting}>
            <IconDownload /> {exporting ? "Đang xuất..." : "Xuất Excel"}
          </button>
        </div>

        {/* Filters */}
        <div className="rp-filters">
          <div className="rp-filter-group">
            <label>Sự kiện</label>
            <select value={eventId} onChange={(e) => setEventId(e.target.value)}>
              <option value="">Tất cả sự kiện</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
          </div>
          <div className="rp-filter-group">
            <label>Thời gian</label>
            <select value={range} onChange={(e) => setRange(e.target.value)}>
              <option value="today">Hôm nay</option>
              <option value="week">Tuần này (7 ngày)</option>
              <option value="month">Tháng này (30 ngày)</option>
            </select>
          </div>
        </div>

        {/* Stat cards */}
        <div className="rp-stats">
          {loadingSummary ? (
            <>
              <div className="rp-stat-skeleton" />
              <div className="rp-stat-skeleton" />
              <div className="rp-stat-skeleton" />
            </>
          ) : summary ? (
            <>
              <StatCard icon={<IconHeadphone />} label="Tổng lượt nghe"
                value={summary.totalListens?.toLocaleString() ?? "—"}
                sub={summary.totalDelta} color="blue" />
              <StatCard icon={<IconBarChart />} label="Trung bình / ngày"
                value={summary.avgPerDay?.toLocaleString() ?? "—"}
                sub={summary.avgDelta} color="purple" />
              <StatCard icon={<IconGlobe />} label="Ngôn ngữ phổ biến"
                value={summary.topLanguage ?? "—"}
                sub={`${summary.totalLanguages ?? 0} ngôn ngữ`} color="green" />
            </>
          ) : null}
        </div>

        {/* Biểu đồ */}
        <div className="rp-card">
          <div className="rp-card__head">
            <div className="rp-card__title-wrap">
              <IconBarChart />
              <h2 className="rp-card__title">Lượt nghe theo ngày</h2>
            </div>
            <span className="rp-card__sub">
              Tổng: <strong>{totalListens.toLocaleString()}</strong> lượt
            </span>
          </div>
          {loadingChart
            ? <SkeletonBlock h={200} />
            : chartData.length === 0
              ? <p className="rp-empty">Chưa có dữ liệu.</p>
              : <BarChart data={chartData} />}
        </div>

        {/* Ngôn ngữ + Thiết bị */}
        <div className="rp-grid-2">
          <div className="rp-card">
            <div className="rp-card__head">
              <div className="rp-card__title-wrap">
                <IconGlobe />
                <h2 className="rp-card__title">Ngôn ngữ</h2>
              </div>
            </div>
            {loadingLang
              ? <SkeletonBlock h={140} />
              : langData.length === 0
                ? <p className="rp-empty">Chưa có dữ liệu.</p>
                : <HBarList items={langData} colorVar="var(--color-primary,#6366f1)" />}
          </div>

          <div className="rp-card">
            <div className="rp-card__head">
              <div className="rp-card__title-wrap">
                <IconPhone />
                <h2 className="rp-card__title">Thiết bị</h2>
              </div>
            </div>
            {loadingDevice
              ? <SkeletonBlock h={140} />
              : deviceData.length === 0
                ? <p className="rp-empty">Chưa có dữ liệu.</p>
                : <HBarList items={deviceData} colorVar="#8b5cf6" />}
          </div>
        </div>

        {/* Bảng chi tiết booth */}
        <div className="rp-card rp-card--full">
          <div className="rp-card__head">
            <div className="rp-card__title-wrap">
              <IconList />
              <h2 className="rp-card__title">Chi tiết theo gian hàng</h2>
            </div>
          </div>
          {loadingBooth ? (
            <div className="rp-skeleton-list">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rp-skeleton-row" />
              ))}
            </div>
          ) : boothData.length === 0 ? (
            <p className="rp-empty">Chưa có dữ liệu.</p>
          ) : (
            <table className="rp-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Gian hàng</th>
                  <th>Sự kiện</th>
                  <th><IconHeadphone /> Lượt nghe</th>
                  <th><IconClock /> TB thời lượng</th>
                </tr>
              </thead>
              <tbody>
                {boothData.map((booth, idx) => (
                  <tr key={`${booth.id}-${idx}`}>
                    <td className="rp-table__rank">
                      <span className={`rp-rank ${idx === 0 ? "rp-rank--gold" : idx === 1 ? "rp-rank--silver" : idx === 2 ? "rp-rank--bronze" : ""}`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="rp-table__name">{booth.name}</td>
                    <td className="rp-table__event">{booth.event ?? "—"}</td>
                    <td className="rp-table__listens">
                      <div className="rp-listen-wrap">
                        <div className="rp-listen-bar">
                          <div className="rp-listen-fill" style={{ width: `${booth.pct ?? 0}%` }} />
                        </div>
                        <span>{booth.listens?.toLocaleString() ?? 0}</span>
                      </div>
                    </td>
                    <td className="rp-table__duration">{formatDuration(booth.avgDuration)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}