import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Package, BarChart2, Leaf, TrendingDown, ArrowRight } from "lucide-react";
import { getPlanLimits } from "../utils/planLimits";
import "./Dashboard.css";

const api = {
  get: (url) => fetch(url, { credentials: "include" }).then((r) => r.json()),
};

/* ── Phase palette ── */
const PHASE_COLORS = {
  materiaux:  "#5EAA28",
  packaging:  "#f0a050",
  transport:  "#e07b8a",
  energie:    "#4a90c4",
  production: "#8b6fc4",
  fin_de_vie: "#c4a84a",
};
const PHASE_LABELS = {
  materiaux:  "Matières premières",
  packaging:  "Packaging",
  transport:  "Transport",
  energie:    "Énergie",
  production: "Production",
  fin_de_vie: "Fin de vie",
};

/* ── KPI card ── */
function KpiCard({ icon: Icon, label, value, sub, color = "#5EAA28" }) {
  return (
    <div className="db2-kpi">
      <div className="db2-kpi-icon" style={{ background: color + "18", color }}>
        <Icon size={20} strokeWidth={1.8} />
      </div>
      <div className="db2-kpi-body">
        <span className="db2-kpi-value">{value}</span>
        <span className="db2-kpi-label">{label}</span>
        {sub && <span className="db2-kpi-sub">{sub}</span>}
      </div>
    </div>
  );
}

/* ── Horizontal bar chart (CO₂ or eco-cost per product) ── */
function HBarChart({ data, valueKey, format, color }) {
  if (!data.length) return <p className="db2-empty-msg">Aucune donnée calculée.</p>;
  const max = Math.max(...data.map((d) => d[valueKey]));
  return (
    <div className="db2-hbar-list">
      {data.map((d) => {
        const pct = max > 0 ? (d[valueKey] / max) * 100 : 0;
        return (
          <div key={d.id} className="db2-hbar-row">
            <span className="db2-hbar-label" title={d.name}>
              {d.name.length > 22 ? d.name.slice(0, 21) + "…" : d.name}
            </span>
            <div className="db2-hbar-track">
              <div
                className="db2-hbar-fill"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
            <span className="db2-hbar-val">{format(d[valueKey])}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Best scenario table ── */
function BestScenarioTable({ rows, navigate }) {
  if (!rows.length) return <p className="db2-empty-msg">Aucun scénario calculé.</p>;
  return (
    <div className="db2-best-table">
      <div className="db2-best-header">
        <span>Produit</span>
        <span>Meilleur scénario</span>
        <span>CO₂ (kg)</span>
        <span>Éco-coût (€)</span>
        <span />
      </div>
      {rows.map((r) => (
        <div key={r.productId} className="db2-best-row">
          <span className="db2-best-product">{r.productName}</span>
          <span className="db2-best-scenario">{r.scenarioName}</span>
          <span className="db2-best-co2">{r.co2.toFixed(2)}</span>
          <span className="db2-best-eco">€{r.eco.toFixed(2)}</span>
          <button
            className="db2-best-link"
            onClick={() => navigate("/app", { state: { selectedProductId: r.productId } })}
          >
            <ArrowRight size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ── Usage bar (free plan) ── */
function UsageBar({ label, used, max }) {
  const pct = Math.min((used / max) * 100, 100);
  const warn = pct >= 80;
  return (
    <div className="db2-usage-item">
      <div className="db2-usage-top">
        <span className="db2-usage-label">{label}</span>
        <span className={`db2-usage-count ${warn ? "warn" : ""}`}>
          {used} / {max}
        </span>
      </div>
      <div className="db2-usage-track">
        <div
          className={`db2-usage-fill ${warn ? "warn" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function Dashboard() {
  const navigate = useNavigate();
  const limits = getPlanLimits();
  const isFree = limits.maxProducts !== Infinity;

  const [products,    setProducts]    = useState([]);
  const [compareData, setCompareData] = useState({}); // { productId: [...scenarios] }
  const [loading,     setLoading]     = useState(true);

  /* ── Load products then compare data for each ── */
  const load = useCallback(async () => {
    setLoading(true);
    const prods = await api.get("/api/products/");
    if (prods.error) { setLoading(false); return; }
    setProducts(prods);

    // Fetch compare data for all products in parallel
    const entries = await Promise.all(
      prods.map((p) =>
        api.get(`/api/products/${p.id}/compare/`).then((d) => ({
          id: p.id,
          data: Array.isArray(d) ? d : [],
        }))
      )
    );
    const map = {};
    entries.forEach(({ id, data }) => { map[id] = data; });
    setCompareData(map);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Derived data ── */

  // All calculated scenarios flattened with product name
  const allScenarios = products.flatMap((p) =>
    (compareData[p.id] || []).map((s) => ({ ...s, productName: p.name, productId: p.id }))
  );

  const totalScenarios = allScenarios.length;

  // Best CO₂ and eco-cost across everything
  const bestCO2 = allScenarios.length
    ? allScenarios.reduce((b, s) => (s.total_carbon_kg < b.total_carbon_kg ? s : b))
    : null;
  const bestEco = allScenarios.length
    ? allScenarios.reduce((b, s) => (s.total_eco_cost < b.total_eco_cost ? s : b))
    : null;

  // Per-product best scenario (for the table)
  const bestPerProduct = products
    .map((p) => {
      const scenarios = compareData[p.id] || [];
      if (!scenarios.length) return null;
      const best = scenarios.reduce((b, s) =>
        s.total_carbon_kg < b.total_carbon_kg ? s : b
      );
      return {
        productId:    p.id,
        productName:  p.name,
        scenarioName: best.name,
        co2:          best.total_carbon_kg,
        eco:          best.total_eco_cost,
      };
    })
    .filter(Boolean);

  // Per-product totals for bar charts (use best scenario per product)
  const chartData = bestPerProduct.map((r) => ({
    id:              r.productId,
    name:            r.productName,
    total_carbon_kg: r.co2,
    total_eco_cost:  r.eco,
  }));

  /* ── Render ── */
  if (loading) {
    return (
      <div className="db2-page">
        <div className="db2-loading">
          <div className="db2-spinner" />
          <p>Chargement du tableau de bord…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="db2-page">

      {/* ── Page title ── */}
      <div className="db2-title-row">
        <div>
          <h1>Tableau de bord</h1>
          <p className="db2-subtitle">Vue d'ensemble de vos analyses ACV</p>
        </div>
        <button className="db2-goto-btn" onClick={() => navigate("/app")}>
          Aller au calcul ACV <ArrowRight size={14} />
        </button>
      </div>

      {/* ── KPI row ── */}
      <div className="db2-kpi-row">
        <KpiCard
          icon={Package}
          label="Produits"
          value={products.length}
          sub={isFree ? `sur ${limits.maxProducts} max` : "illimités"}
          color="#5EAA28"
        />
        <KpiCard
          icon={BarChart2}
          label="Scénarios calculés"
          value={totalScenarios}
          color="#4a90c4"
        />
        <KpiCard
          icon={Leaf}
          label="Meilleure empreinte CO₂"
          value={bestCO2 ? `${bestCO2.total_carbon_kg.toFixed(2)} kg` : "—"}
          sub={bestCO2 ? bestCO2.productName : "Aucun calcul"}
          color="#5EAA28"
        />
        <KpiCard
          icon={TrendingDown}
          label="Meilleur éco-coût"
          value={bestEco ? `€${bestEco.total_eco_cost.toFixed(2)}` : "—"}
          sub={bestEco ? bestEco.productName : "Aucun calcul"}
          color="#8b6fc4"
        />
      </div>

      {/* ── Free plan usage ── */}
      {isFree && (
        <div className="db2-card db2-usage-card">
          <div className="db2-card-header">
            <span className="db2-card-title">Utilisation du plan Gratuit</span>
            <button className="db2-upgrade-btn" onClick={() => navigate("/pricing")}>
              Passer au Pro →
            </button>
          </div>
          <div className="db2-usage-bars">
            <UsageBar label="Produits" used={products.length} max={limits.maxProducts} />
          </div>
        </div>
      )}

      {/* ── Charts row ── */}
      <div className="db2-charts-row">
        <div className="db2-card">
          <div className="db2-card-header">
            <span className="db2-card-title">Empreinte carbone par produit</span>
            <span className="db2-card-sub">kg CO₂ — meilleur scénario</span>
          </div>
          <HBarChart
            data={chartData}
            valueKey="total_carbon_kg"
            format={(v) => `${v.toFixed(2)} kg`}
            color="#5EAA28"
          />
        </div>

        <div className="db2-card">
          <div className="db2-card-header">
            <span className="db2-card-title">Éco-coût par produit</span>
            <span className="db2-card-sub">€ — meilleur scénario</span>
          </div>
          <HBarChart
            data={chartData}
            valueKey="total_eco_cost"
            format={(v) => `€${v.toFixed(2)}`}
            color="#4a90c4"
          />
        </div>
      </div>

      {/* ── Best scenario table ── */}
      <div className="db2-card">
        <div className="db2-card-header">
          <span className="db2-card-title">Meilleur scénario par produit</span>
          <span className="db2-card-sub">basé sur l'empreinte carbone la plus basse</span>
        </div>
        <BestScenarioTable rows={bestPerProduct} navigate={navigate} />
      </div>

    </div>
  );
}
