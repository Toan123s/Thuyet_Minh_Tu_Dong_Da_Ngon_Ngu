import React, { useState } from 'react';
import styles from './NarrationPage.module.css';
import { useNavigate } from 'react-router-dom';

const NarrationPage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('Giới thiệu Gian hàng Công nghệ VinAI');
  const [content, setContent] = useState('VinAI Research là công ty trí tuệ nhân tạo hàng đầu Việt Nam, được thành lập năm 2019...');

  const translationStatuses = [
    { id: 1, lang: '🇬🇧 English (EN)', status: 'success', text: '🟢 Đã dịch tự động' },
    { id: 2, lang: '🇯🇵 日本語 (JA)', status: 'success', text: '🟢 Đã dịch tự động' },
    { id: 3, lang: '🇰🇷 한국어 (KO)', status: 'warning', text: '🟡 Đang xử lý...' },
    { id: 4, lang: '🇨🇳 中文 (ZH)', status: 'danger', text: '🔴 Chưa dịch' }
  ];

  const handleAiTranslate = () => {
    alert('Hệ thống đang gọi API dịch thuật tự động của Azure OpenAI sang 4 ngôn ngữ!');
  };

  return (
    <div className={styles.container}>
      {/* Nút Quay lại Dashboard */}
      <button className={styles.btnBack} onClick={() => navigate('/vendor/dashboard')}>
        ⬅️ Quay lại Tổng quan
      </button>

      <h1 className={styles.title}>✏️ Quản lý nội dung thuyết minh gian hàng</h1>
      <p className={styles.subtitle}>Nhập thông tin thuyết minh gốc bằng tiếng Việt để hệ thống xử lý dịch đa ngôn ngữ bằng AI.</p>
      
      <div className={styles.card}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Tiêu đề thuyết minh:</label>
          <input 
            type="text" 
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Nội dung thuyết minh (Tiếng Việt):</label>
          <textarea 
            className={styles.textarea}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <p className={styles.charCount}>Số ký tự hiện tại: <strong>{content.length}</strong> ký tự</p>
        </div>

        <div className={styles.btnGroup}>
          <button className={`${styles.btn} ${styles.btnSave}`}>Lưu nội dung</button>
          <button className={`${styles.btn} ${styles.btnAi}`} onClick={handleAiTranslate}>
            🤖 Dịch tự động với Azure OpenAI
          </button>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Bản dịch đa ngôn ngữ hệ thống</h2>
      
      <div className={styles.translationList}>
        {translationStatuses.map((item) => (
          <div key={item.id} className={styles.translationItem}>
            <span className={styles.langName}>{item.lang}</span>
            <span className={`${styles.badge} ${styles[item.status]}`}>
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NarrationPage;