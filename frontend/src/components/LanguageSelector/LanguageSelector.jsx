import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./LanguageSelector.css";

const ALL_LANGUAGES = [
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", label: "English",    flag: "🇬🇧" },
  { code: "ja", label: "日本語",      flag: "🇯🇵" },
  { code: "ko", label: "한국어",      flag: "🇰🇷" },
  { code: "zh", label: "中文",        flag: "🇨🇳" },
  { code: "fr", label: "Français",   flag: "🇫🇷" },
];

export default function LanguageSelector({ variant = "dropdown", value, onChange }) {
  const [open,    setOpen]    = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 208 });
  const languages  = ALL_LANGUAGES;
  const ref        = useRef(null);
  const triggerRef = useRef(null);

  // Close khi click ngoài
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        ref.current && !ref.current.contains(e.target) &&
        !e.target.closest(".lang-dd__menu-portal")
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  // Recalculate vị trí khi scroll / resize
  useEffect(() => {
    if (!open) return;
    const recalc = () => {
      if (!triggerRef.current) return;
      const rect      = triggerRef.current.getBoundingClientRect();
      const menuWidth = 208; // 13rem
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const showAbove  = spaceBelow < 250 && spaceAbove > spaceBelow;

      let left = rect.right - menuWidth;
      if (left < 8) left = 8;
      if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8;

      setMenuPos({
        top:    showAbove ? rect.top - 6 : rect.bottom + 6,
        left,
        width:  menuWidth,
        above:  showAbove,
      });
    };
    recalc();
    window.addEventListener("resize",  recalc);
    window.addEventListener("scroll",  recalc, true);
    return () => {
      window.removeEventListener("resize",  recalc);
      window.removeEventListener("scroll",  recalc, true);
    };
  }, [open]);

  const handleSelect = (code) => {
    onChange?.(code);
    setOpen(false);
  };

  const current = languages.find((l) => l.code === value) ?? languages[0];

  // ── INLINE (landing page) ──────────────────────────────────
  if (variant === "inline") {
    return (
      <div className="lang-inline">
        <p className="lang-inline__label">🌐 Chọn ngôn ngữ</p>
        <div className="lang-inline__list">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`lang-inline__item ${value === lang.code ? "lang-inline__item--active" : ""}`}
              onClick={() => handleSelect(lang.code)}
            >
              <span className="lang-inline__flag">{lang.flag}</span>
              <span className="lang-inline__name">{lang.label}</span>
              {value === lang.code && <span className="lang-inline__check">✓</span>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── DROPDOWN (header / topbar) ─────────────────────────────
  const menu = open ? createPortal(
    <div
      className="lang-dd__menu lang-dd__menu-portal"
      style={{
        position:  "fixed",
        top:       menuPos.above ? "auto"       : menuPos.top,
        bottom:    menuPos.above ? (window.innerHeight - menuPos.top) : "auto",
        left:      menuPos.left,
        width:     menuPos.width,
        zIndex:    2147483647,  /* max int — above everything incl. Leaflet */
        maxHeight: "320px",
        overflowY: "auto",
      }}
    >
      {languages.map((lang) => (
        <button
          key={lang.code}
          className={`lang-dd__option ${value === lang.code ? "lang-dd__option--active" : ""}`}
          onClick={() => handleSelect(lang.code)}
        >
          <span className="lang-dd__flag">{lang.flag}</span>
          <span className="lang-dd__name">{lang.label}</span>
          {value === lang.code && (
            <svg className="lang-dd__tick" width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>
      ))}
    </div>,
    document.body
  ) : null;

  return (
    <div className="lang-dd" ref={ref}>
      <button
        className={`lang-dd__trigger ${open ? "lang-dd__trigger--open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        ref={triggerRef}
        aria-label="Chọn ngôn ngữ"
        aria-expanded={open}
      >
        <span className="lang-dd__globe">🌐</span>
        <span className="lang-dd__current">{current.flag} {current.code.toUpperCase()}</span>
        <svg
          className={`lang-dd__caret ${open ? "lang-dd__caret--up" : ""}`}
          width="12" height="12" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {menu}
    </div>
  );
}