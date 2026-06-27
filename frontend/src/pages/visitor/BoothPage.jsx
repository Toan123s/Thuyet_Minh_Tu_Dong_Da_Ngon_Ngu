import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Toast, { useToast } from "../../components/Toast/Toast";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";
import LanguageSelector from "../../components/LanguageSelector/LanguageSelector";
import { useLanguage } from "../../hooks/useLanguage";
import { t } from "../../lang";
import boothService from "../../services/boothService";
import translationService from "../../services/translationService";
import visitLogService from "../../services/visitLogService";
import speechService from "../../services/speechService";
import "./BoothPage.css";

function getEmbedUrl(url) {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
}

export default function BoothPage() {
  const { id }         = useParams();
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const { toasts, showToast } = useToast();
  const { lang, setLang } = useLanguage();
  const eventId        = searchParams.get("event") || "1";

  const [booth,        setBooth]        = useState(null);
  const [narration,    setNarration]    = useState(null);
  const [translation,  setTranslation]  = useState(null);
  const [loadingTrans, setLoadingTrans] = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [imgIndex,     setImgIndex]     = useState(0);
  const [activeTab,    setActiveTab]    = useState("info");

  const audioRef        = useRef(null);
  const activeSpeechRef = useRef(null);
  const visitStartRef   = useRef(Date.now());

  // 1. Fetch booth
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    boothService.getById(id)
      .then((data) => { setBooth(data); setNarration(data?.narration ?? null); })
      .catch(() => showToast("Không thể tải thông tin gian hàng.", "error"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // 2. Fetch translation khi đổi ngôn ngữ
  useEffect(() => {
    if (!narration?.id || lang === "vi") { setTranslation(null); return; }
    let cancelled = false;
    setLoadingTrans(true);
    translationService.getOne(narration.id, lang)
      .then((data) => { if (!cancelled) setTranslation(data); })
      .catch(() => { if (!cancelled) setTranslation(null); })
      .finally(() => { if (!cancelled) setLoadingTrans(false); });
    return () => { cancelled = true; };
  }, [narration?.id, lang]);

  // 3. Dừng audio khi đổi ngôn ngữ
  useEffect(() => {
    activeSpeechRef.current?.stop?.();
    speechService.stopAll(audioRef);
    setIsPlaying(false);
  }, [lang]);

  // 4. Ghi visit log
  useEffect(() => {
    visitStartRef.current = Date.now();
    return () => {
      const duration = Math.round((Date.now() - visitStartRef.current) / 1000);
      if (duration > 3) {
        visitLogService.log({
          boothId: id, languageCode: lang,
          deviceType: /Mobile/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
          durationSec: duration,
        }).catch(() => {});
      }
      activeSpeechRef.current?.stop?.();
      speechService.stopAll(audioRef);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const viContent = narration?.content || booth?.description || "";

  function getContent() {
    if (lang === "vi") return viContent || t(lang, "noContent");
    if (loadingTrans)  return t(lang, "loadingTrans");
    if (translation?.content) return translation.content;
    return viContent || t(lang, "noContent");
  }

  const isFallbackToVi = lang !== "vi" && !loadingTrans && !translation?.content && !!viContent;

  const toggleSpeech = useCallback(async () => {
    if (isPlaying) {
      activeSpeechRef.current?.stop?.();
      speechService.stopAll(audioRef);
      setIsPlaying(false);
      return;
    }
    const text = getContent();
    const noContent = t(lang, "noContent");
    const loadingText = t(lang, "loadingTrans");
    if (!text || text === noContent || text === loadingText) {
      showToast("Chưa có nội dung để phát.", "warning");
      return;
    }
    const speakLang = isFallbackToVi ? "vi" : lang;

    // ✅ Ghi log NGAY KHI bắt đầu phát — không chờ unmount
    // để dashboard cập nhật ngay, tránh mất log khi đóng tab
    visitStartRef.current = Date.now();
    visitLogService.log({
      boothId:     id,
      languageCode: lang,
      deviceType:  /Mobile/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
      durationSec: 0, // sẽ được ghi thêm lần 2 khi unmount với duration thật
    }).catch(() => {});

    const handle = await speechService.speak({
      text, languageCode: speakLang,
      onPlayStateChange: setIsPlaying,
      audioElRef: audioRef,
    });
    activeSpeechRef.current = handle;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, lang, narration, translation, loadingTrans]);

  // Auto-play khi vào từ geofence (?auto=1)
  useEffect(() => {
    if (searchParams.get("auto") !== "1") return;
    if (loading || loadingTrans || isPlaying) return;
    toggleSpeech();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, loadingTrans]);

  const images = booth?.images ?? [];
  const videos = booth?.videos ?? [];

  if (loading) {
    return (
      <div className="bp-loading">
        <LoadingSpinner size="lg" label="Đang tải gian hàng..." />
      </div>
    );
  }

  if (!booth) {
    return (
      <div className="bp-loading">
        <div className="bp-not-found">
          <div className="bp-not-found-icon">🏚️</div>
          <p>Không tìm thấy gian hàng.</p>
          <button onClick={() => navigate(`/map?event=${eventId}&lang=${lang}`)}>
            ← Quay lại bản đồ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bp-page">
      <Toast toasts={toasts} />
      <audio ref={audioRef} style={{ display: "none" }} />

      {/* ── Header ────────────────────────────── */}
      <div className="bp-header">
        <button
          className="bp-back-btn"
          onClick={() => navigate(`/map?event=${eventId}&lang=${lang}`)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span>{t(lang, "back").replace("⬅️ ", "")}</span>
        </button>

        <div className="bp-header-info">
          <h2 className="bp-header-name">{booth.boothName}</h2>
          {booth.categoryName && (
            <span className="bp-header-cat">{booth.categoryName}</span>
          )}
        </div>

        <LanguageSelector value={lang} onChange={setLang} />
      </div>

      {/* ── Image carousel ────────────────────── */}
      <div className="bp-carousel">
        {images.length > 0 ? (
          <>
            <img src={images[imgIndex]?.filePath} alt="booth" className="bp-carousel-img" />
            {images.length > 1 && (
              <div className="bp-carousel-nav">
                <button onClick={() => setImgIndex((imgIndex - 1 + images.length) % images.length)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <span>{imgIndex + 1} / {images.length}</span>
                <button onClick={() => setImgIndex((imgIndex + 1) % images.length)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            )}
            {/* Dots */}
            {images.length > 1 && (
              <div className="bp-carousel-dots">
                {images.map((_, i) => (
                  <span key={i} className={`bp-carousel-dot ${i === imgIndex ? "bp-carousel-dot--on" : ""}`}
                    onClick={() => setImgIndex(i)} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="bp-carousel-empty">🏪</div>
        )}
      </div>

      {/* ── Tabs ──────────────────────────────── */}
      <div className="bp-tabs">
        {[
          { key: "info",   emoji: "📋", label: t(lang, "info")   },
          { key: "images", emoji: "🖼",  label: t(lang, "images") },
          { key: "videos", emoji: "🎬", label: t(lang, "videos") },
        ].map(tab => (
          <button key={tab.key}
            className={`bp-tab ${activeTab === tab.key ? "bp-tab--on" : ""}`}
            onClick={() => setActiveTab(tab.key)}>
            <span className="bp-tab-emoji">{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab body ──────────────────────────── */}
      <div className="bp-body">

        {/* Info tab */}
        {activeTab === "info" && (
          <>
            {/* Audio button — prominent, at top */}
            <div className="bp-audio-bar">
              <button
                className={`bp-audio-btn ${isPlaying ? "bp-audio-btn--stop" : "bp-audio-btn--play"}`}
                onClick={toggleSpeech}
                disabled={loadingTrans}
              >
                {isPlaying ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                    {t(lang, "stop")}
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                    {t(lang, "play")}
                  </>
                )}
              </button>
              {isPlaying && (
                <div className="bp-audio-wave">
                  <span/><span/><span/><span/><span/>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="bp-content-box">
              {loadingTrans
                ? <LoadingSpinner size="sm" label={t(lang, "loadingTrans")} />
                : <p className="bp-description">{getContent()}</p>
              }
            </div>

            {isFallbackToVi && (
              <div className="bp-fallback-note">
                ℹ️ Chưa có bản dịch cho ngôn ngữ này — đang hiển thị nội dung tiếng Việt gốc.
              </div>
            )}
          </>
        )}

        {/* Images tab */}
        {activeTab === "images" && (
          <div className="bp-media-grid">
            {images.length === 0
              ? <p className="bp-media-empty">{t(lang, "noImages")}</p>
              : images.map((img, i) => (
                <div key={img.id ?? i} className="bp-media-item">
                  <img src={img.filePath} alt={img.caption || "booth"} />
                  {img.caption && <p className="bp-media-caption">{img.caption}</p>}
                </div>
              ))
            }
          </div>
        )}

        {/* Videos tab */}
        {activeTab === "videos" && (
          <div className="bp-videos">
            {videos.length === 0
              ? <p className="bp-media-empty">{t(lang, "noVideos")}</p>
              : videos.map((v, i) => {
                  const embed = getEmbedUrl(v.videoUrl);
                  return (
                    <div key={v.id ?? i} className="bp-video-item">
                      {v.title && <p className="bp-video-title">🎬 {v.title}</p>}
                      {embed
                        ? <iframe src={embed} className="bp-video-iframe"
                            allowFullScreen title={v.title || "video"} />
                        : <a href={v.videoUrl} target="_blank" rel="noreferrer"
                            className="bp-video-link">{v.videoUrl}</a>
                      }
                    </div>
                  );
                })
            }
          </div>
        )}
      </div>
    </div>
  );
}