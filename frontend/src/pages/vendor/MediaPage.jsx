// MediaPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import Toast, { useToast } from '../../components/Toast/Toast';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import vendorService from '../../services/vendorService';
import styles from './MediaPage.module.css';

const IconBack = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>;

export default function MediaPage() {
  const navigate = useNavigate();
  const { boothId } = useParams();
  const { toasts, showToast } = useToast();

  const [activeTab,    setActiveTab]    = useState('image');
  const [images,       setImages]       = useState([]);
  const [videos,       setVideos]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [videoUrl,     setVideoUrl]     = useState('');
  const [videoTitle,   setVideoTitle]   = useState('');

  useEffect(() => {
    Promise.all([
      vendorService.getImages(boothId),
      vendorService.getVideos(boothId),
    ])
      .then(([imgs, vids]) => {
        setImages(Array.isArray(imgs) ? imgs : []);
        setVideos(Array.isArray(vids) ? vids : []);
      })
      .catch(() => showToast('Không thể tải dữ liệu media.', 'error'))
      .finally(() => setLoading(false));
  // showToast stable via useToast, không cần đưa vào deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boothId]);

  async function handleUploadImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('Ảnh không được vượt quá 5MB!', 'error'); return; }
    try {
      const result = await vendorService.uploadBoothImage(boothId, file, '');
      setImages(prev => [...prev, result]);
      showToast('Upload ảnh thành công!', 'success');
    } catch {
      showToast('Không thể upload ảnh.', 'error');
    }
    e.target.value = '';
  }

  async function handleCaptionChange(id, caption) {
    setImages(prev => prev.map(i => i.id === id ? { ...i, caption } : i));
    try { await vendorService.updateImageCaption(id, caption); }
    catch { showToast('Không thể cập nhật chú thích.', 'error'); }
  }

  async function handleDeleteImage() {
    try {
      await vendorService.deleteImage(deleteTarget.id);
      setImages(prev => prev.filter(i => i.id !== deleteTarget.id));
      showToast('Đã xóa ảnh!', 'success');
    } catch {
      showToast('Không thể xóa ảnh.', 'error');
    } finally {
      setDeleteTarget(null);
    }
  }

  function handleAddVideo(e) {
    e.preventDefault();
    if (!videoUrl.trim()) return;
    vendorService.addVideo(boothId, videoUrl, videoTitle)
      .then(result => {
        setVideos(prev => [...prev, result]);
        setVideoUrl('');
        setVideoTitle('');
        showToast('Đã thêm video!', 'success');
      })
      .catch(() => showToast('Không thể thêm video.', 'error'));
  }

  async function handleDeleteVideo() {
    try {
      await vendorService.deleteVideo(deleteTarget.id);
      setVideos(prev => prev.filter(v => v.id !== deleteTarget.id));
      showToast('Đã xóa video!', 'success');
    } catch {
      showToast('Không thể xóa video.', 'error');
    } finally {
      setDeleteTarget(null);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
          <LoadingSpinner size="lg" label="Đang tải media..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.container}>
        <Toast toasts={toasts} />

        <button className={styles.btnBack} onClick={() => navigate('/vendor/dashboard')}>
          <IconBack /> Tổng quan
        </button>

        <h1 className={styles.title}>🎥 Quản lý Hình ảnh &amp; Video</h1>
        <p className={styles.subtitle}>
          Cập nhật album ảnh và video giới thiệu để hiển thị lên trang gian hàng.
        </p>

        {/* Tabs */}
        <div className={styles.tabGroup}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'image' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('image')}
          >
            🖼️ Hình ảnh ({images.length})
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'video' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('video')}
          >
            📹 Video ({videos.length})
          </button>
        </div>

        {/* ── Tab Hình ảnh ── */}
        {activeTab === 'image' && (
          <div className={styles.card}>
            <label className={styles.dropzone}>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUploadImage} />
              <div className={styles.dropzoneIcon}>📸</div>
              <p className={styles.dropzoneText}>Kéo thả hoặc click để chọn ảnh</p>
              <p className={styles.dropzoneSub}>JPG, PNG, WebP — tối đa 5MB</p>
            </label>

            <p className={styles.sectionTitle}>🖼️ Hình ảnh hiện tại ({images.length})</p>

            {images.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🏞️</div>
                <p>Chưa có hình ảnh nào. Hãy upload ảnh đầu tiên!</p>
              </div>
            ) : (
              <div className={styles.imageGrid}>
                {images.map((img) => (
                  <div key={img.id} className={styles.imageCard}>
                    <img
                      src={img.filePath}
                      alt={img.caption || 'Booth'}
                      className={styles.previewImg}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className={styles.imageInfo}>
                      <input
                        type="text"
                        className={styles.captionInput}
                        value={img.caption ?? ''}
                        onChange={(e) => handleCaptionChange(img.id, e.target.value)}
                        placeholder="Chú thích ảnh..."
                      />
                      <button
                        className={styles.btnDelete}
                        onClick={() => setDeleteTarget({ type: 'image', id: img.id })}
                      >
                        ❌ Xóa
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
                <label className={styles.label}>Tiêu đề video</label>
                <input
                  type="text"
                  className={styles.input}
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="VD: Video giới thiệu sản phẩm..."
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>URL video (YouTube / Vimeo)</label>
                <div className={styles.inputGroup}>
                  <input
                    type="url"
                    className={styles.input}
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    required
                  />
                  <button type="submit" className={styles.btnSubmit}>🔗 Thêm</button>
                </div>
              </div>
            </form>

            <p className={styles.sectionTitle}>📹 Danh sách video ({videos.length})</p>

            {videos.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🎬</div>
                <p>Chưa có video nào. Hãy thêm URL YouTube hoặc Vimeo!</p>
              </div>
            ) : (
              <div className={styles.videoList}>
                {videos.map((v) => (
                  <div key={v.id} className={styles.videoItem}>
                    <div className={styles.videoInfo}>
                      <p className={styles.videoTitle}>📹 {v.title || 'Video không có tiêu đề'}</p>
                      <p className={styles.videoUrl}>{v.videoUrl}</p>
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

        <ConfirmDialog
          isOpen={!!deleteTarget}
          variant="danger"
          title={deleteTarget?.type === 'image' ? 'Xóa ảnh' : 'Xóa video'}
          message="Bạn có chắc muốn xóa? Hành động này không thể hoàn tác."
          confirmLabel="Xóa"
          onConfirm={deleteTarget?.type === 'image' ? handleDeleteImage : handleDeleteVideo}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </Layout>
  );
}