import './LoadingSpinner.css';

/**
 * Props:
 *  - size : "sm" | "md" | "lg"  (default: "md")
 *  - label: string (optional, text bên dưới spinner)
 */
export default function LoadingSpinner({ size = "md", label }) {
  return (
    <div className={`spinner-wrap spinner-wrap--${size}`}>
      <div className={`spinner spinner--${size}`} />
      {label && <span className="spinner-label">{label}</span>}
    </div>
  );
}