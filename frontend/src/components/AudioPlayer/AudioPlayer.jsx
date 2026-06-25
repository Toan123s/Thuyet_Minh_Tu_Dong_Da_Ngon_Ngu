import { useState, useRef, useEffect } from "react";
import "./AudioPlayer.css";

// ─── Icons ────────────────────────────────────────────────────
const IconPlay = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);
const IconPause = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
  </svg>
);
const IconRewind = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="19 20 9 12 19 4 19 20" /><line x1="5" y1="19" x2="5" y2="5" strokeWidth="2" stroke="currentColor" fill="none" />
  </svg>
);
const IconForward = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" strokeWidth="2" stroke="currentColor" fill="none" />
  </svg>
);
const IconRepeat = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);
const IconVolume = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────
function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Component ────────────────────────────────────────────────
/**
 * Props:
 *  - audioUrl    : string          — URL file audio (blob / CDN)
 *  - title       : string          — Tên gian hàng / tiêu đề hiển thị
 *  - autoPlay    : boolean         — Tự phát khi mount (default: false)
 *  - onEnded     : (duration) => void — Callback khi phát xong, trả về thời lượng thực tế
 */
export default function AudioPlayer({ audioUrl, title, autoPlay = false, onEnded }) {
  const audioRef = useRef(null);

  const [playing,   setPlaying]   = useState(false);
  const [current,   setCurrent]   = useState(0);
  const [duration,  setDuration]  = useState(0);
  const [speed,     setSpeed]     = useState(1);
  const [volume,    setVolume]    = useState(1);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(false);
  const [repeat,    setRepeat]    = useState(false);

  const startTimeRef = useRef(null); // để tính duration thực tế nghe

  // ── Sync audioUrl ────────────────────────────────────────────
  useEffect(() => {
    if (!audioUrl) return;
    const audio = audioRef.current;
    setLoading(true);
    setError(false);
    setPlaying(false);
    setCurrent(0);
    audio.load();
  }, [audioUrl]);

  // ── Auto play ────────────────────────────────────────────────
  useEffect(() => {
    if (!autoPlay || loading || error) return;
    handlePlay();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, autoPlay]);

  // ── Controls ─────────────────────────────────────────────────
  const handlePlay = () => {
    if (!audioRef.current) return;
    audioRef.current.play().then(() => {
      setPlaying(true);
      if (!startTimeRef.current) startTimeRef.current = Date.now();
    }).catch(() => setError(true));
  };

  const handlePause = () => {
    audioRef.current?.pause();
    setPlaying(false);
  };

  const togglePlay = () => playing ? handlePause() : handlePlay();

  const seek = (seconds) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(Math.max(0, audio.currentTime + seconds), duration);
  };

  const handleSeekBar = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const val = parseFloat(e.target.value);
    audio.currentTime = val;
    setCurrent(val);
  };

  const handleSpeed = (s) => {
    setSpeed(s);
    if (audioRef.current) audioRef.current.playbackRate = s;
  };

  const handleVolume = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  // ── Audio events ─────────────────────────────────────────────
  const onLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
    setLoading(false);
  };

  const onTimeUpdate = () => {
    setCurrent(audioRef.current.currentTime);
  };

  const onAudioEnded = () => {
    setPlaying(false);
    if (repeat) {
      audioRef.current.currentTime = 0;
      handlePlay();
    } else {
      const listenDuration = startTimeRef.current
        ? Math.round((Date.now() - startTimeRef.current) / 1000)
        : Math.round(duration);
      onEnded?.(listenDuration);
      startTimeRef.current = null;
    }
  };

  // ── Progress percent ─────────────────────────────────────────
  const progress = duration > 0 ? (current / duration) * 100 : 0;

  // ── Render ───────────────────────────────────────────────────
  if (!audioUrl) return null;

  return (
    <div className="audio-player">
      {/* Hidden native audio */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onEnded={onAudioEnded}
        onError={() => { setError(true); setLoading(false); }}
        preload="metadata"
      />

      {/* ── Header ── */}
      <div className="ap-header">
        <div className={`ap-status-dot ${playing ? "ap-status-dot--playing" : ""}`} />
        <span className="ap-title">
          {loading ? "Đang tải..." : error ? "Lỗi tải audio" : playing ? "Đang phát..." : "Tạm dừng"}
        </span>
        <span className="ap-booth-name">{title}</span>
      </div>

      {/* ── Seek bar ── */}
      <div className="ap-seek">
        <div className="ap-seek__bar-wrap">
          <div className="ap-seek__fill" style={{ width: `${progress}%` }} />
          <input
            className="ap-seek__input"
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={current}
            onChange={handleSeekBar}
            disabled={loading || error}
          />
        </div>
        <div className="ap-seek__times">
          <span>{formatTime(current)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* ── Main controls ── */}
      <div className="ap-controls">
        <button
          className="ap-btn ap-btn--sm"
          onClick={() => seek(-10)}
          disabled={loading || error}
          title="Tua lùi 10 giây"
        >
          <IconRewind />
          <span className="ap-btn__label">10</span>
        </button>

        <button
          className={`ap-btn ap-btn--play ${error ? "ap-btn--error" : ""}`}
          onClick={togglePlay}
          disabled={loading || error}
        >
          {loading ? <div className="ap-mini-spinner" /> : playing ? <IconPause /> : <IconPlay />}
        </button>

        <button
          className="ap-btn ap-btn--sm"
          onClick={() => seek(10)}
          disabled={loading || error}
          title="Tua tới 10 giây"
        >
          <span className="ap-btn__label">10</span>
          <IconForward />
        </button>

        <button
          className={`ap-btn ap-btn--sm ${repeat ? "ap-btn--active" : ""}`}
          onClick={() => setRepeat((r) => !r)}
          title="Phát lại"
        >
          <IconRepeat />
        </button>
      </div>

      {/* ── Speed + Volume ── */}
      <div className="ap-footer">
        {/* Speed */}
        <div className="ap-speed">
          <span className="ap-speed__label">Tốc độ:</span>
          {[0.75, 1, 1.5].map((s) => (
            <button
              key={s}
              className={`ap-speed__btn ${speed === s ? "ap-speed__btn--active" : ""}`}
              onClick={() => handleSpeed(s)}
            >
              {s === 1 ? "1x" : `${s}x`}
            </button>
          ))}
        </div>

        {/* Volume */}
        <div className="ap-volume">
          <IconVolume />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={handleVolume}
            className="ap-volume__slider"
            title={`Âm lượng ${Math.round(volume * 100)}%`}
          />
        </div>
      </div>

      {error && (
        <p className="ap-error">⚠️ Không thể tải file audio. Vui lòng thử lại.</p>
      )}
    </div>
  );
}