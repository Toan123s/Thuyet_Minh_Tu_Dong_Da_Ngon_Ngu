// narrationService.js
import apiClient from "./apiClient";

const narrationService = {
  getByBoothId: (boothId) =>
    apiClient.get(`/narrations/${boothId}`),

  // Tạo mới nếu chưa có
  upsert: (boothId, data) =>
    apiClient.post(`/narrations/${boothId}`, data),

  // Cập nhật nếu đã có
  update: (narrationId, data) =>
    apiClient.put(`/narrations/${narrationId}`, data),

  getTranslation: (narrationId, lang) =>
    apiClient.get(`/narrations/${narrationId}/translation?lang=${lang}`),
};

export default narrationService;