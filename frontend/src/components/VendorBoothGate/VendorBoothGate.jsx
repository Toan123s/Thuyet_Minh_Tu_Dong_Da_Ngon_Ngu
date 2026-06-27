import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import vendorService from "../../services/vendorService";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";

/**
 * Sidebar không biết trước boothId của vendor đang đăng nhập, nên các
 * link "Nội dung / Media / Thống kê" trỏ tới đường dẫn KHÔNG có id
 * (/vendor/narrations, /vendor/media, /vendor/stats).
 * Component này tự gọi API lấy booth của vendor hiện tại, rồi chuyển
 * hướng vào đúng trang có id (/vendor/narrations/:boothId, ...).
 *
 * Props:
 *  - target: "narrations" | "media" | "stats"
 */
export default function VendorBoothGate({ target }) {
  const [state, setState] = useState({ loading: true, boothId: null, error: false });

  useEffect(() => {
    vendorService.getMyBooth()
      .then((booth) => setState({ loading: false, boothId: booth?.id ?? null, error: false }))
      .catch(() => setState({ loading: false, boothId: null, error: true }));
  }, []);

  if (state.loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
        <LoadingSpinner size="lg" label="Đang mở gian hàng của bạn..." />
      </div>
    );
  }

  if (!state.boothId) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏪</div>
        <p style={{ color: "#6b7280", fontWeight: 600 }}>
          {state.error
            ? "Không thể kết nối tới máy chủ."
            : "Bạn chưa được Admin gán gian hàng nào."}
        </p>
      </div>
    );
  }

  return <Navigate to={`/vendor/${target}/${state.boothId}`} replace />;
}
