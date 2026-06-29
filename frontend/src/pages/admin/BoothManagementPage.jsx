import { useState, useEffect, useCallback } from "react";
import Layout from "../../components/Layout/Layout";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import GoogleMap from "../../components/GoogleMap/GoogleMap";
import StatCard from "../../components/StatCard/StatCard";
import { useToast } from "../../components/Toast/Toast";
import Toast from "../../components/Toast/Toast";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";
import boothService from "../../services/boothService";
import eventService from "../../services/eventService";
import accountService from "../../services/accountService";
import categoryService from "../../services/CategoryService";
import "./BoothManagementPage.css";

// ─── Constants ────────────────────────────────────────────────
// Danh mục được quản lý động trong database (bảng Categories),
// không còn hardcode ở đây — xem useEffect load categories bên dưới.

const DEFAULT_FORM = {
  eventId: "",
  vendorId: "",
  categoryId: "",
  name: "",
  description: "",
  latitude: "",
  longitude: "",
  geofenceRadius: 15,
};

// ─── CoordBadge ───────────────────────────────────────────────
function CoordBadge({ lat, lng }) {
  if (!lat || !lng) return <span className="coord-badge coord-badge--empty">Chưa có</span>;
  return <span className="coord-badge coord-badge--set">📍 Đã có</span>;
}

// ─── BoothRow ─────────────────────────────────────────────────
function BoothRow({ booth, onEdit, onDelete }) {
  return (
    <tr className="booth-row">
      <td className="booth-row__name">
        <span className="booth-row__booth-name">{booth.name}</span>
        <span className="booth-row__event">{booth.eventName}</span>
      </td>
      <td>{booth.categoryName}</td>
      <td><CoordBadge lat={booth.latitude} lng={booth.longitude} /></td>
      <td className="booth-row__vendor">{booth.vendorName}</td>
      <td className="booth-row__actions">
        <button className="action-btn action-btn--edit"   onClick={() => onEdit(booth)}    title="Chỉnh sửa">✏️</button>
        <button className="action-btn action-btn--delete" onClick={() => onDelete(booth)}  title="Xóa">🗑️</button>
      </td>
    </tr>
  );
}

// ─── BoothForm ────────────────────────────────────────────────
function BoothForm({ initial, events, vendors, categories, onSave, onCancel, loading }) {
  const [form, setForm]     = useState(initial || DEFAULT_FORM);
  const [showMap, setShowMap] = useState(false);
  const [errors, setErrors]   = useState({});

  useEffect(() => {
    setForm(initial || DEFAULT_FORM);
    setErrors({});
  }, [initial]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Tên gian hàng không được để trống";
    if (!form.eventId)     e.eventId = "Chọn sự kiện";
    if (!form.vendorId)    e.vendorId = "Chọn vendor";
    if (!form.categoryId)  e.categoryId = "Chọn danh mục";
    if (!form.latitude || !form.longitude) e.coords = "Cần chọn tọa độ GPS";
    if (form.geofenceRadius < 5 || form.geofenceRadius > 500)
      e.geofenceRadius = "Bán kính từ 5 đến 500 mét";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave(form);
  };

  const handleMapClick = ({ lat, lng }) => {
    set("latitude",  lat.toFixed(6));
    set("longitude", lng.toFixed(6));
    setShowMap(false);
  };

  return (
    <div className="booth-form">
      <h2 className="booth-form__title">
        {initial?.id ? "Chỉnh sửa gian hàng" : "Tạo gian hàng mới"}
      </h2>

      {/* Row: Event + Vendor */}
      <div className="booth-form__row--2col">
        <div className="form-group">
          <label>Sự kiện <span className="req">*</span></label>
          <select value={form.eventId} onChange={(e) => set("eventId", e.target.value)}
            className={errors.eventId ? "input--error" : ""}>
            <option value="">-- Chọn sự kiện --</option>
            {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
          {errors.eventId && <p className="form-error">{errors.eventId}</p>}
        </div>

        <div className="form-group">
          <label>Vendor <span className="req">*</span></label>
          <select value={form.vendorId} onChange={(e) => set("vendorId", e.target.value)}
            className={errors.vendorId ? "input--error" : ""}>
            <option value="">-- Chọn vendor --</option>
            {vendors.map((v) => <option key={v.id} value={v.id}>{v.companyName}</option>)}
          </select>
          {errors.vendorId && <p className="form-error">{errors.vendorId}</p>}
        </div>
      </div>

      {/* Category */}
      <div className="form-group">
        <label>Danh mục <span className="req">*</span></label>
        <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}
          className={errors.categoryId ? "input--error" : ""}>
          <option value="">-- Chọn danh mục --</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {errors.categoryId && <p className="form-error">{errors.categoryId}</p>}
      </div>

      {/* Name */}
      <div className="form-group">
        <label>Tên gian hàng <span className="req">*</span></label>
        <input type="text" value={form.name} placeholder="VD: VinAI Main Booth"
          onChange={(e) => set("name", e.target.value)}
          className={errors.name ? "input--error" : ""} />
        {errors.name && <p className="form-error">{errors.name}</p>}
      </div>

      {/* Description */}
      <div className="form-group">
        <label>Mô tả</label>
        <textarea rows={3} value={form.description} placeholder="Mô tả ngắn về gian hàng..."
          onChange={(e) => set("description", e.target.value)} />
      </div>

      {/* GPS Section */}
      <div className="form-section">
        <h3 className="form-section__heading">📍 Vị trí GPS</h3>

        <div className="booth-form__row--2col">
          <div className="form-group">
            <label>Latitude <span className="req">*</span></label>
            <input type="number" step="0.000001" value={form.latitude} placeholder="10.776900"
              onChange={(e) => set("latitude", e.target.value)} />
          </div>
          <div className="form-group">
            <label>Longitude <span className="req">*</span></label>
            <input type="number" step="0.000001" value={form.longitude} placeholder="106.700900"
              onChange={(e) => set("longitude", e.target.value)} />
          </div>
        </div>
        {errors.coords && <p className="form-error">{errors.coords}</p>}

        <div className="form-group">
          <label>Bán kính kích hoạt geofence (mét)</label>
          <div className="geofence-input">
            <input type="number" min={5} max={500} value={form.geofenceRadius}
              onChange={(e) => set("geofenceRadius", Number(e.target.value))} />
            <span className="geofence-input__unit">mét</span>
          </div>
          {errors.geofenceRadius && <p className="form-error">{errors.geofenceRadius}</p>}
        </div>

        <button type="button" className="btn btn--outline map-picker-btn"
          onClick={() => setShowMap((s) => !s)}>
          🗺 {showMap ? "Ẩn bản đồ" : "Chọn trên bản đồ"}
        </button>

        {showMap && (
          <div className="map-picker-container">
            <p className="map-picker-hint">Click vào vị trí trên bản đồ để chọn tọa độ</p>
            <GoogleMap
              pickerMode
              onMapClick={handleMapClick}
              initialCenter={
                form.latitude && form.longitude
                  ? { lat: parseFloat(form.latitude), lng: parseFloat(form.longitude) }
                  : { lat: 10.7769, lng: 106.7009 }
              }
              selectedPoint={
                form.latitude && form.longitude
                  ? { lat: parseFloat(form.latitude), lng: parseFloat(form.longitude) }
                  : null
              }
            />
          </div>
        )}
      </div>

      <div className="booth-form__footer">
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={loading}>
          Hủy
        </button>
        <button type="button" className="btn btn--primary" onClick={handleSubmit} disabled={loading}>
          {loading ? <LoadingSpinner size="sm" /> : initial?.id ? "Lưu thay đổi" : "Tạo gian hàng"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function BoothManagementPage() {
  const { toasts, showToast } = useToast();

  // Data
  const [booths,  setBooths]  = useState([]);
  const [events,  setEvents]  = useState([]);
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Filters
  const [filterEvent,    setFilterEvent]    = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [search, setSearch] = useState("");
  const [page,   setPage]   = useState(1);
  const PAGE_SIZE = 10;

  // UI mode
  const [mode, setMode] = useState("list"); // "list" | "form" | "qr"
  const [editingBooth, setEditingBooth] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Stats
  const [stats, setStats] = useState({ total: 0, active: 0, events: 0 });

  // ── Fetch booths ───────────────────────────────────────────
  const fetchBooths = useCallback(async () => {
    setLoading(true);
    try {
      const data = await boothService.getAll({
        eventId: filterEvent, categoryId: filterCategory,
        search, page, pageSize: PAGE_SIZE,
      });
      const items = data.items || data;
      setBooths(items);
      setStats((s) => ({ ...s, total: data.total ?? items.length, active: data.active ?? items.length }));
    } catch {
      showToast("Không tải được danh sách gian hàng", "error");
    } finally {
      setLoading(false);
    }
  }, [filterEvent, filterCategory, search, page]); // eslint-disable-line

  // ── Fetch events + vendors + categories once ────────────────
  useEffect(() => {
    (async () => {
      try {
        const [evList, vendorRes, catList] = await Promise.all([
          eventService.getAll(),
          accountService.getAll({ role: "Vendor", pageSize: 1000 }),
          categoryService.getAll(),
        ]);
        const evArr = Array.isArray(evList) ? evList : evList.items || [];
        setEvents(evArr);
        setStats((s) => ({ ...s, events: evArr.length }));
        setVendors(
          (vendorRes.items || []).map((a) => ({
            id: a.id,
            companyName: a.company || a.username,
          }))
        );
        setCategories(Array.isArray(catList) ? catList : catList.items || []);
      } catch {
        showToast("Không tải được danh sách sự kiện / vendor / danh mục", "error");
      }
    })();
  }, []); // eslint-disable-line

  useEffect(() => { fetchBooths(); }, [fetchBooths]);

  // ── CRUD ───────────────────────────────────────────────────
  const handleSave = async (formData) => {
    setFormLoading(true);
    try {
      if (editingBooth?.id) {
        await boothService.update(editingBooth.id, formData);
        showToast("Cập nhật gian hàng thành công");
        setMode("list");
      } else {
        const created = await boothService.create(formData);
        showToast("Tạo gian hàng thành công");
        if (created?.id) {
          setQrBooth(created);
        } else {
          setMode("list");
        }
      }
      fetchBooths();
    } catch (err) {
      showToast(err?.message || "Có lỗi xảy ra, thử lại sau", "error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await boothService.delete(deleteTarget.id);
      showToast(`Đã xóa gian hàng "${deleteTarget.name}"`);
      fetchBooths();
    } catch {
      showToast("Xóa thất bại, thử lại sau", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(stats.total / PAGE_SIZE));

  // ── Render ─────────────────────────────────────────────────
  return (
    <Layout>
      <div className="booth-mgmt">

        <Toast toasts={toasts} />

        {deleteTarget && (
          <ConfirmDialog
            isOpen={!!deleteTarget}
            variant="danger"
            title="Xóa gian hàng?"
            message={`Bạn có chắc muốn xóa "${deleteTarget.name}"? Hành động này không thể hoàn tác.`}
            confirmLabel="Xóa"
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeleteTarget(null)}
          />
        )}

        {/* ── Header ── */}
        <div className="page-header">
          <div>
            <h1 className="page-header__title">Quản lý gian hàng</h1>
            <p className="page-header__sub">Tạo, chỉnh sửa và cấu hình gian hàng cho các sự kiện</p>
          </div>
          {mode === "list" ? (
            <button className="btn btn--primary"
              onClick={() => { setEditingBooth(null); setMode("form"); }}>
              + Tạo gian hàng
            </button>
          ) : (
            <button className="btn btn--ghost" onClick={() => setMode("list")}>
              ← Quay lại
            </button>
          )}
        </div>

        {/* ── Stat cards (list only) ── */}
        {mode === "list" && (
          <div className="stat-row">
            <StatCard icon="📦" label="Tổng gian hàng"    value={stats.total}  color="blue"   />
            <StatCard icon="🟢" label="Đang active"        value={stats.active} color="green"  />
            <StatCard icon="📅" label="Sự kiện đang mở"   value={stats.events} color="orange" />
          </div>
        )}

        {/* ════ LIST ════ */}
        {mode === "list" && (
          <>
            <div className="filter-bar">
              <select className="filter-bar__select" value={filterEvent}
                onChange={(e) => { setFilterEvent(e.target.value); setPage(1); }}>
                <option value="">Tất cả sự kiện</option>
                {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>

              <select className="filter-bar__select" value={filterCategory}
                onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}>
                <option value="">Tất cả danh mục</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <div className="filter-bar__search">
                <span className="filter-bar__search-icon">🔍</span>
                <input type="text" placeholder="Tìm gian hàng..." value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              </div>
            </div>

            {loading ? (
              <div className="loading-center"><LoadingSpinner label="Đang tải..." /></div>
            ) : booths.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state__icon">📦</p>
                <p className="empty-state__msg">Chưa có gian hàng nào.</p>
                <button className="btn btn--primary"
                  onClick={() => { setEditingBooth(null); setMode("form"); }}>
                  Tạo gian hàng đầu tiên
                </button>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tên gian hàng</th>
                      <th>Danh mục</th>
                      <th>Tọa độ</th>
                      <th>Vendor</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {booths.map((b) => (
                      <BoothRow key={b.id} booth={b}
                        onEdit={(booth) => { setEditingBooth(booth); setMode("form"); }}
                        onDelete={(booth) => setDeleteTarget(booth)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="pagination">
                <button className="pagination__btn" disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}>‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p}
                    className={`pagination__btn ${p === page ? "pagination__btn--active" : ""}`}
                    onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="pagination__btn" disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}>›</button>
                <span className="pagination__info">Trang {page} / {totalPages} ({stats.total} gian hàng)</span>
              </div>
            )}
          </>
        )}

        {/* ════ FORM ════ */}
        {mode === "form" && (
          <BoothForm
            initial={editingBooth}
            events={events}
            vendors={vendors}
            categories={categories}
            onSave={handleSave}
            onCancel={() => setMode("list")}
            loading={formLoading}
          />
        )}
</div>
    </Layout>
  );
}