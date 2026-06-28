// ─── useLanguage Hook ─────────────────────────────────────────
// Ưu tiên ngôn ngữ theo thứ tự:
//   1. ?lang=xx trong URL  → người dùng chọn thủ công / navigate giữ ngôn ngữ
//   2. navigator.language  → ngôn ngữ điện thoại (áp dụng mỗi lần vào trang mới)
//   3. "vi"                → fallback

import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

export const SUPPORTED_LANGUAGES = ["vi", "en", "ja", "zh", "ko", "fr"];
const STORAGE_KEY = "lang";

function detectInitialLang(searchParams) {
  // 1. URL ?lang= — ưu tiên tuyệt đối
  //    (MapPage, BoothPage navigate kèm ?lang= để giữ ngôn ngữ xuyên suốt)
  const fromQuery = searchParams.get("lang");
  if (fromQuery && SUPPORTED_LANGUAGES.includes(fromQuery)) return fromQuery;

  // 2. Không có ?lang= = người dùng vừa vào trang mới (quét QR hoặc mở link)
  //    → LUÔN đọc ngôn ngữ điện thoại, KHÔNG dùng localStorage
  //    → Đảm bảo mỗi người quét QR bằng điện thoại của họ
  //      sẽ thấy đúng ngôn ngữ của họ
  const browserLang = navigator.language?.split("-")[0];
  if (browserLang && SUPPORTED_LANGUAGES.includes(browserLang)) return browserLang;

  return "vi";
}

export function useLanguage() {
  const [searchParams, setSearchParams] = useSearchParams();

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

export function getCurrentLang() {
  // Dùng trong service/helper ngoài React
  const browserLang = navigator.language?.split("-")[0];
  return SUPPORTED_LANGUAGES.includes(browserLang) ? browserLang : "vi";
}