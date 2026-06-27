// StatisticPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import StatCard from '../../components/StatCard/StatCard';
import Toast, { useToast } from '../../components/Toast/Toast';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import vendorService from '../../services/vendorService';
import styles from './StatisticPage.module.css';

const IconHeadphone = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>;
const IconClock     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconGlobe     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const IconBack      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>;

const LANG_NAMES = { vi:'Tiếng Việt', en:'English', ja:'日本語', ko:'한국어', zh:'中文' };

function formatDur(sec) {
  if (!sec) return '—';
  const m = Math.floor(sec / 60), s = sec % 60;
  return m > 0 ? `${m} phút ${s} giây` : `${s} giây`;
}

function DayBarChart({ data = [] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const [hov, setHov] = useState(null);
  return (
    <div className={styles.dayChart}>
      <div className={styles.dayBars}>
        {data.map((d, i) => (
          <div key={i} className={styles.dayCol}
            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
            {hov === i && (
              <div className={styles.tooltip}>{d.count} lượt<br /><span>{d.date}</span></div>
            )}
            <div className={styles.dayBar}
              style={{ height: `${Math.max(3, Math.round((d.count / max) * 100))}%`,
                       background: hov === i ? '#4f46e5' : '#6366f1' }} />
            <span className={styles.dayLabel}>{d.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HourBarChart({ data = [] }) {
  const max = Math.max(...data.map(d => d.views), 1);
  const [hov, setHov] = useState(null);
  return (
    <div className={styles.hourChart}>
      <div className={styles.hourBars}>
        {data.map((d, i) => (
          <div key={i} className={styles.hourCol}
            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
            {hov === i && (
              <div className={styles.tooltip}>{d.views}<br /><span>{d.hour}</span></div>
            )}
            <div className={styles.hourBar2}
              style={{ height: `${Math.max(3, Math.round((d.views / max) * 100))}%`,
                       background: hov === i ? '#10b981' : '#34d399' }} />
            <span className={styles.hourLabel2}>{d.hour}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StatisticPage() {
  const navigate = useNavigate();
  const { boothId } = useParams();
  const { toasts, showToast } = useToast();
  const showToastRef = useRef(showToast);
  useEffect(() => { showToastRef.current = showToast; }, [showToast]);

  const [range,   setRange]   = useState('7days');
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  // Dùng ref để tránh cascading renders khi gọi setState trong effect
  const rangeRef   = useRef(range);
  const boothIdRef = useRef(boothId);
  useEffect(() => { rangeRef.current = range; }, [range]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    vendorService.getAnalyticsStats(boothIdRef.current, rangeRef.current)
      .then((a) => {
        if (cancelled) return;
        setStats(a);
      })
      .catch(() => showToastRef.current('Không thể tải dữ liệu thống kê.', 'error'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [boothId, range]);

  return (
    <Layout>
      <div className={styles.page}>
        <Toast toasts={toasts} />

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.backBtn} onClick={() => navigate('/vendor/dashboard')}>
              <IconBack /> Tổng quan
            </button>
            <div>
              <h1 className={styles.title}>📊 Thống kê chi tiết</h1>
              <p className={styles.sub}>Theo dõi hiệu suất gian hàng theo từng chỉ số.</p>
            </div>
          </div>
          <select className={styles.select} value={range} onChange={e => setRange(e.target.value)}>
            <option value="7days">7 ngày qua</option>
            <option value="30days">30 ngày qua</option>
          </select>
        </div>

        {loading ? (
          <div className={styles.centered}>
            <LoadingSpinner size="lg" label="Đang tải thống kê..." />
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className={styles.statsGrid}>
              <StatCard icon={<IconHeadphone />} label="Tổng lượt nghe"
                value={(stats?.total ?? 0).toLocaleString()} color="green" />
              <StatCard icon={<IconClock />} label="Thời lượng trung bình"
                value={formatDur(stats?.avgDurationSec)} color="purple" />
              <StatCard icon={<IconGlobe />} label="Ngôn ngữ phổ biến"
                value={LANG_NAMES[stats?.topLanguage] ?? stats?.topLanguage ?? '—'} color="orange" />
            </div>

            {/* Biểu đồ theo ngày */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>
                📅 Lượt nghe theo ngày
                <span className={styles.cardSub}> — Tổng: {(stats?.total ?? 0).toLocaleString()} lượt</span>
              </h2>
              {stats?.chartByDay?.length > 0
                ? <DayBarChart data={stats.chartByDay} />
                : <p className={styles.empty}>Chưa có dữ liệu.</p>}
            </div>

            {/* 2 cột */}
            <div className={styles.twoCol}>
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>⏱️ Lượt nghe theo khung giờ</h2>
                {stats?.hourlyData?.length > 0
                  ? <HourBarChart data={stats.hourlyData} />
                  : <p className={styles.empty}>Chưa có dữ liệu.</p>}
              </div>

              <div className={styles.card}>
                <h2 className={styles.cardTitle}>🌐 Phân bổ ngôn ngữ</h2>
                {stats?.langData?.length > 0 ? (
                  <table className={styles.table}>
                    <thead>
                      <tr><th>Ngôn ngữ</th><th>Lượt</th><th>Tỷ lệ</th><th></th></tr>
                    </thead>
                    <tbody>
                      {stats.langData.map((l, i) => (
                        <tr key={i}>
                          <td><strong>{LANG_NAMES[l.languageCode] ?? l.languageCode}</strong></td>
                          <td>{l.count.toLocaleString()}</td>
                          <td><span className={styles.pct}>{l.pct}%</span></td>
                          <td>
                            <div className={styles.tableBarWrap}>
                              <div className={styles.tableBar} style={{ width: `${l.pct}%` }} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p className={styles.empty}>Chưa có dữ liệu.</p>}
              </div>
            </div>

            {/* Top giờ cao điểm */}
            {stats?.hourlyData?.length > 0 && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>🏆 Khung giờ có nhiều người nghe nhất</h2>
                <div className={styles.topHours}>
                  {[...stats.hourlyData]
                    .sort((a, b) => b.views - a.views)
                    .slice(0, 3)
                    .map((h, i) => (
                      <div key={i} className={`${styles.topHourItem} ${i === 0 ? styles.topFirst : ''}`}>
                        <span className={styles.topRank}>{['🥇', '🥈', '🥉'][i]}</span>
                        <span className={styles.topHour}>{h.hour}</span>
                        <span className={styles.topViews}>{h.views} lượt</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}