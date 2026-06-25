import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";
import Toast, { useToast } from "../../components/Toast/Toast";
import boothService from "../../services/boothService";
import "./LocationPage.css";

export default function LocationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lang    = searchParams.get("lang")  || "vi";
  const eventId = searchParams.get("event") || "1";
  const { toasts, showToast } = useToast();

  const [status,     setStatus]     = useState("Đang xin quyền truy cập định vị GPS...");
  const [loading,    setLoading]    = useState(true);
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus("Trình duyệt không hỗ trợ định vị GPS.");
      setShowManual(true);
      setLoading(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setStatus("📍 Đã lấy vị trí! Đang tìm gian hàng gần nhất...");

        try {
          const nearest = await boothService.findNearest({ lat, lng, eventId });
          if (nearest?.id) {
            navigate(`/booth/${nearest.id}?lang=${lang}&event=${eventId}`);
          } else {
            setStatus("Không tìm thấy gian hàng nào gần bạn.");
            setShowManual(true);
          }
        } catch {
          showToast("Không thể tìm gian hàng gần nhất.", "error");
          setShowManual(true);
        } finally {
          setLoading(false);
        }
      },
      () => {
        setStatus("❌ Bạn đã từ chối hoặc định vị GPS thất bại.");
        setShowManual(true);
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <div className="loc-container">
      <Toast toasts={toasts} />
      <div className="loc-card">
        <div className="loc-card__icon">📡</div>

        {loading
          ? <LoadingSpinner size="md" label={status} />
          : <p className="loc-status">{status}</p>
        }

        {showManual && (
          <div className="loc-manual">
            <p className="loc-manual__hint">
              Vui lòng bật định vị hoặc chọn gian hàng thủ công:
            </p>
            <button
              onClick={() => navigate(`/map?event=${eventId}&lang=${lang}`)}
              className="loc-btn"
            >
              Đi tới Bản Đồ 🗺️
            </button>
          </div>
        )}
      </div>
    </div>
  );
}