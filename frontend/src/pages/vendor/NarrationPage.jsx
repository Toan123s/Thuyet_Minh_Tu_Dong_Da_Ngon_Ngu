// NarrationPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Toast, { useToast }  from '../../components/Toast/Toast';
import LoadingSpinner        from '../../components/LoadingSpinner/LoadingSpinner';
import narrationService      from '../../services/narrationService';
import translationService    from '../../services/translationService';
import styles from './NarrationPage.module.css';

const LANGUAGES = [
  { code: "en", flag: "🇬🇧", label: "English (EN)"  },
  { code: "ja", flag: "🇯🇵", label: "日本語 (JA)"    },
  { code: "ko", flag: "🇰🇷", label: "한국어 (KO)"    },
  { code: "zh", flag: "🇨🇳", label: "中文 (ZH)"      },
];

export default function NarrationPage() {
  const navigate    = useNavigate();
  const { boothId } = useParams();
  const { toasts, showToast } = useToast();

  const [narration,     setNarration]     = useState(null);
  const [title,         setTitle]         = useState('');
  const [content,       setContent]       = useState('');
  const [translations,  setTranslations]  = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [translating,   setTranslating]   = useState(false);

  // ── Fetch narration ────────────────────────────────────────
  useEffect(() => {
    narrationService.getByBoothId(boothId)
      .then((data) => {
        setNarration(data);
        setTitle(data.title   ?? '');
        setContent(data.content ?? '');
        setTranslations(data.translations ?? []);
      })
      .catch(() => showToast("Không thể tải nội dung thuyết minh.", "error"))
      .finally(() => setLoading(false));
  }, [boothId]);

  // ── Lưu nội dung ──────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    try {
      if (narration?.id) {
        await narrationService.update(narration.id, { title, content });
      } else {
        const result = await narrationService.upsert(boothId, { title, content });
        setNarration(result);
      }
      showToast("Lưu nội dung thành công!", "success");
    } catch {
      showToast("Không thể lưu nội dung.", "error");
    } finally {
      setSaving(false);
    }
  }

  // ── Dịch tự động ──────────────────────────────────────────
  async function handleAiTranslate() {
    if (!narration?.id) {
      showToast("Vui lòng lưu nội dung trước khi dịch!", "warning");
      return;
    }
    setTranslating(true);
    try {
      const results = await translationService.generateAll(
        narration.id,
        LANGUAGES.map(l => l.code)
      );
      setTranslations(results);
      showToast("Dịch tự động thành công!", "success");
    } catch {
      showToast("Không thể dịch tự động.", "error");
    } finally {
      setTranslating(false);
    }
  }

  // ── Lấy trạng thái bản dịch ───────────────────────────────
  function getTranslationStatus(langCode) {
    const t = translations.find(x => x.languageCode === langCode);
    if (!t)                    return { status: 'danger',  text: '🔴 Chưa dịch'        };
    if (t.isAutoTranslated)    return { status: 'success', text: '🟢 Đã dịch tự động'  };
    return                            { status: 'success', text: '🟢 Đã dịch thủ công' };
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
          <LoadingSpinner size="lg" label="Đang tải nội dung..." />
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

      <h1 className={styles.title}>✏️ Quản lý nội dung thuyết minh gian hàng</h1>
      <p className={styles.subtitle}>
        Nhập thông tin thuyết minh gốc bằng tiếng Việt để hệ thống xử lý dịch đa ngôn ngữ bằng AI.
      </p>

      <div className={styles.card}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Tiêu đề thuyết minh:</label>
          <input
            type="text"
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nhập tiêu đề..."
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Nội dung thuyết minh (Tiếng Việt):</label>
          <textarea
            className={styles.textarea}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nhập nội dung thuyết minh..."
          />
          <p className={styles.charCount}>
            Số ký tự hiện tại: <strong>{content.length}</strong> ký tự
          </p>
        </div>
        <div className={styles.btnGroup}>
          <button
            className={`${styles.btn} ${styles.btnSave}`}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Đang lưu..." : "Lưu nội dung"}
          </button>
          <button
            className={`${styles.btn} ${styles.btnAi}`}
            onClick={handleAiTranslate}
            disabled={translating}
          >
            {translating ? "Đang dịch..." : "🤖 Dịch tự động với Azure OpenAI"}
          </button>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Bản dịch đa ngôn ngữ hệ thống</h2>

      <div className={styles.translationList}>
        {LANGUAGES.map((lang) => {
          const { status, text } = getTranslationStatus(lang.code);
          return (
            <div key={lang.code} className={styles.translationItem}>
              <span className={styles.langName}>{lang.flag} {lang.label}</span>
              <span className={`${styles.badge} ${styles[status]}`}>{text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}