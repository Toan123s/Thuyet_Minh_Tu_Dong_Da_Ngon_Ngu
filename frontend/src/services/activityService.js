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

          // ⚠ Trước đây chỉ hiện giờ:phút → nếu hôm nay chưa có ai nghe,
          // danh sách vẫn hiện log của vài ngày trước với giờ:phút, dễ
          // hiểu lầm là "vừa mới nghe hôm nay". Giờ thêm NGÀY vào, chỉ ẩn
          // ngày khi đúng là hôm nay (theo giờ VN) để đỡ rối mắt.
          const nowVn = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
          const dateVnStr = dateObj.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
          const isToday = dateVnStr === nowVn.toLocaleDateString("vi-VN");

          const dateLabel = dateObj.toLocaleDateString("vi-VN", {
            day:      "2-digit",
            month:    "2-digit",
            timeZone: "Asia/Ho_Chi_Minh",
          });
          const timeWithDate = isToday ? time : `${dateLabel} ${time}`;

          return {
            id:    item.id,
            text:  `Gian hàng "${item.boothName}" vừa có lượt nghe`,
            sub:   `Ngôn ngữ: ${item.languageCode} · ${item.deviceType}`,
            time:  timeWithDate,
            color: "blue",
          };
        })
      ),
};

export default activityService;