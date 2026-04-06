import { useState } from "react";
import "./Sidebar.css";

const navItems = [
  { icon: "📊", label: "Calcul ACV",      active: true },
  { icon: "⊞",  label: "Tableau de bords" },
  { icon: "♥",  label: "Favorites" },
  { icon: "🕐", label: "Historique" },
  { icon: "💲", label: "Tarification" },
];

const bottomItems = [
  { icon: "⚙",  label: "Settings" },
  { icon: "⏻",  label: "Logout", danger: true },
];

export default function Sidebar({ onToggle }) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (onToggle) onToggle(next ? 200 : 60);
  };

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>

      {/* Toggle button */}
      <button className="sidebar-toggle" onClick={toggle}>
        {open ? "‹" : "›"}
      </button>

      <div className="sidebar-divider" />

      {/* Main nav */}
      <nav className="sidebar-nav">
        {navItems.map((item, i) => (
          <button key={i} className={`sidebar-item ${item.active ? "active" : ""}`}>
            <span className="sidebar-item-icon">{item.icon}</span>
            <span className="sidebar-item-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="sidebar-divider" />
      <div className="sidebar-bottom">
        {bottomItems.map((item, i) => (
          <button key={i} className={`sidebar-item ${item.danger ? "danger" : ""}`}>
            <span className="sidebar-item-icon">{item.icon}</span>
            <span className="sidebar-item-label">{item.label}</span>
          </button>
        ))}
      </div>

    </aside>
  );
}