import { useNavigate } from "react-router-dom";

export default function MapPage() {

  const navigate = useNavigate();

  // ✅ dữ liệu cực an toàn
  const booths = [
    { id: "1", name: "Pizza", distance: 120 },
    { id: "2", name: "Pho", distance: 200 },
    { id: "3", name: "Coffee", distance: 300 }
  ];

  return (
    <div style={{ padding: 20 }}>

      <h2>🗺 Event Map</h2>

      {/* ✅ map giả đơn giản */}
      <div style={{
        height: 200,
        background: "#ddd",
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        MAP VIEW
      </div>

      <h3>Nearby Booths</h3>

      {booths.map((b) => (
        <div key={b.id} style={{ marginBottom: 10 }}>
          {b.name} - {b.distance}m

          <button
            style={{ marginLeft: 10 }}
            onClick={() => navigate("/booth/" + b.id)}
          >
            View
          </button>
        </div>
      ))}

    </div>
  );
}