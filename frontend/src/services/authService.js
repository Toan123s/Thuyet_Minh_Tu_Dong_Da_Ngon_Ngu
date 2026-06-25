import apiClient from "./apiClient";
import { getAuthInfo, clearAuth } from "../hooks/useAuth";

// ─── Auth Service ─────────────────────────────────────────────
// Phục vụ: LoginPage, VendorDashboardPage, mọi nơi cần gọi API đăng nhập.
// Việc ĐỌC user hiện tại dùng chung getAuthInfo() từ useAuth.js
// để tránh 2 nguồn sự thật khác nhau (lỗi đã gặp trước đây).

const authService = {
  /**
   * Đăng nhập
   * @param {{ username: string, password: string }} credentials
   * @returns {{ token: string, role: string, accountId: number }}
   */
  login: (credentials) =>
    apiClient.post("/auth/login", credentials),

  /**
   * Đăng xuất — xóa token ở cả localStorage và sessionStorage
   */
  logout: () => {
    clearAuth();
  },

  /**
   * Lấy thông tin user hiện tại từ JWT (đọc cả localStorage + sessionStorage).
   * Dùng chung logic với useAuth() để 2 nơi không bao giờ lệch nhau.
   * @returns {{ accountId, username, role, token } | null}
   */
  getCurrentUser: () => getAuthInfo(),
};

export default authService;