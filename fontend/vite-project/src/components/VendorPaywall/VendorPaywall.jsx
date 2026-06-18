import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../services/apiClient";
import authService from "../../services/authService";
import Toast, { useToast } from "../Toast/Toast";
import "./VendorPaywall.css";

const QR_URL = "https://img.vietqr.io/image/MB-1234567899999-qr_only.png?addInfo=Phi%20Vendor";

export default function VendorPaywall({ children }) {
  const navigate = useNavigate();
  const { toasts, showToast } = useToast();
  const [isPaid,   setIsPaid]   = useState(null); // null = loading
  const [loading,  setLoading]  = useState(true);
  const [paying,   setPaying]   = useState(false);

  const user = authService.getCurrentUser();

  useEffect(() => {
    if (!user?.accountId) { navigate("/login"); return; }
    apiClient.get(`/register/status/${user.accountId}`)
      .then(res => setIsPaid(res.isPaid))
      .catch(() => setIsPaid(false))
      .finally(() => setLoading(false));
  }, [user?.accountId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleConfirmPayment() {
    setPaying(true);
    try {
      await apiClient.post("/register/pay", { accountId: user.accountId });
      showToast("Thanh toán thành công! Tài khoản đã được kích hoạt.", "success");
      setTimeout(() => setIsPaid(true), 1500);
    } catch {
      showToast("Xác nhận thất bại. Vui lòng thử lại.", "error");
    } finally {
      setPaying(false);
    }
  }

  // Đang kiểm tra
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center", color: "#6b7280" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <p>Đang kiểm tra tài khoản...</p>
        </div>
      </div>
    );
  }

  // Đã thanh toán → hiển thị nội dung bình thường
  if (isPaid) return <>{children}</>;

  // Chưa thanh toán → hiển thị nội dung mờ + modal chặn
  return (
    <div className="vp-wrapper">
      <Toast toasts={toasts} />

      {/* Nội dung bị mờ phía sau */}
      <div className="vp-blur">{children}</div>

      {/* Modal chặn */}
      <div className="vp-overlay">
        <div className="vp-modal">
          <div className="vp-modal__header">
            <div className="vp-modal__icon">🔒</div>
            <h3 className="vp-modal__title">Kích Hoạt Tài Khoản Vendor</h3>
            <p className="vp-modal__sub">
              Tài khoản của bạn chưa được kích hoạt. Vui lòng thanh toán phí sử dụng địa điểm để truy cập toàn bộ tính năng.
            </p>
          </div>

          <div className="vp-modal__qr">
            <img src={QR_URL} alt="VietQR" />
          </div>

          <div className="vp-modal__info">
            <div>Ngân hàng: <b>MB Bank</b></div>
            <div>Số TK: <b>1234567899999</b></div>
            <div>Nội dung: <b>Phi Vendor {user?.username}</b></div>
            <div>Số tiền: <b>500,000 VND</b></div>
          </div>

          <button className="vp-modal__btn" onClick={handleConfirmPayment} disabled={paying}>
            {paying ? "Đang xác nhận..." : "✅ Tôi đã chuyển khoản thành công"}
          </button>

          <button className="vp-modal__logout"
            onClick={() => { localStorage.clear(); navigate("/login"); }}>
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}