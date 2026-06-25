import apiClient from "./apiClient";

// ─── Translation Service ──────────────────────────────────────
// Gọi Azure OpenAI để dịch nội dung thuyết minh
// Dùng tại: VD2 – Quản lý nội dung thuyết minh (/vendor/narrations/:boothId)

const translationService = {
  /**
   * Dịch nội dung sang một ngôn ngữ cụ thể
   * @param {string|number} narrationId
   * @param {string} languageCode - "en" | "ja" | "ko" | "zh"
   * Returns: { id, narrationId, languageCode, translatedTitle, translatedContent }
   */
  generateOne: (narrationId, languageCode) =>
    apiClient.post("/translations/generate", { narrationId, languageCode }),

  /**
   * Dịch nội dung sang tất cả ngôn ngữ hỗ trợ (song song)
   * @param {string|number} narrationId
   * @param {string[]} languages - mặc định ["en", "ja", "ko", "zh"]
   * Returns: [{ languageCode, translatedTitle, translatedContent }]
   */
  generateAll: (narrationId, languages = ["en", "ja", "ko", "zh"]) =>
    apiClient.post("/translations/generate-all", { narrationId, languages }),

  /**
   * Lấy một bản dịch theo narrationId + ngôn ngữ
   * @param {string|number} narrationId
   * @param {string} lang - "en" | "ja" | "ko" | "zh"
   * Returns: { id, languageCode, translatedTitle, translatedContent, isManuallyEdited }
   */
  getOne: (narrationId, lang) =>
    apiClient.get(`/translations/${narrationId}?lang=${lang}`),

  /**
   * Vendor sửa thủ công bản dịch
   * @param {string|number} translationId
   * @param {{ translatedTitle: string, translatedContent: string }} data
   */
  updateManual: (translationId, data) =>
    apiClient.put(`/translations/${translationId}`, data),
};

export default translationService;