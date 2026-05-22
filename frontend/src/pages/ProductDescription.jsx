import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ProductDescription.css";
import { getPlanLimits } from "../utils/planLimits";
import {
  Leaf,
  Truck,
  Zap,
  Factory,
  Recycle,
  Layers,
  Trash2,
  BarChart2,
  Search,
  RefreshCw,
  CheckCircle,
  TrendingDown,
  X,
  Star,
  Folder,
} from "lucide-react";

/* ── API helpers ────────────────────────────────────── */
function useFetch(url) {
  const [data, setData] = useState([]);
  useEffect(() => {
    if (!url) return;
    fetch(url, { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((err) => console.error(`[useFetch] ✗ ${url}:`, err));
  }, [url]);
  return data;
}

const api = {
  get: (url) => fetch(url, { credentials: "include" }).then((r) => r.json()),
  post: (url, b) =>
    fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(b),
    }).then((r) => r.json()),
  put: (url, b) =>
    fetch(url, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(b),
    }).then((r) => r.json()),
  delete: (url) =>
    fetch(url, { method: "DELETE", credentials: "include" }).then((r) =>
      r.json(),
    ),
};

/* ── Phase colors & labels ──────────────────────────── */
const PHASE_COLORS = {
  materiaux:  "#5EAA28",   // brand green
  packaging:  "#f0a050",   // warm orange
  transport:  "#e07b8a",   // warm rose
  energie:    "#4a90c4",   // medium blue
  production: "#8b6fc4",   // medium purple
  fin_de_vie: "#c4a84a",   // warm amber
};

const PHASE_LABELS = {
  materiaux:  "Matières premières",
  packaging:  "Packaging",
  transport:  "Transport",
  energie:    "Énergie",
  production: "Production",
  fin_de_vie: "Fin de vie",
};

/* ── Donut chart ────────────────────────────────────── */
function DonutChart({ result, mode = "eco" }) {
  const r = 70,
    cx = 90,
    cy = 90,
    stroke = 28;
  const circ = 2 * Math.PI * r;

  if (!result) {
    return (
      <div className="pd-donut-wrapper">
        <div className="pd-donut-empty">
          <Leaf size={36} color="#a9dfbf" strokeWidth={1.5} />
          <p>Lancez le calcul pour voir les résultats</p>
        </div>
      </div>
    );
  }

  const isCO2 = mode === "co2";
  const breakdown = isCO2
    ? (result.carbon_breakdown || result.breakdown || {})
    : (result.breakdown || {});
  const totalValue = isCO2 ? result.total_carbon_kg : result.total_eco_cost;

  const absSum = Object.values(breakdown).reduce((s, v) => s + Math.abs(v), 0);

  const segments = Object.entries(breakdown)
    .filter(([_, value]) => value !== 0)
    .map(([key, value]) => ({
      key,
      label: PHASE_LABELS[key],
      color: value < 0 ? PHASE_COLORS[key] + "88" : PHASE_COLORS[key],
      value,
      pct: absSum > 0 ? Math.max((Math.abs(value) / absSum) * 100, 1) : 0,
      isCredit: value < 0,
    }))
    .filter((s) => s.pct > 0);

  if (segments.length === 0) {
    return (
      <div className="pd-donut-wrapper">
        <svg className="pd-donut-svg" viewBox="0 0 180 180">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f2f6" strokeWidth={stroke} />
        </svg>
        <div className="pd-donut-center">
          <span className="pd-donut-value">{isCO2 ? "0 kg" : "€0"}</span>
          <span className="pd-donut-label">{isCO2 ? "CO₂ total" : "Éco-coût total"}</span>
        </div>
      </div>
    );
  }

  let cumulativePct = 0;

  return (
    <div className="pd-donut-wrapper">
      <svg className="pd-donut-svg" viewBox="0 0 180 180">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f2f6" strokeWidth={stroke} />
        {segments.map((s, i) => {
          const dash = (s.pct / 100) * circ;
          const gap = circ - dash;
          const rotate = (cumulativePct / 100) * 360 - 90;
          cumulativePct += s.pct;
          return (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`}
              transform={`rotate(${rotate} ${cx} ${cy})`}
              style={{ transition: "all 0.5s ease" }}
            />
          );
        })}
      </svg>
      <div className="pd-donut-center">
        <span className="pd-donut-value">
          {totalValue < 0 ? "-" : ""}
          {isCO2
            ? `${Math.abs(totalValue).toFixed(2)} kg`
            : `€${Math.abs(totalValue).toFixed(2)}`}
        </span>
        <span className="pd-donut-label">
          {totalValue < 0
            ? "Crédit net"
            : isCO2 ? "CO₂ total" : "Éco-coût total"}
        </span>
      </div>
    </div>
  );
}

/* ── Recommendations components ─────────────────────── */
const PHASE_ICONS = {
  materiaux: <Layers size={14} />,
  packaging: <Layers size={14} />,
  transport: <Truck size={14} />,
  energie: <Zap size={14} />,
  production: <Factory size={14} />,
  fin_de_vie: <Recycle size={14} />,
};

/* One alternative row (best or secondary) */
function AltRow({ rec, isBest }) {
  const truncate = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
  return (
    <div className={`pd-reco-alt-row ${isBest ? "best" : "secondary"}`}>
      <div className="pd-reco-alt-header">
        <div className="pd-reco-alt-names">
          <span className="pd-reco-cur" title={rec.current_name}>
            {truncate(rec.current_name, 38)}
          </span>
          <span className="pd-reco-arrow">→</span>
          <span className="pd-reco-alt-name" title={rec.alternative_name}>
            {truncate(rec.alternative_name, 38)}
          </span>
        </div>
        <div className="pd-reco-alt-savings">
          <span className="pd-reco-save-co2">-{rec.co2_saving.toFixed(2)} kg CO₂</span>
          <span className="pd-reco-save-pct">-{rec.improvement_pct}%</span>
          {rec.eco_saving > 0.01 && (
            <span className="pd-reco-save-eco">-€{rec.eco_saving.toFixed(2)}</span>
          )}
        </div>
      </div>
      <p className="pd-reco-conseil">{rec.conseil}</p>
      <div className="pd-reco-meta">
        <span>{rec.quantity} {rec.unit}</span>
        <span>{rec.current_co2.toFixed(3)} → {rec.alternative_co2.toFixed(3)} kg CO₂</span>
      </div>
    </div>
  );
}

/* One card per (phase, current_name) group */
function RecoGroupCard({ phase, phaseLabel, currentName, alternatives }) {
  const [expanded, setExpanded] = useState(false);
  const best = alternatives[0];
  const others = alternatives.slice(1);

  return (
    <div className="pd-reco-group">
      {/* Group header */}
      <div className="pd-reco-group-header">
        <div className="pd-reco-group-phase">
          <span className="pd-reco-phase-icon"
            style={{ color: PHASE_COLORS[phase] || "#636e72" }}>
            {PHASE_ICONS[phase] || <Layers size={14} />}
          </span>
          <span className="pd-reco-phase-label"
            style={{ color: PHASE_COLORS[phase] || "#636e72" }}>
            {phaseLabel}
          </span>
        </div>
        <span className="pd-reco-group-item-name" title={currentName}>
          {currentName.length > 45 ? currentName.slice(0, 44) + "…" : currentName}
        </span>
      </div>

      {/* Best alternative — always visible */}
      <AltRow rec={best} isBest={true} />

      {/* Other alternatives — collapsible */}
      {others.length > 0 && (
        <>
          {expanded && others.map((r, i) => (
            <AltRow key={i} rec={r} isBest={false} />
          ))}
          <button
            className="pd-reco-toggle-btn"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded
              ? "▲ Masquer les autres options"
              : `▼ Voir ${others.length} autre${others.length > 1 ? "s" : ""} option${others.length > 1 ? "s" : ""}`}
          </button>
        </>
      )}
    </div>
  );
}

function RecommendationsPanel({ recommendations, loading }) {
  if (loading) {
    return (
      <div className="pd-reco-state">
        <div className="pd-reco-spinner" />
        <p>Analyse en cours…</p>
      </div>
    );
  }
  if (recommendations.length === 0) {
    return (
      <div className="pd-reco-state">
        <CheckCircle size={32} color="#5EAA28" strokeWidth={1.5} />
        <p>Aucune amélioration significative détectée — votre scénario est déjà bien optimisé !</p>
      </div>
    );
  }

  // Group by (phase, current_name) — preserving order (best CO₂ saving first)
  const groups = [];
  const seen = new Map();
  for (const r of recommendations) {
    const key = `${r.phase}||${r.current_name}`;
    if (!seen.has(key)) {
      seen.set(key, groups.length);
      groups.push({
        phase: r.phase,
        phaseLabel: r.phase_label,
        currentName: r.current_name,
        alternatives: [r],
      });
    } else {
      groups[seen.get(key)].alternatives.push(r);
    }
  }

  const totalSavingCO2 = groups.reduce((s, g) => s + g.alternatives[0].co2_saving, 0);
  const totalSavingEco = groups.reduce((s, g) => s + g.alternatives[0].eco_saving, 0);

  return (
    <div className="pd-reco-content">
      {/* Summary bar */}
      <div className="pd-reco-summary">
        <div className="pd-reco-summary-item">
          <span className="pd-reco-summary-val">-{totalSavingCO2.toFixed(2)} kg CO₂</span>
          <span className="pd-reco-summary-lbl">Potentiel de réduction</span>
        </div>
        <div className="pd-reco-summary-item">
          <span className="pd-reco-summary-val">{groups.length} suggestion{groups.length > 1 ? "s" : ""}</span>
          <span className="pd-reco-summary-lbl">Améliorations identifiées</span>
        </div>
        {totalSavingEco > 0.01 && (
          <div className="pd-reco-summary-item">
            <span className="pd-reco-summary-val">-€{totalSavingEco.toFixed(2)}</span>
            <span className="pd-reco-summary-lbl">Économie éco-coût</span>
          </div>
        )}
      </div>

      {/* One card per item */}
      <div className="pd-reco-groups">
        {groups.map((g, i) => (
          <RecoGroupCard key={i} {...g} />
        ))}
      </div>
    </div>
  );
}

/* ── Compare scenarios components ───────────────────── */
function BestBadge({ data }) {
  const bestCarbon = data.reduce((b, d) =>
    d.total_carbon_kg < b.total_carbon_kg ? d : b,
  );
  const bestEco = data.reduce((b, d) =>
    d.total_eco_cost < b.total_eco_cost ? d : b,
  );
  return (
    <div className="pd-cmp-best">
      <div className="pd-cmp-best-item">
        <Leaf size={22} color="#5EAA28" strokeWidth={1.5} />
        <div>
          <div className="pd-cmp-best-label">Meilleure empreinte carbone</div>
          <div className="pd-cmp-best-name">{bestCarbon.name}</div>
          <div className="pd-cmp-best-val">
            {bestCarbon.total_carbon_kg.toFixed(2)} kg CO₂
          </div>
        </div>
      </div>
      <div className="pd-cmp-best-item">
        <TrendingDown size={22} color="#5EAA28" strokeWidth={1.5} />
        <div>
          <div className="pd-cmp-best-label">Meilleur éco-coût</div>
          <div className="pd-cmp-best-name">{bestEco.name}</div>
          <div className="pd-cmp-best-val">
            €{bestEco.total_eco_cost.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompareBarChart({ data, valueKey, title, format }) {
  const maxVal = Math.max(...data.map((d) => d[valueKey]));
  const bestId = data.reduce((b, d) => (d[valueKey] < b[valueKey] ? d : b)).id;
  return (
    <div className="pd-cmp-section">
      <div className="pd-cmp-section-title">{title}</div>
      {data.map((d) => {
        const pct = maxVal > 0 ? (d[valueKey] / maxVal) * 100 : 0;
        const isBest = d.id === bestId;
        return (
          <div key={d.id} className="pd-cmp-row">
            <span className="pd-cmp-label" title={d.name}>
              {d.name.length > 16 ? d.name.slice(0, 15) + "…" : d.name}
            </span>
            <div className="pd-cmp-track">
              <div
                className={`pd-cmp-bar ${isBest ? "best" : ""}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={`pd-cmp-value ${isBest ? "best" : ""}`}>
              {format(d[valueKey])}
              {isBest && (
                <Star
                  size={12}
                  fill="#f1c40f"
                  color="#f1c40f"
                  style={{ marginLeft: 4 }}
                />
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function CompareStackedChart({ data }) {
  const maxTotal = Math.max(
    ...data.map((d) =>
      Object.values(d.breakdown).filter((v) => v > 0).reduce((a, b) => a + b, 0)
    ),
  );
  const phases = Object.keys(PHASE_COLORS);

  return (
    <div className="pd-cmp-section">
      <div className="pd-cmp-section-title">
        Répartition par phase (éco-coût €)
      </div>
      {data.map((d) => {
        const rowTotal = Object.values(d.breakdown)
          .filter((v) => v > 0)
          .reduce((a, b) => a + b, 0);
        const rowPct = maxTotal > 0 ? (rowTotal / maxTotal) * 100 : 0;
        return (
          <div key={d.id} className="pd-cmp-row">
            <span className="pd-cmp-label" title={d.name}>
              {d.name.length > 16 ? d.name.slice(0, 15) + "…" : d.name}
            </span>
            <div className="pd-cmp-track">
              <div
                style={{
                  width: `${rowPct}%`,
                  display: "flex",
                  height: "100%",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                {phases.map((phase) => {
                  const val = d.breakdown[phase] || 0;
                  if (val <= 0) return null;
                  const segPct = rowTotal > 0 ? (val / rowTotal) * 100 : 0;
                  return (
                    <div
                      key={phase}
                      style={{
                        width: `${segPct}%`,
                        background: PHASE_COLORS[phase],
                        opacity: 0.9,
                        flexShrink: 0,
                      }}
                      title={`${PHASE_LABELS[phase]}: €${val.toFixed(2)}`}
                    />
                  );
                })}
              </div>
            </div>
            <span className="pd-cmp-value">€{rowTotal.toFixed(2)}</span>
          </div>
        );
      })}
      <div className="pd-cmp-legend">
        {Object.entries(PHASE_LABELS).map(([key, label]) => (
          <div key={key} className="pd-cmp-legend-item">
            <div
              className="pd-cmp-legend-dot"
              style={{ background: PHASE_COLORS[key] }}
            />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompareView({ compareData }) {
  if (!compareData || compareData.length === 0) {
    return (
      <div className="pd-cmp-empty">
        <BarChart2 size={36} color="#b2bec3" strokeWidth={1.5} />
        <p>Lancez le calcul sur vos scénarios pour les comparer ici.</p>
      </div>
    );
  }
  if (compareData.length < 2) {
    return (
      <div className="pd-cmp-empty">
        <BarChart2 size={36} color="#b2bec3" strokeWidth={1.5} />
        <p>
          Créez et calculez au moins <strong>2 scénarios</strong> pour afficher
          la comparaison.
        </p>
      </div>
    );
  }
  return (
    <div className="pd-cmp-view">
      <BestBadge data={compareData} />
      <CompareBarChart
        data={compareData}
        valueKey="total_carbon_kg"
        title="Empreinte carbone (kg CO₂)"
        format={(v) => `${v.toFixed(2)} kg`}
      />
      <CompareBarChart
        data={compareData}
        valueKey="total_eco_cost"
        title="Éco-coût total (€)"
        format={(v) => `€${v.toFixed(2)}`}
      />
      <CompareStackedChart data={compareData} />
    </div>
  );
}

/* ── Modals ─────────────────────────────────────────── */
function ProductModal({ product, onSave, onClose }) {
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [scenarioName, setScenarioName] = useState(
    product?.default_scenario_name || "",
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isEdit = !!product;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Le nom du produit est requis");
      return;
    }
    if (!isEdit && !scenarioName.trim()) {
      setError("Le nom du scénario est requis");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const body = {
        name: name.trim(),
        description: description.trim(),
        ...(!isEdit && { scenario_name: scenarioName.trim() }),
      };
      const result = isEdit
        ? await api.put(`/api/products/${product.id}/`, body)
        : await api.post("/api/products/", body);
      if (result.error) setError(result.error);
      else onSave(result);
    } catch {
      setError("Erreur serveur");
    }
    setLoading(false);
  };

  return (
    <div className="pd-modal-overlay" onClick={onClose}>
      <div className="pd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pd-modal-header">
          <h3>{isEdit ? "Modifier le produit" : "Nouveau produit"}</h3>
          <button className="pd-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="pd-modal-field">
            <label>Nom du produit *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Chaise ergonomique"
              autoFocus
            />
          </div>
          <div className="pd-modal-field">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description optionnelle..."
              rows={2}
            />
          </div>
          {!isEdit && (
            <div className="pd-modal-field">
              <label>Nom du scénario par défaut *</label>
              <input
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder="Ex: Scénario de base"
              />
              <span className="pd-modal-hint">
                Un scénario sera automatiquement créé et lié à ce produit.
              </span>
            </div>
          )}
          {isEdit && product.default_scenario_name && (
            <div className="pd-modal-field">
              <label>Scénario par défaut</label>
              <input
                value={product.default_scenario_name}
                readOnly
                style={{ background: "#f8fafb", color: "#636e72" }}
              />
            </div>
          )}
          {error && <p className="pd-modal-error">{error}</p>}
          <div className="pd-modal-actions">
            <button type="button" className="pd-btn-cancel" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="pd-btn-save" disabled={loading}>
              {loading ? "Enregistrement..." : isEdit ? "Modifier" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ScenarioModal({ scenario, onSave, onClose }) {
  const [name, setName] = useState(scenario?.name || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isEdit = !!scenario;

  useEffect(() => {
    setName(scenario?.name || "");
    setError("");
  }, [scenario]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Le nom du scénario est requis");
      return;
    }
    setLoading(true);
    setError("");
    await onSave(name.trim(), scenario);
    setLoading(false);
  };

  return (
    <div className="pd-modal-overlay" onClick={onClose}>
      <div
        className="pd-modal pd-modal-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pd-modal-header">
          <h3>{isEdit ? "Renommer le scénario" : "Nouveau scénario"}</h3>
          <button className="pd-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="pd-modal-field">
            <label>Nom du scénario *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Scénario alternatif"
              autoFocus
            />
            <span className="pd-modal-hint">
              Ce scénario sera lié au produit actif.
            </span>
          </div>
          {error && <p className="pd-modal-error">{error}</p>}
          <div className="pd-modal-actions">
            <button type="button" className="pd-btn-cancel" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="pd-btn-save" disabled={loading}>
              {loading ? "..." : isEdit ? "Modifier" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteModal({ label, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);
  return (
    <div className="pd-modal-overlay pd-modal-overlay-top" onClick={onClose}>
      <div
        className="pd-modal pd-modal-sm pd-modal-top"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pd-modal-header">
          <h3>Confirmer la suppression</h3>
          <button className="pd-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <p className="pd-modal-confirm-text">
          Êtes-vous sûr de vouloir supprimer <strong>«{label}»</strong> ?<br />
          Cette action est irréversible.
        </p>
        <div className="pd-modal-actions">
          <button className="pd-btn-cancel" onClick={onClose}>
            Annuler
          </button>
          <button
            className="pd-btn-delete"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              await onConfirm();
              setLoading(false);
            }}
          >
            {loading ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Form row components ────────────────────────────── */
function MaterialRow({ item, onUpdate, onRemove }) {
  const subtypes = useFetch("/api/materials/subtypes/");
  const materials = useFetch(
    item.subtype
      ? `/api/materials/by-subtype/?subtype=${encodeURIComponent(item.subtype)}`
      : "",
  );
  return (
    <div className="pd-form-row">
      <div className="pd-field">
        <label>Catégorie</label>
        <select
          value={item.subtype}
          onChange={(e) => {
            onUpdate(item.id, "subtype", e.target.value);
            onUpdate(item.id, "material_id", "");
            onUpdate(item.id, "unit", "");
          }}
        >
          <option value="">-- Sélectionner --</option>
          {subtypes.map((s, i) => (
            <option key={i} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="pd-field">
        <label>Matériau</label>
        <select
          value={item.material_id}
          disabled={!item.subtype}
          onChange={(e) => {
            const m = materials.find((m) => m.id === parseInt(e.target.value));
            onUpdate(item.id, "material_id", parseInt(e.target.value));
            onUpdate(item.id, "unit", m?.unit || "");
          }}
        >
          <option value="">-- Sélectionner --</option>
          {materials.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      <div className="pd-field field-sm">
        <label>Poids</label>
        <input
          type="number"
          placeholder="0"
          value={item.weight}
          onChange={(e) => onUpdate(item.id, "weight", e.target.value)}
        />
      </div>
      <div className="pd-field field-xs">
        <label>Unité</label>
        <input value={item.unit} readOnly placeholder="—" />
      </div>
      <button className="pd-delete-btn" onClick={() => onRemove(item.id)}>
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function TransportRow({ item, onUpdate, onRemove }) {
  const subtypes = useFetch("/api/transport/subtypes/");
  const transports = useFetch(
    item.subtype
      ? `/api/transport/by-subtype/?subtype=${encodeURIComponent(item.subtype)}`
      : "",
  );
  return (
    <div className="pd-form-row">
      <div className="pd-field">
        <label>Catégorie</label>
        <select
          value={item.subtype}
          onChange={(e) => {
            onUpdate(item.id, "subtype", e.target.value);
            onUpdate(item.id, "transport_id", "");
            onUpdate(item.id, "unit", "");
          }}
        >
          <option value="">-- Sélectionner --</option>
          {subtypes.map((s, i) => (
            <option key={i} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="pd-field">
        <label>Moyen</label>
        <select
          value={item.transport_id}
          disabled={!item.subtype}
          onChange={(e) => {
            const t = transports.find((t) => t.id === parseInt(e.target.value));
            onUpdate(item.id, "transport_id", parseInt(e.target.value));
            onUpdate(item.id, "unit", t?.unit || "");
          }}
        >
          <option value="">-- Sélectionner --</option>
          {transports.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div className="pd-field field-sm">
        <label>Poids</label>
        <input
          type="number"
          placeholder="0"
          value={item.weight}
          onChange={(e) => onUpdate(item.id, "weight", e.target.value)}
        />
      </div>
      <div className="pd-field field-sm">
        <label>Distance</label>
        <input
          type="number"
          placeholder="0"
          value={item.distance}
          onChange={(e) => onUpdate(item.id, "distance", e.target.value)}
        />
      </div>
      <div className="pd-field field-xs">
        <label>Unité</label>
        <input value={item.unit} readOnly placeholder="—" />
      </div>
      <button className="pd-delete-btn" onClick={() => onRemove(item.id)}>
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function EnergyRow({ item, onUpdate, onRemove }) {
  const subtypes = useFetch("/api/energy/subtypes/");
  const energies = useFetch(
    item.subtype
      ? `/api/energy/by-subtype/?subtype=${encodeURIComponent(item.subtype)}`
      : "",
  );
  return (
    <div className="pd-form-row">
      <div className="pd-field">
        <label>Catégorie</label>
        <select
          value={item.subtype}
          onChange={(e) => {
            onUpdate(item.id, "subtype", e.target.value);
            onUpdate(item.id, "energy_id", "");
            onUpdate(item.id, "unit", "");
          }}
        >
          <option value="">-- Sélectionner --</option>
          {subtypes.map((s, i) => (
            <option key={i} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="pd-field">
        <label>Énergie</label>
        <select
          value={item.energy_id}
          disabled={!item.subtype}
          onChange={(e) => {
            const en = energies.find(
              (en) => en.id === parseInt(e.target.value),
            );
            onUpdate(item.id, "energy_id", parseInt(e.target.value));
            onUpdate(item.id, "unit", en?.unit || "");
          }}
        >
          <option value="">-- Sélectionner --</option>
          {energies.map((en) => (
            <option key={en.id} value={en.id}>
              {en.name}
            </option>
          ))}
        </select>
      </div>
      <div className="pd-field field-sm">
        <label>Quantité</label>
        <input
          type="number"
          placeholder="0"
          value={item.quantity}
          onChange={(e) => onUpdate(item.id, "quantity", e.target.value)}
        />
      </div>
      <div className="pd-field field-xs">
        <label>Unité</label>
        <input value={item.unit} readOnly placeholder="—" />
      </div>
      <button className="pd-delete-btn" onClick={() => onRemove(item.id)}>
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function PackagingRow({ item, onUpdate, onRemove }) {
  const materials = useFetch(
    "/api/materials/by-subtype/?subtype=paper%20%26%20packaging",
  );
  return (
    <div className="pd-form-row">
      <div className="pd-field">
        <label>Matériau</label>
        <select
          value={item.material_id}
          onChange={(e) => {
            const m = materials.find((m) => m.id === parseInt(e.target.value));
            onUpdate(item.id, "material_id", parseInt(e.target.value));
            onUpdate(item.id, "unit", m?.unit || "");
          }}
        >
          <option value="">-- Sélectionner --</option>
          {materials.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      <div className="pd-field field-sm">
        <label>Poids</label>
        <input
          type="number"
          placeholder="0"
          value={item.weight}
          onChange={(e) => onUpdate(item.id, "weight", e.target.value)}
        />
      </div>
      <div className="pd-field field-xs">
        <label>Unité</label>
        <input value={item.unit} readOnly placeholder="—" />
      </div>
      <button className="pd-delete-btn" onClick={() => onRemove(item.id)}>
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function EndOfLifeRow({ item, onUpdate, onRemove }) {
  const subtypes = useFetch("/api/end-of-life/subtypes/");
  const entries = useFetch(
    item.subtype
      ? `/api/end-of-life/by-subtype/?subtype=${encodeURIComponent(item.subtype)}`
      : "",
  );
  return (
    <div className="pd-form-row">
      <div className="pd-field">
        <label>Catégorie</label>
        <select
          value={item.subtype}
          onChange={(e) => {
            onUpdate(item.id, "subtype", e.target.value);
            onUpdate(item.id, "eol_id", "");
            onUpdate(item.id, "unit", "");
          }}
        >
          <option value="">-- Sélectionner --</option>
          {subtypes.map((s, i) => (
            <option key={i} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="pd-field">
        <label>Traitement</label>
        <select
          value={item.eol_id}
          disabled={!item.subtype}
          onChange={(e) => {
            const en = entries.find((en) => en.id === parseInt(e.target.value));
            onUpdate(item.id, "eol_id", parseInt(e.target.value));
            onUpdate(item.id, "unit", en?.unit || "");
          }}
        >
          <option value="">-- Sélectionner --</option>
          {entries.map((en) => (
            <option key={en.id} value={en.id}>{en.name}</option>
          ))}
        </select>
      </div>
      <div className="pd-field field-sm">
        <label>Quantité</label>
        <input
          type="number"
          placeholder="0"
          value={item.quantity}
          onChange={(e) => onUpdate(item.id, "quantity", e.target.value)}
        />
      </div>
      <div className="pd-field field-xs">
        <label>Unité</label>
        <input value={item.unit} readOnly placeholder="—" />
      </div>
      <button className="pd-delete-btn" onClick={() => onRemove(item.id)}>
        <Trash2 size={14} />
      </button>
    </div>
  );
}

/* ── Factories ──────────────────────────────────────── */
const newMaterial = () => ({
  id: Date.now() + Math.random(),
  subtype: "",
  material_id: "",
  weight: "",
  unit: "",
});
const newTransport = () => ({
  id: Date.now() + Math.random(),
  subtype: "",
  transport_id: "",
  weight: "",
  distance: "",
  unit: "",
});
const newEnergy = () => ({
  id: Date.now() + Math.random(),
  subtype: "",
  energy_id: "",
  quantity: "",
  unit: "",
});
const newPackaging = () => ({
  id: Date.now() + Math.random(),
  subtype: "",
  material_id: "",
  weight: "",
  unit: "",
});
const newEndOfLife = () => ({
  id: Date.now() + Math.random(),
  subtype: "",
  eol_id: "",
  quantity: "",
  unit: "",
});

const emptyForm = () => ({
  materials: [newMaterial()],
  transports: [newTransport()],
  energies: [newEnergy()],
  packagings: [newPackaging()],
  end_of_lives: [newEndOfLife()],
});

/* ── Map DB entries back to form rows ───────────────── */
function dbEntriesToForm(entries) {
  const allMaterials = entries.materials || [];
  const regularMaterials = allMaterials.filter((e) => !e.is_packaging);
  const packagingMaterials = allMaterials.filter((e) => e.is_packaging);

  return {
    materials:
      regularMaterials.length > 0
        ? regularMaterials.map((e) => ({
            id: crypto.randomUUID(),
            subtype: e.material__subtype,
            material_id: e.material_id,
            weight: e.quantity,
            unit: e.material__unit,
          }))
        : [newMaterial()],

    packagings:
      packagingMaterials.length > 0
        ? packagingMaterials.map((e) => ({
            id: crypto.randomUUID(),
            subtype: e.material__subtype,
            material_id: e.material_id,
            weight: e.quantity,
            unit: e.material__unit,
          }))
        : [newPackaging()],

    transports:
      entries.transports.length > 0
        ? entries.transports.map((e) => ({
            id: crypto.randomUUID(),
            subtype: e.transport__subtype,
            transport_id: e.transport_id,
            weight: 0,
            distance: e.distance,
            unit: e.transport__unit,
          }))
        : [newTransport()],

    energies:
      entries.energies.length > 0
        ? entries.energies.map((e) => ({
            id: crypto.randomUUID(),
            subtype: e.energy__subtype,
            energy_id: e.energy_id,
            quantity: e.quantity,
            unit: e.energy__unit,
          }))
        : [newEnergy()],

    end_of_lives:
      (entries.end_of_lives || []).length > 0
        ? entries.end_of_lives.map((e) => ({
            id: crypto.randomUUID(),
            subtype: e.end_of_life__subtype,
            eol_id: e.end_of_life_id,
            quantity: e.quantity,
            unit: e.end_of_life__unit,
          }))
        : [newEndOfLife()],
  };
}

/* ── Main component ─────────────────────────────────── */
export default function ProductDescription() {
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [activeProduct, setActiveProduct] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [activeScenario, setActiveScenario] = useState(null);
  const [impactResult, setImpactResult] = useState(null);
  const [compareData, setCompareData] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recoLoading, setRecoLoading] = useState(false);
  const [resultTab, setResultTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [form, setForm] = useState(emptyForm());
  const [limitError, setLimitError] = useState("");
  const [donutMode, setDonutMode] = useState("eco"); // "eco" | "co2"

  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [showCreateScenario, setShowCreateScenario] = useState(false);
  const [editingScenario, setEditingScenario] = useState(null);
  const [scenarioNameInput, setScenarioNameInput] = useState("");
  const [scenarioAddError, setScenarioAddError] = useState("");
  const [deleteScenario, setDeleteScenario] = useState(null);

  /* ── Load products ── */
  const loadProducts = useCallback(async () => {
    const data = await api.get("/api/products/");
    if (!data.error) {
      setProducts(data);
      // Check if we have a selected product from navigation state
      const selectedProductId = location.state?.selectedProductId;
      if (selectedProductId !== undefined && selectedProductId !== null) {
        const selectedProduct = data.find(
          (p) => String(p.id) === String(selectedProductId),
        );
        if (selectedProduct) {
          setActiveProduct(selectedProduct);
          return;
        }
      }
      // Default behavior: select first product
      if (data.length > 0) setActiveProduct((prev) => prev || data[0]);
    }
  }, [location.state]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  /* ── Load scenarios when product changes ── */
  useEffect(() => {
    if (!activeProduct) return;
    api.get(`/api/products/${activeProduct.id}/scenarios/`).then((data) => {
      if (!data.error) {
        setScenarios(data);
        const def = data.find((s) => s.is_default) || data[0];
        setActiveScenario(def || null);
      }
    });
  }, [activeProduct]);

  /* ── Load compare data when tab 1 is active ── */
  useEffect(() => {
    if (resultTab !== 1 || !activeProduct) return;
    api.get(`/api/products/${activeProduct.id}/compare/`).then((data) => {
      if (Array.isArray(data)) setCompareData(data);
    });
  }, [resultTab, activeProduct, impactResult]);

  const handleLoadReco = (force = false) => {
    if (!activeScenario) return;
    setRecoLoading(true);
    const doFetch = () =>
      api.get(`/api/scenarios/${activeScenario.id}/recommendations/`)
        .then((data) => {
          setRecommendations(Array.isArray(data) ? data : []);
          setRecoLoading(false);
        });

    if (force) {
      // Clear cached recommendations so the engine recomputes
      api.delete(`/api/scenarios/${activeScenario.id}/recommendations/`)
        .then(doFetch)
        .catch(doFetch); // even if delete fails, still fetch
    } else {
      doFetch();
    }
  };

  /* ── Load form entries + stored result + stored recommendations when scenario changes ── */
  useEffect(() => {
    if (!activeScenario) {
      setForm(emptyForm());
      setImpactResult(null);
      setRecommendations([]);
      return;
    }
    api.get(`/api/scenarios/${activeScenario.id}/`).then((entries) => {
      if (!entries.error) setForm(dbEntriesToForm(entries));
    });
    api.get(`/api/scenarios/${activeScenario.id}/result/`).then((result) => {
      const hasResult = !result.error;
      setImpactResult(hasResult ? result : null);

      // Auto-load stored recommendations only if scenario has been calculated
      const limits = getPlanLimits();
      if (limits.recommendations && hasResult) {
        setRecoLoading(true);
        api.get(`/api/scenarios/${activeScenario.id}/recommendations/`).then((data) => {
          setRecommendations(Array.isArray(data) ? data : []);
          setRecoLoading(false);
        });
      } else {
        setRecommendations([]);
      }
    });
  }, [activeScenario]);

  /* ── Form helpers ── */
  const add = (key, factory) =>
    setForm((f) => ({ ...f, [key]: [...f[key], factory()] }));
  const remove = (key, id) =>
    setForm((f) => ({ ...f, [key]: f[key].filter((i) => i.id !== id) }));
  const update = (key, id, field, value) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].map((i) => (i.id === id ? { ...i, [field]: value } : i)),
    }));

  /* ── Save & calculate ── */
  const handleCalculate = async () => {
    if (!activeScenario) return;
    setSaving(true);
    setSaveMsg("");

    const allMaterials = [
      ...form.materials
        .filter((m) => m.material_id)
        .map((m) => ({
          material_id: m.material_id,
          quantity: parseFloat(m.weight) || 0,
          is_packaging: false,
        })),
      ...form.packagings
        .filter((m) => m.material_id)
        .map((m) => ({
          material_id: m.material_id,
          quantity: parseFloat(m.weight) || 0,
          is_packaging: true,
        })),
    ];

    const body = {
      materials: allMaterials,
      energies: form.energies
        .filter((e) => e.energy_id)
        .map((e) => ({
          energy_id: e.energy_id,
          quantity: parseFloat(e.quantity) || 0,
        })),
      transports: form.transports
        .filter((t) => t.transport_id)
        .map((t) => ({
          transport_id: t.transport_id,
          distance: parseFloat(t.distance) || 0,
        })),
      productions: [],
      end_of_lives: form.end_of_lives
        .filter((e) => e.eol_id)
        .map((e) => ({
          end_of_life_id: e.eol_id,
          quantity: parseFloat(e.quantity) || 0,
        })),
    };

    const result = await api.post(
      `/api/scenarios/${activeScenario.id}/save/`,
      body,
    );
    if (result.error) {
      setSaveMsg(` ${result.error}`);
    } else {
      setImpactResult(result);
      setSaveMsg(
        ` Calculé: Éco-coût: €${result.total_eco_cost} · CO₂: ${result.total_carbon_kg} kg`,
      );
      // For Pro/Enterprise: clear stale cached recommendations and reload
      const limits = getPlanLimits();
      if (limits.recommendations) {
        setRecoLoading(true);
        setRecommendations([]);
        // Cache was already cleared by scenario_save on the backend.
        // Just re-fetch to trigger fresh KNN computation.
        api.get(`/api/scenarios/${activeScenario.id}/recommendations/`).then((data) => {
          setRecommendations(Array.isArray(data) ? data : []);
          setRecoLoading(false);
        });
      }
    }
    setSaving(false);
  };

  /* ── Product CRUD ── */
  const handleCreateProduct = (p) => {
    const limits = getPlanLimits();
    if (products.length >= limits.maxProducts) {
      setLimitError(`Vous avez atteint la limite de ${limits.maxProducts} produits du plan Gratuit.`);
      setShowCreateProduct(false);
      return;
    }
    setProducts((prev) => [p, ...prev]);
    setActiveProduct(p);
    setShowCreateProduct(false);
    setLimitError("");
  };
  const handleEditProduct = (p) => {
    setProducts((prev) => prev.map((x) => (x.id === p.id ? p : x)));
    setActiveProduct(p);
    setEditProduct(null);
  };
  const handleDeleteProduct = async () => {
    await api.delete(`/api/products/${deleteProduct.id}/`);
    const rest = products.filter((p) => p.id !== deleteProduct.id);
    setProducts(rest);
    setActiveProduct(rest[0] || null);
    setDeleteProduct(null);
  };

  /* ── Scenario CRUD ── */
  const handleCreateScenario = async (name) => {
    if (!name || !name.trim()) {
      setScenarioAddError("Le nom du scénario est requis.");
      return;
    }
    const limits = getPlanLimits();
    if (scenarios.length >= limits.maxScenariosPerProduct) {
      setLimitError(`Vous avez atteint la limite de ${limits.maxScenariosPerProduct} scénarios par produit du plan Gratuit.`);
      if (showCreateScenario) setShowCreateScenario(false);
      return;
    }
    setScenarioAddError("");
    setLimitError("");
    const s = await api.post(`/api/products/${activeProduct.id}/scenarios/`, { name });
    if (s.error === "plan_limit") {
      setLimitError(s.detail);
      return;
    }
    if (!s.error) {
      setScenarios((prev) => [...prev, s]);
      setActiveScenario(s);
      setScenarioNameInput("");
    }
    if (showCreateScenario) setShowCreateScenario(false);
  };

  const handleOpenEditScenario = (scenario) => {
    setEditingScenario(scenario);
    setShowCreateScenario(true);
  };

  const closeScenarioModal = () => {
    setShowCreateScenario(false);
    setEditingScenario(null);
  };

  const handleSaveScenario = async (name, scenario) => {
    if (scenario) {
      const result = await api.put(`/api/scenarios/${scenario.id}/`, { name });
      if (!result.error) {
        setScenarios((prev) =>
          prev.map((s) => (s.id === scenario.id ? result : s)),
        );
        setActiveScenario((prev) =>
          prev?.id === scenario.id ? { ...prev, name: result.name } : prev,
        );
        setEditingScenario(null);
        setShowCreateScenario(false);
      }
      return;
    }

    await handleCreateScenario(name);
  };

  const handleSetDefaultScenario = async (scenario) => {
    if (!activeProduct) return;
    const result = await api.put(`/api/products/${activeProduct.id}/`, {
      default_scenario: scenario.id,
    });
    if (!result.error) {
      setProducts((prev) =>
        prev.map((p) => (p.id === activeProduct.id ? result : p)),
      );
      setActiveProduct((prev) =>
        prev && prev.id === activeProduct.id ? { ...prev, ...result } : prev,
      );
      setScenarios((prev) =>
        prev.map((s) => ({ ...s, is_default: s.id === scenario.id })),
      );
      setActiveScenario(scenario);
    }
  };

  const handleDeleteScenario = async () => {
    await api.delete(`/api/scenarios/${deleteScenario.id}/`);
    const rest = scenarios.filter((s) => s.id !== deleteScenario.id);
    setScenarios(rest);
    setActiveScenario(rest.find((s) => s.is_default) || rest[0] || null);
    setDeleteScenario(null);
  };

  /* ── Render ── */
  return (
    <div className="pd-page">
      {/* ── Plan limit banner ── */}
      {limitError && (
        <div className="pd-limit-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>{limitError}</span>
          <button className="pd-limit-upgrade" onClick={() => navigate("/pricing")}>
            Passer au Pro →
          </button>
          <button className="pd-limit-close" onClick={() => setLimitError("")}>×</button>
        </div>
      )}

      {/* ── Product tabs ── */}
      <div className="pd-tabs-bar">
        <div className="pd-tabs">
          {products.map((p) => (
            <button
              key={p.id}
              className={`pd-tab ${activeProduct?.id === p.id ? "active" : ""}`}
              onClick={() => setActiveProduct(p)}
            >
              {p.name}
              <span className="pd-tab-actions">
                <span
                  className="pd-tab-edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditProduct(p);
                  }}
                >
                  ✏
                </span>
                <span
                  className="pd-tab-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteProduct(p);
                  }}
                >
                  <X size={11} />
                </span>
              </span>
            </button>
          ))}
          <button
            className="pd-tab-add"
            onClick={() => {
              const limits = getPlanLimits();
              if (products.length >= limits.maxProducts) {
                setLimitError(`Vous avez atteint la limite de ${limits.maxProducts} produits du plan Gratuit.`);
                return;
              }
              setShowCreateProduct(true);
            }}
          >
            + Nouveau produit
          </button>
        </div>
      </div>

      {/* ── Empty state ── */}
      {!activeProduct ? (
        <div className="pd-empty">
          <div className="pd-empty-icon">📦</div>
          <h3>Aucun produit</h3>
          <p>Créez votre premier produit pour commencer l'analyse ACV.</p>
          <button
            className="pd-btn-save"
            onClick={() => setShowCreateProduct(true)}
          >
            + Créer un produit
          </button>
        </div>
      ) : (
        /* ── Two columns ── */
        <div className="pd-columns">
          {/* ══ LEFT ══ */}
          <div className="pd-left">
            <div className="pd-product-header">
              <div>
                <h2>{activeProduct.name}</h2>
                {activeProduct.description && (
                  <p className="pd-product-desc">{activeProduct.description}</p>
                )}
              </div>
              <div className="pd-product-actions">
                <button
                  className="pd-btn-icon"
                  onClick={() => setEditProduct(activeProduct)}
                >
                  ✏ Modifier
                </button>
                <button
                  className="pd-btn-icon pd-btn-icon-danger"
                  onClick={() => setDeleteProduct(activeProduct)}
                >
                  <Trash2 size={13} /> Supprimer
                </button>
                <button className="pd-guide-btn">
                  Guide d'utilisation ACV
                </button>
              </div>
            </div>

            <div className="pd-outer-card">
              {/* Matières premières */}
              <div className="pd-section">
                <div className="pd-section-header">
                  <div>
                    <p className="pd-section-title">Matières premières</p>
                    <p className="pd-section-desc">
                      Matériaux utilisés dans la fabrication.
                    </p>
                  </div>
                  <button
                    className="pd-add-btn"
                    onClick={() => add("materials", newMaterial)}
                  >
                    + Ajouter
                  </button>
                </div>
                {form.materials.map((item) => (
                  <MaterialRow
                    key={item.id}
                    item={item}
                    onUpdate={(id, f, v) => update("materials", id, f, v)}
                    onRemove={(id) => remove("materials", id)}
                  />
                ))}
              </div>

              {/* Transportation */}
              <div className="pd-section">
                <div className="pd-section-header">
                  <div>
                    <p className="pd-section-title">Transportation</p>
                    <p className="pd-section-desc">
                      Moyens de transport et distances.
                    </p>
                  </div>
                  <button
                    className="pd-add-btn"
                    onClick={() => add("transports", newTransport)}
                  >
                    + Ajouter
                  </button>
                </div>
                {form.transports.map((item) => (
                  <TransportRow
                    key={item.id}
                    item={item}
                    onUpdate={(id, f, v) => update("transports", id, f, v)}
                    onRemove={(id) => remove("transports", id)}
                  />
                ))}
              </div>

              {/* Énergie */}
              <div className="pd-section">
                <div className="pd-section-header">
                  <div>
                    <p className="pd-section-title">Énergie</p>
                    <p className="pd-section-desc">
                      Énergies utilisées dans la fabrication.
                    </p>
                  </div>
                  <button
                    className="pd-add-btn"
                    onClick={() => add("energies", newEnergy)}
                  >
                    + Ajouter
                  </button>
                </div>
                {form.energies.map((item) => (
                  <EnergyRow
                    key={item.id}
                    item={item}
                    onUpdate={(id, f, v) => update("energies", id, f, v)}
                    onRemove={(id) => remove("energies", id)}
                  />
                ))}
              </div>

              {/* Packaging */}
              <div className="pd-section">
                <div className="pd-section-header">
                  <div>
                    <p className="pd-section-title">Packaging</p>
                    <p className="pd-section-desc">
                      Matériaux d'emballage utilisés.
                    </p>
                  </div>
                  <button
                    className="pd-add-btn"
                    onClick={() => add("packagings", newPackaging)}
                  >
                    + Ajouter
                  </button>
                </div>
                {form.packagings.map((item) => (
                  <PackagingRow
                    key={item.id}
                    item={item}
                    onUpdate={(id, f, v) => update("packagings", id, f, v)}
                    onRemove={(id) => remove("packagings", id)}
                  />
                ))}
              </div>

              {/* Fin de vie */}
              <div className="pd-section">
                <div className="pd-section-header">
                  <div>
                    <p className="pd-section-title">Fin de vie</p>
                    <p className="pd-section-desc">
                      Traitements de fin de vie (recyclage, incinération, enfouissement…).
                    </p>
                  </div>
                  <button
                    className="pd-add-btn"
                    onClick={() => add("end_of_lives", newEndOfLife)}
                  >
                    + Ajouter
                  </button>
                </div>
                {form.end_of_lives.map((item) => (
                  <EndOfLifeRow
                    key={item.id}
                    item={item}
                    onUpdate={(id, f, v) => update("end_of_lives", id, f, v)}
                    onRemove={(id) => remove("end_of_lives", id)}
                  />
                ))}
              </div>
            </div>

            {saveMsg && <div className="pd-save-msg">{saveMsg}</div>}

            <button
              className="pd-calc-btn"
              onClick={handleCalculate}
              disabled={saving || !activeScenario}
            >
              {saving ? "Calcul en cours..." : "Commencez le calcul !"}
            </button>
          </div>
          {/* ══ END LEFT ══ */}

          {/* ══ RIGHT ══ */}
          <div className="pd-right">
            <h2>Résultats</h2>

            {/* Results card */}
            <div className="pd-results-card">
              <div className="pd-result-tabs">
                {["Analyse d'impact", "Comparer les scénarios"].map((t, i) => (
                  <button
                    key={i}
                    className={`pd-result-tab ${resultTab === i ? "active" : ""}`}
                    onClick={() => setResultTab(i)}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {resultTab === 0 && (
                <>
                  <div className="pd-chart-header">
                    <span className="pd-chart-title">Impact par phase</span>
                    <div className="pd-donut-toggle">
                      <button
                        className={`pd-donut-toggle-btn ${donutMode === "eco" ? "active" : ""}`}
                        onClick={() => setDonutMode("eco")}
                      >
                        Éco-coût
                      </button>
                      <button
                        className={`pd-donut-toggle-btn ${donutMode === "co2" ? "active" : ""}`}
                        onClick={() => setDonutMode("co2")}
                      >
                        CO₂
                      </button>
                    </div>
                  </div>

                  <DonutChart result={impactResult} mode={donutMode} />

                  {impactResult?.breakdown && (
                    <div className="pd-legend">
                      {(() => {
                        const activeBreakdown = donutMode === "co2"
                          ? (impactResult.carbon_breakdown || impactResult.breakdown)
                          : impactResult.breakdown;
                        const absSum = Object.values(activeBreakdown)
                          .reduce((s, v) => s + Math.abs(v), 0);
                        return Object.entries(activeBreakdown)
                          .filter(([_, v]) => v !== 0)
                          .map(([key, value]) => {
                            const pct = absSum > 0
                              ? ((Math.abs(value) / absSum) * 100).toFixed(1)
                              : 0;
                            const isCredit = value < 0;
                            return (
                              <div key={key} className="pd-legend-item">
                                <div
                                  className="pd-legend-dot"
                                  style={{
                                    background: PHASE_COLORS[key],
                                    opacity: isCredit ? 0.5 : 1,
                                  }}
                                />
                                <span className="pd-legend-label">
                                  {PHASE_LABELS[key]}
                                  {isCredit && <span style={{ fontSize: 9, color: "#4a90c4", marginLeft: 4 }}>crédit</span>}
                                </span>
                                <span className="pd-legend-value" style={{ color: isCredit ? "#4a90c4" : undefined }}>
                                  {donutMode === "co2"
                                    ? `${value.toFixed(3)} kg`
                                    : `€${value.toFixed(2)}`} ({pct}%)
                                </span>
                              </div>
                            );
                          });
                      })()}
                    </div>
                  )}

                  {impactResult && (
                    <div className="pd-impact-summary">
                      <div className="pd-impact-item">
                        <span className="pd-impact-label">Éco-coût total</span>
                        <span className={`pd-impact-value ${impactResult.total_eco_cost < 0 ? "credit" : "green"}`}>
                          €{impactResult.total_eco_cost.toFixed(2)}
                          {impactResult.total_eco_cost < 0 && (
                            <span className="pd-impact-credit-badge" title="Le traitement de fin de vie génère un crédit environnemental net">crédit</span>
                          )}
                        </span>
                      </div>
                      <div className="pd-impact-item">
                        <span className="pd-impact-label">Empreinte carbone</span>
                        <span className={`pd-impact-value ${impactResult.total_carbon_kg < 0 ? "credit" : "blue"}`}>
                          {impactResult.total_carbon_kg.toFixed(2)} kg CO₂
                          {impactResult.total_carbon_kg < 0 && (
                            <span className="pd-impact-credit-badge" title="Le traitement de fin de vie compense les émissions de production">crédit</span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {resultTab === 1 && <CompareView compareData={compareData} />}
            </div>
            {/* END results card */}

            {/* ══ Recommendations panel ══ */}
            {impactResult && (
              getPlanLimits().recommendations ? (
                <div className="pd-reco-card">
                  <div className="pd-reco-header">
                    <div>
                      <h3 className="pd-reco-title">Recommandations IA</h3>
                      <p className="pd-reco-subtitle">
                        Analyse KNN sur <strong>{activeScenario?.name}</strong> —
                        suggestions d'optimisation par phase
                      </p>
                    </div>
                    {recoLoading ? (
                      <div className="pd-reco-spinner-inline" />
                    ) : (
                      <button
                        className="pd-reco-btn"
                        onClick={() => handleLoadReco(recommendations.length > 0)}
                      >
                        {recommendations.length > 0 ? (
                          <>
                            <RefreshCw size={13} /> Réanalyser
                          </>
                        ) : (
                          <>
                            <Search size={13} /> Voir les recommandations
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  {(recoLoading || recommendations.length > 0) && (
                    <RecommendationsPanel
                      recommendations={recommendations}
                      loading={recoLoading}
                    />
                  )}
                </div>
              ) : (
                <div className="pd-reco-card pd-reco-locked">
                  <div className="pd-reco-locked-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                      width="28" height="28">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <div className="pd-reco-locked-body">
                    <h3 className="pd-reco-title">Recommandations IA</h3>
                    <p className="pd-reco-subtitle">
                      Les suggestions d'optimisation par phase sont réservées au plan Pro.
                    </p>
                    <button className="pd-reco-upgrade-btn" onClick={() => navigate("/pricing")}>
                      Passer au Pro →
                    </button>
                  </div>
                </div>
              )
            )}
            {/* END recommendations panel */}

            {/* Scenario panel */}
            <div className="pd-scenario-panel">
              <div className="pd-scenario-panel-header">
                <h3>Scénarios</h3>
                <button
                  className="pd-add-btn"
                  onClick={() => {
                    setEditingScenario(null);
                    setShowCreateScenario(true);
                  }}
                >
                  + Nouveau scénario
                </button>
              </div>
              <p className="pd-scenario-panel-desc">
                Chaque scénario représente une configuration ACV différente pour{" "}
                <strong>{activeProduct.name}</strong>.
              </p>
              <div className="pd-scenario-add-row">
                <input
                  type="text"
                  value={scenarioNameInput}
                  onChange={(e) => {
                    setScenarioNameInput(e.target.value);
                    setScenarioAddError("");
                  }}
                  placeholder="Ajouter un scénario"
                />
                <button
                  type="button"
                  className="pd-btn-save"
                  onClick={() => handleCreateScenario(scenarioNameInput.trim())}
                >
                  Ajouter
                </button>
              </div>
              {scenarioAddError && (
                <p className="pd-scenario-error">{scenarioAddError}</p>
              )}
              <div className="pd-scenario-list">
                {scenarios.map((s) => (
                  <div
                    key={s.id}
                    className={`pd-scenario-item ${activeScenario?.id === s.id ? "active" : ""}`}
                    onClick={() => setActiveScenario(s)}
                  >
                    <div className="pd-scenario-item-left">
                      <span className="pd-scenario-icon">
                        <Folder size={16} color="#636e72" />
                      </span>
                      <div>
                        <span className="pd-scenario-name">{s.name}</span>
                        {s.is_default && (
                          <span className="pd-scenario-badge">Par défaut</span>
                        )}
                      </div>
                    </div>
                    <div className="pd-scenario-item-actions">
                      {!s.is_default && (
                        <button
                          className="pd-scenario-action"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetDefaultScenario(s);
                          }}
                        >
                          Définir par défaut
                        </button>
                      )}
                      <button
                        className="pd-scenario-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditScenario(s);
                        }}
                      >
                        Modifier
                      </button>
                      {!s.is_default && (
                        <button
                          className="pd-scenario-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteScenario(s);
                          }}
                          title="Supprimer ce scénario"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {scenarios.length === 0 && (
                  <p className="pd-scenario-empty">Aucun scénario trouvé.</p>
                )}
              </div>
            </div>
            {/* END scenario panel */}
          </div>
          {/* ══ END RIGHT ══ */}
        </div>
        /* END pd-columns */
      )}
      {/* END ternary */}

      {/* ── Modals ── */}
      {showCreateProduct && (
        <ProductModal
          onSave={handleCreateProduct}
          onClose={() => setShowCreateProduct(false)}
        />
      )}
      {editProduct && (
        <ProductModal
          product={editProduct}
          onSave={handleEditProduct}
          onClose={() => setEditProduct(null)}
        />
      )}
      {deleteProduct && (
        <DeleteModal
          label={deleteProduct.name}
          onConfirm={handleDeleteProduct}
          onClose={() => setDeleteProduct(null)}
        />
      )}
      {(showCreateScenario || editingScenario) && (
        <ScenarioModal
          scenario={editingScenario}
          onSave={handleSaveScenario}
          onClose={closeScenarioModal}
        />
      )}
      {deleteScenario && (
        <DeleteModal
          label={deleteScenario.name}
          onConfirm={handleDeleteScenario}
          onClose={() => setDeleteScenario(null)}
        />
      )}
    </div>
    /* END pd-page */
  );
}
