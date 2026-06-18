import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Toast, { useToast } from "../../components/Toast/Toast";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";
import boothService from "../../services/boothService";
import narrationService from "../../services/narrationService";
import translationService from "../../services/translationService";
import visitLogService from "../../services/visitLogService";
import { isPaidAndValid, getRemainingTime } from "../../untils/helpers";
import "./BoothPage.css";

const UI_TEXT = {
  vi: {
    back: "⬅️ Bản đồ", noContent: "Chưa có nội dung thuyết minh.",
    locked: "🔒 Vui lòng thanh toán phí sử dụng để nghe thuyết minh tự động.",
    payBtn: "💳 Thanh toán để nghe thuyết minh",
    play: "▶️ Bắt đầu nghe", stop: "⏸️ Dừng",
    playing: "🔊 Đang phát...",
    images: "Hình ảnh", videos: "Video", info: "Thông tin",
    noImages: "Chưa có hình ảnh.", noVideos: "Chưa có video.",
    loadingTrans: "Đang tải bản dịch...", noTrans: "Chưa có bản dịch.",
  },
  en: {
    back: "⬅️ Map", noContent: "No narration content available.",
    locked: "🔒 Please complete the payment to unlock narration.",
    payBtn: "💳 Pay to unlock narration",
    play: "▶️ Start narration", stop: "⏸️ Stop",
    playing: "🔊 Playing...",
    images: "Images", videos: "Videos", info: "Info",
    noImages: "No images available.", noVideos: "No videos available.",
    loadingTrans: "Loading translation...", noTrans: "No translation available.",
  },
  ja: {
    back: "⬅️ マップ", noContent: "解説コンテンツがありません。",
    locked: "🔒 決済を完了してください。",
    payBtn: "💳 解説を聴くには支払う",
    play: "▶️ 解説を開始", stop: "⏸️ 停止",
    playing: "🔊 再生中...",
    images: "画像", videos: "動画", info: "情報",
    noImages: "画像がありません。", noVideos: "動画がありません。",
    loadingTrans: "翻訳を読み込んでいます...", noTrans: "翻訳がありません。",
  },
  zh: {
    back: "⬅️ 地图", noContent: "暂无解说内容。",
    locked: "🔒 请先完成支付。",
    payBtn: "💳 付款解锁讲解",
    play: "▶️ 开始讲解", stop: "⏸️ 停止",
    playing: "🔊 播放中...",
    images: "图片", videos: "视频", info: "信息",
    noImages: "暂无图片。", noVideos: "暂无视频。",
    loadingTrans: "正在加载翻译...", noTrans: "暂无翻译。",
  },
  ko: {
    back: "⬅️ 지도", noContent: "해설 콘텐츠가 없습니다.",
    locked: "🔒 결제를 완료해 주세요。",
    payBtn: "💳 해설 결제하기",
    play: "▶️ 해설 시작", stop: "⏸️ 정지",
    playing: "🔊 재생 중...",
    images: "이미지", videos: "비디오", info: "정보",
    noImages: "이미지가 없습니다.", noVideos: "비디오가 없습니다.",
    loadingTrans: "번역 로딩 중...", noTrans: "번역이 없습니다.",
  },
  fr: {
    back: "⬅️ Carte", noContent: "Aucun contenu disponible.",
    locked: "🔒 Veuillez effectuer le paiement.",
    payBtn: "💳 Payer pour écouter",
    play: "▶️ Commencer", stop: "⏸️ Arrêter",
    playing: "🔊 En cours...",
    images: "Images", videos: "Vidéos", info: "Info",
    noImages: "Aucune image.", noVideos: "Aucune vidéo.",
    loadingTrans: "Chargement...", noTrans: "Aucune traduction.",
  },
};

const SPEECH_LANG = {
  vi: "vi-VN", en: "en-US", ja: "ja-JP",
  zh: "zh-CN", ko: "ko-KR", fr: "fr-FR",
};

function getEmbedUrl(url) {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
}

export default function BoothPage() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const [searchParams] = useSearchParams();
  const { toasts, showToast } = useToast();

  const lang    = searchParams.get("lang")  || "vi";
  const eventId = searchParams.get("event") || "1";
  const t       = UI_TEXT[lang] ?? UI_TEXT["en"];

  const [booth,        setBooth]        = useState(null);
  const [narration,    setNarration]    = useState(null);
  const [translation,  setTranslation]  = useState(null);
  const [loadingTrans, setLoadingTrans] = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [imgIndex,     setImgIndex]     = useState(0);
  const [activeTab,    setActiveTab]    = useState("info");

  const visitStartRef = useRef(Date.now());
  const audioRef      = useRef(null);

  const isPaid    = isPaidAndValid(eventId);
  const remaining = getRemainingTime(eventId);

  // Fetch booth + narration
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    Promise.all([
      boothService.getById(id),
      narrationService.getByBoothId(id),
    ])
      .then(([boothData, narrationData]) => {
        if (cancelled) return;
        setBooth(boothData);
        setNarration(narrationData);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        showToast("Không thể tải thông tin gian hàng.", "error");
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id, showToast]);

  // Fetch translation khi đổi lang (dùng translationService đúng endpoint)
  useEffect(() => {
    let cancelled = false;
    if (!narration?.id || lang === "vi") {
      setTranslation(null);
      return;
    }
    setLoadingTrans(true);
    translationService.getOne(narration.id, lang)
      .then((data) => {
        if (!cancelled) { setTranslation(data); setLoadingTrans(false); }
      })
      .catch(() => {
        if (!cancelled) { setTranslation(null); setLoadingTrans(false); }
      });
    return () => { cancelled = true; };
  }, [lang, narration?.id]);

  // Stop audio khi đổi lang
  useEffect(() => {
    window.speechSynthesis.cancel();
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ghi visit log khi rời trang
  const logVisit = useCallback(() => {
    const duration = Math.round((Date.now() - visitStartRef.current) / 1000);
    if (duration > 3) {
      visitLogService.log({
        boothId:      id,
        languageCode: lang,
        deviceType:   /Mobile/.test(navigator.userAgent) ? "Mobile" : "Desktop",
        durationSec:  duration,
      }).catch(() => {});
    }
  }, [id, lang]);

  useEffect(() => {
    visitStartRef.current = Date.now();
    return () => {
      window.speechSynthesis.cancel();
      logVisit();
    };
  }, [logVisit]);

  function getContent() {
    if (lang === "vi") return narration?.content || booth?.description || t.noContent;
    if (loadingTrans)  return t.loadingTrans;
    return translation?.translatedContent || t.noTrans;
  }

  function toggleSpeech() {
    const audioUrl = translation?.audioUrl;
    if (audioUrl && lang !== "vi") {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        if (!audioRef.current) audioRef.current = new Audio(audioUrl);
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      const text = lang === "vi"
        ? (narration?.content || booth?.description || "")
        : (translation?.translatedContent || "");
      if (!text) { showToast("Chưa có nội dung để phát.", "warning"); return; }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang  = SPEECH_LANG[lang] || "vi-VN";
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  }

  const images = booth?.images ?? [];
  const videos = booth?.videos ?? [];

  if (loading) {
    return (
      <div className="booth-loading">
        <LoadingSpinner size="lg" label="Đang tải gian hàng..." />
      </div>
    );
  }

  return (
    <div className="booth-page">
      <Toast toasts={toasts} />

      {/* Header */}
      <div className="booth-header">
        <button className="booth-header__back"
          onClick={() => navigate(`/map?event=${eventId}&lang=${lang}`)}>
          {t.back}
        </button>
        <div className="booth-header__info">
          <h3 className="booth-header__name">{booth?.name}</h3>
          {booth?.categoryName && (
            <span className="booth-header__category">🏷 {booth.categoryName}</span>
          )}
        </div>
        {isPaid && remaining && (
          <div className="booth-header__badge">⏱ {remaining}</div>
        )}
      </div>

      {/* Carousel ảnh */}
      <div className="booth-carousel">
        {images.length > 0 ? (
          <>
            <img src={images[imgIndex]?.filePath} alt="booth" className="booth-carousel__img" />
            <div className="booth-carousel__nav">
              <button onClick={() => setImgIndex((imgIndex - 1 + images.length) % images.length)}>◀️</button>
              <span>{imgIndex + 1}/{images.length}</span>
              <button onClick={() => setImgIndex((imgIndex + 1) % images.length)}>▶️</button>
            </div>
          </>
        ) : (
          <div className="booth-carousel__empty">🏪</div>
        )}
      </div>

      {/* Tab bar */}
      <div className="booth-tabs">
        {[
          { key: "info",   label: `📋 ${t.info}`   },
          { key: "images", label: `🖼 ${t.images}`  },
          { key: "videos", label: `🎬 ${t.videos}`  },
        ].map(tab => (
          <button key={tab.key}
            className={`booth-tab ${activeTab === tab.key ? "booth-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="booth-body">

        {/* Tab: Thông tin */}
        {activeTab === "info" && (
          <>
            <div className="booth-content-box">
              {loadingTrans
                ? <LoadingSpinner size="sm" label={t.loadingTrans} />
                : <p className="booth-description">{getContent()}</p>
              }
            </div>

            {!isPaid ? (
              <div className="booth-locked">
                <p className="booth-locked__text">{t.locked}</p>
                <button className="booth-locked__btn"
                  onClick={() => navigate(`/payment?event=${eventId}&lang=${lang}`)}>
                  {t.payBtn}
                </button>
              </div>
            ) : (
              <div className="booth-audio">
                <button onClick={toggleSpeech} disabled={loadingTrans}
                  className={`booth-audio__btn ${isPlaying ? "booth-audio__btn--stop" : "booth-audio__btn--play"}`}>
                  {isPlaying ? t.stop : t.play}
                </button>
                {isPlaying && (
                  <p className="booth-audio__status">{t.playing} [{SPEECH_LANG[lang]}]</p>
                )}
              </div>
            )}
          </>
        )}

        {/* Tab: Hình ảnh */}
        {activeTab === "images" && (
          <div className="booth-media-grid">
            {images.length === 0
              ? <p className="booth-media__empty">{t.noImages}</p>
              : images.map((img, i) => (
                <div key={img.id ?? i} className="booth-media-grid__item">
                  <img src={img.filePath} alt={img.caption || "booth"} />
                  {img.caption && <p className="booth-media-grid__caption">{img.caption}</p>}
                </div>
              ))
            }
          </div>
        )}

        {/* Tab: Video */}
        {activeTab === "videos" && (
          <div className="booth-videos">
            {videos.length === 0
              ? <p className="booth-media__empty">{t.noVideos}</p>
              : videos.map((v, i) => {
                const embedUrl = getEmbedUrl(v.videoUrl);
                return (
                  <div key={v.id ?? i} className="booth-video-item">
                    {v.title && <p className="booth-video-item__title">🎬 {v.title}</p>}
                    {embedUrl
                      ? <iframe src={embedUrl} className="booth-video-item__iframe"
                          allowFullScreen title={v.title || "video"} />
                      : <a href={v.videoUrl} target="_blank" rel="noreferrer"
                          className="booth-video-item__link">{v.videoUrl}</a>
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