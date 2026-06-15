import React, { useState, useEffect } from 'react';
import styles from './VendorDashboardPage.module.css';
import { useNavigate } from 'react-router-dom';
// Import shipper kết nối API vào đây
import vendorService from '../../services/vendorService';

const VendorDashboardPage = () => {
  const navigate = useNavigate();

  // 1. Tạo các State để quản lý dữ liệu động và trạng thái tải trang
  const [vendorData, setVendorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Giả lập mã Vendor đăng nhập thực tế (sau này lấy từ JWT Token hoặc Context)
  const currentVendorId = "V001"; 

  // 2. Dùng useEffect để tự động kích hoạt lấy dữ liệu khi trang vừa load xong
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true); // Bật trạng thái đang tải dữ liệu
        
        // Gọi hàm từ vendorService để bắn request lên Backend ASP.NET Core
        const dataFromServer = await vendorService.getDashboardStats(currentVendorId);
        
        // Hứng được dữ liệu từ Backend trả về thành công thì đập vào State
        setVendorData(dataFromServer);
      } catch (err) {
        // Nếu Backend sập hoặc lỗi mạng thì hứng lỗi ở đây để giao diện không bị crash
        setError("Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại Backend!");
      } finally {
        setLoading(false); // Tắt trạng thái tải trang dù thành công hay thất bại
      }
    };

    fetchDashboardData();
  }, []); // Mảng rỗng đảm bảo hàm này chỉ chạy duy nhất 1 lần khi mở trang

  // 3. Xử lý giao diện chờ đợi khi đang tải dữ liệu (UX nâng cao)
  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.welcomeText}>🔄 Đang tải số liệu gian hàng từ máy chủ...</p>
      </div>
    );
  }

  // 4. Xử lý giao diện báo lỗi nếu Backend bị sập (UX nâng cao)
  if (error) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>⚠️ Đã xảy ra lỗi</h2>
        <p className={styles.welcomeText} style={{ color: '#dc2626' }}>{error}</p>
        <button className={styles.btn} onClick={() => window.location.reload()}>🔄 Thử lại</button>
      </div>
    );
  }

  // 5. Giao diện chính hiển thị khi đã có dữ liệu thật từ database đổ về
  return (
    <div className={styles.container}>
      {/* Tiêu đề trang tổng quan */}
      <h1 className={styles.title}>Tổng quan cá nhân 👋</h1>
      <p className={styles.welcomeText}>
        Xin chào, đại diện thương hiệu <span className={styles.brandName}>{vendorData?.username}</span>!
      </p>
      
      {/* Khối hiển thị các số liệu nhanh */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h4 className={styles.cardLabel}>Gian hàng hoạt động</h4>
          <p className={`${styles.cardValue} ${styles.textPrimary}`}>{vendorData?.stats.activeBooths}</p>
        </div>
        
        <div className={styles.statCard}>
          <h4 className={styles.cardLabel}>Lượt nghe hôm nay</h4>
          <p className={`${styles.cardValue} ${styles.textSuccess}`}>{vendorData?.stats.todayViews}</p>
        </div>

        <div className={styles.statCard}>
          <h4 className={styles.cardLabel}>Ngôn ngữ đã dịch</h4>
          <p className={`${styles.cardValue} ${styles.textWarning}`}>{vendorData?.stats.languages}</p>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Gian hàng của tôi</h2>

      {/* Danh sách các gian hàng lấy từ database thật */}
      {vendorData?.booths.map((booth) => (
        <div key={booth.id} className={styles.boothCard}>
          <h3 className={styles.boothName}>📦 {booth.name}</h3>
          <p className={styles.eventName}>Sự kiện: {booth.eventName}</p>
          
          {/* Cụm nút bấm điều hướng động theo ID từng booth */}
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
};

export default VendorDashboardPage;