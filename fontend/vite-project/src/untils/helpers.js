// ─── Payment Helper ───────────────────────────────────────────
// Quản lý trạng thái thanh toán phí sử dụng thuyết minh
// Lưu vào localStorage: { eventId, paidAt (timestamp ms) }
// Hiệu lực: 24 giờ kể từ lúc thanh toán

const STORAGE_KEY = "narration_access";
const DURATION_MS = 24 * 60 * 60 * 1000; // 24 giờ

/**
 * Kiểm tra xem event này đã được thanh toán và còn hiệu lực không
 * @param {string|number} eventId
 * @returns {boolean}
 */
export function isPaidAndValid(eventId) {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${eventId}`);
    if (!raw) return false;
    const { paidAt } = JSON.parse(raw);
    return Date.now() - paidAt < DURATION_MS;
  } catch {
    return false;
  }
}

/**
 * Lưu thông tin thanh toán
 * @param {string|number} eventId
 */
export function savePaidAccess(eventId) {
  localStorage.setItem(
    `${STORAGE_KEY}_${eventId}`,
    JSON.stringify({ eventId, paidAt: Date.now() })
  );
}

/**
 * Lấy thời gian còn lại (dạng string "HHhMMm")
 * @param {string|number} eventId
 * @returns {string|null}
 */
export function getRemainingTime(eventId) {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${eventId}`);
    if (!raw) return null;
    const { paidAt }  = JSON.parse(raw);
    const remaining   = DURATION_MS - (Date.now() - paidAt);
    if (remaining <= 0) return null;
    const hours   = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    return `${hours}h${minutes.toString().padStart(2, "0")}m`;
  } catch {
    return null;
  }
}