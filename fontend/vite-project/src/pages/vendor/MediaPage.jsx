// MediaPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Toast, { useToast }  from '../../components/Toast/Toast';
import ConfirmDialog        from '../../components/ConfirmDialog/ConfirmDialog';
import LoadingSpinner       from '../../components/LoadingSpinner/LoadingSpinner';
import vendorService        from '../../services/vendorService';
import styles from './MediaPage.module.css';

export default function MediaPage() {
  const navigate    = useNavigate();
  const { boothId } = useParams();
  const { toasts, showToast } = useToast();

  const [activeTab,    setActiveTab]    = useState('image');
  const [images,       setImages]       = useState([]);
  const [videos,       setVideos]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'image'|'video', id }
  const [videoUrl,     setVideoUrl]     = useState('');
  const [videoTitle,   setVideoTitle]   = useState('');

  // ── Fetch data ─────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      vendorService.getImages(boothId),
      vendorService.getVideos(boothId),
    ])
      .then(([imgs, vids]) => {
        setImages(Array.isArray(imgs) ? imgs : []);
        setVideos(Array.isArray(vids) ? vids : []);
      })
      .catch(() => showToast("Không thể tải dữ liệu media.", "error"))
      .finally(() => setLoading(false));
  }, [boothId]);

  // ── Upload ảnh ─────────────────────────────────────────────
  async function handleUploadImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("Ảnh không được vượt quá 5MB!", "error");
      return;
    }
    try {
      const result = await vendorService.uploadBoothImage(boothId, file, "");
      setImages(prev => [...prev, result]);
      showToast("Upload ảnh thành công!", "success");
    } catch {
      showToast("Không thể upload ảnh.", "error");
    }
  }

  // ── Cập nhật caption ───────────────────────────────────────
  async function handleCaptionChange(id, caption) {
    setImages(prev => prev.map(i => i.id === id ? { ...i, caption } : i));
    try {
      await vendorService.updateImageCaption(id, caption);
    } catch {
      showToast("Không thể cập nhật chú thích.", "error");
    }
  }

  // ── Xóa ảnh ───────────────────────────────────────────────
  async function handleDeleteImage() {
    try {
      await vendorService.deleteImage(deleteTarget.id);
      setImages(prev => prev.filter(i => i.id !== deleteTarget.id));
      showToast("Đã xóa ảnh thành công!", "success");
    } catch {
      showToast("Không thể xóa ảnh.", "error");
    } finally {
      setDeleteTarget(null);
    }
  }

  // ── Thêm video ────────────────────────────────────────────
  async function handleAddVideo(e) {
    e.preventDefault();
    try {
      const result = await vendorService.addVideo(boothId, videoUrl, videoTitle);
      setVideos(prev => [...prev, result]);
      setVideoUrl('');
      setVideoTitle('');
      showToast("Đã thêm video thành công!", "success");
    } catch {
      showToast("Không thể thêm video.", "error");
    }
  }

  // ── Xóa video ─────────────────────────────────────────────
  async function handleDeleteVideo() {
    try {
      await vendorService.deleteVideo(deleteTarget.id);
      setVideos(prev => prev.filter(v => v.id !== deleteTarget.id));
      showToast("Đã xóa video thành công!", "success");
    } catch {
      showToast("Không thể xóa video.", "error");
    } finally {
      setDeleteTarget(null);
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
          <LoadingSpinner size="lg" label="Đang tải media..." />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Toast toasts={toasts} />

      <button className={styles.btnBack} onClick={() => navigate('/vendor/dashboard')}>
        ⬅️ Quay lại Tổng quan
      </button>

      <h1 className={styles.title}>🎥 Quản lý tài nguyên hình ảnh & Video</h1>
      <p className={styles.subtitle}>
        Cập nhật album ảnh thực tế và các video giới thiệu để hiển thị lên Carousel cho khách tham quan.
      </p>

      <div className={styles.tabGroup}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'image' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('image')}
        >
          🖼️ Bộ sưu tập hình ảnh ({images.length})
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'video' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('video')}
        >
          📹 Video giới thiệu ({videos.length})
        </button>
      </div>

      {/* ── Tab Hình ảnh ── */}
      {activeTab === 'image' && (
        <div className={styles.card}>
          <label className={styles.dropzone}>
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleUploadImage}
            />
            <p className={styles.dropzoneText}>Kéo thả hình ảnh vào đây hoặc click để chọn file</p>
            <p className={styles.dropzoneSub}>Hỗ trợ: JPG, PNG, WebP – tối đa 5MB</p>
          </label>

          <h3 className={styles.sectionTitle}>Hình ảnh hiện tại ({images.length})</h3>

          {images.length === 0 ? (
            <p style={{ color: "#9ca3af", textAlign: "center", padding: "20px" }}>
              Chưa có hình ảnh nào.
            </p>
          ) : (
            <div className={styles.imageGrid}>
              {images.map((img) => (
                <div key={img.id} className={styles.imageCard}>
                  <img src={img.filePath} alt="Booth" className={styles.previewImg} />
                  <div className={styles.imageInfo}>
                    <input
                      type="text"
                      className={styles.captionInput}
                      value={img.caption ?? ""}
                      onChange={(e) => handleCaptionChange(img.id, e.target.value)}
                      placeholder="Nhập chú thích..."
                    />
                    <button
                      className={styles.btnDelete}
                      onClick={() => setDeleteTarget({ type: 'image', id: img.id })}
                    >
                      ❌ Xóa ảnh
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab Video ── */}
      {activeTab === 'video' && (
        <div className={styles.card}>
          <form onSubmit={handleAddVideo} className={styles.videoForm}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Tiêu đề video:</label>
              <input
                type="text"
                className={styles.input}
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="Nhập tiêu đề..."
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>URL video (YouTube / Vimeo):</label>
              <div className={styles.inputGroup}>
                <input
                  type="text"
                  className={styles.input}
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/..."
                  required
                />
                <button type="submit" className={styles.btnSubmit}>🔗 Thêm video</button>
              </div>
            </div>
          </form>

          <h3 className={styles.sectionTitle}>Danh sách video ({videos.length})</h3>

          {videos.length === 0 ? (
            <p style={{ color: "#9ca3af", textAlign: "center", padding: "20px" }}>
              Chưa có video nào.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {videos.map((v) => (
                <div key={v.id} style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", padding: "16px",
                  border: "1px solid #e5e7eb", borderRadius: "8px",
                  background: "#fff"
                }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, color: "#111827" }}>{v.title ?? "Video"}</p>
                    <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>{v.videoUrl}</p>
                  </div>
                  <button
                    className={styles.btnDelete}
                    onClick={() => setDeleteTarget({ type: 'video', id: v.id })}
                  >
                    ❌ Xóa
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Confirm Dialog ── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        variant="danger"
        title={deleteTarget?.type === 'image' ? "Xóa ảnh" : "Xóa video"}
        message="Bạn có chắc muốn xóa? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        onConfirm={deleteTarget?.type === 'image' ? handleDeleteImage : handleDeleteVideo}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}