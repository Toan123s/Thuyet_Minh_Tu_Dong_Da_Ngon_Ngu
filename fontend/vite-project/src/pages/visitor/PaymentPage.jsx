import { useNavigate, useSearchParams } from "react-router-dom";
import Toast, { useToast } from "../../components/Toast/Toast";
import { savePaidAccess, isPaidAndValid } from "../../untils/helpers";
import "./PaymentPage.css";

export default function PaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toasts, showToast } = useToast();

  const lang    = searchParams.get("lang")  || "vi";
  const eventId = searchParams.get("event") || "1";

  // Nếu đã thanh toán rồi → redirect thẳng
  if (isPaidAndValid(eventId)) {
    navigate(`/location?lang=${lang}&event=${eventId}`, { replace: true });
    return null;
  }

  const qrUrl = `https://img.vietqr.io/image/MB-1234567899999-qr_only.png?addInfo=Tham%20Du%20Su%20Kien%20${eventId}`;

  function handleConfirm() {
    savePaidAccess(eventId);
    showToast("Thanh toán thành công! Đang chuyển hướng...", "success");
    setTimeout(() => navigate(`/location?lang=${lang}&event=${eventId}`), 1500);
  }

  return (
    <div className="pay-container">
      <Toast toasts={toasts} />
      <div className="pay-card">
        <button
          className="pay-back"
          onClick={() => navigate(`/?event=${eventId}&lang=${lang}`)}
        >
          ⬅️ Quay lại
        </button>

        <h2 className="pay-title">💳 Phí Sử Dụng Thuyết Minh</h2>
        <p className="pay-subtitle">
          Thanh toán 1 lần để nghe thuyết minh <b>tất cả gian hàng</b> trong <b>24 giờ</b>
        </p>

        <div className="pay-qr">
          <img src={qrUrl} alt="QR Payment" />
        </div>

        <div className="pay-info">
          <div>Ngân hàng: <b>MB Bank</b></div>
          <div>Số TK: <b>1234567899999</b></div>
          <div>Nội dung: <b>Thuyet Minh {eventId}</b></div>
          <div>Số tiền: <b>20,000 VND</b></div>
          <div style={{ marginTop: 6, color: "#2563eb" }}>
            ⏱ Hiệu lực: <b>24 giờ</b> kể từ lúc thanh toán
          </div>
        </div>

        <button className="pay-btn" onClick={handleConfirm}>
          ✅ Tôi đã chuyển khoản thành công
        </button>
      </div>
    </div>
  );
}