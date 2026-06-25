import "./StatCard.css";

/**
 * Props:
 *  - icon  : ReactNode
 *  - label : string
 *  - value : string | number
 *  - sub   : string (optional, phụ đề nhỏ bên dưới)
 *  - color : "blue" | "green" | "orange" | "purple" (default: "blue")
 */
export default function StatCard({ icon, label, value, sub, color = "blue" }) {
  return (
    <div className={`stat-card stat-card--${color}`}>
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__body">
        <div className="stat-card__value">{value}</div>
        <div className="stat-card__label">{label}</div>
        {sub && <div className="stat-card__sub">{sub}</div>}
      </div>
    </div>
  );
}