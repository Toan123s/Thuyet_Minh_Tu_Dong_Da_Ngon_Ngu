// ─── Speech Service ────────────────────────────────────────────
// Ưu tiên: Azure TTS → Web Speech API (fallback)
// Fix: chọn đúng voice cho từng ngôn ngữ trên mobile

import apiClient from "./apiClient";

const LANG_MAP = {
  vi: "vi-VN", en: "en-US", ja: "ja-JP",
  zh: "zh-CN", ko: "ko-KR", fr: "fr-FR",
};

async function generateAzureAudio(text, languageCode) {
  try {
    const res = await apiClient.post("/speech/generate", { text, languageCode });
    return res?.audioUrl || null;
  } catch {
    return null;
  }
}

// Tìm voice phù hợp nhất cho ngôn ngữ — quan trọng trên mobile
function getBestVoice(langCode) {
  const bcp47 = LANG_MAP[langCode] || "vi-VN";
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  // Ưu tiên: exact match lang-REGION
  let voice = voices.find(v => v.lang === bcp47);
  if (voice) return voice;

  // Fallback: match prefix (vi, ja, zh...)
  const prefix = bcp47.split("-")[0];
  voice = voices.find(v => v.lang.startsWith(prefix));
  if (voice) return voice;

  return null;
}

const speechService = {
  async speak({ text, languageCode, onPlayStateChange, audioElRef }) {
    if (!text) { onPlayStateChange?.(false); return { source: null, stop: () => {} }; }

    // ── Ưu tiên: Azure TTS ─────────────────────────────────────
    const azureUrl = await generateAzureAudio(text, languageCode);
    if (azureUrl && audioElRef?.current) {
      const audio = audioElRef.current;
      const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5069/api').replace('/api', '');
      audio.src = azureUrl.startsWith('http') ? azureUrl : `${apiBase}${azureUrl}`;
      audio.onended = () => onPlayStateChange?.(false);
      audio.onerror = () => onPlayStateChange?.(false);
      await audio.play();
      onPlayStateChange?.(true);
      return { source: "azure", stop: () => { audio.pause(); onPlayStateChange?.(false); } };
    }

    // ── Fallback: Web Speech API ────────────────────────────────
    if (!window.speechSynthesis) {
      onPlayStateChange?.(false);
      return { source: null, stop: () => {} };
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang  = LANG_MAP[languageCode] || "vi-VN";
    utterance.rate  = 0.9;   // chậm hơn một chút, dễ nghe hơn
    utterance.pitch = 1.0;

    // Chờ voices load xong (mobile thường cần thêm thời gian)
    const trySpeak = () => {
      const voice = getBestVoice(languageCode);
      if (voice) utterance.voice = voice;
      utterance.onend   = () => onPlayStateChange?.(false);
      utterance.onerror = () => onPlayStateChange?.(false);
      window.speechSynthesis.speak(utterance);
      onPlayStateChange?.(true);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      trySpeak();
    } else {
      // Mobile cần chờ voices load
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        trySpeak();
      };
      // Timeout 1s nếu onvoiceschanged không fire
      setTimeout(() => {
        if (!utterance.voice) trySpeak();
      }, 1000);
    }

    return {
      source: "webspeech",
      stop: () => { window.speechSynthesis.cancel(); onPlayStateChange?.(false); },
    };
  },

  stopAll(audioElRef) {
    window.speechSynthesis?.cancel();
    if (audioElRef?.current) audioElRef.current.pause();
  },
};

export default speechService;