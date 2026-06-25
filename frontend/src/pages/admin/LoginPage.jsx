import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import "./LoginPage.css";

const IconUser = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconLock = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconEye = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconEyeOff = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const IconMic = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z" opacity="0.9"/>
    <path d="M19 10a7 7 0 0 1-14 0H3a9 9 0 0 0 8 8.94V21H9v2h6v-2h-2v-2.06A9 9 0 0 0 21 10h-2z" opacity="0.7"/>
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();

  const [login,        setLogin]        = useState(""); // username hoặc email
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember,     setRemember]     = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!login.trim()) { setError("Vui lòng nhập tên đăng nhập hoặc email."); return; }
    if (!password)     { setError("Vui lòng nhập mật khẩu."); return; }

    setLoading(true);
    setError("");

    try {
      const res = await authService.login({
        username: login.trim(),
        password,
      });

      // Xóa hết token cũ
      localStorage.clear();
      sessionStorage.clear();

      // Lưu token mới
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem("token",     res.token);
      storage.setItem("role",      res.role);
      storage.setItem("accountId", String(res.accountId));

      if (res.role === "Admin") navigate("/admin/dashboard");
      else                      navigate("/vendor/dashboard");

    } catch (err) {
      const msg = err.message || "";
      if (msg.toLowerCase().includes("khóa") || msg.toLowerCase().includes("lock")) {
        setError("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
      } else {
        setError("Tên đăng nhập/email hoặc mật khẩu không đúng.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="lp-page">
      <div className="lp-blob lp-blob--1" />
      <div className="lp-blob lp-blob--2" />

      <div className="lp-card">
        <div className="lp-brand">
          <div className="lp-brand__icon"><IconMic /></div>
          <h1 className="lp-brand__name">AutoNarration</h1>
          <p className="lp-brand__sub">Admin Portal</p>
        </div>

        {error && <div className="lp-error"><span>{error}</span></div>}

        <form className="lp-form" onSubmit={handleSubmit}>
          {/* Username hoặc Email */}
          <div className={`lp-field ${error ? "lp-field--error" : ""}`}>
            <label htmlFor="lp-login">Tên đăng nhập hoặc Email</label>
            <div className="lp-input-wrap">
              <span className="lp-input-icon"><IconUser /></span>
              <input
                id="lp-login"
                type="text"
                autoComplete="username"
                placeholder="Nhập tên đăng nhập hoặc email..."
                value={login}
                onChange={(e) => { setLogin(e.target.value); setError(""); }}
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div className={`lp-field ${error ? "lp-field--error" : ""}`}>
            <label htmlFor="lp-password">Mật khẩu</label>
            <div className="lp-input-wrap">
              <span className="lp-input-icon"><IconLock /></span>
              <input
                id="lp-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                disabled={loading}
              />
              <button
                type="button"
                className="lp-eye-btn"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
          </div>

          <div className="lp-row">
            <label className="lp-checkbox">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <button type="button" className="lp-forgot">Quên mật khẩu?</button>
          </div>

          <button type="submit" className="lp-submit" disabled={loading}>
            {loading ? <span className="lp-spinner" /> : "Đăng nhập"}
          </button>

          <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#6b7280" }}>
            Chưa có tài khoản?{" "}
            <button
              type="button"
              onClick={() => navigate("/register")}
              style={{ background: "none", border: "none", color: "#4f46e5", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
            >
              Đăng ký ngay
            </button>
          </div>
        </form>

        <p className="lp-footer">Hệ thống Thuyết Minh Tự Động Đa Ngôn Ngữ</p>
      </div>
    </div>
  );
}