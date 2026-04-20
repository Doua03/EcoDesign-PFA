import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronUp, ChevronDown, User, Settings, LogOut } from "lucide-react";
import "./Header.css";

export default function Header({ sidebarWidth = 60 }) {
  const navigate = useNavigate();
  const [user,         setUser]        = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:8000/api/logout/', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) { /* ignore network error */ }
    localStorage.removeItem('user');
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <header className="header" style={{ left: sidebarWidth }}>
      <div className="header-left">
        <div className="header-logo">
          <img src="/Logo.png" alt="EcoDesign" />
        </div>
        <div className="header-search">
          <span className="header-search-icon"><Search size={15} /></span>
          <input placeholder="Search" />
        </div>
      </div>

      {/* User dropdown */}
      <div className="header-user-wrapper" ref={dropdownRef}>
        <div className="header-user" onClick={() => setDropdownOpen(!dropdownOpen)}>
          <div className="header-avatar">{initials}</div>
          <div className="header-user-info">
            <span className="header-username">{user?.name || 'Utilisateur'}</span>
          </div>
          <span className="header-chevron">
            {dropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </div>

        {dropdownOpen && (
          <div className="header-dropdown">
            <div className="header-dropdown-info">
              <div className="header-dropdown-avatar">{initials}</div>
              <div>
                <div className="header-dropdown-name">{user?.name}</div>
                <div className="header-dropdown-email">{user?.email}</div>
              </div>
            </div>

            <div className="header-dropdown-divider" />

            <button className="header-dropdown-item">
              <User size={15} /> Mon profil
            </button>
            <button className="header-dropdown-item">
              <Settings size={15} /> Paramètres
            </button>

            <div className="header-dropdown-divider" />

            <button className="header-dropdown-item header-dropdown-logout" onClick={handleLogout}>
              <LogOut size={15} /> Se déconnecter
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
