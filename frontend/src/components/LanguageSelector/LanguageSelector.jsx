import { useState, useEffect, useRef } from "react";
import "./LanguageSelector.css";

// ─── Config ───────────────────────────────────────────────────
export const LANGUAGES = [
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", label: "English",    flag: "🇬🇧" },
  { code: "ja", label: "日本語",      flag: "🇯🇵" },
  { code: "ko", label: "한국어",      flag: "🇰🇷" },
  { code: "zh", label: "中文",        flag: "🇨🇳" },
];

/** Detect ngôn ngữ trình duyệt và map về code hỗ trợ */
function detectBrowserLang() {
  const nav = navigator.language || "vi";
  const code = nav.split("-")[0].toLowerCase();
  return LANGUAGES.find((l) => l.code === code)?.code ?? "vi";
}

/** Đọc / ghi ngôn ngữ vào localStorage */
export function getSavedLang() {
  return localStorage.getItem("lang") || detectBrowserLang();
}
export function saveLang(code) {
  localStorage.setItem("lang", code);
}

// ─── Component ────────────────────────────────────────────────
/**
 * Props:
 *  - variant  : "dropdown" | "inline"
 *               dropdown → button + popover (dùng ở V4 – header gian hàng)
 *               inline   → danh sách lớn (dùng ở V1 – landing page)
 *  - onChange : (langCode: string) => void
 *  - value    : string (controlled, optional — nếu không truyền tự quản lý state)
 */
export default function LanguageSelector({ variant = "dropdown", onChange, value }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(value ?? getSavedLang());
  const ref = useRef(null);

  // Sync controlled value
  useEffect(() => {
    if (value !== undefined) setSelected(value);
  }, [value]);

  // Close khi click ngoài
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = (code) => {
    setSelected(code);
    saveLang(code);
    onChange?.(code);
    setOpen(false);
  };

  const current = LANGUAGES.find((l) => l.code === selected) ?? LANGUAGES[0];

  // ── INLINE (V1 – landing) ──────────────────────────────────
  if (variant === "inline") {
    return (
      <div className="lang-inline">
        <p className="lang-inline__label">🌐 Chọn ngôn ngữ</p>
        <div className="lang-inline__list">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              className={`lang-inline__item ${selected === lang.code ? "lang-inline__item--active" : ""}`}
              onClick={() => handleSelect(lang.code)}
            >
              <span className="lang-inline__flag">{lang.flag}</span>
              <span className="lang-inline__name">{lang.label}</span>
              {selected === lang.code && <span className="lang-inline__check">✓</span>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── DROPDOWN (V4 – header) ─────────────────────────────────
  return (
    <div className="lang-dd" ref={ref}>
      <button
        className={`lang-dd__trigger ${open ? "lang-dd__trigger--open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-label="Chọn ngôn ngữ"
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

      {open && (
        <div className="lang-dd__menu">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              className={`lang-dd__option ${selected === lang.code ? "lang-dd__option--active" : ""}`}
              onClick={() => handleSelect(lang.code)}
            >
              <span className="lang-dd__flag">{lang.flag}</span>
              <span className="lang-dd__name">{lang.label}</span>
              {selected === lang.code && (
                <svg className="lang-dd__tick" width="14" height="14" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}