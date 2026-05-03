import { useNavigate, useLocation } from "react-router-dom";
import {
  BarChart2,
  LayoutDashboard,
  Tag,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import "./Sidebar.css";

const navItems = [
  { Icon: Package,         label: "Produits",          path: "/products"   },
  { Icon: BarChart2,       label: "Calcul ACV",         path: "/app"        },
  { Icon: LayoutDashboard, label: "Tableau de bords",   path: "/dashboard"  },
  { Icon: Tag,             label: "Tarification",       path: "/pricing"    },
];

const bottomItems = [
  { Icon: Settings, label: "Paramètres", path: "/settings" },
  { Icon: LogOut,   label: "Déconnexion", danger: true },
];

export default function Sidebar({ isOpen = false, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();

  const toggle = () => {
    if (onToggle) onToggle();
  };

  const handleNavClick = (path) => {
    if (path) navigate(path);
  };

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      {/* Toggle button */}
      <button className="sidebar-toggle" onClick={toggle}>
        {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      <div className="sidebar-divider" />

      {/* Main nav */}
      <nav className="sidebar-nav">
        {navItems.map(({ Icon, label, path }, i) => (
          <button
            key={i}
            className={`sidebar-item ${location.pathname === path ? "active" : ""}`}
            onClick={() => handleNavClick(path)}
          >
            <span className="sidebar-item-icon">
              <Icon size={18} />
            </span>
            <span className="sidebar-item-label">{label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="sidebar-divider" />
      <div className="sidebar-bottom">
        {bottomItems.map(({ Icon, label, path, danger }, i) => (
          <button
            key={i}
            className={`sidebar-item ${danger ? "danger" : ""} ${location.pathname === path ? "active" : ""}`}
            onClick={async () => {
              if (danger) {
                try {
                  await fetch("http://localhost:8000/api/logout/", { method: "POST", credentials: "include" });
                } catch { /* ignore */ }
                localStorage.removeItem("user");
                navigate("/login");
              } else {
                handleNavClick(path);
              }
            }}
          >
            <span className="sidebar-item-icon"><Icon size={18} /></span>
            <span className="sidebar-item-label">{label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
