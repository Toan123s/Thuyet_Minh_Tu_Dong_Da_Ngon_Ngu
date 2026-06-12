import { useNavigate } from "react-router-dom";

export default function PaymentPage() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", marginTop: "80px" }}>
      <h2>💳 Thanh toán để sử dụng</h2>

      <p>Quét QR để thanh toán</p>

      <img
        src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:5173/location"
        alt="QR"
      />

      <br /><br />

      <button
        onClick={() => navigate("/location")}
        style={{
          padding: "10px 20px",
          background: "green",
          color: "white",
          border: "none",
          borderRadius: "5px"
        }}
      >
        ✅ Tôi đã thanh toán
      </button>
    </div>
  );
}