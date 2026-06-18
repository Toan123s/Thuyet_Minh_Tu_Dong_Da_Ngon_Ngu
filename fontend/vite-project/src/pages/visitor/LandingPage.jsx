import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";
import eventService from "../../services/eventService";
import "./LandingPage.css";

const LANGUAGE_DICTS = {
  vi: { welcome: "Chào mừng bạn đến với sự kiện", start: "Bắt đầu tham quan 🚀", map: "Xem bản đồ 🗺️", select: "Chọn ngôn ngữ:" },
  en: { welcome: "Welcome to the Event",            start: "Start Tour 🚀",           map: "View Map 🗺️",      select: "Select Language:" },
  ja: { welcome: "イベントへようこそ",                     start: "ツアー開始 🚀",             map: "地図を見る 🗺️",    select: "言語選択:" },
  zh: { welcome: "欢迎光临活动",                          start: "开始参观 🚀",               map: "查看地图 🗺️",      select: "选择语言:" },
  ko: { welcome: "이벤트에 오신 것을 환영합니다",              start: "투어 시작 🚀",              map: "지도 보기 🗺️",     select: "언어 선택:" },
  fr: { welcome: "Bienvenue à l'événement",         start: "Commencer la visite 🚀",  map: "Voir la carte 🗺️", select: "Choisir la langue:" },
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("event") || "1";

  const [lang,      setLang]      = useState("vi");
  const [eventInfo, setEventInfo] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    const browserLang = navigator.language.split("-")[0];
    if (LANGUAGE_DICTS[browserLang]) setLang(browserLang);
    else {
      const saved = localStorage.getItem("lang");
      if (saved && LANGUAGE_DICTS[saved]) setLang(saved);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    eventService.getById(eventId)
      .then(setEventInfo)
      .catch(() => setError("Không thể tải thông tin sự kiện. Vui lòng thử lại."))
      .finally(() => setLoading(false));
  }, [eventId]);

  function handleLangChange(newLang) {
    setLang(newLang);
    localStorage.setItem("lang", newLang);
  }

  const t          = LANGUAGE_DICTS[lang] ?? LANGUAGE_DICTS["en"];
  const formatDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "";

  return (
    <div className="lp-container">
      <div className="lp-card">
        {loading ? (
          <div style={{ padding: "40px 0" }}>
            <LoadingSpinner size="lg" label="Đang tải sự kiện..." />
          </div>
        ) : error ? (
          <div className="lp-error">
            <p>⚠️ {error}</p>
            <button
              className="lp-btn-secondary"
              onClick={() => {
                setLoading(true);
                setError(null);
                eventService.getById(eventId)
                  .then(setEventInfo)
                  .catch(() => setError("Không thể tải thông tin sự kiện. Vui lòng thử lại."))
                  .finally(() => setLoading(false));
              }}
            >
              Thử lại
            </button>
          </div>
        ) : (
          <>
            <div className="lp-card__icon">🎪</div>
            <h2 className="lp-card__title">{eventInfo?.name}</h2>
            <p className="lp-card__location">📍 {eventInfo?.location}</p>
            <p className="lp-card__date">
              📅 {formatDate(eventInfo?.startDate)} – {formatDate(eventInfo?.endDate)}
            </p>

            <hr className="lp-divider" />

            <label className="lp-label">{t.select}</label>
            <select
              value={lang}
              onChange={(e) => handleLangChange(e.target.value)}
              className="lp-select"
            >
              <option value="vi">🇻🇳 Tiếng Việt</option>
              <option value="en">🇬🇧 English</option>
              <option value="ja">🇯🇵 日本語</option>
              <option value="zh">🇨🇳 中文</option>
              <option value="ko">🇰🇷 한국어</option>
              <option value="fr">🇫🇷 Français</option>
            </select>

            <button
              onClick={() => navigate(`/location?lang=${lang}&event=${eventId}`)}
              className="lp-btn-primary"
            >
              {t.start}
            </button>
            <button
              onClick={() => navigate(`/map?event=${eventId}&lang=${lang}`)}
              className="lp-btn-secondary"
            >
              {t.map}
            </button>
          </>
        )}
      </div>
    </div>
  );
}