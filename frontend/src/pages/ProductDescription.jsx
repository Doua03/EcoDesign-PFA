import { useState, useEffect, useCallback } from "react";
import "./ProductDescription.css";

/* ── API helpers ────────────────────────────────────── */
function useFetch(url) {
  const [data, setData] = useState([]);
  useEffect(() => {
    if (!url) return;
    fetch(url, { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(setData)
      .catch(err => console.error(`[useFetch] ✗ ${url}:`, err));
  }, [url]);
  return data;
}

const api = {
  get:    url      => fetch(url, { credentials: 'include' }).then(r => r.json()),
  post:   (url, b) => fetch(url, { method: 'POST',   credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }).then(r => r.json()),
  put:    (url, b) => fetch(url, { method: 'PUT',    credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }).then(r => r.json()),
  delete: url      => fetch(url, { method: 'DELETE', credentials: 'include' }).then(r => r.json()),
};

/* ── Phase colors & labels ──────────────────────────── */
const PHASE_COLORS = {
  materiaux:  "#2ecc71",
  transport:  "#fd79a8",
  energie:    "#74b9ff",
  production: "#a29bfe",
  fin_de_vie: "#ffeaa7",
};

const PHASE_LABELS = {
  materiaux:  "Matières premières",
  transport:  "Transport",
  energie:    "Énergie",
  production: "Production",
  fin_de_vie: "Fin de vie",
};

/* ── Donut chart ────────────────────────────────────── */
function DonutChart({ result }) {
  const r = 70, cx = 90, cy = 90, stroke = 28;
  const circ = 2 * Math.PI * r;

  if (!result) {
    return (
      <div className="pd-donut-wrapper">
        <div className="pd-donut-empty">
          <span>🌿</span>
          <p>Lancez le calcul pour voir les résultats</p>
        </div>
      </div>
    );
  }

  const total = result.total_eco_cost;
  const breakdown = result.breakdown || {};
  const segments = Object.entries(breakdown)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      key,
      label: PHASE_LABELS[key],
      color: PHASE_COLORS[key],
      value,
      pct: total > 0 ? (value / total) * 100 : 0,
    }));

  if (segments.length === 0) {
    return (
      <div className="pd-donut-wrapper">
        <svg className="pd-donut-svg" viewBox="0 0 180 180">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f2f6" strokeWidth={stroke} />
        </svg>
        <div className="pd-donut-center">
          <span className="pd-donut-value">€0</span>
          <span className="pd-donut-label">Éco-coût total</span>
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
          const dash   = (s.pct / 100) * circ;
          const gap    = circ - dash;
          const rotate = (cumulativePct / 100) * 360 - 90;
          cumulativePct += s.pct;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={s.color} strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`}
              transform={`rotate(${rotate} ${cx} ${cy})`}
              style={{ transition: 'all 0.5s ease' }}
            />
          );
        })}
      </svg>
      <div className="pd-donut-center">
        <span className="pd-donut-value">€{total.toFixed(2)}</span>
        <span className="pd-donut-label">Éco-coût total</span>
      </div>
    </div>
  );
}

/* ── Modals ─────────────────────────────────────────── */
function ProductModal({ product, onSave, onClose }) {
  const [name,         setName]         = useState(product?.name || '');
  const [description,  setDescription]  = useState(product?.description || '');
  const [scenarioName, setScenarioName] = useState(product?.default_scenario_name || '');
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const isEdit = !!product;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Le nom du produit est requis'); return; }
    if (!isEdit && !scenarioName.trim()) { setError('Le nom du scénario est requis'); return; }
    setLoading(true); setError('');
    try {
      const body = { name: name.trim(), description: description.trim(), ...(!isEdit && { scenario_name: scenarioName.trim() }) };
      const result = isEdit
        ? await api.put(`/api/products/${product.id}/`, body)
        : await api.post('/api/products/', body);
      if (result.error) setError(result.error);
      else onSave(result);
    } catch { setError('Erreur serveur'); }
    setLoading(false);
  };

  return (
    <div className="pd-modal-overlay" onClick={onClose}>
      <div className="pd-modal" onClick={e => e.stopPropagation()}>
        <div className="pd-modal-header">
          <h3>{isEdit ? 'Modifier le produit' : 'Nouveau produit'}</h3>
          <button className="pd-modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="pd-modal-field">
            <label>Nom du produit *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Chaise ergonomique" autoFocus />
          </div>
          <div className="pd-modal-field">
            <label>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description optionnelle..." rows={2} />
          </div>
          {!isEdit && (
            <div className="pd-modal-field">
              <label>Nom du scénario par défaut *</label>
              <input value={scenarioName} onChange={e => setScenarioName(e.target.value)} placeholder="Ex: Scénario de base" />
              <span className="pd-modal-hint">Un scénario sera automatiquement créé et lié à ce produit.</span>
            </div>
          )}
          {isEdit && product.default_scenario_name && (
            <div className="pd-modal-field">
              <label>Scénario par défaut</label>
              <input value={product.default_scenario_name} readOnly style={{ background: '#f8fafb', color: '#636e72' }} />
            </div>
          )}
          {error && <p className="pd-modal-error">{error}</p>}
          <div className="pd-modal-actions">
            <button type="button" className="pd-btn-cancel" onClick={onClose}>Annuler</button>
            <button type="submit" className="pd-btn-save" disabled={loading}>
              {loading ? 'Enregistrement...' : (isEdit ? 'Modifier' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ScenarioModal({ onSave, onClose }) {
  const [name,    setName]    = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Le nom du scénario est requis'); return; }
    setLoading(true); setError('');
    onSave(name.trim());
    setLoading(false);
  };

  return (
    <div className="pd-modal-overlay" onClick={onClose}>
      <div className="pd-modal pd-modal-sm" onClick={e => e.stopPropagation()}>
        <div className="pd-modal-header">
          <h3>Nouveau scénario</h3>
          <button className="pd-modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="pd-modal-field">
            <label>Nom du scénario *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Scénario alternatif" autoFocus />
            <span className="pd-modal-hint">Ce scénario sera lié au produit actif.</span>
          </div>
          {error && <p className="pd-modal-error">{error}</p>}
          <div className="pd-modal-actions">
            <button type="button" className="pd-btn-cancel" onClick={onClose}>Annuler</button>
            <button type="submit" className="pd-btn-save" disabled={loading}>{loading ? '...' : 'Créer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteModal({ label, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);
  return (
    <div className="pd-modal-overlay" onClick={onClose}>
      <div className="pd-modal pd-modal-sm" onClick={e => e.stopPropagation()}>
        <div className="pd-modal-header">
          <h3>Confirmer la suppression</h3>
          <button className="pd-modal-close" onClick={onClose}>✕</button>
        </div>
        <p className="pd-modal-confirm-text">
          Êtes-vous sûr de vouloir supprimer <strong>«{label}»</strong> ?<br />
          Cette action est irréversible.
        </p>
        <div className="pd-modal-actions">
          <button className="pd-btn-cancel" onClick={onClose}>Annuler</button>
          <button className="pd-btn-delete" disabled={loading}
            onClick={async () => { setLoading(true); await onConfirm(); setLoading(false); }}>
            {loading ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Form row components ────────────────────────────── */
function MaterialRow({ item, onUpdate, onRemove }) {
  const subtypes  = useFetch("/api/materials/subtypes/");
  const materials = useFetch(item.subtype ? `/api/materials/by-subtype/?subtype=${encodeURIComponent(item.subtype)}` : "");
  return (
    <div className="pd-form-row">
      <div className="pd-field">
        <label>Catégorie</label>
        <select value={item.subtype} onChange={e => { onUpdate(item.id, "subtype", e.target.value); onUpdate(item.id, "material_id", ""); onUpdate(item.id, "unit", ""); }}>
          <option value="">-- Sélectionner --</option>
          {subtypes.map((s, i) => <option key={i} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="pd-field">
        <label>Matériau</label>
        <select value={item.material_id} disabled={!item.subtype}
          onChange={e => { const m = materials.find(m => m.id === parseInt(e.target.value)); onUpdate(item.id, "material_id", parseInt(e.target.value)); onUpdate(item.id, "unit", m?.unit || ""); }}>
          <option value="">-- Sélectionner --</option>
          {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
      <div className="pd-field field-sm">
        <label>Poids</label>
        <input type="number" placeholder="0" value={item.weight} onChange={e => onUpdate(item.id, "weight", e.target.value)} />
      </div>
      <div className="pd-field field-xs">
        <label>Unité</label>
        <input value={item.unit} readOnly placeholder="—" />
      </div>
      <button className="pd-delete-btn" onClick={() => onRemove(item.id)}>🗑</button>
    </div>
  );
}

function TransportRow({ item, onUpdate, onRemove }) {
  const subtypes   = useFetch("/api/transport/subtypes/");
  const transports = useFetch(item.subtype ? `/api/transport/by-subtype/?subtype=${encodeURIComponent(item.subtype)}` : "");
  return (
    <div className="pd-form-row">
      <div className="pd-field">
        <label>Catégorie</label>
        <select value={item.subtype} onChange={e => { onUpdate(item.id, "subtype", e.target.value); onUpdate(item.id, "transport_id", ""); onUpdate(item.id, "unit", ""); }}>
          <option value="">-- Sélectionner --</option>
          {subtypes.map((s, i) => <option key={i} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="pd-field">
        <label>Moyen</label>
        <select value={item.transport_id} disabled={!item.subtype}
          onChange={e => { const t = transports.find(t => t.id === parseInt(e.target.value)); onUpdate(item.id, "transport_id", parseInt(e.target.value)); onUpdate(item.id, "unit", t?.unit || ""); }}>
          <option value="">-- Sélectionner --</option>
          {transports.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div className="pd-field field-sm">
        <label>Poids</label>
        <input type="number" placeholder="0" value={item.weight} onChange={e => onUpdate(item.id, "weight", e.target.value)} />
      </div>
      <div className="pd-field field-sm">
        <label>Distance</label>
        <input type="number" placeholder="0" value={item.distance} onChange={e => onUpdate(item.id, "distance", e.target.value)} />
      </div>
      <div className="pd-field field-xs">
        <label>Unité</label>
        <input value={item.unit} readOnly placeholder="—" />
      </div>
      <button className="pd-delete-btn" onClick={() => onRemove(item.id)}>🗑</button>
    </div>
  );
}

function EnergyRow({ item, onUpdate, onRemove }) {
  const subtypes = useFetch("/api/energy/subtypes/");
  const energies = useFetch(item.subtype ? `/api/energy/by-subtype/?subtype=${encodeURIComponent(item.subtype)}` : "");
  return (
    <div className="pd-form-row">
      <div className="pd-field">
        <label>Catégorie</label>
        <select value={item.subtype} onChange={e => { onUpdate(item.id, "subtype", e.target.value); onUpdate(item.id, "energy_id", ""); onUpdate(item.id, "unit", ""); }}>
          <option value="">-- Sélectionner --</option>
          {subtypes.map((s, i) => <option key={i} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="pd-field">
        <label>Énergie</label>
        <select value={item.energy_id} disabled={!item.subtype}
          onChange={e => { const en = energies.find(en => en.id === parseInt(e.target.value)); onUpdate(item.id, "energy_id", parseInt(e.target.value)); onUpdate(item.id, "unit", en?.unit || ""); }}>
          <option value="">-- Sélectionner --</option>
          {energies.map(en => <option key={en.id} value={en.id}>{en.name}</option>)}
        </select>
      </div>
      <div className="pd-field field-sm">
        <label>Quantité</label>
        <input type="number" placeholder="0" value={item.quantity} onChange={e => onUpdate(item.id, "quantity", e.target.value)} />
      </div>
      <div className="pd-field field-xs">
        <label>Unité</label>
        <input value={item.unit} readOnly placeholder="—" />
      </div>
      <button className="pd-delete-btn" onClick={() => onRemove(item.id)}>🗑</button>
    </div>
  );
}

function PackagingRow({ item, onUpdate, onRemove }) {
  const materials = useFetch("/api/materials/by-subtype/?subtype=paper%20%26%20packaging");
  return (
    <div className="pd-form-row">
      <div className="pd-field">
        <label>Matériau</label>
        <select value={item.material_id}
          onChange={e => { const m = materials.find(m => m.id === parseInt(e.target.value)); onUpdate(item.id, "material_id", parseInt(e.target.value)); onUpdate(item.id, "unit", m?.unit || ""); }}>
          <option value="">-- Sélectionner --</option>
          {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
      <div className="pd-field field-sm">
        <label>Poids</label>
        <input type="number" placeholder="0" value={item.weight} onChange={e => onUpdate(item.id, "weight", e.target.value)} />
      </div>
      <div className="pd-field field-xs">
        <label>Unité</label>
        <input value={item.unit} readOnly placeholder="—" />
      </div>
      <button className="pd-delete-btn" onClick={() => onRemove(item.id)}>🗑</button>
    </div>
  );
}

/* ── Factories ──────────────────────────────────────── */
const newMaterial  = () => ({ id: Date.now() + Math.random(), subtype: "", material_id:  "", weight: "",   unit: "" });
const newTransport = () => ({ id: Date.now() + Math.random(), subtype: "", transport_id: "", weight: "",   distance: "", unit: "" });
const newEnergy    = () => ({ id: Date.now() + Math.random(), subtype: "", energy_id:    "", quantity: "", unit: "" });
const newPackaging = () => ({ id: Date.now() + Math.random(), subtype: "", material_id:  "", weight: "",   unit: "" });

const emptyForm = () => ({
  materials:  [newMaterial()],
  transports: [newTransport()],
  energies:   [newEnergy()],
  packagings: [newPackaging()],
});

/* ── Map DB entries back to form rows ───────────────── */
function dbEntriesToForm(entries) {
  const allMaterials     = entries.materials || [];
  const regularMaterials = allMaterials.filter(e => !e.is_packaging);
  const packagingMaterials = allMaterials.filter(e => e.is_packaging);

  return {
    materials: regularMaterials.length > 0
      ? regularMaterials.map(e => ({ id: crypto.randomUUID(), subtype: e.material__subtype, material_id: e.material_id, weight: e.quantity, unit: e.material__unit }))
      : [newMaterial()],

    packagings: packagingMaterials.length > 0
      ? packagingMaterials.map(e => ({ id: crypto.randomUUID(), subtype: e.material__subtype, material_id: e.material_id, weight: e.quantity, unit: e.material__unit }))
      : [newPackaging()],

    transports: entries.transports.length > 0
      ? entries.transports.map(e => ({ id: crypto.randomUUID(), subtype: e.transport__subtype, transport_id: e.transport_id, weight: 0, distance: e.distance, unit: e.transport__unit }))
      : [newTransport()],

    energies: entries.energies.length > 0
      ? entries.energies.map(e => ({ id: crypto.randomUUID(), subtype: e.energy__subtype, energy_id: e.energy_id, quantity: e.quantity, unit: e.energy__unit }))
      : [newEnergy()],
  };
}

/* ── Main component ─────────────────────────────────── */
export default function ProductDescription() {
  const [products,       setProducts]       = useState([]);
  const [activeProduct,  setActiveProduct]  = useState(null);
  const [scenarios,      setScenarios]      = useState([]);
  const [activeScenario, setActiveScenario] = useState(null);
  const [impactResult,   setImpactResult]   = useState(null);
  const [resultTab,      setResultTab]      = useState(0);
  const [saving,         setSaving]         = useState(false);
  const [saveMsg,        setSaveMsg]        = useState('');
  const [form,           setForm]           = useState(emptyForm());

  const [showCreateProduct,  setShowCreateProduct]  = useState(false);
  const [editProduct,        setEditProduct]         = useState(null);
  const [deleteProduct,      setDeleteProduct]       = useState(null);
  const [showCreateScenario, setShowCreateScenario]  = useState(false);
  const [deleteScenario,     setDeleteScenario]      = useState(null);

  /* ── Load products ── */
  const loadProducts = useCallback(async () => {
    const data = await api.get('/api/products/');
    if (!data.error) {
      setProducts(data);
      if (data.length > 0) setActiveProduct(prev => prev || data[0]);
    }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  /* ── Load scenarios when product changes ── */
  useEffect(() => {
    if (!activeProduct) return;
    api.get(`/api/products/${activeProduct.id}/scenarios/`).then(data => {
      if (!data.error) {
        setScenarios(data);
        const def = data.find(s => s.is_default) || data[0];
        setActiveScenario(def || null);
      }
    });
  }, [activeProduct]);

  /* ── Load form entries when scenario changes ── */
  useEffect(() => {
    if (!activeScenario) { setForm(emptyForm()); setImpactResult(null); return; }
    api.get(`/api/scenarios/${activeScenario.id}/`).then(entries => {
      if (!entries.error) setForm(dbEntriesToForm(entries));
    });
    setImpactResult(null);
  }, [activeScenario]);

  /* ── Form helpers ── */
  const add    = (key, factory) => setForm(f => ({ ...f, [key]: [...f[key], factory()] }));
  const remove = (key, id)      => setForm(f => ({ ...f, [key]: f[key].filter(i => i.id !== id) }));
  const update = (key, id, field, value) =>
    setForm(f => ({ ...f, [key]: f[key].map(i => i.id === id ? { ...i, [field]: value } : i) }));

  /* ── Save & calculate ── */
  const handleCalculate = async () => {
    if (!activeScenario) return;
    setSaving(true); setSaveMsg('');

    const allMaterials = [
      ...form.materials.filter(m => m.material_id).map(m => ({
        material_id:  m.material_id,
        quantity:     parseFloat(m.weight) || 0,
        is_packaging: false,
      })),
      ...form.packagings.filter(m => m.material_id).map(m => ({
        material_id:  m.material_id,
        quantity:     parseFloat(m.weight) || 0,
        is_packaging: true,
      })),
    ];

    const body = {
      materials:    allMaterials,
      energies:     form.energies.filter(e => e.energy_id).map(e => ({ energy_id: e.energy_id, quantity: parseFloat(e.quantity) || 0 })),
      transports:   form.transports.filter(t => t.transport_id).map(t => ({ transport_id: t.transport_id, distance: parseFloat(t.distance) || 0 })),
      productions:  [],
      end_of_lives: [],
    };

    const result = await api.post(`/api/scenarios/${activeScenario.id}/save/`, body);
    if (result.error) {
      setSaveMsg(`❌ ${result.error}`);
    } else {
      setImpactResult(result);
      setSaveMsg(`✅ Calculé — Éco-coût: €${result.total_eco_cost} · CO₂: ${result.total_carbon_kg} kg`);
    }
    setSaving(false);
  };

  /* ── Product CRUD ── */
  const handleCreateProduct = p => { setProducts(prev => [p, ...prev]); setActiveProduct(p); setShowCreateProduct(false); };
  const handleEditProduct   = p => { setProducts(prev => prev.map(x => x.id === p.id ? p : x)); setActiveProduct(p); setEditProduct(null); };
  const handleDeleteProduct = async () => {
    await api.delete(`/api/products/${deleteProduct.id}/`);
    const rest = products.filter(p => p.id !== deleteProduct.id);
    setProducts(rest); setActiveProduct(rest[0] || null); setDeleteProduct(null);
  };

  /* ── Scenario CRUD ── */
  const handleCreateScenario = async (name) => {
    const s = await api.post(`/api/products/${activeProduct.id}/scenarios/`, { name });
    if (!s.error) { setScenarios(prev => [...prev, s]); setActiveScenario(s); }
    setShowCreateScenario(false);
  };
  const handleDeleteScenario = async () => {
    await api.delete(`/api/scenarios/${deleteScenario.id}/`);
    const rest = scenarios.filter(s => s.id !== deleteScenario.id);
    setScenarios(rest);
    setActiveScenario(rest.find(s => s.is_default) || rest[0] || null);
    setDeleteScenario(null);
  };

  /* ── Render ── */
  return (
    <div className="pd-page">

      {/* ── Product tabs ── */}
      <div className="pd-tabs-bar">
        <div className="pd-tabs">
          {products.map(p => (
            <button key={p.id} className={`pd-tab ${activeProduct?.id === p.id ? "active" : ""}`}
              onClick={() => setActiveProduct(p)}>
              {p.name}
              <span className="pd-tab-actions">
                <span className="pd-tab-edit"   onClick={e => { e.stopPropagation(); setEditProduct(p); }}>✏</span>
                <span className="pd-tab-delete" onClick={e => { e.stopPropagation(); setDeleteProduct(p); }}>✕</span>
              </span>
            </button>
          ))}
          <button className="pd-tab-add" onClick={() => setShowCreateProduct(true)}>+ Nouveau produit</button>
        </div>
      </div>

      {/* ── Empty state ── */}
      {!activeProduct ? (
        <div className="pd-empty">
          <div className="pd-empty-icon">📦</div>
          <h3>Aucun produit</h3>
          <p>Créez votre premier produit pour commencer l'analyse ACV.</p>
          <button className="pd-btn-save" onClick={() => setShowCreateProduct(true)}>+ Créer un produit</button>
        </div>
      ) : (

        /* ── Two columns ── */
        <div className="pd-columns">

          {/* ══ LEFT ══ */}
          <div className="pd-left">
            <div className="pd-product-header">
              <div>
                <h2>{activeProduct.name}</h2>
                {activeProduct.description && <p className="pd-product-desc">{activeProduct.description}</p>}
              </div>
              <div className="pd-product-actions">
                <button className="pd-btn-icon" onClick={() => setEditProduct(activeProduct)}>✏ Modifier</button>
                <button className="pd-btn-icon pd-btn-icon-danger" onClick={() => setDeleteProduct(activeProduct)}>🗑 Supprimer</button>
                <button className="pd-guide-btn">Guide d'utilisation ACV</button>
              </div>
            </div>

            <div className="pd-outer-card">

              {/* Matières premières */}
              <div className="pd-section">
                <div className="pd-section-header">
                  <div>
                    <p className="pd-section-title">Matières premières</p>
                    <p className="pd-section-desc">Matériaux utilisés dans la fabrication.</p>
                  </div>
                  <button className="pd-add-btn" onClick={() => add('materials', newMaterial)}>+ Ajouter</button>
                </div>
                {form.materials.map(item => (
                  <MaterialRow key={item.id} item={item}
                    onUpdate={(id, f, v) => update('materials', id, f, v)}
                    onRemove={id => remove('materials', id)} />
                ))}
              </div>

              {/* Transportation */}
              <div className="pd-section">
                <div className="pd-section-header">
                  <div>
                    <p className="pd-section-title">Transportation</p>
                    <p className="pd-section-desc">Moyens de transport et distances.</p>
                  </div>
                  <button className="pd-add-btn" onClick={() => add('transports', newTransport)}>+ Ajouter</button>
                </div>
                {form.transports.map(item => (
                  <TransportRow key={item.id} item={item}
                    onUpdate={(id, f, v) => update('transports', id, f, v)}
                    onRemove={id => remove('transports', id)} />
                ))}
              </div>

              {/* Énergie */}
              <div className="pd-section">
                <div className="pd-section-header">
                  <div>
                    <p className="pd-section-title">Énergie</p>
                    <p className="pd-section-desc">Énergies utilisées dans la fabrication.</p>
                  </div>
                  <button className="pd-add-btn" onClick={() => add('energies', newEnergy)}>+ Ajouter</button>
                </div>
                {form.energies.map(item => (
                  <EnergyRow key={item.id} item={item}
                    onUpdate={(id, f, v) => update('energies', id, f, v)}
                    onRemove={id => remove('energies', id)} />
                ))}
              </div>

              {/* Packaging */}
              <div className="pd-section">
                <div className="pd-section-header">
                  <div>
                    <p className="pd-section-title">Packaging</p>
                    <p className="pd-section-desc">Matériaux d'emballage utilisés.</p>
                  </div>
                  <button className="pd-add-btn" onClick={() => add('packagings', newPackaging)}>+ Ajouter</button>
                </div>
                {form.packagings.map(item => (
                  <PackagingRow key={item.id} item={item}
                    onUpdate={(id, f, v) => update('packagings', id, f, v)}
                    onRemove={id => remove('packagings', id)} />
                ))}
              </div>

            </div>

            {saveMsg && <div className="pd-save-msg">{saveMsg}</div>}

            <button className="pd-calc-btn" onClick={handleCalculate} disabled={saving || !activeScenario}>
              {saving ? 'Calcul en cours...' : 'Commencez le calcul !'}
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
                  <button key={i} className={`pd-result-tab ${resultTab === i ? "active" : ""}`}
                    onClick={() => setResultTab(i)}>{t}</button>
                ))}
              </div>

              <div className="pd-chart-header">
                <span className="pd-chart-title">Impact par phase</span>
              </div>

              <DonutChart result={impactResult} />

              {impactResult?.breakdown && (
                <div className="pd-legend">
                  {Object.entries(impactResult.breakdown)
                    .filter(([_, v]) => v > 0)
                    .map(([key, value]) => {
                      const total = impactResult.total_eco_cost;
                      const pct   = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                      return (
                        <div key={key} className="pd-legend-item">
                          <div className="pd-legend-dot" style={{ background: PHASE_COLORS[key] }} />
                          <span className="pd-legend-label">{PHASE_LABELS[key]}</span>
                          <span className="pd-legend-value">€{value.toFixed(2)} ({pct}%)</span>
                        </div>
                      );
                    })}
                </div>
              )}

              {impactResult && (
                <div className="pd-impact-summary">
                  <div className="pd-impact-item">
                    <span className="pd-impact-label">Éco-coût total</span>
                    <span className="pd-impact-value green">€{impactResult.total_eco_cost.toFixed(2)}</span>
                  </div>
                  <div className="pd-impact-item">
                    <span className="pd-impact-label">Empreinte carbone</span>
                    <span className="pd-impact-value blue">{impactResult.total_carbon_kg.toFixed(2)} kg CO₂</span>
                  </div>
                </div>
              )}
            </div>
            {/* END results card */}

            {/* Scenario panel */}
            <div className="pd-scenario-panel">
              <div className="pd-scenario-panel-header">
                <h3>Scénarios</h3>
                <button className="pd-add-btn" onClick={() => setShowCreateScenario(true)}>+ Nouveau scénario</button>
              </div>
              <p className="pd-scenario-panel-desc">
                Chaque scénario représente une configuration ACV différente pour <strong>{activeProduct.name}</strong>.
              </p>
              <div className="pd-scenario-list">
                {scenarios.map(s => (
                  <div key={s.id}
                    className={`pd-scenario-item ${activeScenario?.id === s.id ? 'active' : ''}`}
                    onClick={() => setActiveScenario(s)}>
                    <div className="pd-scenario-item-left">
                      <span className="pd-scenario-icon">🗂</span>
                      <div>
                        <span className="pd-scenario-name">{s.name}</span>
                        {s.is_default && <span className="pd-scenario-badge">Par défaut</span>}
                      </div>
                    </div>
                    {!s.is_default && (
                      <button className="pd-scenario-delete"
                        onClick={e => { e.stopPropagation(); setDeleteScenario(s); }}
                        title="Supprimer ce scénario">✕</button>
                    )}
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
      {showCreateProduct  && <ProductModal onSave={handleCreateProduct} onClose={() => setShowCreateProduct(false)} />}
      {editProduct        && <ProductModal product={editProduct} onSave={handleEditProduct} onClose={() => setEditProduct(null)} />}
      {deleteProduct      && <DeleteModal label={deleteProduct.name} onConfirm={handleDeleteProduct} onClose={() => setDeleteProduct(null)} />}
      {showCreateScenario && <ScenarioModal onSave={handleCreateScenario} onClose={() => setShowCreateScenario(false)} />}
      {deleteScenario     && <DeleteModal label={deleteScenario.name} onConfirm={handleDeleteScenario} onClose={() => setDeleteScenario(null)} />}

    </div>
    /* END pd-page */
  );
}