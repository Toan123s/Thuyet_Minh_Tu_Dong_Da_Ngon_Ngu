import apiClient from "./apiClient";

// ─── Language Registry Service ─────────────────────────────────
// Danh sách ngôn ngữ hiển thị trong dropdown là TOÀN CỤC — lấy từ server,
// KHÔNG phải hardcode cứng ở frontend. Mặc định server luôn có sẵn vi+en;
// các ngôn ngữ khác chỉ xuất hiện sau khi có khách thật quét QR với điện
// thoại đang để ngôn ngữ đó (xem useLanguage.js gọi detect()).
const languageService = {
  // GET toàn bộ danh sách ngôn ngữ hiện đang hỗ trợ (chung cho mọi người)
  getAll: () => apiClient.get("/languages"),

  // Báo cho server "vừa có người quét QR với ngôn ngữ này" — nếu server
  // có bản dịch cho ngôn ngữ đó và chưa từng có trong danh sách, server
  // sẽ thêm vào và TỪ ĐÓ MỌI NGƯỜI đều thấy nó trong dropdown.
  // Không throw lỗi ra ngoài — đây là tác vụ nền, không nên làm gián đoạn
  // trải nghiệm khách nếu server lỗi/mất mạng.
  detect: (code) =>
    apiClient.post("/languages/detect", { code }).catch(() => null),
};

export default languageService;
