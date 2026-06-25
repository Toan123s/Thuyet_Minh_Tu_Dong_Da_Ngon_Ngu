import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";
import Toast, { useToast } from "../../components/Toast/Toast";
import { useLanguage } from "../../hooks/useLanguage";
import eventService from "../../services/eventService";
import GoogleMap from "../../components/GoogleMap/GoogleMap";
import "./MapPage.css";


const CATEGORY_COLORS = [
  "#6366f1", "#f97316", "#22c55e", "#eab308",
  "#ec4899", "#14b8a6", "#ef4444", "#8b5cf6",
];

function getCategoryColor(categoryName, categories) {
  const idx = categories.indexOf(categoryName);
  return CATEGORY_COLORS[idx % CATEGORY_COLORS.length] ?? "#6b7280";
}

function getDistance(lat1, lng1, lat2, lng2) {
  const R  = 6371e3;
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lng2 - lng1) * Math.PI / 180;
  const a  = Math.sin(dp/2)**2 + Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}


export default function MapPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("event") || "1";

  // ── Ngôn ngữ: nguồn sự thật duy nhất, dùng chung với LandingPage + BoothPage ──
  const { lang } = useLanguage();

  const { toasts, showToast } = useToast();

  const [booths,      setBooths]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [userPos,     setUserPos]     = useState(null);
  const [search,      setSearch]      = useState("");
  const [filter,      setFilter]      = useState("All");
  const [highlighted, setHighlighted] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    // watchPosition thay vì getCurrentPosition 1 lần — để chấm "vị trí bạn"
    // và vòng tròn đỏ "đang trong phạm vi" cập nhật theo thời gian thực khi
    // người dùng di chuyển, không cần load lại trang.
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}, // im lặng nếu user từ chối — map vẫn hiển thị booth không kèm khoảng cách
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    eventService.getBooths(eventId)
      .then((data) => {
        console.table(data);

        setBooths(
          Array.isArray(data)
            ? data
            : []
        );
      })
      .catch(() => showToast("Không thể tải danh sách gian hàng.", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const categories = [...new Set(booths.map(b => b.categoryName).filter(Boolean))];

    const allMapped = booths.map((b) => {
      const lat = parseFloat(b.latitude);
      const lng = parseFloat(b.longitude);
      const radius = parseFloat(b.radius) || 15;

      const distance = userPos
        ? getDistance(
            userPos.lat,
            userPos.lng,
            lat,
            lng
          )
        : null;

      return {
        ...b,
        lat,
        lng,
        radius,
        distance,
        inRange:
          distance !== null &&
          distance <= radius,

        color: getCategoryColor(
          b.categoryName,
          categories
        ),
      };
    });

  const processed = allMapped
    .filter(b => filter === "All" || b.categoryName === filter)
    .filter(b => !search || b.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));

  function handleBoothClick(booth) {
    navigate(`/booth/${booth.id}?event=${eventId}&lang=${lang}`);
  }

  function handleListClick(booth) {
    setHighlighted(booth.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setHighlighted(null), 2000);
  }

  return (
    <div className="map-page">
      <Toast toasts={toasts} />

      {/* Header */}
      <div className="map-header">
        <button className="map-header__back" onClick={() => navigate(`/?event=${eventId}&lang=${lang}`)}>
          ← Quay lại
        </button>
        <h3 className="map-header__title">🗺️ Sơ Đồ Sự Kiện</h3>
      </div>

      <p className="map-hint">
        💡 Hệ thống tự động phát thuyết minh khi bạn đến gần gian hàng — bạn cũng có thể bấm vào để xem trước.
      </p>

      {/* Search */}
      <div className="map-search">
        <input
          type="text"
          placeholder="Tìm gian hàng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="map-search__input"
        />
      </div>

      {/* Filter */}
      <div className="map-filter">
        <button
          className={`map-filter__btn ${filter === "All" ? "map-filter__btn--active" : "map-filter__btn--inactive"}`}
          onClick={() => setFilter("All")}
        >
          Tất cả
        </button>
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`map-filter__btn ${filter === cat ? "map-filter__btn--active" : "map-filter__btn--inactive"}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* SVG Map */}
      {loading ? (
        <div className="map-loading">
          <LoadingSpinner size="lg" label="Đang tải sơ đồ..." />
        </div>
      ) : (
        <>
          <GoogleMap
            booths={processed}
            userPosition={userPos}
            onMarkerClick={(boothId) => {
              const booth = processed.find(
                (b) => b.id === boothId
              );

              if (booth) {
                handleBoothClick(booth);
              }
            }}
/>

          {categories.length > 0 && (
            <div className="map-legend">
              {categories.map((cat, i) => (
                <div key={cat} className="map-legend__item">
                  <div className="map-legend__dot"
                    style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                  <span>{cat}</span>
                </div>
              ))}
              {userPos && (
                <div className="map-legend__item">
                  <div className="map-legend__dot" style={{ backgroundColor: "#2563eb" }} />
                  <span>Vị trí của bạn</span>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Booth list */}
      <div className="map-list">
        <h4 className="map-list__title">
          {userPos ? "📍 Gần bạn nhất" : "🏪 Gian hàng"} ({processed.length})
        </h4>

        {processed.length === 0 ? (
          <p className="map-list__empty">Không tìm thấy gian hàng nào.</p>
        ) : (
          processed.map(b => (
            <div key={b.id}
              className={`map-booth-card ${highlighted === b.id ? "map-booth-card--highlighted" : ""}`}
              onClick={() => { handleListClick(b); setTimeout(() => handleBoothClick(b), 400); }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "10px",
                  backgroundColor: b.color + "20",
                  border: `2px solid ${b.color}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: "50%",
                    backgroundColor: b.color,
                  }} />
                </div>
                <div>
                  <div className="map-booth-card__name">{b.name}</div>
                  {b.categoryName && <div className="map-booth-card__category">🏷 {b.categoryName}</div>}
                  {b.distance !== null && (
                    <div className="map-booth-card__distance">📍 Cách {b.distance}m</div>
                  )}
                </div>
              </div>
              <span className="map-booth-card__arrow">›</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}