// ─── useAuth Hook ─────────────────────────────────────────────
// Tách riêng khỏi ProtectedRoute.jsx để tránh lỗi react-refresh/only-export-components
// (1 file chỉ nên export component, không export kèm hàm/hook khác)

/**
 * Đọc token từ localStorage HOẶC sessionStorage.
 * - "Ghi nhớ đăng nhập" được tick → token nằm ở localStorage (tồn tại lâu dài)
 * - Không tick → token nằm ở sessionStorage (mất khi đóng tab/browser)
 */
function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("accountId");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("role");
  sessionStorage.removeItem("accountId");
}

/** Đọc và validate JWT, bất kể đang nằm ở localStorage hay sessionStorage */
function getAuthInfo() {
  try {
    const token = getToken();
    if (!token) return null;

    const payload = JSON.parse(atob(token.split(".")[1]));

    if (payload.exp && payload.exp * 1000 < Date.now()) {
      clearAuth();
      return null;
    }

    return {
      token,
      role: payload.role,
      accountId: payload.accountId || payload.sub,
      username: payload.username,
    };
  } catch {
    clearAuth();
    return null;
  }
}

/**
 * Hook trả về thông tin user hiện tại từ JWT (đọc cả localStorage + sessionStorage).
 * Dùng: const { role, username, accountId } = useAuth();
 */
export function useAuth() {
  return getAuthInfo();
}

// Export thêm để ProtectedRoute.jsx dùng lại logic này
export { getAuthInfo, getToken, clearAuth };