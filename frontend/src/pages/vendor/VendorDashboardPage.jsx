import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/StatCard/StatCard';
import Toast, { useToast } from '../../components/Toast/Toast';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import vendorService from '../../services/vendorService';
import apiClient from '../../services/apiClient';
import styles from './VendorDashboardPage.module.css';

const IconPackage   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l10 6.5v7L12 22 2 15.5v-7L12 2z"/><line x1="12" y1="22" x2="12" y2="11.5"/><polyline points="22 8.5 12 11.5 2 8.5"/></svg>;
const IconHeadphone = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>;
const IconGlobe     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;

const CATEGORIES = [
  { id: 1, name: "Công nghệ thông tin" },
  { id: 2, name: "Hàng tiêu dùng" },
  { id: 3, name: "Thực phẩm & Đồ uống" },
  { id: 4, name: "Thời trang" },
];

export default function VendorDashboardPage() {
  const navigate = useNavigate();
  const { toasts, showToast } = useToast();

  // ── Auth: nguồn sự thật duy nhất, đọc cả localStorage + sessionStorage ──
  const auth = useAuth(); // { token, role, accountId, username } | null

  const [vendor,       setVendor]       = useState(null);
  const [booths,       setBooths]       = useState([]);
  const [stats,        setStats]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [requests,     setRequests]     = useState([]); // danh sách yêu cầu đã gửi

  const [form, setForm] = useState({
    boothName:   "",
    description: "",
    categoryId:  "",
  });
  const [formErr, setFormErr] = useState({});

  // ── Chưa đăng nhập → về login ──────────────────────────────
  // (Bình thường ProtectedRoute đã chặn trước khi vào trang này,
  //  check thêm ở đây để phòng trường hợp token hết hạn giữa lúc đang dùng)
  useEffect(() => {
    if (!auth) { navigate("/login"); return; }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.accountId]);

  async function loadData() {
    try {
      const [vendorData, boothsData, statsData] = await Promise.all([
        vendorService.getMe(),
        vendorService.getMyBooths(),
        vendorService.getStatsToday(),
      ]);
      setVendor(vendorData);
      setBooths(Array.isArray(boothsData) ? boothsData : []);
      setStats(statsData);

      // Lấy danh sách yêu cầu mở sạp đã gửi
      try {
        const reqs = await apiClient.get(`/booth-requests/my/${auth.accountId}`);
        setRequests(Array.isArray(reqs) ? reqs : []);
      } catch { setRequests([]); }

    } catch {
      showToast("Không thể kết nối đến máy chủ!", "error");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setFormErr(prev => ({ ...prev, [name]: "" }));
  }

  function validate() {
    const errs = {};
    if (!form.boothName.trim())  errs.boothName   = "Vui lòng nhập tên gian hàng.";
    if (!form.categoryId)        errs.categoryId   = "Vui lòng chọn danh mục.";
    return errs;
  }

  async function handleSubmitRequest(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFormErr(errs); return; }

    setSubmitting(true);
    try {
      await apiClient.post("/booth-requests", {
        accountId:   auth.accountId,
        boothName:   form.boothName.trim(),
        description: form.description.trim(),
        categoryId:  Number(form.categoryId),
      });
      showToast("Gửi yêu cầu mở sạp thành công! Admin sẽ xét duyệt sớm.", "success");
      setShowModal(false);
      setForm({ boothName: "", description: "", categoryId: "" });
      loadData(); // reload để cập nhật danh sách yêu cầu
    } catch (err) {
      showToast(err.message || "Gửi yêu cầu thất bại.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const statusBadge = (status) => {
    const map = {
      Pending:  { label: "⏳ Chờ duyệt",  color: "#f59e0b", bg: "#fef3c7" },
      Approved: { label: "✅ Đã duyệt",   color: "#16a34a", bg: "#dcfce7" },
      Rejected: { label: "❌ Từ chối",    color: "#dc2626", bg: "#fee2e2" },
    };
    const s = map[status] ?? map["Pending"];
    return (
      <span style={{
        fontSize: 12, fontWeight: 600, padding: "3px 10px",
        borderRadius: 20, color: s.color, backgroundColor: s.bg,
      }}>
        {s.label}
      </span>
    );
  };

  if (!auth || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.centered}>
          <LoadingSpinner size="lg" label="Đang tải số liệu gian hàng..." />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Toast toasts={toasts} />

      <h1 className={styles.title}>Tổng quan cá nhân 👋</h1>
      <p className={styles.welcomeText}>
        Xin chào, đại diện thương hiệu{" "}
        <span className={styles.brandName}>{vendor?.companyName ?? auth.username}</span>!
      </p>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <StatCard icon={<IconPackage />}   label="Gian hàng hoạt động" value={stats?.totalBooths ?? 0}    color="blue"   />
        <StatCard icon={<IconHeadphone />} label="Lượt nghe hôm nay"   value={stats?.listensToday ?? 0}   color="green"  />
        <StatCard icon={<IconGlobe />}     label="Ngôn ngữ đã dịch"    value={stats?.totalLanguages ?? 0} color="purple" />
      </div>

      {/* ── Gian hàng của tôi ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 36 }}>
        <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Gian hàng của tôi</h2>
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setShowModal(true)}>
          + Yêu cầu mở sạp
        </button>
      </div>
      <hr style={{ border: "none", borderTop: "2px solid #e5e7eb", margin: "12px 0 20px" }} />

      {booths.length === 0 && requests.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", backgroundColor: "#fff", borderRadius: 12, border: "1px dashed #d1d5db" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏪</div>
          <p style={{ color: "#6b7280", marginBottom: 16 }}>Bạn chưa có gian hàng nào.</p>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setShowModal(true)}>
            + Yêu cầu mở sạp ngay
          </button>
        </div>
      )}

      {/* Danh sách booth */}
      {booths.map((booth) => (
        <div key={booth.id} className={styles.boothCard} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h3 className={styles.boothName}>📦 {booth.name}</h3>
              <p className={styles.eventName}>Sự kiện: {booth.eventName}</p>
            </div>
            <span style={{
              fontSize: 12, padding: "3px 10px", borderRadius: 20, fontWeight: 600,
              backgroundColor: booth.isActive ? "#dcfce7" : "#f3f4f6",
              color: booth.isActive ? "#16a34a" : "#6b7280",
            }}>
              {booth.isActive ? "● Hoạt động" : "○ Tạm dừng"}
            </span>
          </div>
          <div className={styles.btnGroup}>
            <button className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => navigate(`/vendor/narrations/${booth.id}`)}>
              ✏️ Nội dung thuyết minh
            </button>
            <button className={`${styles.btn} ${styles.btnSuccess}`}
              onClick={() => navigate(`/vendor/media/${booth.id}`)}>
              🎥 Ảnh / Video
            </button>
            <button className={`${styles.btn} ${styles.btnWarning}`}
              onClick={() => navigate(`/vendor/stats/${booth.id}`)}>
              📊 Thống kê
            </button>
          </div>
        </div>
      ))}

      {/* Danh sách yêu cầu đang chờ */}
      {requests.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>Yêu cầu mở sạp</h2>
          {requests.map((req, i) => (
            <div key={req.id ?? i} style={{
              padding: "16px 20px", backgroundColor: "#fff", borderRadius: 12,
              border: "1px solid #e5e7eb", marginBottom: 12,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#111" }}>🏪 {req.boothName}</p>
                <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>{req.categoryName} — {req.description || "Chưa có mô tả"}</p>
              </div>
              {statusBadge(req.status)}
            </div>
          ))}
        </>
      )}

      {/* ── Modal yêu cầu mở sạp ── */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: 20, backdropFilter: "blur(4px)",
        }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: 28,
            width: "100%", maxWidth: 460,
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>🏪 Yêu cầu mở gian hàng</h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280" }}>✕</button>
            </div>

            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20, lineHeight: 1.6 }}>
              Điền thông tin gian hàng bạn muốn mở. Admin sẽ xét duyệt và đặt vị trí trên bản đồ sự kiện.
            </p>

            <form onSubmit={handleSubmitRequest}>
              {/* Tên gian hàng */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5, color: "#374151" }}>
                  Tên gian hàng *
                </label>
                <input
                  name="boothName" value={form.boothName} onChange={handleChange}
                  placeholder="VD: Gian hàng Công nghệ ABC"
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: 8, boxSizing: "border-box",
                    border: `1.5px solid ${formErr.boothName ? "#dc2626" : "#d1d5db"}`, fontSize: 14,
                  }}
                />
                {formErr.boothName && <p style={{ color: "#dc2626", fontSize: 12, margin: "4px 0 0" }}>{formErr.boothName}</p>}
              </div>

              {/* Danh mục */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5, color: "#374151" }}>
                  Danh mục *
                </label>
                <select
                  name="categoryId" value={form.categoryId} onChange={handleChange}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: 8, boxSizing: "border-box",
                    border: `1.5px solid ${formErr.categoryId ? "#dc2626" : "#d1d5db"}`, fontSize: 14,
                    backgroundColor: "#fff",
                  }}
                >
                  <option value="">-- Chọn danh mục --</option>
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {formErr.categoryId && <p style={{ color: "#dc2626", fontSize: 12, margin: "4px 0 0" }}>{formErr.categoryId}</p>}
              </div>

              {/* Mô tả */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5, color: "#374151" }}>
                  Mô tả gian hàng
                </label>
                <textarea
                  name="description" value={form.description} onChange={handleChange}
                  placeholder="Giới thiệu ngắn về sản phẩm/dịch vụ bạn sẽ trưng bày..."
                  rows={3}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: 8, boxSizing: "border-box",
                    border: "1.5px solid #d1d5db", fontSize: 14, resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{
                    flex: 1, padding: 12, background: "none", border: "1.5px solid #d1d5db",
                    borderRadius: 8, fontSize: 14, cursor: "pointer", color: "#6b7280",
                  }}>
                  Hủy
                </button>
                <button type="submit" disabled={submitting}
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  style={{ flex: 2, padding: 12, fontSize: 14, borderRadius: 8 }}>
                  {submitting ? "Đang gửi..." : "📤 Gửi yêu cầu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}