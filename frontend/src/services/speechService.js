// ─── Speech Service ────────────────────────────────────────────
// Thứ tự ưu tiên:
//   1. Azure TTS (nếu có key) — chất lượng tốt nhất
//   2. Google TTS qua proxy backend — free, không cần key, đủ ngôn ngữ
//   3. Web Speech API — fallback cuối, phụ thuộc voice thiết bị

import apiClient from "./apiClient";

const LANG_BCP47 = {
  vi: "vi-VN", en: "en-US", ja: "ja-JP",
  zh: "zh-CN", ko: "ko-KR", fr: "fr-FR",
};

// ── Gọi Azure TTS ─────────────────────────────────────────────
async function tryAzureTTS(text, languageCode) {
  try {
    const res = await apiClient.post("/speech/generate", { text, languageCode });
    return res?.audioUrl ?? null;
  } catch {
    return null;
  }
}

// ── Gọi Google TTS proxy (backend /api/speech/gtts) ──────────
async function tryGoogleTTS(text, languageCode) {
  try {
    const res = await apiClient.post("/speech/gtts", { text, languageCode });
    return res?.audioUrl ?? null;
  } catch {
    return null;
  }
}

// ── Phát audio từ URL ─────────────────────────────────────────
async function playAudioUrl(url, audioElRef, onPlayStateChange) {
  if (!audioElRef?.current) return false;
  const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:5069/api").replace("/api", "");
  const audio   = audioElRef.current;
  audio.pause();
  audio.src     = url.startsWith("http") ? url : `${apiBase}${url}`;
  audio.onended = () => onPlayStateChange?.(false);
  audio.onerror = () => onPlayStateChange?.(false);
  try {
    await audio.play();
    onPlayStateChange?.(true);
    return true;
  } catch {
    return false;
  }
}

// ── Web Speech API fallback ───────────────────────────────────
function getVoicesAsync() {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis?.getVoices() ?? [];
    if (voices.length > 0) { resolve(voices); return; }
    const handler = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener("voiceschanged", handler);
    setTimeout(() => {
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
      resolve(window.speechSynthesis?.getVoices() ?? []);
    }, 2000);
  });
}

function getBestVoice(langCode, voices) {
  const bcp47  = LANG_BCP47[langCode] || "vi-VN";
  const prefix = bcp47.split("-")[0];
  return voices.find(v => v.lang === bcp47)
      || voices.find(v => v.lang.startsWith(prefix + "-"))
      || voices.find(v => v.lang.startsWith(prefix))
      || null;
}

const speechService = {
  async speak({ text, languageCode, onPlayStateChange, audioElRef }) {
    if (!text) { onPlayStateChange?.(false); return { stop: () => {} }; }

    // ── 1. Azure TTS ──────────────────────────────────────────
    const azureUrl = await tryAzureTTS(text, languageCode);
    if (azureUrl) {
      const ok = await playAudioUrl(azureUrl, audioElRef, onPlayStateChange);
      if (ok) {
        return {
          source: "azure",
          stop: () => {
            if (audioElRef?.current) { audioElRef.current.pause(); audioElRef.current.src = ""; }
            onPlayStateChange?.(false);
          },
        };
      }
    }

    // ── 2. Google TTS proxy ───────────────────────────────────
    // Hoạt động với vi/en/ja/ko/zh/fr, không cần cấu hình thêm
    const gttsUrl = await tryGoogleTTS(text, languageCode);
    if (gttsUrl) {
      const ok = await playAudioUrl(gttsUrl, audioElRef, onPlayStateChange);
      if (ok) {
        return {
          source: "gtts",
          stop: () => {
            if (audioElRef?.current) { audioElRef.current.pause(); audioElRef.current.src = ""; }
            onPlayStateChange?.(false);
          },
        };
      }
    }

    // ── 3. Web Speech API fallback ────────────────────────────
    if (!window.speechSynthesis) {
      onPlayStateChange?.(false);
      return { stop: () => {} };
    }

    window.speechSynthesis.cancel();
    const voices    = await getVoicesAsync();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang  = LANG_BCP47[languageCode] || "vi-VN";
    utterance.rate  = 0.88;

    const voice = getBestVoice(languageCode, voices);
    if (voice) utterance.voice = voice;

    utterance.onend   = () => onPlayStateChange?.(false);
    utterance.onerror = () => onPlayStateChange?.(false);
    window.speechSynthesis.speak(utterance);
    onPlayStateChange?.(true);

    return {
      source: "webspeech",
      stop: () => { window.speechSynthesis.cancel(); onPlayStateChange?.(false); },
    };
  },

  stopAll(audioElRef) {
    window.speechSynthesis?.cancel();
    if (audioElRef?.current) {
      audioElRef.current.pause();
      audioElRef.current.src = "";
    }
  },
};

export default speechService;