import apiClient from "./apiClient";

const narrationService = {
  getByBoothId: (boothId) =>
    apiClient.get(`/narrations/${boothId}`),

  upsert: (boothId, data) =>
    apiClient.post(`/narrations/${boothId}`, data),

  update: (narrationId, data) =>
    apiClient.put(`/narrations/${narrationId}`, data),
};

export default narrationService;