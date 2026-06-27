import { useEffect, useRef } from "react";
import "./GoogleMap.css";

export default function GoogleMap({
  pickerMode = false,
  onMapClick,
  initialCenter = null,
  selectedPoint = null,
  booths = [],
  userPosition = null,
  onMarkerClick,
}) {
  const containerRef    = useRef(null);
  const mapRef          = useRef(null);
  const markersRef      = useRef([]);
  const userMarkerRef   = useRef(null);
  const pickerMarkerRef = useRef(null);
  const initializedRef  = useRef(false); // chặn double-init StrictMode

  const defaultCenter = initialCenter
    ?? (booths.length
      ? { lat: parseFloat(booths[0].latitude), lng: parseFloat(booths[0].longitude) }
      : { lat: 15.8801, lng: 108.338 });

  // Load Leaflet CSS
  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const link  = document.createElement("link");
      link.id     = "leaflet-css";
      link.rel    = "stylesheet";
      link.href   = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
  }, []);

  // Init map — chỉ chạy 1 lần duy nhất
  useEffect(() => {
    if (initializedRef.current) return;
    if (!containerRef.current)  return;

    initializedRef.current = true;

    import("leaflet").then((L) => {
      // Nếu container đã bị init (StrictMode unmount/remount) thì xóa trước
      if (containerRef.current._leaflet_id) {
        containerRef.current._leaflet_id = null;
      }

      const map = L.map(containerRef.current, {
        center: [defaultCenter.lat, defaultCenter.lng],
        zoom: 16,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      if (pickerMode) {
        map.on("click", (e) => {
          const { lat, lng } = e.latlng;
          onMapClick?.({ lat, lng });
          if (pickerMarkerRef.current) {
            pickerMarkerRef.current.setLatLng([lat, lng]);
          } else {
            pickerMarkerRef.current = L.marker([lat, lng], { icon: makeIcon(L, "#2563eb") })
              .addTo(map);
          }
        });
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        initializedRef.current = false;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync selectedPoint (picker)
  useEffect(() => {
    if (!mapRef.current || !pickerMode || !selectedPoint) return;
    import("leaflet").then((L) => {
      if (pickerMarkerRef.current) {
        pickerMarkerRef.current.setLatLng([selectedPoint.lat, selectedPoint.lng]);
      } else {
        pickerMarkerRef.current = L.marker(
          [selectedPoint.lat, selectedPoint.lng],
          { icon: makeIcon(L, "#2563eb") }
        ).addTo(mapRef.current);
      }
      mapRef.current.panTo([selectedPoint.lat, selectedPoint.lng]);
    });
  }, [selectedPoint, pickerMode]);

  // Sync booth markers
  useEffect(() => {
    if (!mapRef.current || pickerMode) return;
    import("leaflet").then((L) => {
      // Xóa markers cũ
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      booths.forEach((booth) => {
        const lat = parseFloat(booth.latitude);
        const lng = parseFloat(booth.longitude);
        if (isNaN(lat) || isNaN(lng)) return;

        const label = booth.boothName || booth.name || "";
        const marker = L.marker([lat, lng], { icon: makeIcon(L, booth.color || "#6366f1") })
          .addTo(mapRef.current)
          .bindTooltip(label, { permanent: false, direction: "top", offset: [0, -10] });

        marker.on("click", () => onMarkerClick?.(booth.id));
        markersRef.current.push(marker);
      });

      // Vị trí người dùng
      if (userMarkerRef.current) { userMarkerRef.current.remove(); userMarkerRef.current = null; }
      if (userPosition) {
        userMarkerRef.current = L.circleMarker(
          [userPosition.lat, userPosition.lng],
          { radius: 10, fillColor: "#2563eb", fillOpacity: 1, color: "#fff", weight: 3 }
        ).addTo(mapRef.current)
         .bindTooltip("Vị trí của bạn", { direction: "top" });
      }

      // Pan tới booth đầu tiên
      if (booths.length) {
        const lat = parseFloat(booths[0].latitude);
        const lng = parseFloat(booths[0].longitude);
        if (!isNaN(lat) && !isNaN(lng)) mapRef.current.setView([lat, lng], 16);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booths, userPosition]);

  return (
    <div className="gmap-wrapper">
      <div ref={containerRef} className="gmap-container" />
    </div>
  );
}

function makeIcon(L, color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38">
    <path d="M15 0C8.4 0 3 5.4 3 12c0 9 12 26 12 26S27 21 27 12C27 5.4 21.6 0 15 0z"
      fill="${color}" stroke="#fff" stroke-width="2"/>
    <circle cx="15" cy="12" r="5" fill="#fff" opacity="0.9"/>
  </svg>`;
  return L.divIcon({
    html: svg, iconSize: [30, 38], iconAnchor: [15, 38],
    tooltipAnchor: [0, -38], className: "",
  });
}