import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";
import Toast, { useToast } from "../../components/Toast/Toast";
import eventService from "../../services/eventService";
import "./MapPage.css";

// ── Màu theo category ─────────────────────────────────────────
const CATEGORY_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#8b5cf6", "#ec4899", "#14b8a6",
];

function getCategoryColor(categoryName, categories) {
  const idx = categories.indexOf(categoryName);
  return CATEGORY_COLORS[idx % CATEGORY_COLORS.length] ?? "#6b7280";
}

// ── Haversine distance (metres) ───────────────────────────────
function getDistance(lat1, lng1, lat2, lng2) {
  const R  = 6371e3;
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lng2 - lng1) * Math.PI / 180;
  const a  = Math.sin(dp/2)**2 + Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// ── Normalize GPS → SVG pixel (0..W, 0..H) ───────────────────
function gpsToSvg(lat, lng, bounds, W, H, padding = 32) {
  const { minLat, maxLat, minLng, maxLng } = bounds;
  const rangeW = maxLng - minLng || 0.001;
  const rangeH = maxLat - minLat || 0.001;
  const x = padding + ((lng - minLng) / rangeW) * (W - padding * 2);
  // lat tăng lên = đi lên trên SVG nên cần đảo
  const y = padding + ((maxLat - lat) / rangeH) * (H - padding * 2);
  return { x, y };
}

function getBounds(booths) {
  if (!booths.length) return { minLat: 0, maxLat: 1, minLng: 0, maxLng: 1 };
  const lats = booths.map(b => parseFloat(b.latitude));
  const lngs = booths.map(b => parseFloat(b.longitude));
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
}

const SVG_W = 460;
const SVG_H = 320;

export default function MapPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("event") || "1";
  const lang    = searchParams.get("lang")  || "vi";
  const { toasts, showToast } = useToast();

  const [booths,      setBooths]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [userPos,     setUserPos]     = useState(null);
  const [search,      setSearch]      = useState("");
  const [filter,      setFilter]      = useState("All");
  const [hovered,     setHovered]     = useState(null); // booth id
  const [highlighted, setHighlighted] = useState(null); // booth id
  const svgRef = useRef(null);

  // Lấy vị trí người dùng
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  // Lấy danh sách booths
  useEffect(() => {
    eventService.getBooths(eventId)
      .then((data) => setBooths(Array.isArray(data) ? data : []))
      .catch(() => showToast("Không thể tải danh sách gian hàng.", "error"))
      .finally(() => setLoading(false));
  }, [eventId]);

  // ── Tính toán ─────────────────────────────────────────────
  const categories = [...new Set(booths.map(b => b.categoryName).filter(Boolean))];
  const bounds     = getBounds(booths);

  const processed = booths
    .map(b => ({
      ...b,
      distance: userPos
        ? getDistance(userPos.lat, userPos.lng, parseFloat(b.latitude), parseFloat(b.longitude))
        : null,
      svgPos: gpsToSvg(parseFloat(b.latitude), parseFloat(b.longitude), bounds, SVG_W, SVG_H),
      color:  getCategoryColor(b.categoryName, categories),
    }))
    .filter(b => filter === "All" || b.categoryName === filter)
    .filter(b => !search || b.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));

  // Tất cả booths (không filter) để vẽ SVG
  const allMapped = booths.map(b => ({
    ...b,
    distance: userPos
      ? getDistance(userPos.lat, userPos.lng, parseFloat(b.latitude), parseFloat(b.longitude))
      : null,
    svgPos: gpsToSvg(parseFloat(b.latitude), parseFloat(b.longitude), bounds, SVG_W, SVG_H),
    color:  getCategoryColor(b.categoryName, categories),
  }));

  // Vị trí user trên SVG
  const userSvgPos = userPos
    ? gpsToSvg(userPos.lat, userPos.lng, bounds, SVG_W, SVG_H)
    : null;

  function handleBoothClick(booth) {
    navigate(`/booth/${booth.id}?lang=${lang}&event=${eventId}`);
  }

  function handleDotHover(boothId) {
    setHovered(boothId);
  }

  function handleListClick(booth) {
    setHighlighted(booth.id);
    // Scroll to top để thấy SVG
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setHighlighted(null), 2000);
  }

  return (
    <div className="map-page">
      <Toast toasts={toasts} />

      {/* Header */}
      <div className="map-header">
        <button className="map-header__back" onClick={() => navigate(`/?event=${eventId}&lang=${lang}`)}>
          ⬅️ Quay lại
        </button>
        <h3 className="map-header__title">🗺️ Sơ Đồ Sự Kiện</h3>
      </div>

      {/* Search */}
      <div className="map-search">
        <input
          type="text"
          placeholder="🔍 Tìm gian hàng..."
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
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`map-filter__btn ${filter === cat ? "map-filter__btn--active" : "map-filter__btn--inactive"}`}
          >
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
          <div className="map-svg-wrap" ref={svgRef}>
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="map-svg"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Nền */}
              <rect width={SVG_W} height={SVG_H} className="map-svg__bg" rx="12" />

              {/* Grid nhẹ */}
              {[1,2,3,4].map(i => (
                <line key={`h${i}`} x1={0} y1={SVG_H*i/5} x2={SVG_W} y2={SVG_H*i/5}
                  stroke="#cde8cd" strokeWidth="1" />
              ))}
              {[1,2,3,4,5].map(i => (
                <line key={`v${i}`} x1={SVG_W*i/6} y1={0} x2={SVG_W*i/6} y2={SVG_H}
                  stroke="#cde8cd" strokeWidth="1" />
              ))}

              {/* Booth dots */}
              {allMapped.map(b => {
                const isHighlighted = highlighted === b.id;
                const isHovered     = hovered === b.id;
                const r = isHighlighted ? 14 : isHovered ? 12 : 9;
                const inFilter = processed.some(p => p.id === b.id);

                return (
                  <g
                    key={b.id}
                    className="map-dot"
                    onClick={() => handleBoothClick(b)}
                    onMouseEnter={() => handleDotHover(b.id)}
                    onMouseLeave={() => setHovered(null)}
                    style={{ opacity: inFilter ? 1 : 0.3 }}
                  >
                    {/* Halo khi highlight */}
                    {isHighlighted && (
                      <circle cx={b.svgPos.x} cy={b.svgPos.y} r={r + 6}
                        fill={b.color} opacity={0.25} />
                    )}
                    <circle
                      cx={b.svgPos.x} cy={b.svgPos.y} r={r}
                      fill={b.color}
                      stroke="#fff" strokeWidth="2"
                    />
                    {/* Label tên booth */}
                    {(isHovered || isHighlighted) && (
                      <text
                        x={b.svgPos.x} y={b.svgPos.y - r - 5}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#333"
                        fontWeight="bold"
                        style={{ pointerEvents: "none" }}
                      >
                        {b.name.length > 15 ? b.name.slice(0, 14) + "…" : b.name}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Vị trí user - chấm xanh */}
              {userSvgPos && (
                <g>
                  <circle cx={userSvgPos.x} cy={userSvgPos.y} r={14}
                    fill="#2563eb" opacity={0.2} />
                  <circle cx={userSvgPos.x} cy={userSvgPos.y} r={8}
                    fill="#2563eb" stroke="#fff" strokeWidth="2" />
                  <text x={userSvgPos.x} y={userSvgPos.y - 14}
                    textAnchor="middle" fontSize="10" fill="#2563eb" fontWeight="bold">
                    Bạn
                  </text>
                </g>
              )}
            </svg>
          </div>

          {/* Legend */}
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
          Gian hàng {userPos ? "gần bạn" : "trong sự kiện"} ({processed.length})
        </h4>

        {processed.length === 0 ? (
          <p className="map-list__empty">Không tìm thấy gian hàng nào.</p>
        ) : (
          processed.map(b => (
            <div
              key={b.id}
              className={`map-booth-card ${highlighted === b.id ? "map-booth-card--highlighted" : ""}`}
              onClick={() => { handleListClick(b); setTimeout(() => handleBoothClick(b), 300); }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 12, height: 12, borderRadius: "50%",
                  backgroundColor: b.color, flexShrink: 0,
                }} />
                <div>
                  <div className="map-booth-card__name">{b.name}</div>
                  {b.categoryName && <div className="map-booth-card__category">{b.categoryName}</div>}
                  {b.distance !== null && <div className="map-booth-card__distance">📍 Cách {b.distance}m</div>}
                </div>
              </div>
              <span className="map-booth-card__arrow">➡️</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}