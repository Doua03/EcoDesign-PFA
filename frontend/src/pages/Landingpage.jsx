import { useState, useEffect, useRef } from "react";
import "./Landingpage.css";
import { Link } from "react-router-dom";

const NAV_LINKS = [
  { label: "Fonctionnalités",    id: "fonctionnalites" },
  { label: "Comment ça marche",  id: "comment-ca-marche" },
  { label: "Tarification",       id: "tarification" },
  { label: "À propos",           id: "a-propos" },
];

/* ── Feature SVG icons ── */
const IconLeaf = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
);

const IconBolt = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
);

const IconBarChart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6"  y1="20" x2="6"  y2="14"/>
    <line x1="2"  y1="20" x2="22" y2="20"/>
  </svg>
);

const IconDatabase = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
    <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>
  </svg>
);

const IconSpark = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
  </svg>
);

const IconFileText = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
    <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
    <line x1="8" y1="13" x2="16" y2="13"/>
    <line x1="8" y1="17" x2="13" y2="17"/>
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconMinus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const FEATURES = [
  {
    Icon: IconLeaf,
    title: "Analyse du Cycle de Vie",
    desc: "Évaluez l'impact environnemental de vos produits à chaque étape — de la matière première à la fin de vie.",
  },
  {
    Icon: IconBolt,
    title: "Calcul en Temps Réel",
    desc: "Obtenez instantanément vos indicateurs d'éco-coûts et d'empreinte carbone dès que vous saisissez vos données.",
  },
  {
    Icon: IconBarChart,
    title: "Comparaison de Scénarios",
    desc: "Testez plusieurs configurations et comparez visuellement leur impact pour choisir la solution la plus durable.",
  },
  {
    Icon: IconDatabase,
    title: "Base Idemat Intégrée",
    desc: "Accédez à plus de 2 300 matériaux, énergies et procédés issus de la base de données Idemat 2026.",
  },
  {
    Icon: IconSpark,
    title: "Recommandations Intelligentes",
    desc: "Recevez des suggestions ciblées pour réduire l'impact environnemental de vos produits, phase par phase.",
  },
  {
    Icon: IconFileText,
    title: "Rapports Exportables",
    desc: "Générez des rapports détaillés prêts à partager avec vos équipes, clients ou auditeurs.",
  },
];

const STEPS = [
  { num: "01", title: "Décrivez votre produit", desc: "Saisissez les matériaux, l'énergie, le transport et le packaging utilisés dans la fabrication." },
  { num: "02", title: "Lancez le calcul ACV", desc: "Notre moteur analyse chaque composant et calcule les éco-coûts et l'empreinte carbone totale." },
  { num: "03", title: "Analysez les résultats", desc: "Visualisez l'impact par catégorie et identifiez les leviers d'amélioration prioritaires." },
  { num: "04", title: "Optimisez & Exportez", desc: "Comparez les scénarios, appliquez les recommandations et exportez votre rapport final." },
];

const STATS = [
  { value: "2 300+", label: "Matériaux & procédés" },
  { value: "85%",    label: "Réduction du temps d'analyse" },
  { value: "ISO",    label: "14040 / 14044 compatible" },
  { value: "100%",   label: "Données Idemat 2026" },
];

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [featRef, featVisible] = useInView();
  const [stepsRef, stepsVisible] = useInView();
  const [statsRef, statsVisible] = useInView();
  const [ctaRef, ctaVisible] = useInView();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="lp">

      {/* ── Navbar ── */}
      <nav className={`lp-nav ${scrolled ? "scrolled" : ""}`}>
        <div className="lp-nav-inner">
          <div className="lp-logo">
            <img src="/Logo.png" alt="EcoDesign" className="lp-logo-img" />
          </div>
          <ul className={`lp-nav-links ${menuOpen ? "open" : ""}`}>
            {NAV_LINKS.map((l, i) => (
              <li key={i}>
                <a href={`#${l.id}`} onClick={() => setMenuOpen(false)}>{l.label}</a>
              </li>
            ))}
          </ul>
          <div className="lp-nav-actions">
            <Link to="/login" className="lp-btn-ghost">Connexion</Link>
            <Link to="/register" className="lp-btn-primary">Commencer</Link>
          </div>
          <button className="lp-hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-hero-bg">
          <div className="lp-blob lp-blob-1" />
          <div className="lp-blob lp-blob-2" />
          <div className="lp-blob lp-blob-3" />
          <div className="lp-grid-overlay" />
        </div>
        <div className="lp-hero-content">
          <div className="lp-hero-badge">
            <span className="lp-badge-dot" />
            Idemat 2026 · ISO 14040 compatible
          </div>
          <h1 className="lp-hero-title">
            Concevez des produits<br />
            <span className="lp-hero-accent">durables</span> dès le départ
          </h1>
          <p className="lp-hero-sub">
            EcoDesign vous donne les outils pour mesurer, comprendre et réduire
            l'impact environnemental de vos produits grâce à l'Analyse du Cycle de Vie.
          </p>
          <div className="lp-hero-ctas">
            <Link to="/register" className="lp-btn-primary lp-btn-lg">
             Démarrer gratuitement →
            </Link>
            <a href="#comment-ça-marche" className="lp-btn-ghost lp-btn-lg">
              Voir comment ça marche
            </a>
          </div>
          <div className="lp-hero-stats">
            {STATS.map((s, i) => (
              <div key={i} className="lp-hero-stat">
                <span className="lp-hero-stat-val">{s.value}</span>
                <span className="lp-hero-stat-lbl">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="lp-hero-visual">
          <div className="lp-mockup">
            <div className="lp-mockup-bar">
              <span /><span /><span />
            </div>
            <div className="lp-mockup-body">
              <div className="lp-mockup-sidebar">
                {["📊","♥","📄","◎","⚙"].map((ic, i) => (
                  <div key={i} className={`lp-mockup-icon ${i === 2 ? "active" : ""}`}>{ic}</div>
                ))}
              </div>
              <div className="lp-mockup-main">
                <div className="lp-mockup-title">Description du produit</div>
                {["Matières premières", "Transportation", "Énergie", "Packaging"].map((s, i) => (
                  <div key={i} className="lp-mockup-section">
                    <div className="lp-mockup-section-head">
                      <div className="lp-mockup-section-title">{s}</div>
                      <div className="lp-mockup-tag">+ Ajouter</div>
                    </div>
                    <div className="lp-mockup-fields">
                      <div className="lp-mockup-field" />
                      <div className="lp-mockup-field lp-mockup-field-sm" />
                      <div className="lp-mockup-del" />
                    </div>
                  </div>
                ))}
                <div className="lp-mockup-btn">Commencez le calcul !</div>
              </div>
              <div className="lp-mockup-chart">
                <div className="lp-mockup-chart-title">Résultats</div>
                <div className="lp-mockup-donut">
                  <svg viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="28" fill="none" stroke="#f1f2f6" strokeWidth="12"/>
                    <circle cx="40" cy="40" r="28" fill="none" stroke="#2ecc71" strokeWidth="12"
                      strokeDasharray="70 106" strokeDashoffset="-28" transform="rotate(-90 40 40)"/>
                    <circle cx="40" cy="40" r="28" fill="none" stroke="#fd79a8" strokeWidth="12"
                      strokeDasharray="40 136" strokeDashoffset="-98" transform="rotate(-90 40 40)"/>
                    <circle cx="40" cy="40" r="28" fill="none" stroke="#74b9ff" strokeWidth="12"
                      strokeDasharray="25 151" strokeDashoffset="-138" transform="rotate(-90 40 40)"/>
                    <text x="40" y="44" textAnchor="middle" fontSize="10" fontWeight="800" fill="#2d3436">$85k</text>
                  </svg>
                </div>
                <div className="lp-mockup-legend">
                  {["#2ecc71","#fd79a8","#74b9ff","#ffeaa7"].map((c, i) => (
                    <div key={i} className="lp-mockup-legend-item">
                      <div className="lp-mockup-legend-dot" style={{ background: c }} />
                      <div className="lp-mockup-legend-bar" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="lp-features" id="fonctionnalites" ref={featRef}>
        <div className="lp-container">
          <div className={`lp-section-head ${featVisible ? "visible" : ""}`}>
            <span className="lp-eyebrow">Fonctionnalités</span>
            <h2>Tout ce dont vous avez besoin<br />pour un design écoresponsable</h2>
          </div>
          <div className="lp-features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className={`lp-feature-card ${featVisible ? "visible" : ""}`}
                style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="lp-feature-icon"><f.Icon /></div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="lp-steps" id="comment-ca-marche" ref={stepsRef}>
        <div className="lp-container">
          <div className={`lp-section-head ${stepsVisible ? "visible" : ""}`}>
            <span className="lp-eyebrow">Comment ça marche</span>
            <h2>De la donnée brute<br />à la décision éclairée</h2>
          </div>
          <div className="lp-steps-grid">
            {STEPS.map((s, i) => (
              <div key={i} className={`lp-step ${stepsVisible ? "visible" : ""}`}
                style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="lp-step-num">{s.num}</div>
                <div className="lp-step-line" />
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats banner ── */}
      <section className="lp-stats-banner" ref={statsRef}>
        <div className="lp-stats-bg" />
        <div className="lp-container lp-stats-inner">
          {STATS.map((s, i) => (
            <div key={i} className={`lp-stat-item ${statsVisible ? "visible" : ""}`}
              style={{ animationDelay: `${i * 0.1}s` }}>
              <span className="lp-stat-val">{s.value}</span>
              <span className="lp-stat-lbl">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tarification ── */}
      <section className="lp-pricing" id="tarification">
        <div className="lp-container">
          <div className="lp-section-head visible">
            <span className="lp-eyebrow">Tarification</span>
            <h2>Simple, transparent,<br />sans surprise</h2>
          </div>
          <div className="lp-pricing-grid">
            <div className="lp-pricing-card">
              <div className="lp-pricing-badge">Gratuit</div>
              <div className="lp-pricing-price"><span className="lp-pricing-amount">0 €</span><span className="lp-pricing-period">/mois</span></div>
              <p className="lp-pricing-desc">Idéal pour découvrir l'outil et réaliser vos premières analyses.</p>
              <ul className="lp-pricing-features">
                <li><IconCheck /> 3 produits</li>
                <li><IconCheck /> 2 scénarios par produit</li>
                <li><IconCheck /> Accès base Idemat complète</li>
                <li><IconCheck /> Calcul éco-coûts & CO₂</li>
                <li className="lp-pricing-disabled"><IconMinus /> Recommandations intelligentes</li>
                <li className="lp-pricing-disabled"><IconMinus /> Export de rapports</li>
              </ul>
              <Link to="/register" className="lp-btn-ghost lp-pricing-cta">Commencer gratuitement</Link>
            </div>
            <div className="lp-pricing-card lp-pricing-card--featured">
              <div className="lp-pricing-badge lp-pricing-badge--green">Pro</div>
              <div className="lp-pricing-price"><span className="lp-pricing-amount">29 €</span><span className="lp-pricing-period">/mois</span></div>
              <p className="lp-pricing-desc">Pour les équipes qui font de l'éco-conception un avantage compétitif.</p>
              <ul className="lp-pricing-features">
                <li><IconCheck /> Produits illimités</li>
                <li><IconCheck /> Scénarios illimités</li>
                <li><IconCheck /> Accès base Idemat complète</li>
                <li><IconCheck /> Calcul éco-coûts & CO₂</li>
                <li><IconCheck /> Recommandations intelligentes</li>
                <li><IconCheck /> Export PDF & rapports</li>
              </ul>
              <Link to="/register" className="lp-btn-primary lp-pricing-cta">Démarrer l'essai gratuit</Link>
            </div>
            <div className="lp-pricing-card">
              <div className="lp-pricing-badge">Entreprise</div>
              <div className="lp-pricing-price"><span className="lp-pricing-amount">Sur devis</span></div>
              <p className="lp-pricing-desc">Déploiement sur mesure pour les grandes organisations et bureaux d'études.</p>
              <ul className="lp-pricing-features">
                <li><IconCheck /> Tout le plan Pro</li>
                <li><IconCheck /> SSO & gestion des accès</li>
                <li><IconCheck /> Intégration API</li>
                <li><IconCheck /> Support dédié</li>
                <li><IconCheck /> Formation équipe</li>
                <li><IconCheck /> SLA garanti</li>
              </ul>
              <a href="mailto:contact@ecodesign.app" className="lp-btn-ghost lp-pricing-cta">Nous contacter</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── À propos ── */}
      <section className="lp-about" id="a-propos">
        <div className="lp-container lp-about-inner">
          <div className="lp-about-text">
            <span className="lp-eyebrow">À propos</span>
            <h2>Conçu par des ingénieurs,<br />pour des concepteurs</h2>
            <p>
              EcoDesign est né d'un constat simple : les outils d'Analyse du Cycle de Vie
              existants sont trop complexes, trop coûteux, ou trop déconnectés du quotidien
              des équipes de conception.
            </p>
            <p>
              Notre mission est de rendre l'éco-conception accessible à tous — des startups
              aux grands groupes industriels — en combinant la rigueur méthodologique de la
              norme ISO 14040/14044 avec une expérience utilisateur moderne.
            </p>
            <p>
              La base de données <strong>Idemat 2026</strong>, développée par la TU Delft,
              fournit des données environnementales fiables sur plus de 2 300 matériaux,
              sources d'énergie et procédés de fabrication.
            </p>
            <div className="lp-about-tags">
              <span>ISO 14040 / 14044</span>
              <span>Idemat 2026</span>
              <span>Open methodology</span>
              <span>Made in France</span>
            </div>
          </div>
          <div className="lp-about-visual">
            <div className="lp-about-card">
              <div className="lp-about-stat"><span>2 300+</span><p>entrées dans la base Idemat</p></div>
              <div className="lp-about-divider" />
              <div className="lp-about-stat"><span>5</span><p>phases du cycle de vie analysées</p></div>
              <div className="lp-about-divider" />
              <div className="lp-about-stat"><span>2</span><p>indicateurs clés : éco-coût & CO₂</p></div>
              <div className="lp-about-divider" />
              <div className="lp-about-stat"><span>KNN</span><p>algorithme de recommandation Pareto-optimal</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta" ref={ctaRef}>
        <div className={`lp-cta-card ${ctaVisible ? "visible" : ""}`}>
          <div className="lp-cta-blob" />
          <span className="lp-eyebrow" style={{ color: "#a9f0c8" }}>Prêt à commencer ?</span>
          <h2>Réduisez l'empreinte carbone<br />de vos produits aujourd'hui</h2>
          <p>Rejoignez les équipes qui font de l'éco-conception une priorité.</p>
          <div className="lp-cta-btns">
           <Link to="/register" className="lp-btn-white">
                Créer un compte gratuit
           </Link>
            <a href="/demo" className="lp-btn-outline-white">Voir une démo</a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <div className="lp-footer-brand">
            <div className="lp-logo">
             <img src="/Logo.png" alt="EcoDesign" className="lp-logo-img" />
           </div>
            <p>Outil d'Analyse du Cycle de Vie pour les équipes de conception industrielle.</p>
          </div>
          <div className="lp-footer-links">
            <div className="lp-footer-col">
              <h4>Produit</h4>
              <a href="#">Fonctionnalités</a>
              <a href="#">Tarification</a>
              <a href="#">Documentation</a>
            </div>
            <div className="lp-footer-col">
              <h4>Entreprise</h4>
              <a href="#">À propos</a>
              <a href="#">Contact</a>
              <a href="#">Mentions légales</a>
            </div>
          </div>
        </div>
        <div className="lp-footer-bottom">
          © {new Date().getFullYear()} EcoDesign · Tous droits réservés
        </div>
      </footer>

    </div>
  );
}