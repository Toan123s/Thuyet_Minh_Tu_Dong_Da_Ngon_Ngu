import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";
import { useAuth, clearAuth } from "../../hooks/useAuth";
import "./Layout.css";

/**
 * Props:
 *  - children : ReactNode
 *
 * Lấy user/role qua useAuth() — cùng nguồn với ProtectedRoute,
 * tự đọc đúng localStorage HOẶC sessionStorage tuỳ "Ghi nhớ đăng nhập".
 * Dùng bọc tất cả trang Admin và Vendor.
 */
export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const auth = useAuth(); // { token, role, accountId, username } | null

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <div className="layout">
      <Navbar
        user={auth ? { username: auth.username, role: auth.role } : null}
        onLogout={handleLogout}
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
      />

      <div className="layout__body">
        <Sidebar
          role={auth?.role ?? "Admin"}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="layout__main">
          {children}
        </main>
      </div>
    </div>
  );
}