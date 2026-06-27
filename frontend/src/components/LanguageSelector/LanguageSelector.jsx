import { useState, useEffect, useRef } from "react";
import "./LanguageSelector.css";

// ─── Config ───────────────────────────────────────────────────
// Đồng bộ với SUPPORTED_LANGUAGES trong hooks/useLanguage.js — đây
// là component THUẦN HIỂN THỊ, không tự đọc/ghi localStorage nữa.
// Mọi logic "ngôn ngữ hiện tại là gì, lưu ở đâu" đều do useLanguage()
// xử lý ở component cha, tránh 2 nguồn sự thật khác nhau (1 ở đây,
// 1 ở hook) như trước đây đã từng gây bug.
export const LANGUAGES = [
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", label: "English",    flag: "🇬🇧" },
  { code: "ja", label: "日本語",      flag: "🇯🇵" },
  { code: "ko", label: "한국어",      flag: "🇰🇷" },
  { code: "zh", label: "中文",        flag: "🇨🇳" },
  { code: "fr", label: "Français",   flag: "🇫🇷" },
];

// ─── Component ────────────────────────────────────────────────
/**
 * Component THUẦN ĐIỀU KHIỂN (controlled) — không tự quản lý state
 * ngôn ngữ, không tự đụng vào localStorage. Component cha PHẢI dùng
 * useLanguage() và truyền value/onChange xuống:
 *
 *   const { lang, setLang } = useLanguage();
 *   <LanguageSelector value={lang} onChange={setLang} />
 *
 * Props:
 *  - variant  : "dropdown" | "inline"
 *  - value    : string (bắt buộc — code ngôn ngữ hiện tại)
 *  - onChange : (langCode: string) => void (bắt buộc)
 */
export default function LanguageSelector({ variant = "dropdown", value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

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
    onChange?.(code);
    setOpen(false);
  };

  const current = LANGUAGES.find((l) => l.code === value) ?? LANGUAGES[0];

  // ── INLINE (V1 – landing) ──────────────────────────────────
  if (variant === "inline") {
    return (
      <div className="lang-inline">
        <p className="lang-inline__label">🌐 Chọn ngôn ngữ</p>
        <div className="lang-inline__list">
          {LANGUAGES.map((lang) => (
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
        </div>
      )}
    </div>
  );
}