import { useEffect, useRef, useState } from "react";
import "./GoogleMap.css";

/**
 * Props:
 *  -- CHẾ ĐỘ PICKER (BoothManagementPage) --
 *  - pickerMode    : boolean           — bật chế độ click chọn tọa độ
 *  - onMapClick    : ({ lat, lng }) => void
 *  - initialCenter : { lat, lng }      — vị trí ban đầu (default: HCM)
 *  - selectedPoint : { lat, lng } | null — hiện marker đã chọn
 *
 *  -- CHẾ ĐỘ HIỂN THỊ BOOTHS (MapPage) --
 *  - booths        : [{ id, name, latitude, longitude }]
 *  - userPosition  : { lat, lng } | null
 *  - onMarkerClick : (boothId) => void
 *
 * Cả hai chế độ đều đọc VITE_GOOGLE_MAPS_KEY từ import.meta.env
 */
export default function GoogleMap({
  pickerMode = false,
  onMapClick,
  initialCenter = null,
  selectedPoint = null,
  booths = [],
  userPosition = null,
  onMarkerClick,
}) {
  // 🔥 SỬA: tính center mặc định ở ĐÂY (sau khi `booths` đã có giá trị),
  // thay vì để trong default param phía trên — trước đây code tham chiếu
  // `booths` ngay trong default value của `initialCenter`, nhưng `booths`
  // lại được khai báo SAU `initialCenter` trong cùng danh sách destructuring
  // → JS ném "ReferenceError: Cannot access 'booths' before initialization"
  // ngay khi component được gọi mà không truyền initialCenter (đúng như
  // cách MapPage.jsx đang dùng) → cả bản đồ bị crash trắng.
  const initialCenterResolved = initialCenter
    ?? (booths.length
      ? { lat: parseFloat(booths[0].latitude), lng: parseFloat(booths[0].longitude) }
      : { lat: 15.8801, lng: 108.338 }); // fallback: trung tâm Phố cổ Hội An

  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef([]);
  const pickerMarkerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // ── Load Google Maps SDK once ──────────────────────────────
  useEffect(() => {
    if (window.google?.maps) { setLoading(false); return; }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
    if (!apiKey) {
      setError("Thiếu VITE_GOOGLE_MAPS_KEY trong .env");
      setLoading(false);
      return;
    }

    const existing = document.getElementById("gmap-script");
    if (existing) {
      existing.addEventListener("load", () => setLoading(false));
      return;
    }

    const script = document.createElement("script");
    script.id  = "gmap-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => setLoading(false);
    script.onerror = () => {
      setError("Không tải được Google Maps");
      setLoading(false);
    };
    document.head.appendChild(script);
  }, []);

  // ── Init map after SDK loaded ──────────────────────────────
  useEffect(() => {
    if (loading || error || !containerRef.current) return;
    if (mapRef.current) return; // already init

    mapRef.current = new window.google.maps.Map(containerRef.current, {
      center: initialCenterResolved,
      zoom: pickerMode ? 16 : 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    if (pickerMode) {
      mapRef.current.addListener("click", (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        onMapClick?.({ lat, lng });

        // Move or create picker marker
        if (pickerMarkerRef.current) {
          pickerMarkerRef.current.setPosition({ lat, lng });
        } else {
          pickerMarkerRef.current = new window.google.maps.Marker({
            position: { lat, lng },
            map: mapRef.current,
            title: "Vị trí đã chọn",
            animation: window.google.maps.Animation.DROP,
          });
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, error]);

  // ── Sync selectedPoint (picker mode) ──────────────────────
  useEffect(() => {
    if (!mapRef.current || !pickerMode) return;
    if (!selectedPoint) return;

    if (pickerMarkerRef.current) {
      pickerMarkerRef.current.setPosition(selectedPoint);
    } else {
      pickerMarkerRef.current = new window.google.maps.Marker({
        position: selectedPoint,
        map: mapRef.current,
        title: "Vị trí đã chọn",
      });
    }
    mapRef.current.panTo(selectedPoint);
  }, [selectedPoint, pickerMode]);

  // ── Sync booth markers (display mode) ─────────────────────
  useEffect(() => {
    if (!mapRef.current || pickerMode) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    booths.forEach((booth) => {
      const lat = parseFloat(booth.latitude);
      const lng = parseFloat(booth.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: mapRef.current,
        title: booth.name,
      });
      marker.addListener("click", () => onMarkerClick?.(booth.id));
      markersRef.current.push(marker);
    });

    // User position — blue marker
    if (userPosition) {
      const userMarker = new window.google.maps.Marker({
        position: userPosition,
        map: mapRef.current,
        title: "Vị trí của bạn",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#2563eb",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
        },
      });
      markersRef.current.push(userMarker);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booths, userPosition]);

  // ── Render ─────────────────────────────────────────────────
  if (error) {
    return (
      <div className="gmap-error">
        <span>⚠️ {error}</span>
      </div>
    );
  }

  return (
    <div className="gmap-wrapper">
      {loading && (
        <div className="gmap-loading">
          <div className="gmap-loading__spinner" />
          <span>Đang tải bản đồ...</span>
        </div>
      )}
      <div
        ref={containerRef}
        className="gmap-container"
        style={{ opacity: loading ? 0 : 1 }}
      />
    </div>
  );
}