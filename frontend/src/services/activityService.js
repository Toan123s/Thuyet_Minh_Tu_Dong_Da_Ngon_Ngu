// activityService.js
import apiClient from "./apiClient";

const activityService = {
  getRecent: (limit = 5) =>
    apiClient.get(`/admin/activity?limit=${limit}`)
      .then(res =>
        (Array.isArray(res) ? res : []).map(item => ({
          id:    item.id,
          text:  `Gian hàng "${item.boothName}" vừa có lượt nghe`,
          sub:   `Ngôn ngữ: ${item.languageCode} · ${item.deviceType}`,
          time:  new Date(item.visitedAt).toLocaleTimeString("vi-VN", {
                   hour: "2-digit", minute: "2-digit"
                 }),
          color: "blue",
        }))
      ),
};

export default activityService;