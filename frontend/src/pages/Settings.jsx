import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, Monitor, Bell, Shield, Trash2 } from "lucide-react";
import "./Settings.css";

const LANGUAGES = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English", disabled: true },
];

const THEMES = [
  { value: "light", label: "Clair" },
  { value: "dark",  label: "Sombre (bientôt disponible)", disabled: true },
];

export default function Settings() {
  const navigate = useNavigate();

  // Read persisted prefs or fall back to defaults
  const saved = (() => {
    try { return JSON.parse(localStorage.getItem("settings") || "{}"); }
    catch { return {}; }
  })();

  const [language,      setLanguage]      = useState(saved.language      || "fr");
  const [theme,         setTheme]         = useState(saved.theme          || "light");
  const [notifCalc,     setNotifCalc]     = useState(saved.notifCalc      ?? true);
  const [notifReco,     setNotifReco]     = useState(saved.notifReco      ?? true);
  const [saved2,        setSaved2]        = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleSave = () => {
    localStorage.setItem("settings", JSON.stringify({ language, theme, notifCalc, notifReco }));
    setSaved2(true);
    setTimeout(() => setSaved2(false), 2500);
  };

  const handleDeleteAccount = async () => {
    try {
      await fetch("http://localhost:8000/api/logout/", { method: "POST", credentials: "include" });
    } catch { /* ignore */ }
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="settings-page">

      <div className="settings-title-row">
        <h1>Paramètres</h1>
        <p>Personnalisez votre expérience EcoDesign.</p>
      </div>

      {/* ── Langue & affichage ── */}
      <div className="settings-card">
        <div className="settings-card-header">
          <Globe size={16} />
          <h2>Langue & affichage</h2>
        </div>

        <div className="settings-field">
          <label>Langue de l'interface</label>
          <div className="settings-radio-group">
            {LANGUAGES.map((l) => (
              <label
                key={l.value}
                className={`settings-radio ${language === l.value ? "active" : ""} ${l.disabled ? "disabled" : ""}`}
              >
                <input
                  type="radio"
                  name="language"
                  value={l.value}
                  checked={language === l.value}
                  onChange={() => !l.disabled && setLanguage(l.value)}
                  disabled={l.disabled}
                />
                {l.label}
                {l.disabled && <span className="settings-soon">bientôt</span>}
              </label>
            ))}
          </div>
        </div>

        <div className="settings-field">
          <label>Thème</label>
          <div className="settings-radio-group">
            {THEMES.map((t) => (
              <label
                key={t.value}
                className={`settings-radio ${theme === t.value ? "active" : ""} ${t.disabled ? "disabled" : ""}`}
              >
                <input
                  type="radio"
                  name="theme"
                  value={t.value}
                  checked={theme === t.value}
                  onChange={() => !t.disabled && setTheme(t.value)}
                  disabled={t.disabled}
                />
                {t.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ── Apparence ── */}
      <div className="settings-card">
        <div className="settings-card-header">
          <Monitor size={16} />
          <h2>Apparence</h2>
        </div>
        <div className="settings-field">
          <label>Unité d'éco-coût</label>
          <div className="settings-radio-group">
            {["€ (Euro)", "$ (Dollar)"].map((u) => (
              <label key={u} className={`settings-radio ${u.startsWith("€") ? "active" : "disabled"}`}>
                <input type="radio" disabled={!u.startsWith("€")} defaultChecked={u.startsWith("€")} />
                {u}{!u.startsWith("€") && <span className="settings-soon">bientôt</span>}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ── Notifications ── */}
      <div className="settings-card">
        <div className="settings-card-header">
          <Bell size={16} />
          <h2>Notifications</h2>
        </div>

        <div className="settings-field settings-field--toggle">
          <div>
            <label>Calcul terminé</label>
            <p className="settings-field-desc">Recevoir une confirmation après chaque calcul ACV.</p>
          </div>
          <button
            className={`settings-toggle ${notifCalc ? "on" : ""}`}
            onClick={() => setNotifCalc((v) => !v)}
            aria-label="Toggle calcul notification"
          >
            <span className="settings-toggle-knob" />
          </button>
        </div>

        <div className="settings-field settings-field--toggle">
          <div>
            <label>Nouvelles recommandations</label>
            <p className="settings-field-desc">Être notifié quand de nouvelles suggestions sont disponibles.</p>
          </div>
          <button
            className={`settings-toggle ${notifReco ? "on" : ""}`}
            onClick={() => setNotifReco((v) => !v)}
            aria-label="Toggle reco notification"
          >
            <span className="settings-toggle-knob" />
          </button>
        </div>
      </div>

      {/* ── Confidentialité ── */}
      <div className="settings-card settings-card--danger">
        <div className="settings-card-header">
          <Shield size={16} />
          <h2>Confidentialité & données</h2>
        </div>

        <div className="settings-field">
          <label>Supprimer le compte</label>
          <div className="settings-value-row">
            <p className="settings-field-desc" style={{ margin: 0 }}>
              Supprime définitivement votre compte et toutes vos données. Cette action est irréversible.
            </p>
            {!deleteConfirm ? (
              <button className="settings-btn-danger" onClick={() => setDeleteConfirm(true)}>
                <Trash2 size={13} /> Supprimer
              </button>
            ) : (
              <div className="settings-confirm-row">
                <span className="settings-confirm-text">Êtes-vous sûr ?</span>
                <button className="settings-btn-danger" onClick={handleDeleteAccount}>Confirmer</button>
                <button className="settings-btn-cancel" onClick={() => setDeleteConfirm(false)}>Annuler</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Save bar ── */}
      <div className="settings-save-bar">
        {saved2 && <span className="settings-saved-msg">✓ Paramètres enregistrés</span>}
        <button className="settings-btn-save" onClick={handleSave}>
          Enregistrer les modifications
        </button>
      </div>

    </div>
  );
}
