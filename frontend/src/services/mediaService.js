import apiClient from "./apiClient";

// Đọc token từ cả 2 storage
function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

const mediaService = {
  // ── Hình ảnh ──────────────────────────────────────────────

  getImages: (boothId) =>
    apiClient.get(`/booths/${boothId}/images`),

  // ✅ FIX: Dùng /images/upload thay vì /images (JSON)
  uploadImage: (formData) => {
    return fetch(`${import.meta.env.VITE_API_URL}/images/upload`, {
      method:  "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
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

  // ── Video ─────────────────────────────────────────────────

  getVideos: (boothId) =>
    apiClient.get(`/booths/${boothId}/videos`),

  addVideo: (boothId, videoUrl, title) =>
    apiClient.post("/videos", { boothId, videoUrl, title }),

  deleteVideo: (videoId) =>
    apiClient.delete(`/videos/${videoId}`),
};

export default mediaService;
