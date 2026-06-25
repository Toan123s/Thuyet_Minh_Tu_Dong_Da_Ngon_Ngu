import "./ConfirmDialog.css";

const IconWarning = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

/**
 * Props:
 *  - isOpen      : boolean
 *  - variant     : "warning" | "danger"
 *  - title       : string
 *  - message     : string
 *  - confirmLabel: string
 *  - onConfirm   : () => void
 *  - onCancel    : () => void
 */
export default function ConfirmDialog({ isOpen, variant = "warning", title, message, confirmLabel = "Xác nhận", onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div className="cd-overlay" onClick={onCancel}>
      <div className="cd-modal" onClick={e => e.stopPropagation()}>
        <div className="cd-body">
          <div className={`cd-icon cd-icon--${variant}`}>
            <IconWarning />
          </div>
          <div className="cd-text">
            <h3>{title}</h3>
            <p>{message}</p>
          </div>
        </div>
        <div className="cd-footer">
          <button className="cd-btn cd-btn--ghost" onClick={onCancel}>Hủy</button>
          <button className={`cd-btn cd-btn--${variant}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}