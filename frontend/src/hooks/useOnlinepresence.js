// useOnlinePresence.js
// Gửi heartbeat lên server mỗi 20s để báo "đang online".
// Gọi hook này ở MapPage, BoothPage, LandingPage — bất kỳ trang visitor nào.
// Khi khách đóng tab → beacon DELETE để server biết ngay (không cần đợi TTL 45s).

import { useEffect, useRef } from 'react';
import { getCurrentLang } from './useLanguage';

const PING_INTERVAL_MS = 20_000; // 20 giây
const PING_URL  = `${(import.meta.env.VITE_API_URL || 'http://localhost:5069/api')}/admin/online/ping`;
const LEAVE_URL = (sid) =>
  `${(import.meta.env.VITE_API_URL || 'http://localhost:5069/api')}/admin/online/leave/${sid}`;

// Fallback tạo UUID khi crypto.randomUUID() không tồn tại — xảy ra khi
// trang được tải qua "insecure context" (http://<LAN-IP>:port, không phải
// localhost và không phải https://). Đây CHÍNH XÁC là tình huống quét QR
// qua điện thoại trong mạng LAN dev (vd http://192.168.50.8:5173) — lúc đó
// crypto.randomUUID là undefined, gọi nó sẽ throw ngay khi mount component
// → React crash, không render được gì → toàn trang trắng, không có lỗi
// hiển thị rõ ràng cho người dùng.
function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback RFC4122-ish, đủ dùng để định danh session, không cần chuẩn crypto
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrCreateSessionId() {
  let sid = sessionStorage.getItem('visitor_session_id');
  if (!sid) {
    sid = generateUUID();
    sessionStorage.setItem('visitor_session_id', sid);
  }
  return sid;
}

/**
 * Hook tự động gửi heartbeat khi component mount, dừng khi unmount.
 * @param {Object} opts
 * @param {number|null} opts.boothId  — ID gian hàng đang xem (null nếu ở MapPage)
 */
export function useOnlinePresence({ boothId = null } = {}) {
  const sessionId = useRef(getOrCreateSessionId());

  useEffect(() => {
    const sid  = sessionId.current;
    const lang = getCurrentLang();
    const device = /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';

    const payload = JSON.stringify({
      sessionId:    sid,
      boothId:      boothId ?? 0,
      languageCode: lang,
      deviceType:   device,
    });

    // Ping ngay lập tức khi vào trang
    fetch(PING_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    payload,
    }).catch(() => {}); // silent fail — không làm gián đoạn UX

    // Ping định kỳ
    const timer = setInterval(() => {
      fetch(PING_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    payload,
      }).catch(() => {});
    }, PING_INTERVAL_MS);

    // Khi rời trang: dùng sendBeacon (hoạt động kể cả khi đóng tab)
    function onUnload() {
      navigator.sendBeacon(LEAVE_URL(sid));
    }
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') onUnload();
    });
    window.addEventListener('pagehide', onUnload);

    return () => {
      clearInterval(timer);
      window.removeEventListener('visibilitychange', onUnload);
      window.removeEventListener('pagehide', onUnload);
      // Cleanup khi navigate trong app (không đóng tab)
      fetch(LEAVE_URL(sid), { method: 'DELETE' }).catch(() => {});
    };
  }, [boothId]);
}