// activityService.js
import apiClient from "./apiClient";

const activityService = {
  getRecent: (limit = 5) =>
    apiClient.get(`/admin/activity?limit=${limit}`)
      .then(res =>
        (Array.isArray(res) ? res : []).map(item => {
          // Backend trả "2025-06-26T10:30:00.0000000" (không có Z)
          // → browser hiểu là local time → sai 7 tiếng
          // Fix: ép thêm "Z" vào cuối nếu chưa có để browser biết đây là UTC
          const rawTime = item.visitedAt ?? "";
          const isoUtc  = rawTime.endsWith("Z") ? rawTime : rawTime + "Z";
          const dateObj  = new Date(isoUtc);

          const time = dateObj.toLocaleTimeString("vi-VN", {
            hour:     "2-digit",
            minute:   "2-digit",
            timeZone: "Asia/Ho_Chi_Minh",
          });

          return {
            id:    item.id,
            text:  `Gian hàng "${item.boothName}" vừa có lượt nghe`,
            sub:   `Ngôn ngữ: ${item.languageCode} · ${item.deviceType}`,
            time,
            color: "blue",
          };
        })
      ),
};

export default activityService;