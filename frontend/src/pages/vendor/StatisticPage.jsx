// StatisticPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StatCard from '../../components/StatCard/StatCard';
import Toast, { useToast } from '../../components/Toast/Toast';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import vendorService from '../../services/vendorService';
import styles from './StatisticPage.module.css';

const IconHeadphone = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>;
const IconClock     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconGlobe     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const IconMoney     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;

function formatDuration(seconds) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m} phút ${s} giây`;
}

const LANG_NAMES = {
  vi: "Tiếng Việt",
  en: "English",
  ja: "日本語",
  ko: "한국어",
  zh: "中文",
};

export default function StatisticPage() {
  const navigate    = useNavigate();
  const { boothId } = useParams();
  const { toasts, showToast } = useToast();

  const [filterRange, setFilterRange] = useState('7days');
  const [stats,       setStats]       = useState(null);
  const [loading,     setLoading]     = useState(true);

  const fetchStats = useCallback(() => {
    setLoading(true);
    vendorService.getAnalyticsStats(boothId, filterRange)
      .then(setStats)
      .catch(() => showToast("Không thể tải dữ liệu thống kê.", "error"))
      .finally(() => setLoading(false));
  }, [boothId, filterRange]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  function handleExport() {
    showToast("Tính năng xuất báo cáo đang phát triển...", "warning");
  }

  return (
    <div className={styles.container}>
      <Toast toasts={toasts} />

      <button className={styles.btnBack} onClick={() => navigate('/vendor/dashboard')}>
        ⬅️ Quay lại Tổng quan
      </button>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>📊 Thống kê số liệu</h1>
          <p className={styles.subtitle}>
            Theo dõi hiệu suất lượt nghe tại gian hàng theo thời gian thực.
          </p>
        </div>
        <div className={styles.filterGroup}>
          <select
            className={styles.select}
            value={filterRange}
            onChange={(e) => setFilterRange(e.target.value)}
          >
            <option value="7days">7 ngày qua</option>
            <option value="30days">30 ngày qua</option>
            <option value="month">Tháng này</option>
          </select>
          <button className={styles.btnExport} onClick={handleExport}>
            📥 Xuất báo cáo
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
          <LoadingSpinner size="lg" label="Đang tải thống kê..." />
        </div>
      ) : (
        <>
          <div className={styles.statsGrid}>
            <StatCard
              icon={<IconHeadphone />}
              label="Tổng số lượt nghe"
              value={stats?.total?.toLocaleString() ?? "0"}
              color="green"
            />
            <StatCard
              icon={<IconClock />}
              label="Thời lượng nghe trung bình"
              value={formatDuration(stats?.avgDurationSec)}
              color="blue"
            />
            <StatCard
              icon={<IconGlobe />}
              label="Ngôn ngữ phổ biến"
              value={LANG_NAMES[stats?.topLanguage] ?? stats?.topLanguage ?? "—"}
              color="orange"
            />
          </div>

          <div className={styles.chartSection}>
            {/* Biểu đồ theo giờ */}
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>⏱️ Lượt nghe theo khung giờ</h3>
              {!stats?.hourlyData?.length ? (
                <p style={{ color: "#9ca3af", textAlign: "center", padding: "20px" }}>
                  Chưa có dữ liệu.
                </p>
              ) : (
                <div className={styles.barChartHourly}>
                  {stats.hourlyData.map((item, i) => {
                    const max = Math.max(...stats.hourlyData.map(x => x.views), 1);
                    return (
                      <div key={i} className={styles.hourlyColumnWrapper}>
                        <div className={styles.columnValue}>{item.views}</div>
                        <div
                          className={styles.hourlyBar}
                          style={{ height: `${Math.round((item.views / max) * 100)}%` }}
                        />
                        <div className={styles.columnLabel}>{item.hour}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Thống kê ngôn ngữ */}
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>🌐 Thống kê ngôn ngữ</h3>
              {!stats?.langData?.length ? (
                <p style={{ color: "#9ca3af", textAlign: "center", padding: "20px" }}>
                  Chưa có dữ liệu.
                </p>
              ) : (
                <table className={styles.revenueTable}>
                  <thead>
                    <tr>
                      <th>Ngôn ngữ</th>
                      <th>Lượt nghe</th>
                      <th>Tỷ lệ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.langData.map((lang, i) => (
                      <tr key={i}>
                        <td><strong>{LANG_NAMES[lang.languageCode] ?? lang.languageCode}</strong></td>
                        <td>{lang.count}</td>
                        <td className={styles.textDanger}><strong>{lang.pct}%</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}