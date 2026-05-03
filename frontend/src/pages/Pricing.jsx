import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentPlanKey } from "../utils/planLimits";
import "./Pricing.css";

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconMinus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const PLANS = [
  {
    key: "free",
    name: "Gratuit",
    price: "0 €",
    period: "/mois",
    desc: "Idéal pour découvrir l'outil et réaliser vos premières analyses.",
    features: [
      { label: "3 produits",                    included: true  },
      { label: "2 scénarios par produit",       included: true  },
      { label: "Accès base Idemat complète",    included: true  },
      { label: "Calcul éco-coûts & CO₂",       included: true  },
      { label: "Recommandations intelligentes", included: false },
      { label: "Export de rapports",            included: false },
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: "29 €",
    period: "/mois",
    desc: "Pour les équipes qui font de l'éco-conception un avantage compétitif.",
    featured: true,
    features: [
      { label: "Produits illimités",            included: true },
      { label: "Scénarios illimités",           included: true },
      { label: "Accès base Idemat complète",    included: true },
      { label: "Calcul éco-coûts & CO₂",       included: true },
      { label: "Recommandations intelligentes", included: true },
      { label: "Export PDF & rapports",         included: true },
    ],
  },
  {
    key: "enterprise",
    name: "Entreprise",
    price: "Sur devis",
    period: "",
    desc: "Déploiement sur mesure pour les grandes organisations et bureaux d'études.",
    features: [
      { label: "Tout le plan Pro",          included: true },
      { label: "SSO & gestion des accès",   included: true },
      { label: "Intégration API",           included: true },
      { label: "Support dédié",             included: true },
      { label: "Formation équipe",          included: true },
      { label: "SLA garanti",               included: true },
    ],
  },
];

const FAQ = [
  {
    q: "Puis-je changer de plan à tout moment ?",
    a: "Oui, vous pouvez contacter notre équipe pour évoluer vers un plan supérieur. Le changement prend effet immédiatement.",
  },
  {
    q: "Les données Idemat 2026 sont-elles incluses dans tous les plans ?",
    a: "Oui, l'accès complet à la base Idemat 2026 (2 300+ entrées) est inclus dans tous les plans, y compris le plan gratuit.",
  },
  {
    q: "Comment accéder au plan Pro ?",
    a: "Contactez notre équipe à contact@ecodesign.app pour activer le plan Pro sur votre compte.",
  },
  {
    q: "La méthodologie est-elle conforme ISO 14040 / 14044 ?",
    a: "Oui, EcoDesign suit la méthodologie ACV définie par les normes ISO 14040 et 14044.",
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const currentPlan = getCurrentPlanKey();
  const [contactVisible, setContactVisible] = useState(false);

  return (
    <div className="pricing-page">

      {/* ── Header ── */}
      <div className="pricing-header">
        <span className="pricing-eyebrow">Tarification</span>
        <h1>Simple, transparent,<br />sans surprise</h1>
        <p>Votre plan actuel est affiché ci-dessous. Contactez-nous pour évoluer.</p>
      </div>

      {/* ── Contact toast ── */}
      {contactVisible && (
        <div className="pricing-contact-toast">
          <span>Contactez-nous à <strong>contact@ecodesign.app</strong> pour activer ce plan.</span>
          <button onClick={() => setContactVisible(false)}>×</button>
        </div>
      )}

      {/* ── Plans ── */}
      <div className="pricing-grid">
        {PLANS.map((plan) => {
          const isActive = currentPlan === plan.key;
          return (
            <div key={plan.key}
              className={`pricing-card ${plan.featured ? "pricing-card--featured" : ""} ${isActive ? "pricing-card--active" : ""}`}>

              <div className="pricing-card-top">
                <div className="pricing-plan-name-row">
                  <span className="pricing-plan-name">{plan.name}</span>
                  {isActive && <span className="pricing-active-badge">Plan actuel</span>}
                </div>
                <div className="pricing-price">
                  <span className="pricing-amount">{plan.price}</span>
                  {plan.period && <span className="pricing-period">{plan.period}</span>}
                </div>
                <p className="pricing-desc">{plan.desc}</p>
              </div>

              <ul className="pricing-features">
                {plan.features.map((f, i) => (
                  <li key={i} className={f.included ? "" : "pricing-disabled"}>
                    <span className={`pricing-icon ${f.included ? "pricing-icon--check" : "pricing-icon--minus"}`}>
                      {f.included ? <IconCheck /> : <IconMinus />}
                    </span>
                    {f.label}
                  </li>
                ))}
              </ul>

              <div className="pricing-cta">
                {isActive ? (
                  /* Current plan — show active state */
                  <div className="pricing-btn pricing-btn--active">✓ Plan actif</div>
                ) : plan.key === "free" ? (
                  /* Downgrade to free — navigate to app (plan is set in DB, this is just info) */
                  <button className="pricing-btn pricing-btn--ghost"
                    onClick={() => navigate("/app")}>
                    Voir mes produits
                  </button>
                ) : (
                  /* Pro / Entreprise — contact prompt */
                  <button className="pricing-btn pricing-btn--primary"
                    onClick={() => setContactVisible(true)}>
                    Nous contacter
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── FAQ ── */}
      <div className="pricing-faq">
        <h2>Questions fréquentes</h2>
        <div className="pricing-faq-grid">
          {FAQ.map((item, i) => (
            <div key={i} className="pricing-faq-item">
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
