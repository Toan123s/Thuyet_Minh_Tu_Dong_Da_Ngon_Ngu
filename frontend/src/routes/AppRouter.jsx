import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute   from "../components/ProtectedRoute/ProtectedRoute";
import VendorPaywall    from "../components/VendorPaywall/VendorPaywall";
import GeofenceProvider from "../components/GeofenceProvider/GeofenceProvider";

// ── Admin pages ──────────────────────────────────────────────
import DashboardPage         from "../pages/admin/DashboardPage";
import EventManagementPage   from "../pages/admin/EventManagementPage";
import BoothManagementPage   from "../pages/admin/BoothManagementPage";
import AccountManagementPage from "../pages/admin/AccountManagementPage";
import ReportPage            from "../pages/admin/ReportPage";
import LoginPage             from "../pages/admin/LoginPage";
import RegisterPage          from "../pages/admin/RegisterPage";

// ── Vendor pages ─────────────────────────────────────────────
import VendorDashboardPage from "../pages/vendor/VendorDashboardPage";
import NarrationPage       from "../pages/vendor/NarrationPage";
import MediaPage           from "../pages/vendor/MediaPage";
import StatisticPage       from "../pages/vendor/StatisticPage";

// ── Visitor pages ─────────────────────────────────────────────
import LandingPage  from "../pages/visitor/LandingPage";
import PaymentPage  from "../pages/visitor/PaymentPage";
import LocationPage from "../pages/visitor/LocationPage";
import MapPage      from "../pages/visitor/MapPage";
import BoothPage    from "../pages/visitor/BoothPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      {/*
        GeofenceProvider nằm NGOÀI <Routes> — nhờ vậy nó không bị
        unmount/remount mỗi khi chuyển trang. watchPosition() chỉ
        được khởi tạo 1 lần và chạy liên tục xuyên suốt cả app,
        tự điều hướng sang booth mới khi người dùng bước vào phạm vi,
        bất kể đang đứng ở MapPage, BoothPage của booth khác, hay
        LandingPage. Tự tắt khi ở /admin, /vendor, /login (xem logic
        isVisitorRoute bên trong GeofenceProvider).
      */}
      <GeofenceProvider />

      <Routes>

        {/* ── Visitor (không cần đăng nhập) ───────────────── */}
        <Route path="/"          element={<LandingPage />} />
        <Route path="/payment"   element={<PaymentPage />} />
        <Route path="/location"  element={<LocationPage />} />
        <Route path="/map"       element={<MapPage />} />
        <Route path="/booth/:id" element={<BoothPage />} />

        {/* ── Public ──────────────────────────────────────── */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ── Admin ───────────────────────────────────────── */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <Navigate to="/admin/dashboard" replace />
          </ProtectedRoute>
        } />
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/events" element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <EventManagementPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/booths" element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <BoothManagementPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/accounts" element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <AccountManagementPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/reports" element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <ReportPage />
          </ProtectedRoute>
        } />

        {/* ── Vendor (bọc VendorPaywall để chặn chưa trả phí) ── */}
        <Route path="/vendor" element={
          <ProtectedRoute allowedRoles={["Vendor"]}>
            <Navigate to="/vendor/dashboard" replace />
          </ProtectedRoute>
        } />
        <Route path="/vendor/dashboard" element={
          <ProtectedRoute allowedRoles={["Vendor"]}>
            <VendorPaywall>
              <VendorDashboardPage />
            </VendorPaywall>
          </ProtectedRoute>
        } />
        <Route path="/vendor/narrations/:boothId" element={
          <ProtectedRoute allowedRoles={["Vendor"]}>
            <VendorPaywall>
              <NarrationPage />
            </VendorPaywall>
          </ProtectedRoute>
        } />
        <Route path="/vendor/media/:boothId" element={
          <ProtectedRoute allowedRoles={["Vendor"]}>
            <VendorPaywall>
              <MediaPage />
            </VendorPaywall>
          </ProtectedRoute>
        } />
        <Route path="/vendor/stats/:boothId" element={
          <ProtectedRoute allowedRoles={["Vendor"]}>
            <VendorPaywall>
              <StatisticPage />
            </VendorPaywall>
          </ProtectedRoute>
        } />

        {/* ── Fallback ────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}