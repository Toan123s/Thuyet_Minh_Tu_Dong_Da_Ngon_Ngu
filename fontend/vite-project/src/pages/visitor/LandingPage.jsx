import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", marginTop: "120px" }}>
      <h1>🎙 AutoNarration System</h1>
      <p>Hệ thống thuyết minh tự động đa ngôn ngữ</p>

      <button
        onClick={() => navigate("/payment")}
        style={{
          padding: "12px 30px",
          background: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "6px",
          marginTop: "20px"
        }}
      >
        Bắt đầu
      </button>
    </div>
  );
}