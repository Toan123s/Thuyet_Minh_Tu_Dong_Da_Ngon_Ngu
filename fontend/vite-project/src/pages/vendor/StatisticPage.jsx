import React, { useState } from 'react';
import styles from './StatisticPage.module.css';
import { useNavigate } from 'react-router-dom';

const StatisticPage = () => {
  const navigate = useNavigate();
  const [filterRange, setFilterRange] = useState('7days');

  // Bổ sung thêm dữ liệu doanh thu giả lập theo yêu cầu của ông Toàn
  const statsData = {
    totalViews: '1,240 lượt',
    avgDuration: '2 phút 15 giây',
    topLanguage: 'Tiếng Việt (VI)',
    totalRevenue: '15,400,000 VND', // 💰 Thêm tổng doanh thu
    hourlyData: [
      { hour: '08h', views: 40 },
      { hour: '10h', views: 85 },
      { hour: '12h', views: 50 },
      { hour: '14h', views: 120 },
      { hour: '16h', views: 95 },
      { hour: '18h', views: 30 }
    ],
    languageData: [
      { lang: 'Tiếng Việt', code: 'VI', percentage: 60, color: '#4f46e5' },
      { lang: 'English', code: 'EN', percentage: 25, color: '#10b981' },
      { lang: '日本語', code: 'JA', percentage: 10, color: '#f59e0b' },
      { lang: '한국어', code: 'KO', percentage: 5, color: '#ef4444' }
    ],
    // Dữ liệu doanh thu theo thời gian
    revenueHistory: [
      { period: 'Hôm nay', amount: '1,200,000 VND', count: '120 lượt' },
      { period: 'Tuần này', amount: '5,800,000 VND', count: '580 lượt' },
      { period: 'Tháng này', amount: '15,400,000 VND', count: '1,240 lượt' }
    ]
  };

  return (
    <div className={styles.container}>
      <button className={styles.btnBack} onClick={() => navigate('/vendor/dashboard')}>
        ⬅️ Quay lại Tổng quan
      </button>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>📊 Thống kê số liệu & Doanh thu</h1>
          <p className={styles.subtitle}>Theo dõi hiệu suất lượt nghe và doanh thu thu phí dịch vụ thuyết minh tại gian hàng.</p>
        </div>
        <div className={styles.filterGroup}>
          <select className={styles.select} value={filterRange} onChange={(e) => setFilterRange(e.target.value)}>
            <option value="7days">7 ngày qua</option>
            <option value="30days">30 ngày qua</option>
            <option value="month">Tháng này</option>
          </select>
          <button className={styles.btnExport} onClick={() => alert('Đang xuất báo cáo tài chính...')}>
            📥 Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Grid Stat Cards (Tăng lên thành 4 cột để nhét card Doanh thu) */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.borderSuccess}`}>
          <h4 className={styles.cardLabel}>Tổng số lượt nghe</h4>
          <h2 className={`${styles.cardValue} ${styles.textSuccess}`}>{statsData.totalViews}</h2>
        </div>
        <div className={`${styles.statCard} ${styles.borderPrimary}`}>
          <h4 className={styles.cardLabel}>Thời lượng nghe trung bình</h4>
          <h2 className={`${styles.cardValue} ${styles.textPrimary}`}>{statsData.avgDuration}</h2>
        </div>
        <div className={`${styles.statCard} ${styles.borderWarning}`}>
          <h4 className={styles.cardLabel}>Ngôn ngữ phổ biến</h4>
          <h2 className={`${styles.cardValue} ${styles.textWarning}`}>{statsData.topLanguage}</h2>
        </div>
        {/* Card doanh thu mới tinh cực nổi bật */}
        <div className={`${styles.statCard} ${styles.borderDanger}`}>
          <h4 className={styles.cardLabel}>💰 Tổng doanh thu ước tính</h4>
          <h2 className={`${styles.cardValue} ${styles.textDanger}`}>{statsData.totalRevenue}</h2>
        </div>
      </div>

      <div className={styles.chartSection}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>⏱️ Lượt nghe theo khung giờ trong ngày</h3>
          <div className={styles.barChartHourly}>
            {statsData.hourlyData.map((item, index) => (
              <div key={index} className={styles.hourlyColumnWrapper}>
                <div className={styles.columnValue}>{item.views}</div>
                <div className={styles.hourlyBar} style={{ height: `${item.views > 100 ? 100 : item.views}%` }}></div>
                <div className={styles.columnLabel}>{item.hour}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Khối bảng thống kê doanh thu chi tiết ngày/tuần/tháng */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>💵 Chi tiết thu nhập theo chu kỳ</h3>
          <table className={styles.revenueTable}>
            <thead>
              <tr>
                <th>Khoảng thời gian</th>
                <th>Số lượt dịch vụ</th>
                <th>Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {statsData.revenueHistory.map((rev, index) => (
                <tr key={index}>
                  <td><strong>{rev.period}</strong></td>
                  <td>{rev.count}</td>
                  <td className={styles.textDanger}><strong>{rev.amount}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StatisticPage;