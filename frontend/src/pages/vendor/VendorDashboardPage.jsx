import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import StatCard from '../../components/StatCard/StatCard';
import Toast, { useToast } from '../../components/Toast/Toast';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import vendorService from '../../services/vendorService';
import styles from './VendorDashboardPage.module.css';

const IconClock     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconHeadphone = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>;
const IconGlobe     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;

// Định dạng giây -> "1p 23s" / "45s" cho dễ đọc
function formatDuration(sec) {
  if (!sec) return '0s';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}p ${s}s` : `${s}s`;
}

export default function VendorDashboardPage() {
  const navigate = useNavigate();
  const { toasts, showToast } = useToast();
  const auth = useAuth();

  const [vendor,  setVendor]  = useState(null);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) { navigate('/login'); return; }
    let cancelled = false;

    Promise.all([
      vendorService.getMe(),
      vendorService.getStatsToday(),
    ])
      .then(([vendorData, statsData]) => {
        if (cancelled) return;
        setVendor(vendorData);
        setStats(statsData);
      })
      .catch(() => showToast('Không thể kết nối đến máy chủ!', 'error'))
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!auth || loading) {
    return (
      <Layout>
        <div className={styles.page}>
          <div className={styles.centered}>
            <LoadingSpinner size="lg" label="Đang tải số liệu..." />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.page}>
        <Toast toasts={toasts} />

        <h1 className={styles.title}>Tổng quan cá nhân 👋</h1>
        <p className={styles.welcomeText}>
          Xin chào, đại diện thương hiệu{' '}
          <span className={styles.brandName}>{vendor?.companyName ?? auth.username}</span>!
        </p>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <StatCard icon={<IconHeadphone />} label="Lượt nghe hôm nay"        value={stats?.listensToday ?? 0}              color="green"  />
          <StatCard icon={<IconGlobe />}     label="Ngôn ngữ đã dịch"         value={stats?.totalLanguages ?? 0}            color="purple" />
          <StatCard icon={<IconClock />}     label="Thời gian nghe trung bình" value={formatDuration(stats?.avgDurationSec)} color="blue"   />
        </div>
      </div>
    </Layout>
  );
}