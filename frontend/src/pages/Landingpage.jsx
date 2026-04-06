import { useState, useEffect, useRef } from "react";
import "./Landingpage.css";
import { Link } from "react-router-dom";

const NAV_LINKS = ["Fonctionnalités", "Comment ça marche", "Tarification", "À propos"];

const FEATURES = [
  {
    icon: "🌿",
    title: "Analyse du Cycle de Vie",
    desc: "Évaluez l'impact environnemental de vos produits à chaque étape — de la matière première à la fin de vie.",
  },
  {
    icon: "⚡",
    title: "Calcul en Temps Réel",
    desc: "Obtenez instantanément vos indicateurs d'éco-coûts et d'empreinte carbone dès que vous saisissez vos données.",
  },
  {
    icon: "📊",
    title: "Comparaison de Scénarios",
    desc: "Testez plusieurs configurations et comparez visuellement leur impact pour choisir la solution la plus durable.",
  },
  {
    icon: "🗄️",
    title: "Base Idemat Intégrée",
    desc: "Accédez à plus de 2 300 matériaux, énergies et procédés issus de la base de données Idemat 2026.",
  },
  {
    icon: "🤖",
    title: "Recommandations IA",
    desc: "Recevez des suggestions intelligentes pour réduire l'impact environnemental de vos produits.",
  },
  {
    icon: "📄",
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
            {NAV_LINKS.map((l, i) => <li key={i}><a href={`#${l}`}>{l}</a></li>)}
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
      <section className="lp-features" id="Fonctionnalités" ref={featRef}>
        <div className="lp-container">
          <div className={`lp-section-head ${featVisible ? "visible" : ""}`}>
            <span className="lp-eyebrow">Fonctionnalités</span>
            <h2>Tout ce dont vous avez besoin<br />pour un design écoresponsable</h2>
          </div>
          <div className="lp-features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className={`lp-feature-card ${featVisible ? "visible" : ""}`}
                style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="lp-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="lp-steps" id="Comment-ça-marche" ref={stepsRef}>
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