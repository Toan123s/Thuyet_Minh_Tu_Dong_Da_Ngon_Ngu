import logo from "../../assets/img/logo-full.svg";
import "./Navbar.css";

// ─── Icons ────────────────────────────────────────────────────
const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const IconMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6"  x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

/**
 * Props:
 *  - user           : { username: string, role: string }
 *  - onLogout       : () => void
 *  - onToggleSidebar: () => void  (mobile hamburger)
 */
export default function Navbar({ user, onLogout, onToggleSidebar }) {
  return (
    <header className="navbar">
      <div className="navbar__left">
        <button className="navbar__hamburger" onClick={onToggleSidebar} aria-label="Toggle menu">
          <IconMenu />
        </button>
        <img src={logo} alt="AutoNarration" className="navbar__logo" />
      </div>

      <div className="navbar__right">
        <div className="navbar__user">
          <div className="navbar__avatar">
            {user?.username?.[0]?.toUpperCase() ?? "A"}
          </div>
          <div className="navbar__user-info">
            <span className="navbar__username">{user?.username ?? "Admin"}</span>
            <span className="navbar__role">{user?.role ?? "Admin"}</span>
          </div>
        </div>

        <button className="navbar__logout" onClick={onLogout} title="Đăng xuất">
          <IconLogout />
          <span>Đăng xuất</span>
        </button>
      </div>
    </header>
  );
}