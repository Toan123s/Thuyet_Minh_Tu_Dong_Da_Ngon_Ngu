import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>🎙 AutoNarration System</h1>
      <p>Hệ thống thuyết minh tự động đa ngôn ngữ</p>

      <button
        onClick={() => navigate("/location")}
        style={{ padding: "12px 25px" }}
      >
        Bắt đầu
      </button>
    </div>
  );
}
