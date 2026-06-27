import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";
import Toast, { useToast } from "../../components/Toast/Toast";
import LanguageSelector from "../../components/LanguageSelector/LanguageSelector";
import { useLanguage } from "../../hooks/useLanguage";
import { t } from "../../lang";
import eventService from "../../services/eventService";
import GoogleMap from "../../components/GoogleMap/GoogleMap";
import "./MapPage.css";

const CATEGORY_COLORS = [
  "#6366f1","#f97316","#22c55e","#eab308",
  "#ec4899","#14b8a6","#ef4444","#8b5cf6",
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
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

export default function MapPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("event") || "1";
  const { lang, setLang } = useLanguage();
  const { toasts, showToast } = useToast();

  const [booths,      setBooths]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [userPos,     setUserPos]     = useState(null);
  const [search,      setSearch]      = useState("");
  const [filter,      setFilter]      = useState("All");
  const [highlighted, setHighlighted] = useState(null);
  const [panelOpen,   setPanelOpen]   = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const wid = navigator.geolocation.watchPosition(
      (p) => setUserPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(wid);
  }, []);

  useEffect(() => {
    eventService.getBooths(eventId)
      .then((data) => setBooths(Array.isArray(data) ? data : []))
      .catch(() => showToast("Không thể tải danh sách gian hàng.", "error"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const categories = [...new Set(booths.map(b => b.categoryName).filter(Boolean))];

  const allMapped = booths.map((b) => {
    const lat = parseFloat(b.latitude);
    const lng = parseFloat(b.longitude);
    const radius = parseFloat(b.radius) || 15;
    const distance = userPos ? getDistance(userPos.lat, userPos.lng, lat, lng) : null;
    return {
      ...b, lat, lng, radius, distance,
      inRange: distance !== null && distance <= radius,
      color: getCategoryColor(b.categoryName, categories),
    };
  });

  const processed = allMapped
    .filter(b => filter === "All" || b.categoryName === filter)
    .filter(b => !search || (b.boothName || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));

  function handleBoothClick(booth) {
    navigate(`/booth/${booth.id}?event=${eventId}&lang=${lang}`);
  }
  function handleListClick(booth) {
    setHighlighted(booth.id);
    setTimeout(() => setHighlighted(null), 2000);
  }

  function fmtDist(m) {
    return m < 1000 ? `${m}m` : `${(m/1000).toFixed(1)}km`;
  }

  return (
    <div className="mp-root">
      <Toast toasts={toasts} />

      {/* ── Topbar ─────────────────────────────── */}
      <div className="mp-topbar">
        <button
          className="mp-back-btn"
          onClick={() => navigate(`/?event=${eventId}&lang=${lang}`)}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span>{t(lang, "backEvent")}</span>
        </button>

        <div className="mp-search-wrap">
          <svg className="mp-search-icon" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder={t(lang, "searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mp-search-input"
          />
        </div>

        <LanguageSelector value={lang} onChange={setLang} />
      </div>

      {/* ── Filter chips ───────────────────────── */}
      <div className="mp-chips">
        <button
          className={`mp-chip ${filter === "All" ? "mp-chip--on" : ""}`}
          onClick={() => setFilter("All")}
        >
          {t(lang, "filterAll")}
        </button>
        {categories.map((cat, i) => (
          <button
            key={cat}
            className={`mp-chip ${filter === cat ? "mp-chip--on mp-chip--colored" : ""}`}
            style={filter === cat
              ? { background: CATEGORY_COLORS[i % CATEGORY_COLORS.length], borderColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }
              : { borderLeftColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
            onClick={() => setFilter(cat)}
          >
            <span
              className="mp-chip-dot"
              style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
            />
            {cat}
          </button>
        ))}
      </div>

      {/* ── Main body ──────────────────────────── */}
      <div className="mp-body">

        {/* Map area */}
        <div className="mp-map-area">
          {loading ? (
            <div className="mp-map-loading">
              <LoadingSpinner size="lg" label="Đang tải sơ đồ..." />
            </div>
          ) : (
            <>
              <GoogleMap
                booths={processed}
                userPosition={userPos}
                onMarkerClick={(boothId) => {
                  const b = processed.find(x => x.id === boothId);
                  if (b) handleBoothClick(b);
                }}
              />

              {/* Legend */}
              {categories.length > 0 && (
                <div className="mp-legend">
                  {categories.map((cat, i) => (
                    <div key={cat} className="mp-legend-item">
                      <span className="mp-legend-dot" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}/>
                      {cat}
                    </div>
                  ))}
                  {userPos && (
                    <div className="mp-legend-item">
                      <span className="mp-legend-dot" style={{ background: "#2563eb" }}/>
                      {t(lang, "yourLocation")}
                    </div>
                  )}
                </div>
              )}

              {/* Tip */}
              <div className="mp-tip">{t(lang, "mapTip")}</div>
            </>
          )}
        </div>

        {/* ── Right panel ──────────────────────── */}
        <div className={`mp-panel ${panelOpen ? "mp-panel--open" : ""}`}>
          {/* drag handle (mobile) */}
          <button className="mp-handle" onClick={() => setPanelOpen(p => !p)} aria-label="Toggle">
            <span className="mp-handle-bar"/>
          </button>

          <div className="mp-panel-head">
            <span className="mp-panel-title">
              {userPos ? t(lang, "nearYou") : t(lang, "allBooths")}
            </span>
            <span className="mp-panel-count">{processed.length}</span>
          </div>

          <div className="mp-panel-scroll">
            {processed.length === 0 ? (
              <p className="mp-empty">{t(lang, "noBooths")}</p>
            ) : (
              processed.map(b => (
                <div
                  key={b.id}
                  className={`mp-card ${highlighted === b.id ? "mp-card--hl" : ""}`}
                  onClick={() => { handleListClick(b); setTimeout(() => handleBoothClick(b), 300); }}
                >
                  <div className="mp-card-dot-wrap"
                    style={{ background: b.color + "20", borderColor: b.color + "60" }}>
                    <div className="mp-card-dot-inner" style={{ background: b.color }}/>
                  </div>

                  <div className="mp-card-info">
                    <div className="mp-card-name">{b.boothName}</div>
                    {b.categoryName && (
                      <div className="mp-card-cat"
                        style={{ color: b.color }}>
                        {b.categoryName}
                      </div>
                    )}
                    {b.distance !== null && (
                      <div className="mp-card-dist">
                        {b.inRange
                          ? <span className="mp-card-near">{t(lang, "inRange")}</span>
                          : `${fmtDist(b.distance)} · ${t(lang, "tapToListen")}`}
                      </div>
                    )}
                  </div>

                  <svg className="mp-card-arrow" width="15" height="15" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}