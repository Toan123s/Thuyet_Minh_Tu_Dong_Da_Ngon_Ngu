import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast, { useToast } from "../../components/Toast/Toast";
import apiClient from "../../services/apiClient";
import authService from "../../services/authService";
import "./RegisterPage.css";

const QR_URL = "https://img.vietqr.io/image/MB-1234567899999-qr_only.png?addInfo=Phi%20Vendor";
const FEE    = "500,000 VND";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { toasts, showToast } = useToast();

  const [step,       setStep]       = useState(1); // 1: form, 2: payment
  const [loading,    setLoading]    = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [accountId,  setAccountId]  = useState(null);
  const [error,      setError]      = useState("");

  const [form, setForm] = useState({
    username:           "",
    password:           "",
    confirmPassword:    "",
    email:              "",
    companyName:        "",
    representativeName: "",
    phoneNumber:        "",
  });

  const [errors, setErrors] = useState({});

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
    setError("");
  }

  function validate() {
    const errs = {};
    if (!form.username.trim())           errs.username           = "Vui lòng nhập tên đăng nhập.";
    if (form.password.length < 6)        errs.password           = "Mật khẩu tối thiểu 6 ký tự.";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Mật khẩu không khớp.";
    if (!form.email.includes("@"))       errs.email              = "Email không hợp lệ.";
    if (!form.companyName.trim())        errs.companyName        = "Vui lòng nhập tên công ty.";
    if (!form.representativeName.trim()) errs.representativeName = "Vui lòng nhập tên người đại diện.";
    if (!form.phoneNumber.trim())        errs.phoneNumber        = "Vui lòng nhập số điện thoại.";
    return errs;
  }

  // Bước 1: Submit form → tạo account
  async function handleRegister(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await apiClient.post("/register", {
        username:           form.username.trim(),
        password:           form.password,
        email:              form.email.trim(),
        companyName:        form.companyName.trim(),
        representativeName: form.representativeName.trim(),
        phoneNumber:        form.phoneNumber.trim(),
      });
      setAccountId(res.accountId);
      setStep(2); // Chuyển sang bước thanh toán
    } catch (err) {
      setError(err.message || "Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  // Bước 2: Confirm thanh toán
  async function handleConfirmPayment() {
    setPayLoading(true);
    try {
      await apiClient.post("/register/pay", { accountId });

      // Tự động login sau khi thanh toán
      const loginRes = await authService.login({
        username: form.username.trim(),
        password: form.password,
      });

      const storage = localStorage;
      storage.setItem("token",     loginRes.token);
      storage.setItem("role",      loginRes.role);
      storage.setItem("accountId", String(loginRes.accountId));

      showToast("Đăng ký & thanh toán thành công! Đang vào hệ thống...", "success");
      setTimeout(() => navigate("/vendor/dashboard"), 1500);
    } catch {
      showToast("Xác nhận thanh toán thất bại. Vui lòng thử lại.", "error");
    } finally {
      setPayLoading(false);
    }
  }

  return (
    <div className="rp-page">
      <Toast toasts={toasts} />

      <div className="rp-card">
        {/* Brand */}
        <div className="rp-brand">
          <div className="rp-brand__icon">🏪</div>
          <h1 className="rp-brand__title">Đăng Ký Vendor</h1>
          <p className="rp-brand__sub">AutoNarration — Hệ thống thuyết minh tự động</p>
        </div>

        {/* Steps */}
        <div className="rp-steps">
          <div className="rp-step">
            <div className={`rp-step__circle ${step >= 1 ? (step > 1 ? "rp-step__circle--done" : "rp-step__circle--active") : ""}`}>
              {step > 1 ? "✓" : "1"}
            </div>
            <span className="rp-step__label">Thông tin</span>
          </div>
          <div className={`rp-step__line ${step > 1 ? "rp-step__line--done" : ""}`} />
          <div className="rp-step">
            <div className={`rp-step__circle ${step >= 2 ? "rp-step__circle--active" : ""}`}>
              2
            </div>
            <span className="rp-step__label">Thanh toán</span>
          </div>
        </div>

        {/* Step 1: Form */}
        {step === 1 && (
          <form onSubmit={handleRegister}>
            {error && <div className="rp-error">⚠️ {error}</div>}

            <p className="rp-section-title">🏢 Thông tin công ty</p>

            <div className="rp-field">
              <label>Tên công ty *</label>
              <input name="companyName" value={form.companyName}
                onChange={handleChange} placeholder="VD: Công ty TNHH ABC"
                className={errors.companyName ? "error" : ""} />
              {errors.companyName && <p className="rp-field__err">{errors.companyName}</p>}
            </div>

            <div className="rp-row">
              <div className="rp-field">
                <label>Người đại diện *</label>
                <input name="representativeName" value={form.representativeName}
                  onChange={handleChange} placeholder="Họ và tên"
                  className={errors.representativeName ? "error" : ""} />
                {errors.representativeName && <p className="rp-field__err">{errors.representativeName}</p>}
              </div>
              <div className="rp-field">
                <label>Số điện thoại *</label>
                <input name="phoneNumber" value={form.phoneNumber}
                  onChange={handleChange} placeholder="0901234567"
                  className={errors.phoneNumber ? "error" : ""} />
                {errors.phoneNumber && <p className="rp-field__err">{errors.phoneNumber}</p>}
              </div>
            </div>

            <p className="rp-section-title">👤 Tài khoản đăng nhập</p>

            <div className="rp-field">
              <label>Email *</label>
              <input name="email" type="email" value={form.email}
                onChange={handleChange} placeholder="email@company.com"
                className={errors.email ? "error" : ""} />
              {errors.email && <p className="rp-field__err">{errors.email}</p>}
            </div>

            <div className="rp-field">
              <label>Tên đăng nhập *</label>
              <input name="username" value={form.username}
                onChange={handleChange} placeholder="username"
                className={errors.username ? "error" : ""} />
              {errors.username && <p className="rp-field__err">{errors.username}</p>}
            </div>

            <div className="rp-row">
              <div className="rp-field">
                <label>Mật khẩu *</label>
                <input name="password" type="password" value={form.password}
                  onChange={handleChange} placeholder="Tối thiểu 6 ký tự"
                  className={errors.password ? "error" : ""} />
                {errors.password && <p className="rp-field__err">{errors.password}</p>}
              </div>
              <div className="rp-field">
                <label>Xác nhận mật khẩu *</label>
                <input name="confirmPassword" type="password" value={form.confirmPassword}
                  onChange={handleChange} placeholder="Nhập lại mật khẩu"
                  className={errors.confirmPassword ? "error" : ""} />
                {errors.confirmPassword && <p className="rp-field__err">{errors.confirmPassword}</p>}
              </div>
            </div>

            <button type="submit" className="rp-btn-primary" disabled={loading}>
              {loading ? "Đang xử lý..." : "Tiếp tục →"}
            </button>

            <div className="rp-login-link">
              Đã có tài khoản?{" "}
              <button type="button" onClick={() => navigate("/login")}>Đăng nhập</button>
            </div>
          </form>
        )}
      </div>

      {/* Payment Modal — hiện khi step === 2 */}
      {step === 2 && (
        <div className="rp-modal-overlay">
          <div className="rp-modal">
            <div className="rp-modal__header">
              <div className="rp-modal__icon">💳</div>
              <h3 className="rp-modal__title">Thanh Toán Phí Địa Điểm</h3>
              <p className="rp-modal__sub">
                Hoàn tất thanh toán để kích hoạt tài khoản vendor và sử dụng toàn bộ tính năng
              </p>
            </div>

            <div className="rp-modal__qr">
              <img src={QR_URL} alt="VietQR" />
            </div>

            <div className="rp-modal__info">
              <div>Ngân hàng: <b>MB Bank</b></div>
              <div>Số TK: <b>1234567899999</b></div>
              <div>Nội dung: <b>Phi Vendor {form.companyName}</b></div>
              <div>Số tiền: <b>{FEE}</b></div>
            </div>

            <button className="rp-modal__btn" onClick={handleConfirmPayment} disabled={payLoading}>
              {payLoading ? "Đang xác nhận..." : "✅ Tôi đã chuyển khoản thành công"}
            </button>

            <button className="rp-modal__skip" onClick={() => navigate("/login")}>
              Thanh toán sau → Đăng nhập
            </button>
          </div>
        </div>
      )}
    </div>
  );
}