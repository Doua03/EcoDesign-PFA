import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BarChart2,
  LayoutDashboard,
  Heart,
  Clock,
  Tag,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import "./Sidebar.css";

const navItems = [
  { Icon: Package, label: "Produits", path: "/products" },
  { Icon: BarChart2, label: "Calcul ACV", path: "/app" },
  { Icon: LayoutDashboard, label: "Tableau de bords" },
  { Icon: Heart, label: "Favorites" },
  { Icon: Clock, label: "Historique" },
  { Icon: Tag, label: "Tarification" },
];

const bottomItems = [
  { Icon: Settings, label: "Settings" },
  { Icon: LogOut, label: "Logout", danger: true },
];

export default function Sidebar({ onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (onToggle) onToggle(next ? 200 : 60);
  };

  const handleNavClick = (path) => {
    if (path) navigate(path);
  };

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      {/* Toggle button */}
      <button className="sidebar-toggle" onClick={toggle}>
        {open ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
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
        {bottomItems.map(({ Icon, label, danger }, i) => (
          <button key={i} className={`sidebar-item ${danger ? "danger" : ""}`}>
            <span className="sidebar-item-icon">
              <Icon size={18} />
            </span>
            <span className="sidebar-item-label">{label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
