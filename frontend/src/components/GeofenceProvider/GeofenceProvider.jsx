import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useGeofence } from "../../hooks/useGeofence";

/**
 * Đặt component này bên trong <BrowserRouter> nhưng BÊN NGOÀI <Routes>
 * trong AppRouter.jsx, để useGeofence() chạy NỀN xuyên suốt mọi trang —
 * không bị unmount khi chuyển route như khi đặt hook trong từng page.
 *
 * Tự lấy eventId từ query string hiện tại (?event=) và chỉ bật
 * geofence khi đang ở route visitor (/, /map, /booth/:id, /location),
 * tắt hẳn khi đang ở /admin/* hoặc /vendor/* để không tốn pin/GPS
 * vô nghĩa cho admin/vendor.
 */
export default function GeofenceProvider() {
  const location = useLocation();
  const [eventId, setEventId] = useState(null);

  const isVisitorRoute =
    !location.pathname.startsWith("/admin") &&
    !location.pathname.startsWith("/vendor") &&
    location.pathname !== "/login" &&
    location.pathname !== "/register";

  // Đồng bộ eventId theo query string mỗi khi đổi route.
  // setEventId đẩy vào microtask để tránh setState đồng bộ ngay
  // trong thân effect (react-hooks/set-state-in-effect).
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromQuery = params.get("event");
    if (!fromQuery) return;
    Promise.resolve().then(() => setEventId(fromQuery));
  }, [location.search]);

  const { nearby } = useGeofence(eventId, isVisitorRoute);

  // Toast nhẹ báo "đang ở gần gian hàng X" — tuỳ chọn, không bắt buộc.
  // Có thể bỏ phần render này nếu không muốn hiện gì cả, hook vẫn
  // chạy nền điều hướng tự động bất kể có render UI hay không.
  if (!isVisitorRoute || !nearby) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(17,24,39,0.9)",
        color: "#fff",
        padding: "10px 18px",
        borderRadius: 99,
        fontSize: 13,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 8,
        boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
        pointerEvents: "none",
      }}
    >
      <span style={{
        width: 8, height: 8, borderRadius: "50%",
        background: "#ef4444",
        boxShadow: "0 0 0 4px rgba(239,68,68,0.3)",
      }} />
      Đang ở gần "{nearby.name}" — đang chuyển trang...
    </div>
  );
}