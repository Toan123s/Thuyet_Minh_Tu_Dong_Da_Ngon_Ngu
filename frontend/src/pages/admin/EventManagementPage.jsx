import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout/Layout';
import eventService from '../../services/eventService';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import './EventManagementPage.css';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5069/api').replace('/api', '');

const STATUS_MAP = {
  'Đang mở':    { cls: 'active',   label: '🟢 Đang mở' },
  'Sắp tới':    { cls: 'upcoming', label: '🔵 Sắp tới' },
  'Đã kết thúc':{ cls: 'ended',    label: '⚫ Đã kết thúc' },
};

const EMPTY_FORM = {
  name: '', description: '', location: '',
  startDate: '', endDate: '', logoUrl: '',
};

export default function EventManagementPage() {
  const [events,        setEvents]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [filterStatus,  setFilterStatus]  = useState('');

  // Form modal
  const [showForm,      setShowForm]      = useState(false);
  const [editingEvent,  setEditingEvent]  = useState(null); // null = tạo mới
  const [formData,      setFormData]      = useState(EMPTY_FORM);
  const [saving,        setSaving]        = useState(false);
  const [formError,     setFormError]     = useState('');

  // QR modal
  const [qrEvent,       setQrEvent]       = useState(null);
  const [qrUrl,         setQrUrl]         = useState('');
  const [qrLoading,     setQrLoading]     = useState(false);

  // Delete confirm
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleting,      setDeleting]      = useState(false);

  // ── Fetch ──────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await eventService.getAll(filterStatus || null);
      setEvents(Array.isArray(data) ? data : (data?.items || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // ── Form helpers ────────────────────────────────────
  function openCreate() {
    setEditingEvent(null);
    setFormData(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  }

  function openEdit(ev) {
    setEditingEvent(ev);
    setFormData({
      name:        ev.name        || '',
      description: ev.description || '',
      location:    ev.location    || '',
      startDate:   ev.startDate ? ev.startDate.slice(0, 16) : '',
      endDate:     ev.endDate   ? ev.endDate.slice(0, 16)   : '',
      logoUrl:     ev.logoUrl   || '',
    });
    setFormError('');
    setShowForm(true);
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    if (!formData.name.trim())      return setFormError('Vui lòng nhập tên sự kiện.');
    if (!formData.startDate)        return setFormError('Vui lòng chọn ngày bắt đầu.');
    if (!formData.endDate)          return setFormError('Vui lòng chọn ngày kết thúc.');
    if (formData.endDate < formData.startDate) return setFormError('Ngày kết thúc phải sau ngày bắt đầu.');

    setSaving(true);
    setFormError('');
    try {
      const payload = {
        name:        formData.name.trim(),
        description: formData.description.trim(),
        location:    formData.location.trim(),
        startDate:   new Date(formData.startDate).toISOString(),
        endDate:     new Date(formData.endDate).toISOString(),
        logoUrl:     formData.logoUrl.trim(),
      };

      if (editingEvent) {
        await eventService.update(editingEvent.id, payload);
      } else {
        await eventService.create(payload);
      }

      setShowForm(false);
      await fetchEvents();
    } catch (err) {
      setFormError(err?.message || 'Lỗi lưu sự kiện.');
    } finally {
      setSaving(false);
    }
  }

  // ── QR helpers ──────────────────────────────────────
  async function openQR(ev) {
    setQrEvent(ev);
    setQrUrl(ev.qrCodeUrl || '');
    setQrLoading(false);

    // Nếu chưa có QR → tự tạo
    if (!ev.qrCodeUrl) {
      setQrLoading(true);
      try {
        const res = await eventService.generateQR(ev.id);
        setQrUrl(res.qrCodeUrl);
        setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, qrCodeUrl: res.qrCodeUrl } : e));
      } catch {
        alert('❌ Không thể tạo QR Code!');
        setQrEvent(null);
        return;
      } finally {
        setQrLoading(false);
      }
    }
  }

  async function handleRegenerateQR() {
    if (!qrEvent) return;
    setQrLoading(true);
    try {
      const res = await eventService.generateQR(qrEvent.id);
      setQrUrl(res.qrCodeUrl);
      setEvents(prev => prev.map(e => e.id === qrEvent.id ? { ...e, qrCodeUrl: res.qrCodeUrl } : e));
    } catch {
      alert('❌ Lỗi tạo lại QR Code!');
    } finally {
      setQrLoading(false);
    }
  }

  function handleDownloadQR() {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href     = `${API_BASE}${qrUrl}`;
    a.download = `qrcode_event_${qrEvent.id}.png`;
    a.click();
  }

  // ── Delete ──────────────────────────────────────────
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await eventService.delete(deleteTarget.id);
      setDeleteTarget(null);
      await fetchEvents();
    } catch (err) {
      alert(`❌ ${err?.message || 'Lỗi xóa sự kiện!'}`);
    } finally {
      setDeleting(false);
    }
  }

  // ────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="em-page">

        {/* ── Header ──────────────────────────────── */}
        <div className="em-header">
          <div>
            <h1 className="em-title">📋 Quản lý sự kiện</h1>
            <p className="em-subtitle">Tạo và quản lý sự kiện, mã QR tham quan</p>
          </div>
          <button className="em-btn em-btn--primary" onClick={openCreate}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Tạo sự kiện
          </button>
        </div>

        {/* ── Filter bar ──────────────────────────── */}
        <div className="em-filters">
          {['', 'Đang mở', 'Sắp tới', 'Đã kết thúc'].map(s => (
            <button key={s}
              className={`em-filter-chip ${filterStatus === s ? 'em-filter-chip--on' : ''}`}
              onClick={() => setFilterStatus(s)}>
              {s === '' ? 'Tất cả' : STATUS_MAP[s]?.label}
            </button>
          ))}
          <span className="em-filter-count">{events.length} sự kiện</span>
        </div>

        {/* ── Table ───────────────────────────────── */}
        {loading ? (
          <div className="em-loading"><LoadingSpinner size="lg" label="Đang tải..." /></div>
        ) : events.length === 0 ? (
          <div className="em-empty">
            <div className="em-empty-icon">📭</div>
            <p>Chưa có sự kiện nào.</p>
            <button className="em-btn em-btn--primary" onClick={openCreate}>Tạo sự kiện đầu tiên</button>
          </div>
        ) : (
          <div className="em-table-wrap">
            <table className="em-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên sự kiện</th>
                  <th>Địa điểm</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                  <th>Booth</th>
                  <th>QR Code</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {events.map(ev => {
                  const st = STATUS_MAP[ev.status] || STATUS_MAP['Sắp tới'];
                  return (
                    <tr key={ev.id}>
                      <td className="em-td-id">#{ev.id}</td>
                      <td className="em-td-name">
                        <div className="em-event-name">{ev.name}</div>
                        {ev.description && (
                          <div className="em-event-desc">{ev.description.slice(0, 60)}{ev.description.length > 60 ? '…' : ''}</div>
                        )}
                      </td>
                      <td>{ev.location || '—'}</td>
                      <td className="em-td-date">
                        <div>{ev.startDate ? new Date(ev.startDate).toLocaleDateString('vi') : '—'}</div>
                        <div className="em-date-sep">→</div>
                        <div>{ev.endDate   ? new Date(ev.endDate).toLocaleDateString('vi')   : '—'}</div>
                      </td>
                      <td>
                        <span className={`em-badge em-badge--${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="em-td-center">{ev.totalBooths ?? 0}</td>
                      <td className="em-td-center">
                        {ev.qrCodeUrl
                          ? <span className="em-qr-ok">✅ Đã tạo</span>
                          : <span className="em-qr-no">❌ Chưa tạo</span>}
                      </td>
                      <td>
                        <div className="em-actions">
                          <button className="em-btn em-btn--qr"  onClick={() => openQR(ev)}    title="Xem / Tạo QR">📱 QR</button>
                          <button className="em-btn em-btn--edit" onClick={() => openEdit(ev)}  title="Sửa">✏️</button>
                          <button className="em-btn em-btn--del"  onClick={() => setDeleteTarget(ev)} title="Xóa">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ─────────── MODAL: Tạo / Sửa sự kiện ─────────── */}
        {showForm && (
          <div className="em-overlay" onClick={() => !saving && setShowForm(false)}>
            <div className="em-modal em-modal--form" onClick={e => e.stopPropagation()}>
              <div className="em-modal-header">
                <h2>{editingEvent ? '✏️ Sửa sự kiện' : '➕ Tạo sự kiện mới'}</h2>
                <button className="em-modal-close" onClick={() => setShowForm(false)} disabled={saving}>✕</button>
              </div>

              <form onSubmit={handleFormSubmit} className="em-form">
                <div className="em-field">
                  <label>Tên sự kiện <span className="em-req">*</span></label>
                  <input name="name" value={formData.name} onChange={handleFormChange}
                    placeholder="VD: Hội chợ văn hoá Hội An 2025" required />
                </div>

                <div className="em-field">
                  <label>Mô tả</label>
                  <textarea name="description" value={formData.description} onChange={handleFormChange}
                    placeholder="Mô tả ngắn về sự kiện..." rows={3} />
                </div>

                <div className="em-field">
                  <label>Địa điểm</label>
                  <input name="location" value={formData.location} onChange={handleFormChange}
                    placeholder="VD: Phố cổ Hội An, Quảng Nam" />
                </div>

                <div className="em-field-row">
                  <div className="em-field">
                    <label>Ngày bắt đầu <span className="em-req">*</span></label>
                    <input type="datetime-local" name="startDate" value={formData.startDate}
                      onChange={handleFormChange} required />
                  </div>
                  <div className="em-field">
                    <label>Ngày kết thúc <span className="em-req">*</span></label>
                    <input type="datetime-local" name="endDate" value={formData.endDate}
                      onChange={handleFormChange} required />
                  </div>
                </div>

                <div className="em-field">
                  <label>URL Logo</label>
                  <input name="logoUrl" value={formData.logoUrl} onChange={handleFormChange}
                    placeholder="https://..." />
                  {formData.logoUrl && (
                    <img src={formData.logoUrl} alt="logo preview"
                      className="em-logo-preview"
                      onError={e => e.target.style.display = 'none'} />
                  )}
                </div>

                {formError && <div className="em-error">⚠️ {formError}</div>}

                <div className="em-form-actions">
                  <button type="button" className="em-btn em-btn--ghost"
                    onClick={() => setShowForm(false)} disabled={saving}>
                    Huỷ
                  </button>
                  <button type="submit" className="em-btn em-btn--primary" disabled={saving}>
                    {saving
                      ? <><span className="em-spinner" /> Đang lưu...</>
                      : editingEvent ? '💾 Lưu thay đổi' : '✅ Tạo sự kiện'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─────────── MODAL: QR Code ─────────── */}
        {qrEvent && (
          <div className="em-overlay" onClick={() => setQrEvent(null)}>
            <div className="em-modal em-modal--qr" onClick={e => e.stopPropagation()}>
              <div className="em-modal-header">
                <h2>📱 QR Code — {qrEvent.name}</h2>
                <button className="em-modal-close" onClick={() => setQrEvent(null)}>✕</button>
              </div>

              <div className="em-qr-body">
                {/* QR image */}
                <div className="em-qr-img-wrap">
                  {qrLoading ? (
                    <div className="em-qr-generating">
                      <LoadingSpinner size="md" label="Đang tạo QR..." />
                    </div>
                  ) : qrUrl ? (
                    <img
                      src={`${API_BASE}${qrUrl}`}
                      alt="QR Code"
                      className="em-qr-img"
                      onError={e => { e.target.style.display='none'; }}
                    />
                  ) : (
                    <div className="em-qr-placeholder">❌ Không có QR</div>
                  )}
                </div>

                {/* Info */}
                <div className="em-qr-info">
                  <div className="em-qr-info-row">
                    <span className="em-qr-info-label">🔗 URL quét:</span>
                    <code className="em-qr-url">{window.location.origin}/?event={qrEvent.id}</code>
                  </div>
                  <div className="em-qr-info-row">
                    <span className="em-qr-info-label">📌 Event ID:</span>
                    <span>#{qrEvent.id}</span>
                  </div>
                  {qrUrl && (
                    <div className="em-qr-info-row">
                      <span className="em-qr-info-label">📂 File:</span>
                      <span className="em-qr-file">{qrUrl}</span>
                    </div>
                  )}
                </div>

                {/* Hướng dẫn */}
                <div className="em-qr-guide">
                  <strong>📋 Hướng dẫn sử dụng:</strong>
                  <ol>
                    <li>Tải QR Code về máy (nút bên dưới)</li>
                    <li>In ra giấy, kích thước tối thiểu <strong>5×5 cm</strong></li>
                    <li>Dán tại cổng vào / trạm check-in sự kiện</li>
                    <li>Khách quét bằng camera điện thoại</li>
                    <li>Tự động mở trang thuyết minh</li>
                  </ol>
                </div>

                {/* Actions */}
                <div className="em-qr-actions">
                  <button className="em-btn em-btn--primary" onClick={handleDownloadQR} disabled={!qrUrl || qrLoading}>
                    ⬇️ Tải xuống PNG
                  </button>
                  <button className="em-btn em-btn--outline" onClick={handleRegenerateQR} disabled={qrLoading}>
                    🔄 Tạo lại QR
                  </button>
                  <button className="em-btn em-btn--ghost" onClick={() => setQrEvent(null)}>
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─────────── MODAL: Confirm xoá ─────────── */}
        {deleteTarget && (
          <div className="em-overlay" onClick={() => !deleting && setDeleteTarget(null)}>
            <div className="em-modal em-modal--confirm" onClick={e => e.stopPropagation()}>
              <div className="em-confirm-icon">🗑️</div>
              <h3>Xóa sự kiện?</h3>
              <p>Bạn sắp xóa <strong>{deleteTarget.name}</strong>. Hành động này không thể hoàn tác.</p>
              <div className="em-form-actions">
                <button className="em-btn em-btn--ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>Huỷ</button>
                <button className="em-btn em-btn--danger" onClick={confirmDelete} disabled={deleting}>
                  {deleting ? <><span className="em-spinner" /> Đang xóa...</> : '🗑️ Xóa'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}