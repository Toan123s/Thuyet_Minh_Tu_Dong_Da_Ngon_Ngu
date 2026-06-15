// vendorService.js
import apiClient from "./apiClient";

const vendorService = {
  getMe:        () => apiClient.get("/vendor/me"),
  getMyBooths:  () => apiClient.get("/vendor/booths"),
  getStatsToday: () => apiClient.get("/vendor/stats/today"),

  getAnalyticsStats: (boothId, range = "7days") =>
    apiClient.get(`/vendor/stats/${boothId}?range=${range}`),

  // ── Images ───────────────────────────────────────────────
  getImages: (boothId) =>
    apiClient.get(`/booths/${boothId}/images`),

  uploadBoothImage: (boothId, fileObj, caption) => {
    const formData = new FormData();
    formData.append("file", fileObj);
    formData.append("caption", caption);
    return fetch(`${import.meta.env.VITE_API_URL}/images`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: formData,
    }).then(res => res.json());
  },

  updateImageCaption: (imageId, caption) =>
    apiClient.put(`/images/${imageId}`, { caption }),

  deleteImage: (imageId) =>
    apiClient.delete(`/images/${imageId}`),

  // ── Videos ───────────────────────────────────────────────
  getVideos: (boothId) =>
    apiClient.get(`/booths/${boothId}/videos`),

  addVideo: (boothId, videoUrl, title) =>
    apiClient.post("/videos", { boothId, videoUrl, title }),

  deleteVideo: (videoId) =>
    apiClient.delete(`/videos/${videoId}`),
};

export default vendorService;