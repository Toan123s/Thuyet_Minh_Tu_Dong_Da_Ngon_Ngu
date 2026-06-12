import { useNavigate } from "react-router-dom";

export default function LocationPage() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", marginTop: "80px" }}>
      <h2>📍 Đang xác định vị trí...</h2>

      <button
        onClick={() => navigate("/map")}
        style={{ marginTop: "20px" }}
      >
        Tiếp tục
      </button>
    </div>
  );
}