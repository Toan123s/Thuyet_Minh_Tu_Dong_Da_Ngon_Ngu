import { useState, useMemo, useEffect, useCallback } from "react";
import Layout from "../../components/Layout/Layout";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import Toast, { useToast } from "../../components/Toast/Toast";
import accountService from "../../services/accountService";
import "./AccountManagementPage.css";

// ─── Icons ───────────────────────────────────────────────────
const IconPlus = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
const IconSearch = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const IconX = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const IconEdit = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
const IconLock = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
const IconUnlock = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></svg>;
const IconRefresh = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.95" /></svg>;
const IconChevronL = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>;
const IconChevronR = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>;
const IconUser = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;

const PAGE_SIZE = 5;

function getInitials(username) {
  return username.slice(0, 2).toUpperCase();
}

function validateForm(form) {
  const errors = {};
  if (!form.username.trim()) errors.username = "Không được để trống";
  if (!form.email.trim()) errors.email = "Không được để trống";
  else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = "Email không hợp lệ";
  if (form.role === "Vendor") {
    if (!form.company.trim()) errors.company = "Không được để trống";
    if (!form.representative.trim()) errors.representative = "Không được để trống";
  }
  return errors;
}

// ─── Account Form Modal ──────────────────────────────────────
function AccountFormModal({ initial, onSave, onClose }) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    username: initial?.username ?? "",
    email: initial?.email ?? "",
    role: initial?.role ?? "Vendor",
    company: initial?.company ?? "",
    representative: initial?.representative ?? "",
    phone: initial?.phone ?? "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: undefined }));
  }

  async function handleSave() {
    const errs = validateForm(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="am-modal-overlay" onClick={onClose}>
      <div className="am-modal" onClick={e => e.stopPropagation()}>
        <div className="am-modal-header">
          <h2>{isEdit ? "Chỉnh sửa tài khoản" : "Tạo tài khoản mới"}</h2>
          <button className="am-modal-close" onClick={onClose}><IconX /></button>
        </div>

        <div className="am-modal-body">
          <div className="am-form-row">
            <div className="am-field">
              <label>Tên đăng nhập <span>*</span></label>
              <input value={form.username} onChange={e => set("username", e.target.value)}
                className={errors.username ? "error" : ""}
                placeholder="vd: vinai_acc" disabled={isEdit} />
              {errors.username && <span className="am-error-msg">{errors.username}</span>}
            </div>
            <div className="am-field">
              <label>Email <span>*</span></label>
              <input value={form.email} onChange={e => set("email", e.target.value)}
                className={errors.email ? "error" : ""}
                placeholder="vd: vendor@company.com" />
              {errors.email && <span className="am-error-msg">{errors.email}</span>}
            </div>
          </div>

          <div className="am-field">
            <label>Vai trò <span>*</span></label>
            <select value={form.role} onChange={e => set("role", e.target.value)} disabled={isEdit}>
              <option value="Admin">Admin</option>
              <option value="Vendor">Vendor</option>
            </select>
          </div>

          {form.role === "Vendor" && (
            <div className="am-vendor-fields">
              <div className="am-vendor-fields-label">🏢 Thông tin doanh nghiệp</div>
              <div className="am-form-row">
                <div className="am-field full">
                  <label>Tên công ty <span>*</span></label>
                  <input value={form.company} onChange={e => set("company", e.target.value)}
                    className={errors.company ? "error" : ""}
                    placeholder="vd: VinAI Research" />
                  {errors.company && <span className="am-error-msg">{errors.company}</span>}
                </div>
                <div className="am-field">
                  <label>Người đại diện <span>*</span></label>
                  <input value={form.representative} onChange={e => set("representative", e.target.value)}
                    className={errors.representative ? "error" : ""}
                    placeholder="vd: Nguyễn Văn A" />
                  {errors.representative && <span className="am-error-msg">{errors.representative}</span>}
                </div>
                <div className="am-field">
                  <label>Số điện thoại</label>
                  <input value={form.phone} onChange={e => set("phone", e.target.value)}
                    placeholder="vd: 0901234567" />
                </div>
              </div>
            </div>
          )}

          {!isEdit && (
            <p className="am-note">
              💡 Mật khẩu tạm sẽ được tạo tự động và gửi về email tài khoản.
            </p>
          )}
        </div>

        <div className="am-modal-footer">
          <button className="am-btn am-btn--ghost" onClick={onClose} disabled={saving}>Hủy</button>
          <button className="am-btn am-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo tài khoản"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton Row ────────────────────────────────────────────
function SkeletonRows({ count = 5 }) {
  return Array.from({ length: count }).map((_, i) => (
    <tr key={i} className="am-skeleton-row">
      {Array.from({ length: 6 }).map((_, j) => (
        <td key={j}><div className="am-skeleton-cell" /></td>
      ))}
    </tr>
  ));
}

// ─── Main Page ───────────────────────────────────────────────
export default function AccountManagementPage() {
  // ── State ────────────────────────────────────────────────
  const [accounts, setAccounts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [modalForm, setModalForm] = useState(null);
  const [confirm, setConfirm] = useState({ isOpen: false });
  const [pendingAction, setPending] = useState(null);
  const { toasts, showToast } = useToast();

  // ── Fetch ────────────────────────────────────────────────
  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const role = activeTab === "all" ? "" : activeTab;
      const res = await accountService.getAll({ page, pageSize: PAGE_SIZE, role, search });
      setAccounts(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách tài khoản.");
    } finally {
      setLoading(false);
    }
  }, [page, activeTab, search]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  // ── Tab counts (từ total API; nếu cần count theo role thì gọi thêm) ──
  // Tạm tính từ dữ liệu đang hiển thị
  const counts = useMemo(() => ({
    all: total,
    Admin: accounts.filter(a => a.role === "Admin").length,
    Vendor: accounts.filter(a => a.role === "Vendor").length,
  }), [accounts, total]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function changeTab(tab) { setActiveTab(tab); setPage(1); }

  // Debounce search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Save form ─────────────────────────────────────────────
  async function handleSaveForm(form) {
    if (modalForm.mode === "create") {
      await accountService.create(form);
      showToast("Tạo tài khoản thành công — mật khẩu đã gửi qua email.");
    } else {
      await accountService.update(modalForm.data.id, form);
      showToast("Đã lưu thay đổi.");
    }
    setModalForm(null);
    fetchAccounts();
  }

  // ── Toggle status ─────────────────────────────────────────
  function askToggleStatus(acc) {
    const willLock = acc.status === "active";
    setPending({ type: "toggle", acc });
    setConfirm({
      isOpen: true,
      variant: "warning",
      title: willLock ? `Khóa tài khoản ${acc.username}?` : `Mở tài khoản ${acc.username}?`,
      message: willLock
        ? "Tài khoản này sẽ không thể đăng nhập cho đến khi được mở lại."
        : "Tài khoản này sẽ có thể đăng nhập trở lại.",
      confirmLabel: willLock ? "Khóa tài khoản" : "Mở tài khoản",
    });
  }

  // ── Reset password ────────────────────────────────────────
  function askResetPassword(acc) {
    setPending({ type: "reset", acc });
    setConfirm({
      isOpen: true,
      variant: "danger",
      title: "Reset mật khẩu?",
      message: `Mật khẩu mới sẽ được tạo ngẫu nhiên và gửi tới ${acc.email}.`,
      confirmLabel: "Reset mật khẩu",
    });
  }

  async function handleConfirm() {
    setConfirm({ isOpen: false });
    try {
      if (pendingAction?.type === "toggle") {
        const { acc } = pendingAction;
        const newStatus = acc.status === "active" ? "inactive" : "active";
        await accountService.setStatus(acc.id, newStatus);
        showToast(
          newStatus === "inactive"
            ? `Đã khóa tài khoản ${acc.username}.`
            : `Đã mở tài khoản ${acc.username}.`,
          newStatus === "inactive" ? "warning" : "success"
        );
        fetchAccounts();
      } else if (pendingAction?.type === "reset") {
        await accountService.resetPassword(pendingAction.acc.id);
        showToast(`Mật khẩu mới đã gửi tới ${pendingAction.acc.email}.`);
      }
    } catch (err) {
      showToast(err.message || "Có lỗi xảy ra.", "error");
    } finally {
      setPending(null);
    }
  }

  function handleCancel() {
    setConfirm({ isOpen: false });
    setPending(null);
  }

  // ─────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="am-page">

        {/* Header */}
        <div className="am-header">
          <div className="am-header-left">
            <h1>Quản lý tài khoản</h1>
            <p>Quản lý tài khoản Admin và Vendor trong hệ thống</p>
          </div>
          <button className="am-btn-create" onClick={() => setModalForm({ mode: "create" })}>
            <IconPlus /> Tạo tài khoản
          </button>
        </div>

        {/* Toolbar */}
        <div className="am-toolbar">
          <div className="am-tabs">
            {[
              { key: "all", label: "Tất cả" },
              { key: "Admin", label: "Admin" },
              { key: "Vendor", label: "Vendor" },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`am-tab ${activeTab === key ? "active" : ""}`}
                onClick={() => changeTab(key)}
              >
                {label}
                <span className="am-tab-count">
                  {key === "all" ? counts.all : counts[key]}
                </span>
              </button>
            ))}
          </div>

          <div className="am-search-wrap">
            <IconSearch />
            <input
              className="am-search"
              placeholder="Tìm theo tên, email, công ty..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="am-error-banner">
            ⚠️ {error}
            <button onClick={fetchAccounts}>Thử lại</button>
          </div>
        )}

        {/* Table */}
        <div className="am-table-card">
          <table className="am-table">
            <thead>
              <tr>
                <th>Tài khoản</th>
                <th>Vai trò</th>
                <th>Thông tin vendor</th>
                <th>Ngày tạo</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows count={PAGE_SIZE} />
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="am-empty">
                      <IconUser />
                      <p>Không tìm thấy tài khoản nào.</p>
                    </div>
                  </td>
                </tr>
              ) : accounts.map(acc => (
                <tr key={acc.id}>

                  {/* User */}
                  <td>
                    <div className="am-user-cell">
                      <div className={`am-avatar am-avatar--${acc.role.toLowerCase()}`}>
                        {getInitials(acc.username)}
                      </div>
                      <div>
                        <div className="am-user-name">{acc.username}</div>
                        <div className="am-user-email">{acc.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td>
                    <span className={`am-role-badge am-role-badge--${acc.role.toLowerCase()}`}>
                      {acc.role === "Admin" ? "🛡 Admin" : "🏢 Vendor"}
                    </span>
                  </td>

                  {/* Vendor info */}
                  <td>
                    {acc.role === "Vendor" ? (
                      <div>
                        <div className="am-vendor-name">{acc.company}</div>
                        <div className="am-vendor-rep">{acc.representative} · {acc.phone}</div>
                      </div>
                    ) : (
                      <span className="am-cell-empty">—</span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="am-cell-date">{acc.createdAt}</td>

                  {/* Status */}
                  <td>
                    <span className={`am-status-badge am-status-badge--${acc.status}`}>
                      <span className="am-status-dot" />
                      {acc.status === "active" ? "Đang hoạt động" : "Đã khóa"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td>
                    <div className="am-actions">
                      <button className="am-btn-icon" title="Chỉnh sửa"
                        onClick={() => setModalForm({ mode: "edit", data: acc })}>
                        <IconEdit />
                      </button>
                      <button
                        className={`am-btn-icon ${acc.status === "active" ? "am-btn-icon--lock" : "am-btn-icon--unlock"}`}
                        title={acc.status === "active" ? "Khóa tài khoản" : "Mở tài khoản"}
                        onClick={() => askToggleStatus(acc)}>
                        {acc.status === "active" ? <IconLock /> : <IconUnlock />}
                      </button>
                      <button className="am-btn-icon am-btn-icon--reset" title="Reset mật khẩu"
                        onClick={() => askResetPassword(acc)}>
                        <IconRefresh />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <div className="am-pagination">
              <span className="am-pagination-info">
                Hiển thị {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} / {total} tài khoản
              </span>
              <div className="am-pagination-btns">
                <button className="am-page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1 || loading}>
                  <IconChevronL />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button key={n} className={`am-page-btn ${n === page ? "active" : ""}`}
                    onClick={() => setPage(n)} disabled={loading}>
                    {n}
                  </button>
                ))}
                <button className="am-page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages || loading}>
                  <IconChevronR />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Form Modal */}
        {modalForm && (
          <AccountFormModal
            initial={modalForm.data}
            onSave={handleSaveForm}
            onClose={() => setModalForm(null)}
          />
        )}

        {/* Shared Components */}
        <ConfirmDialog
          isOpen={confirm.isOpen}
          variant={confirm.variant}
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />

        <Toast toasts={toasts} />
      </div>
    </Layout>

  );
}