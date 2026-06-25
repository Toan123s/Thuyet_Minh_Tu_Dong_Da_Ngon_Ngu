import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const IconDashboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);
const IconCalendar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconPackage = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2l10 6.5v7L12 22 2 15.5v-7L12 2z"/>
    <line x1="12" y1="22" x2="12" y2="11.5"/>
    <polyline points="22 8.5 12 11.5 2 8.5"/>
    <polyline points="7 5.25 12 8.5 17 5.25"/>
  </svg>
);
const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconBarChart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="20" x2="12" y2="10"/>
    <line x1="18" y1="20" x2="18" y2="4"/>
    <line x1="6"  y1="20" x2="6"  y2="16"/>
  </svg>
);
const IconStore = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const ADMIN_MENU = [
  { to: "/admin/dashboard", icon: <IconDashboard />, label: "Dashboard" },
  { to: "/admin/events",    icon: <IconCalendar />,  label: "Sự kiện" },
  { to: "/admin/booths",    icon: <IconPackage />,   label: "Gian hàng" },
  { to: "/admin/accounts",  icon: <IconUsers />,     label: "Tài khoản" },
  { to: "/admin/reports",   icon: <IconBarChart />,  label: "Báo cáo" },
];

const VENDOR_MENU = [
  { to: "/vendor/dashboard", icon: <IconDashboard />, label: "Dashboard" },
  { to: "/vendor/narrations",icon: <IconPackage />,   label: "Nội dung" },
  { to: "/vendor/media",     icon: <IconStore />,     label: "Media" },
  { to: "/vendor/stats",     icon: <IconBarChart />,  label: "Thống kê" },
];

/**
 * Props:
 *  - role       : "Admin" | "Vendor"
 *  - isOpen     : boolean (mobile)
 *  - onClose    : () => void (mobile overlay click)
 */
export default function Sidebar({ role = "Admin", isOpen, onClose }) {
  const menu = role === "Vendor" ? VENDOR_MENU : ADMIN_MENU;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? "sidebar--open" : ""}`}>
        <nav className="sidebar__nav">
          <p className="sidebar__section-label">MENU</p>
          {menu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar__item ${isActive ? "sidebar__item--active" : ""}`
              }
              onClick={onClose}
            >
              <span className="sidebar__icon">{item.icon}</span>
              <span className="sidebar__label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <span className="sidebar__version">AutoNarration v1.0</span>
        </div>
      </aside>
    </>
  );
}