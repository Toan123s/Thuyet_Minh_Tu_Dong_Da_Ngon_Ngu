// ─── Speech Service ───────────────────────────────────────────
// Phục vụ: BoothPage — phát audio thuyết minh.
//
// Chiến lược: Azure Cognitive Speech LÀM CHÍNH (giọng tự nhiên hơn,
// cần backend + Azure key) — nếu lỗi hoặc backend chưa cấu hình Azure
// (trả 501/503, hoặc network fail), tự FALLBACK sang Web Speech API
// của browser (luôn hoạt động được, không cần key, không cần mạng).
//
// Nhờ vậy app LUÔN phát được thuyết minh dù Azure chưa setup xong.

import apiClient from "./apiClient";

const SPEECH_LANG_MAP = {
  vi: "vi-VN", en: "en-US", ja: "ja-JP",
  zh: "zh-CN", ko: "ko-KR", fr: "fr-FR",
};

/**
 * Gọi backend để Azure tạo file audio MP3 từ text.
 * @returns {Promise<string>} audioUrl (CDN/local path) — null nếu Azure chưa sẵn sàng
 */
async function generateAzureAudio(text, languageCode) {
  try {
    const res = await apiClient.post("/speech/generate", { text, languageCode });
    return res?.audioUrl || null;
  } catch {
    // Backend chưa code SpeechController, chưa cấu hình Azure key,
    // hoặc Azure đang lỗi — coi như "không có", để fallback xử lý tiếp.
    return null;
  }
}

const speechService = {
  /**
   * Phát thuyết minh — tự chọn Azure hay Web Speech API.
   *
   * @param {object} params
   * @param {string} params.text          - nội dung cần đọc
   * @param {string} params.languageCode  - "vi" | "en" | "ja" | "zh" | "ko" | "fr"
   * @param {(playing: boolean) => void} params.onPlayStateChange - callback cập nhật UI play/pause
   * @param {HTMLAudioElement} params.audioElRef - ref tới <audio> dùng để phát Azure mp3 (tái sử dụng, không tạo mới mỗi lần)
   * @returns {{ source: "azure" | "webspeech", stop: () => void }}
   */
  async speak({ text, languageCode, onPlayStateChange, audioElRef }) {
    if (!text) {
      onPlayStateChange?.(false);
      return { source: null, stop: () => {} };
    }

    // ── Ưu tiên 1: Azure Cognitive Speech ─────────────────────
    const azureUrl = await generateAzureAudio(text, languageCode);
    if (azureUrl && audioElRef?.current) {
      const audio = audioElRef.current;
      audio.src = azureUrl;
      audio.onended = () => onPlayStateChange?.(false);
      audio.onerror = () => onPlayStateChange?.(false); // file lỗi → coi như dừng, không tự fallback giữa chừng để tránh giọng lặp 2 lần
      await audio.play();
      onPlayStateChange?.(true);
      return {
        source: "azure",
        stop: () => { audio.pause(); onPlayStateChange?.(false); },
      };
    }

    // ── Fallback: Web Speech API (luôn hoạt động, không cần mạng) ──
    if (!window.speechSynthesis) {
      onPlayStateChange?.(false);
      return { source: null, stop: () => {} };
    }

    window.speechSynthesis.cancel(); // huỷ câu đang đọc trước đó nếu có
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang  = SPEECH_LANG_MAP[languageCode] || "vi-VN";
    utterance.onend = () => onPlayStateChange?.(false);
    window.speechSynthesis.speak(utterance);
    onPlayStateChange?.(true);

    return {
      source: "webspeech",
      stop: () => { window.speechSynthesis.cancel(); onPlayStateChange?.(false); },
    };
  },

  /** Dừng phát ngay, bất kể đang dùng nguồn nào */
  stopAll(audioElRef) {
    window.speechSynthesis?.cancel();
    if (audioElRef?.current) audioElRef.current.pause();
  },
};

export default speechService;