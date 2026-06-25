import { Navigate, useLocation } from "react-router-dom";
import { getAuthInfo } from "../../hooks/useAuth";

// ─── Component ────────────────────────────────────────────────
/**
 * Props:
 *  - children    : ReactNode
 *  - allowedRoles: string[]   — VD: ["Admin"] hoặc ["Admin", "Vendor"]
 *
 * Hành vi:
 *  - Chưa đăng nhập           → redirect /login (giữ lại location để redirect lại sau)
 *  - Đăng nhập nhưng sai role → redirect về dashboard của role đó
 *  - Đúng role                → render children
 *
 * Dùng:
 *   <Route path="/admin/*" element={<ProtectedRoute allowedRoles={["Admin"]}><AdminLayout /></ProtectedRoute>} />
 *   <Route path="/vendor/*" element={<ProtectedRoute allowedRoles={["Vendor"]}><VendorLayout /></ProtectedRoute>} />
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const location = useLocation();
  const auth = getAuthInfo();

  // ── Chưa đăng nhập ──────────────────────────────────────────
  if (!auth) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // ── Sai role ─────────────────────────────────────────────────
  if (allowedRoles.length > 0 && !allowedRoles.includes(auth.role)) {
    const fallback = auth.role === "Admin"
      ? "/admin/dashboard"
      : "/vendor/dashboard";
    return <Navigate to={fallback} replace />;
  }

  // ── OK ───────────────────────────────────────────────────────
  return children;
}