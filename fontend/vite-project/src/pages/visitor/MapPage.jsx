import { useNavigate } from "react-router-dom";

export default function MapPage() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", marginTop: "80px" }}>
      <h2>🗺 Bản đồ gian hàng</h2>
      <p>Chọn gian hàng để nghe thuyết minh</p>

      <button onClick={() => navigate("/booth/1")}>
        Gian hàng VinAI
      </button>

      <br /><br />

      <button onClick={() => navigate("/booth/2")}>
        Gian hàng FPT
      </button>
    </div>
  );
}
