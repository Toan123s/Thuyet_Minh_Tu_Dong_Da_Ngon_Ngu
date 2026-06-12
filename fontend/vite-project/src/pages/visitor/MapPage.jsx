import { useNavigate } from "react-router-dom";

export default function MapPage() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", marginTop: "80px" }}>
      <h2>🗺 Chọn gian hàng</h2>

      <button onClick={() => navigate("/booth/1")}>
        VinAI
      </button>

      <br /><br />

      <button onClick={() => navigate("/booth/2")}>
        FPT Software
      </button>
    </div>
  );
}