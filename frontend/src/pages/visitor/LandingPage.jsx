﻿import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import eventService from '../../services/eventService';
import eventScanService from '../../services/eventScanService';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../hooks/useLanguage';
import './LandingPage.css';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5069/api').replace('/api', '');

// ── Bản dịch ──────────────────────────────────────────────────
const T = {
  vi: {
    welcome:'🎪 Chào mừng!', explore:'Khám phá các gian hàng triển lãm',
    scanQr:'📱 Quét QR để bắt đầu tham quan', orPress:'hoặc bấm nút bên dưới',
    noQr:'Chưa có QR — vào Admin tạo QR', enterBtn:'🚀 Vào tham quan ngay',
    loading:'Đang tải...', location:'📍 Địa điểm:', date:'📅 Ngày:',
    status:'🏷️ Trạng thái:', booths:'🏪 Số booth:', startBtn:'🚀 Bắt đầu tham quan',
    checkQR:'Vui lòng quét lại mã QR.', retry:'🔄 Thử lại',
    notFound:'Không tìm thấy sự kiện!', checkQR2:'Vui lòng kiểm tra lại mã QR.',
    statusOpen:'Đang mở', statusSoon:'Sắp tới', statusEnd:'Đã kết thúc',
    changeLang:'Đổi ngôn ngữ',
  },
  en: {
    welcome:'🎪 Welcome!', explore:'Explore the exhibition booths',
    scanQr:'📱 Scan QR to start your tour', orPress:'or press the button below',
    noQr:'No QR yet — generate in Admin', enterBtn:'🚀 Enter now',
    loading:'Loading...', location:'📍 Location:', date:'📅 Date:',
    status:'🏷️ Status:', booths:'🏪 Booths:', startBtn:'🚀 Start tour',
    checkQR:'Please scan the QR code again.', retry:'🔄 Retry',
    notFound:'Event not found!', checkQR2:'Please check the QR code.',
    statusOpen:'Open', statusSoon:'Coming soon', statusEnd:'Ended',
    changeLang:'Change language',
  },
  ja: {
    welcome:'🎪 ようこそ！', explore:'展示ブースを探索しよう',
    scanQr:'📱 QRをスキャンしてツアー開始', orPress:'または下のボタンを押してください',
    noQr:'QRがありません', enterBtn:'🚀 今すぐ入場',
    loading:'読み込み中...', location:'📍 場所:', date:'📅 日付:',
    status:'🏷️ ステータス:', booths:'🏪 ブース数:', startBtn:'🚀 ツアー開始',
    checkQR:'QRコードを再度スキャンしてください。', retry:'🔄 再試行',
    notFound:'イベントが見つかりません！', checkQR2:'QRコードを確認してください。',
    statusOpen:'開催中', statusSoon:'もうすぐ', statusEnd:'終了',
    changeLang:'言語を変更',
  },
  zh: {
    welcome:'🎪 欢迎！', explore:'探索展览展台',
    scanQr:'📱 扫描二维码开始参观', orPress:'或按下方按钮',
    noQr:'暂无二维码', enterBtn:'🚀 立即进入',
    loading:'加载中...', location:'📍 地点:', date:'📅 日期:',
    status:'🏷️ 状态:', booths:'🏪 展台数:', startBtn:'🚀 开始参观',
    checkQR:'请重新扫描二维码。', retry:'🔄 重试',
    notFound:'未找到活动！', checkQR2:'请检查二维码。',
    statusOpen:'进行中', statusSoon:'即将开始', statusEnd:'已结束',
    changeLang:'切换语言',
  },
  ko: {
    welcome:'🎪 환영합니다!', explore:'전시 부스를 탐험하세요',
    scanQr:'📱 QR을 스캔하여 투어 시작', orPress:'또는 아래 버튼을 누르세요',
    noQr:'QR 없음', enterBtn:'🚀 지금 입장',
    loading:'로딩 중...', location:'📍 위치:', date:'📅 날짜:',
    status:'🏷️ 상태:', booths:'🏪 부스 수:', startBtn:'🚀 투어 시작',
    checkQR:'QR 코드를 다시 스캔해주세요.', retry:'🔄 재시도',
    notFound:'이벤트를 찾을 수 없습니다！', checkQR2:'QR 코드를 확인해주세요.',
    statusOpen:'진행 중', statusSoon:'곧 시작', statusEnd:'종료됨',
    changeLang:'언어 변경',
  },
  fr: {
    welcome:'🎪 Bienvenue !', explore:"Explorez les stands d'exposition",
    scanQr:'📱 Scanner le QR pour commencer', orPress:'ou appuyez sur le bouton ci-dessous',
    noQr:'Pas de QR', enterBtn:'🚀 Entrer maintenant',
    loading:'Chargement...', location:'📍 Lieu :', date:'📅 Date :',
    status:'🏷️ Statut :', booths:'🏪 Stands :', startBtn:'🚀 Commencer la visite',
    checkQR:'Veuillez rescanner le code QR.', retry:'🔄 Réessayer',
    notFound:'Événement introuvable !', checkQR2:'Veuillez vérifier le code QR.',
    statusOpen:'Ouvert', statusSoon:'Bientôt', statusEnd:'Terminé',
    changeLang:'Changer de langue',
  },
};

function tx(lang, key) {
  return (T[lang] ?? T.vi)[key] ?? T.vi[key] ?? key;
}

const LANG_FLAGS = { vi:'🇻🇳', en:'🇬🇧', ja:'🇯🇵', zh:'🇨🇳', ko:'🇰🇷', fr:'🇫🇷' };

// Lang picker nhỏ gọn — chỉ hiện khi bấm vào
function LangPicker({ lang, setLang }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lp-lang-wrap">
      <button className="lp-lang-trigger" onClick={() => setOpen(o => !o)}>
        {LANG_FLAGS[lang]} {lang.toUpperCase()} ▾
      </button>
      {open && (
        <div className="lp-lang-dropdown">
          {SUPPORTED_LANGUAGES.map(l => (
            <button key={l}
              className={`lp-lang-option ${lang === l ? 'lp-lang-option--active' : ''}`}
              onClick={() => { setLang(l); setOpen(false); }}>
              {LANG_FLAGS[l]} {l.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const { lang, setLang } = useLanguage();
  const scannedRef     = useRef(null);

  const eventIdFromQR  = searchParams.get('event');
  const [loading,     setLoading]     = useState(true);
  const [eventData,   setEventData]   = useState(null);
  const [globalQrUrl, setGlobalQrUrl] = useState(null);
  const [todayEvent,  setTodayEvent]  = useState(null);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true); setError(null);
        if (eventIdFromQR) {
          const data = await eventService.getById(eventIdFromQR);
          if (cancelled) return;
          if (!data?.id) throw new Error(tx(lang, 'notFound'));
          setEventData(data);
          if (scannedRef.current !== eventIdFromQR) {
            scannedRef.current = eventIdFromQR;
            const device = /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
            eventScanService.log(eventIdFromQR, device);
          }
        } else {
          const events = await eventService.getActiveToday().catch(() => []);
          if (cancelled) return;
          const active = Array.isArray(events) ? (events[0] ?? null) : null;
          setTodayEvent(active);
          if (active?.qrCodeUrl) setGlobalQrUrl(active.qrCodeUrl);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || tx(lang, 'notFound'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventIdFromQR]);

  if (loading) return <LoadingSpinner size="lg" label={tx(lang, 'loading')} />;

  // ── MODE KHÁCH: quét QR có ?event= ──────────────────────────
  if (eventIdFromQR) {
    if (error || !eventData) {
      return (
        <div className="error-page">
          <LangPicker lang={lang} setLang={setLang} />
          <div className="error-container">
            <h2 className="error-title">❌ {error || tx(lang, 'notFound')}</h2>
            <p className="error-text">{tx(lang, 'checkQR2')}</p>
            <button className="btn-retry" onClick={() => window.location.reload()}>
              {tx(lang, 'retry')}
            </button>
          </div>
        </div>
      );
    }

    const statusKey   = eventData.status === 'Đang mở' ? 'statusOpen'
                      : eventData.status === 'Sắp tới'  ? 'statusSoon' : 'statusEnd';
    const statusClass = statusKey === 'statusOpen' ? 'active'
                      : statusKey === 'statusSoon' ? 'upcoming' : 'ended';

    return (
      <div className="landing-page">
        {/* Chỉ hiện lang picker nhỏ gọn — không phải dãy nút to */}
        <LangPicker lang={lang} setLang={setLang} />

        <div className="landing-content">
          {eventData.logoUrl && (
            <img src={eventData.logoUrl} alt={eventData.name} className="event-logo"
              onError={(e) => { e.target.style.display = 'none'; }} />
          )}
          <h1 className="event-title">{eventData.name}</h1>
          <p className="event-description">{eventData.description}</p>
          <div className="event-info-grid">
            <p>{tx(lang,'location')} <strong>{eventData.location}</strong></p>
            <p>{tx(lang,'date')}{' '}
              {new Date(eventData.startDate).toLocaleDateString('vi-VN')} –{' '}
              {new Date(eventData.endDate).toLocaleDateString('vi-VN')}
            </p>
            <p>{tx(lang,'status')}{' '}
              <span className={`status-badge ${statusClass}`}>{tx(lang, statusKey)}</span>
            </p>
            <p>{tx(lang,'booths')} {eventData.totalBooths || 0}</p>
          </div>
          <button className="btn-start"
            onClick={() => navigate(`/map?event=${eventIdFromQR}&lang=${lang}`)}>
            {tx(lang, 'startBtn')}
          </button>
        </div>
      </div>
    );
  }

  // ── MODE KIOSK ───────────────────────────────────────────────
  const handleEnter = () => {
    const q = new URLSearchParams({ lang });
    if (todayEvent) navigate(`/map?event=${todayEvent.id}&${q}`);
    else navigate(`/map?${q}`);
  };

  return (
    <div className="landing-page">
      <LangPicker lang={lang} setLang={setLang} />
      <div className="landing-content">
        <h1 className="event-title" style={{ fontSize:28 }}>{tx(lang,'welcome')}</h1>
        {todayEvent ? (
          <>
            <h2 style={{ fontSize:20, fontWeight:700, color:'#111827', margin:'4px 0 2px' }}>
              {todayEvent.name}
            </h2>
            <p style={{ color:'#6b7280', fontSize:13, marginBottom:24 }}>{todayEvent.location}</p>
          </>
        ) : (
          <p style={{ color:'#6b7280', fontSize:14, marginBottom:24 }}>{tx(lang,'explore')}</p>
        )}
        <div className="qr-section">
          <p style={{ fontWeight:600, marginBottom:12 }}>{tx(lang,'scanQr')}</p>
          {globalQrUrl ? (
            <img src={`${API_BASE}${globalQrUrl}`} alt="QR"
              style={{ width:220, height:220, borderRadius:12,
                       border:'3px solid #e5e7eb', padding:8, background:'#fff' }}
              onError={(e) => { e.target.style.display='none'; }} />
          ) : (
            <div style={{ width:220, height:220, borderRadius:12, border:'2px dashed #d1d5db',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          color:'#9ca3af', fontSize:13, margin:'0 auto' }}>
              {tx(lang,'noQr')}
            </div>
          )}
          <p style={{ fontSize:12, color:'#9ca3af', marginTop:10 }}>{tx(lang,'orPress')}</p>
        </div>
        <button className="btn-start" onClick={handleEnter}>{tx(lang,'enterBtn')}</button>
      </div>
    </div>
  );
}