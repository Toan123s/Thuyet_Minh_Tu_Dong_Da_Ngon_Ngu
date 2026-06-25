// ─── useLanguage Hook ─────────────────────────────────────────
// Gom logic xử lý ngôn ngữ về 1 chỗ duy nhất, dùng chung cho
// LandingPage, MapPage, BoothPage (và mọi trang visitor sau này).
//
// Nguồn sự thật ưu tiên theo thứ tự:
//   1. Query string  ?lang=xx   (để share link giữ đúng ngôn ngữ)
//   2. localStorage  "lang"     (ngôn ngữ đã chọn trước đó)
//   3. navigator.language       (ngôn ngữ trình duyệt)
//   4. "vi"                     (fallback cuối cùng)

import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

export const SUPPORTED_LANGUAGES = ["vi", "en", "ja", "zh", "ko", "fr"];
const STORAGE_KEY = "lang";

function detectInitialLang(searchParams) {
  const fromQuery = searchParams.get("lang");
  if (fromQuery && SUPPORTED_LANGUAGES.includes(fromQuery)) return fromQuery;

  const fromStorage = localStorage.getItem(STORAGE_KEY);
  if (fromStorage && SUPPORTED_LANGUAGES.includes(fromStorage)) return fromStorage;

  const browserLang = navigator.language?.split("-")[0];
  if (browserLang && SUPPORTED_LANGUAGES.includes(browserLang)) return browserLang;

  return "vi";
}

/**
 * Hook dùng chung cho mọi trang visitor cần biết/đổi ngôn ngữ.
 *
 * const { lang, setLang } = useLanguage();
 *
 * - Giá trị khởi tạo được TÍNH TRONG LÚC RENDER (lazy initializer của useState),
 *   không setState bên trong effect → không vi phạm react-hooks/set-state-in-effect.
 * - setLang() cập nhật cả state, localStorage và query string trong cùng 1 lần
 *   gọi do người dùng chủ động kích hoạt (không phải side-effect tự động).
 */
export function useLanguage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Lazy initializer: chạy đúng 1 lần ở lần render đầu, không phải trong effect.
  const [lang, setLangState] = useState(() => detectInitialLang(searchParams));

  const setLang = useCallback((newLang) => {
    if (!SUPPORTED_LANGUAGES.includes(newLang)) return;
    setLangState(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);

    const params = new URLSearchParams(searchParams);
    params.set("lang", newLang);
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  return { lang, setLang };
}

/** Đọc ngôn ngữ hiện tại không cần hook (dùng trong service/helper) */
export function getCurrentLang() {
  const fromStorage = localStorage.getItem(STORAGE_KEY);
  if (fromStorage && SUPPORTED_LANGUAGES.includes(fromStorage)) return fromStorage;
  const browserLang = navigator.language?.split("-")[0];
  return SUPPORTED_LANGUAGES.includes(browserLang) ? browserLang : "vi";
}