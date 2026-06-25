import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import StatCard from "../../components/StatCard/StatCard";
import Toast, { useToast } from "../../components/Toast/Toast";
import adminStatsService from "../../services/adminStatsService";
import activityService from "../../services/activityService";
import "./DashboardPage.css";

// ─── Icons ────────────────────────────────────────────────────
const IconCalendar  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IconPackage   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l10 6.5v7L12 22 2 15.5v-7L12 2z"/><line x1="12" y1="22" x2="12" y2="11.5"/><polyline points="22 8.5 12 11.5 2 8.5"/></svg>;
const IconHeadphone = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>;
const IconTrendUp   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
const IconPlus      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconArrow     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
const IconDot       = () => <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor"><circle cx="3" cy="3" r="3"/></svg>;

// ─── Helpers ──────────────────────────────────────────────────
function today() {
  return new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
}

// ─── Bar Chart ────────────────────────────────────────────────
function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const [hovered, setHovered] = useState(null);
  return (
    <div className="db-chart">
      <div className="db-chart__bars">
        {data.map((d, i) => {
          const h = Math.round((d.value / max) * 100);
          const isHovered = hovered === i;
          return (
            <div key={d.day ?? i} className="db-chart__col"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}>
              {isHovered && <div className="db-chart__tooltip">{d.value.toLocaleString()}</div>}
              <div className={`db-chart__bar ${isHovered ? "db-chart__bar--hovered" : ""}`}
                style={{ height: `${h}%` }} />
              <span className="db-chart__label">{d.day}</span>
            </div>
          );
        })}
      </div>
      <div className="db-chart__y-axis">
        {[max, Math.round(max / 2), 0].map(v => (
          <span key={v}>{v > 0 ? v.toLocaleString() : "0"}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Skeleton helpers ─────────────────────────────────────────
function ChartSkeleton() {
  return <div className="db-skeleton db-skeleton--chart" />;
}
function ListSkeleton({ rows = 5 }) {
  return (
    <div className="db-skeleton-list">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="db-skeleton db-skeleton--row" />
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();
  const { toasts, showToast } = useToast();

  const [stats,        setStats]        = useState(null);
  const [chartData,    setChartData]    = useState([]);
  const [topBooths,    setTopBooths]    = useState([]);
  const [activity,     setActivity]     = useState([]);

  const [loadingStats,    setLoadingStats]    = useState(true);
  const [loadingChart,    setLoadingChart]    = useState(true);
  const [loadingBooths,   setLoadingBooths]   = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);

  // ── Fetch summary ──────────────────────────────────────────
  useEffect(() => {
    adminStatsService.getSummary()
      .then(setStats)
      .catch(err => showToast(err.message || "Không thể tải số liệu.", "error"))
      .finally(() => setLoadingStats(false));
  }, []);

  // ── Fetch chart ────────────────────────────────────────────
  useEffect(() => {
    adminStatsService.getChart("7d")
      .then(res => {
        const normalized = res.labels
          ? res.labels.map((day, i) => ({ day, value: res.values[i] ?? 0 }))
          : (res.data ?? res);
        setChartData(normalized);
      })
      .catch(err => showToast(err.message || "Không thể tải biểu đồ.", "error"))
      .finally(() => setLoadingChart(false));
  }, []);

  // ── Fetch top booths ───────────────────────────────────────
  useEffect(() => {
    adminStatsService.getTopBooths(5)
      .then(setTopBooths)
      .catch(err => showToast(err.message || "Không thể tải top gian hàng.", "error"))
      .finally(() => setLoadingBooths(false));
  }, []);

  // ── Fetch activity ─────────────────────────────────────────
  useEffect(() => {
    activityService.getRecent(5)
      .then(setActivity)
      .catch(() => setActivity([]))
      .finally(() => setLoadingActivity(false));
  }, []);

  const totalListens = chartData.reduce((s, d) => s + (d.value ?? 0), 0);

  return (
    <Layout>
      <div className="db-page">
        <Toast toasts={toasts} />

        {/* ── Header ── */}
        <div className="db-header">
          <div className="db-header__left">
            <p className="db-header__greeting">Xin chào, Admin 👋</p>
            <h1 className="db-header__title">Dashboard</h1>
            <p className="db-header__date">📅 {today()}</p>
          </div>
          <div className="db-header__actions">
            <button className="db-btn db-btn--outline" onClick={() => navigate("/admin/events")}>
              <IconCalendar /> Tạo sự kiện
            </button>
            <button className="db-btn db-btn--primary" onClick={() => navigate("/admin/booths")}>
              <IconPlus /> Tạo gian hàng
            </button>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="db-stats">
          {loadingStats ? (
            <><div className="db-stat-skeleton" /><div className="db-stat-skeleton" /><div className="db-stat-skeleton" /></>
          ) : stats ? (
            <>
              <StatCard icon={<IconCalendar />}  label="Sự kiện đang mở"   value={stats.events}  sub={stats.eventsDelta}  color="blue"   />
              <StatCard icon={<IconPackage />}   label="Gian hàng active"  value={stats.booths}  sub={stats.boothsDelta}  color="purple" />
              <StatCard icon={<IconHeadphone />} label="Lượt nghe hôm nay" value={typeof stats.listensToday === "number" ? stats.listensToday.toLocaleString() : stats.listensToday} sub={stats.listensDelta} color="green" />
            </>
          ) : null}
        </div>

        {/* ── Grid: chart + activity ── */}
        <div className="db-grid">

          {/* Biểu đồ */}
          <div className="db-card db-card--chart">
            <div className="db-card__head">
              <div>
                <h2 className="db-card__title">Lượt nghe 7 ngày qua</h2>
                <p className="db-card__sub">Tổng: <strong>{totalListens.toLocaleString()}</strong> lượt</p>
              </div>
              {stats && (
                <span className="db-trend"><IconTrendUp /> {stats.listensDelta ?? ""}</span>
              )}
            </div>
            {loadingChart
              ? <ChartSkeleton />
              : chartData.length === 0
                ? <p className="db-empty-text">Chưa có dữ liệu.</p>
                : <BarChart data={chartData} />
            }
          </div>

          {/* Hoạt động gần đây */}
          <div className="db-card db-card--activity">
            <div className="db-card__head">
              <h2 className="db-card__title">Hoạt động gần đây</h2>
            </div>
            {loadingActivity ? (
              <ListSkeleton rows={4} />
            ) : activity.length === 0 ? (
              <p className="db-empty-text">Chưa có hoạt động nào.</p>
            ) : (
              <div className="db-activity">
                {activity.map((item, idx) => (
                  <div key={item.id} className="db-activity__item">
                    <div className={`db-activity__dot db-activity__dot--${item.color}`}><IconDot /></div>
                    {idx < activity.length - 1 && <div className="db-activity__line" />}
                    <div className="db-activity__body">
                      <p className="db-activity__text">{item.text}</p>
                      <p className="db-activity__sub">{item.sub}</p>
                    </div>
                    <span className="db-activity__time">{item.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Top booths ── */}
        <div className="db-card db-card--full">
          <div className="db-card__head">
            <div>
              <h2 className="db-card__title">Top gian hàng hôm nay</h2>
              <p className="db-card__sub">Xếp theo lượt nghe</p>
            </div>
            <button className="db-link-btn" onClick={() => navigate("/admin/reports")}>
              Xem báo cáo đầy đủ <IconArrow />
            </button>
          </div>
          {loadingBooths ? (
            <ListSkeleton rows={5} />
          ) : topBooths.length === 0 ? (
            <p className="db-empty-text">Chưa có dữ liệu.</p>
          ) : (
            <div className="db-top-list">
              {topBooths.map((booth, idx) => (
                <div key={booth.id} className="db-top-item">
                  <span className={`db-top-rank ${idx === 0 ? "db-top-rank--gold" : idx === 1 ? "db-top-rank--silver" : idx === 2 ? "db-top-rank--bronze" : ""}`}>
                    {idx + 1}
                  </span>
                  <div className="db-top-info">
                    <span className="db-top-name">{booth.name}</span>
                    <span className="db-top-event">{booth.event}</span>
                  </div>
                  <div className="db-top-bar-wrap">
                    <div className="db-top-bar" style={{ width: `${booth.pct}%` }} />
                  </div>
                  <span className="db-top-visits">{booth.visits.toLocaleString()} lượt</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}