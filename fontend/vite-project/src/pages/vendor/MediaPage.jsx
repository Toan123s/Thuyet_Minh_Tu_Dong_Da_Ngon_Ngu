import React, { useState } from 'react';
import styles from './MediaPage.module.css';
import { useNavigate } from 'react-router-dom';

const MediaPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('image');
  
  const [images, setImages] = useState([
    { id: 1, url: 'https://picsum.photos/200/150', caption: 'Mặt tiền gian hàng công nghệ VinAI tại triển lãm' },
    { id: 2, url: 'https://picsum.photos/200/151', caption: 'Khách tham quan đang trải nghiệm quét mã QR nghe thuyết minh' }
  ]);

  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

  const handleUploadImage = () => {
    alert('Hệ thống đang kích hoạt luồng upload ảnh Multipart Form, đẩy file trực tiếp vào MediaService!');
  };

  const handleAddVideo = (e) => {
    e.preventDefault();
    alert(`Đã lưu URL video: ${videoUrl}`);
  };

  return (
    <div className={styles.container}>
      {/* Nút Quay lại Dashboard */}
      <button className={styles.btnBack} onClick={() => navigate('/vendor/dashboard')}>
        ⬅️ Quay lại Tổng quan
      </button>

      <h1 className={styles.title}>🎥 Quản lý tài nguyên hình ảnh & Video</h1>
      <p className={styles.subtitle}>Cập nhật album ảnh thực tế và các video giới thiệu để hiển thị lên dòng Carousel cho khách tham quan.</p>

      <div className={styles.tabGroup}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'image' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('image')}
        >
          🖼️ Bộ sưu tập hình ảnh
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'video' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('video')}
        >
          📹 Video giới thiệu (YouTube)
        </button>
      </div>

      {activeTab === 'image' && (
        <div className={styles.card}>
          <div className={styles.dropzone} onClick={handleUploadImage}>
            <p className={styles.dropzoneText}>Kéo thả hình ảnh vào đây hoặc click để chọn file từ máy tính</p>
            <p className={styles.dropzoneSub}>Hỗ trợ định dạng: JPG, PNG, WebP (Dung lượng tối đa 5MB)</p>
          </div>

          <h3 className={styles.sectionTitle}>Hình ảnh hiện tại ({images.length})</h3>
          
          <div className={styles.imageGrid}>
            {images.map((img) => (
              <div key={img.id} className={styles.imageCard}>
                <img src={img.url} alt="Booth" className={styles.previewImg} />
                <div className={styles.imageInfo}>
                  <input 
                    type="text" 
                    className={styles.captionInput} 
                    value={img.caption}
                    onChange={(e) => {
                      const newImages = images.map(i => i.id === img.id ? {...i, caption: e.target.value} : i);
                      setImages(newImages);
                    }}
                    placeholder="Nhập chú thích..."
                  />
                  <button className={styles.btnDelete} onClick={() => alert('Xác nhận xóa ảnh?')}>❌ Xóa ảnh</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'video' && (
        <div className={styles.card}>
          <form onSubmit={handleAddVideo} className={styles.videoForm}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nhập đường dẫn URL video (YouTube / Vimeo):</label>
              <div className={styles.inputGroup}>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  required
                />
                <button type="submit" className={styles.btnSubmit}>🔗 Thêm video</button>
              </div>
            </div>
          </form>

          <h3 className={styles.sectionTitle}>Video xem trước (Preview nhúng)</h3>
          <div className={styles.videoWrapper}>
            <div className={styles.videoPlaceholder}>
              🖥️ [ Khung hiển thị trình phát Video Player nhúng từ link: {videoUrl} ]
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaPage;