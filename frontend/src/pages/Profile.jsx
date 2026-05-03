import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Shield, LogOut, Edit2, Check, X, CreditCard } from "lucide-react";
import { PLANS, getCurrentPlanKey } from "../utils/planLimits";
import "./Profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Editable name state
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState("");
  const [nameSaving, setNameSaving] = useState(false);

  // Editable password state
  const [editingPassword, setEditingPassword] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed);
      setNameInput(parsed.name || "");
    }
  }, []);

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  /* ── Save name ── */
  const handleSaveName = async () => {
    if (!nameInput.trim()) { setNameError("Le nom ne peut pas être vide."); return; }
    setNameSaving(true);
    setNameError("");
    try {
      const res = await fetch(`http://localhost:8000/api/users/${user.id}/`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput.trim() }),
      });
      if (res.ok) {
        const updated = { ...user, name: nameInput.trim() };
        localStorage.setItem("user", JSON.stringify(updated));
        setUser(updated);
        setEditingName(false);
      } else {
        setNameError("Erreur lors de la mise à jour.");
      }
    } catch {
      setNameError("Erreur serveur.");
    }
    setNameSaving(false);
  };

  /* ── Save password ── */
  const handleSavePassword = async () => {
    setPwError("");
    setPwSuccess("");
    if (!pwForm.current) { setPwError("Mot de passe actuel requis."); return; }
    if (pwForm.next.length < 6) { setPwError("Le nouveau mot de passe doit contenir au moins 6 caractères."); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError("Les mots de passe ne correspondent pas."); return; }
    setPwSaving(true);
    try {
      const res = await fetch(`http://localhost:8000/api/users/${user.id}/password/`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: pwForm.current, new_password: pwForm.next }),
      });
      if (res.ok) {
        setPwSuccess("Mot de passe mis à jour avec succès.");
        setPwForm({ current: "", next: "", confirm: "" });
        setEditingPassword(false);
      } else {
        const data = await res.json();
        setPwError(data.error || "Erreur lors de la mise à jour.");
      }
    } catch {
      setPwError("Erreur serveur.");
    }
    setPwSaving(false);
  };

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:8000/api/logout/", { method: "POST", credentials: "include" });
    } catch { /* ignore */ }
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div className="profile-page">

      {/* ── Hero card ── */}
      <div className="profile-hero">
        <div className="profile-avatar-lg">{initials}</div>
        <div className="profile-hero-info">
          <h1>{user.name}</h1>
          <p>{user.email}</p>
        </div>
      </div>

      <div className="profile-body">

        {/* ── Informations personnelles ── */}
        <div className="profile-card">
          <div className="profile-card-header">
            <User size={16} />
            <h2>Informations personnelles</h2>
          </div>

          {/* Name row */}
          <div className="profile-field">
            <label>Nom complet</label>
            {editingName ? (
              <div className="profile-edit-row">
                <input
                  value={nameInput}
                  onChange={(e) => { setNameInput(e.target.value); setNameError(""); }}
                  autoFocus
                  className="profile-input"
                />
                <button className="profile-icon-btn profile-icon-btn--save"
                  onClick={handleSaveName} disabled={nameSaving}>
                  <Check size={15} />
                </button>
                <button className="profile-icon-btn profile-icon-btn--cancel"
                  onClick={() => { setEditingName(false); setNameInput(user.name); setNameError(""); }}>
                  <X size={15} />
                </button>
              </div>
            ) : (
              <div className="profile-value-row">
                <span className="profile-value">{user.name}</span>
                <button className="profile-edit-btn" onClick={() => setEditingName(true)}>
                  <Edit2 size={13} /> Modifier
                </button>
              </div>
            )}
            {nameError && <p className="profile-error">{nameError}</p>}
          </div>

          {/* Email row — read only */}
          <div className="profile-field">
            <label>Adresse e-mail</label>
            <div className="profile-value-row">
              <span className="profile-value">{user.email}</span>
              <span className="profile-readonly-badge">
                <Mail size={11} /> Non modifiable
              </span>
            </div>
          </div>
          
        </div>

        {/* ── Mon abonnement ── */}
        {(() => {
          const planKey = getCurrentPlanKey();
          const plan = PLANS[planKey];
          const isPro = planKey !== "free";

          const features = [
            { label: "3 produits",                    included: plan.maxProducts >= 3 },
            { label: "2 scénarios par produit",       included: plan.maxScenariosPerProduct >= 2 },
            { label: "Accès base Idemat complète",    included: true },
            { label: "Calcul éco-coûts & CO₂",       included: true },
            { label: "Recommandations intelligentes", included: plan.recommendations },
            { label: "Export de rapports",            included: plan.export },
          ];

          return (
            <div className="profile-card">
              <div className="profile-card-header">
                <CreditCard size={16} />
                <h2>Mon abonnement</h2>
              </div>

              <div className="profile-plan-top">
                <div className="profile-plan-badge">
                  <span className="profile-plan-dot" />
                  {plan.name}
                </div>
                {!isPro && (
                  <button className="profile-btn-upgrade" onClick={() => navigate("/pricing")}>
                    Passer au Pro →
                  </button>
                )}
                {isPro && (
                  <button className="profile-btn-change" onClick={() => navigate("/pricing")}>
                    Changer de plan
                  </button>
                )}
              </div>

              <ul className="profile-plan-features">
                {features.map((f, i) => (
                  <li key={i} className={f.included ? "profile-plan-yes" : "profile-plan-no"}>
                    {f.included ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    )}
                    {f.label}
                    {!f.included && (
                      <span className="profile-plan-lock">— Plan Pro</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })()}

        {/* ── Sécurité ── */}
        <div className="profile-card">
          <div className="profile-card-header">
            <Shield size={16} />
            <h2>Sécurité</h2>
          </div>

          <div className="profile-field">
            <label>Mot de passe</label>
            {editingPassword ? (
              <div className="profile-pw-form">
                <input
                  type="password"
                  placeholder="Mot de passe actuel"
                  value={pwForm.current}
                  onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
                  className="profile-input"
                />
                <input
                  type="password"
                  placeholder="Nouveau mot de passe"
                  value={pwForm.next}
                  onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
                  className="profile-input"
                />
                <input
                  type="password"
                  placeholder="Confirmer le nouveau mot de passe"
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                  className="profile-input"
                />
                {pwError && <p className="profile-error">{pwError}</p>}
                <div className="profile-pw-actions">
                  <button className="profile-btn-save" onClick={handleSavePassword} disabled={pwSaving}>
                    {pwSaving ? "Enregistrement..." : "Enregistrer"}
                  </button>
                  <button className="profile-btn-cancel"
                    onClick={() => { setEditingPassword(false); setPwForm({ current: "", next: "", confirm: "" }); setPwError(""); }}>
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div className="profile-value-row">
                <span className="profile-value">••••••••</span>
                <button className="profile-edit-btn" onClick={() => setEditingPassword(true)}>
                  <Edit2 size={13} /> Modifier
                </button>
              </div>
            )}
            {pwSuccess && <p className="profile-success">{pwSuccess}</p>}
          </div>
        </div>

        {/* ── Danger zone ── */}
        <div className="profile-card profile-card--danger">
          <div className="profile-card-header">
            <LogOut size={16} />
            <h2>Session</h2>
          </div>
          <div className="profile-field">
            <label>Déconnexion</label>
            <div className="profile-value-row">
              <span className="profile-value profile-value--muted">
                Connecté en tant que <strong>{user.email}</strong>
              </span>
              <button className="profile-btn-logout" onClick={handleLogout}>
                Se déconnecter
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
