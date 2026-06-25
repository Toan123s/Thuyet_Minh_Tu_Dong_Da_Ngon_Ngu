// vendorService.js
import apiClient from "./apiClient";

// Đọc token từ cả 2 storage (hỗ trợ cả "ghi nhớ" và "không ghi nhớ")
function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

const vendorService = {
  getMe:         () => apiClient.get("/vendor/me"),
  getMyBooths:   () => apiClient.get("/vendor/booths"),
  getStatsToday: () => apiClient.get("/vendor/stats/today"),

  getAnalyticsStats: (boothId, range = "7days") =>
    apiClient.get(`/vendor/stats/${boothId}?range=${range}`),

  // ── Images ───────────────────────────────────────────────
  getImages: (boothId) =>
    apiClient.get(`/booths/${boothId}/images`),

  // ✅ FIX: Dùng endpoint /images/upload (multipart) và token đúng
  uploadBoothImage: (boothId, fileObj, caption) => {
    const formData = new FormData();
    formData.append("file",     fileObj);
    formData.append("boothId",  String(boothId));
    formData.append("caption",  caption ?? "");

    return fetch(`${import.meta.env.VITE_API_URL}/images/upload`, {
      method:  "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      // Không set Content-Type — browser tự set multipart/form-data + boundary
      body: formData,
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload thất bại");
      return data;
    });
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
