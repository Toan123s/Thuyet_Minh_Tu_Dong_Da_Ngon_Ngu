// VendorDashboardPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/StatCard/StatCard';
import Toast, { useToast } from '../../components/Toast/Toast';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import vendorService from '../../services/vendorService';
import authService from '../../services/authService';
import styles from './VendorDashboardPage.module.css';

const IconPackage   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l10 6.5v7L12 22 2 15.5v-7L12 2z"/><line x1="12" y1="22" x2="12" y2="11.5"/><polyline points="22 8.5 12 11.5 2 8.5"/></svg>;
const IconHeadphone = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>;
const IconGlobe     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;

export default function VendorDashboardPage() {
  const navigate = useNavigate();
  const { toasts, showToast } = useToast();

  const [vendor,       setVendor]       = useState(null);
  const [booths,       setBooths]       = useState([]);
  const [stats,        setStats]        = useState(null);
  const [loading,      setLoading]      = useState(true);

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    Promise.all([
      vendorService.getMe(),
      vendorService.getMyBooths(),
      vendorService.getStatsToday(),
    ])
      .then(([vendorData, boothsData, statsData]) => {
        setVendor(vendorData);
        setBooths(Array.isArray(boothsData) ? boothsData : []);
        setStats(statsData);
      })
      .catch(() => showToast("Không thể kết nối đến máy chủ!", "error"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.centered}>
          <LoadingSpinner size="lg" label="Đang tải số liệu gian hàng..." />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Toast toasts={toasts} />

      <h1 className={styles.title}>Tổng quan cá nhân 👋</h1>
      <p className={styles.welcomeText}>
        Xin chào, đại diện thương hiệu{" "}
        <span className={styles.brandName}>{vendor?.companyName ?? currentUser?.username}</span>!
      </p>

      <div className={styles.statsGrid}>
        <StatCard
          icon={<IconPackage />}
          label="Gian hàng hoạt động"
          value={stats?.totalBooths ?? 0}
          color="blue"
        />
        <StatCard
          icon={<IconHeadphone />}
          label="Lượt nghe hôm nay"
          value={stats?.listensToday ?? 0}
          color="green"
        />
        <StatCard
          icon={<IconGlobe />}
          label="Ngôn ngữ đã dịch"
          value={stats?.totalLanguages ?? 0}
          color="purple"
        />
      </div>

      <h2 className={styles.sectionTitle}>Gian hàng của tôi</h2>

      {booths.length === 0 && (
        <p className={styles.empty}>Chưa có gian hàng nào.</p>
      )}

      {booths.map((booth) => (
        <div key={booth.id} className={styles.boothCard}>
          <h3 className={styles.boothName}>📦 {booth.name}</h3>
          <p className={styles.eventName}>Sự kiện: {booth.eventName}</p>
          <div className={styles.btnGroup}>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => navigate(`/vendor/narrations/${booth.id}`)}
            >
              ✏️ Sửa nội dung thuyết minh
            </button>
            <button
              className={`${styles.btn} ${styles.btnSuccess}`}
              onClick={() => navigate(`/vendor/media/${booth.id}`)}
            >
              🎥 Quản lý hình ảnh/video
            </button>
            <button
              className={`${styles.btn} ${styles.btnWarning}`}
              onClick={() => navigate(`/vendor/stats/${booth.id}`)}
            >
              📊 Xem thống kê lượt nghe
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}