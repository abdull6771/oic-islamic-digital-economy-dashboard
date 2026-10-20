import { useCallback, useEffect, useRef, useState } from "react";

import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/components.css";

import { META, OIC_AVERAGE, REFERENCE_YEAR } from "./data/index.js";
import { DEFAULT_VIEW, VIEWS, isValidView, viewById } from "./lib/nav.js";
import { hashParam, navigate, onHashChange, openCountry } from "./lib/routing.js";
import * as fmt from "./lib/format.js";
import CommandPalette from "./components/CommandPalette.jsx";

import GlobalOverview from "./views/GlobalOverview.jsx";
import CountryProfiles from "./views/CountryProfiles.jsx";
import CompareCountries from "./views/CompareCountries.jsx";
import PillarAnalysis from "./views/PillarAnalysis.jsx";
import GeographicAnalysis from "./views/GeographicAnalysis.jsx";
import TrendsProgress from "./views/TrendsProgress.jsx";
import PolicyRecommendations from "./views/PolicyRecommendations.jsx";
import DigitalDivide from "./views/DigitalDivide.jsx";
import CustomIndexBuilder from "./views/CustomIndexBuilder.jsx";
import PeerLearning from "./views/PeerLearning.jsx";
import StatisticalAnalysis from "./views/StatisticalAnalysis.jsx";
import Methodology from "./views/Methodology.jsx";
import Acknowledgement from "./views/Acknowledgement.jsx";
import ReportDownloads from "./views/ReportDownloads.jsx";
import WhatIfCalculator from "./views/WhatIfCalculator.jsx";
import DataQualityExplorer from "./views/DataQualityExplorer.jsx";
import UpdateHistory from "./views/UpdateHistory.jsx";

const COMPONENTS = {
  overview: GlobalOverview,
  profiles: CountryProfiles,
  compare: CompareCountries,
  pillar: PillarAnalysis,
  geo: GeographicAnalysis,
  trends: TrendsProgress,
  divide: DigitalDivide,
  policy: PolicyRecommendations,
  builder: CustomIndexBuilder,
  peers: PeerLearning,
  stats: StatisticalAnalysis,
  methodology: Methodology,
  acknowledgement: Acknowledgement,
  reports: ReportDownloads,
  whatif: WhatIfCalculator,
  quality: DataQualityExplorer,
  history: UpdateHistory,
};

function DashboardNavigation({ activeView, onNavigate }) {
  const navRef = useRef(null);
  const [overflow, setOverflow] = useState({ left: false, right: false });

  useEffect(() => {
    const nav = navRef.current;
    const measure = () => setOverflow({
      left: nav.scrollLeft > 2,
      right: nav.scrollWidth - nav.clientWidth - nav.scrollLeft > 2,
    });
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    nav.addEventListener("scroll", measure, { passive: true });
    measure();
    return () => {
      observer.disconnect();
      nav.removeEventListener("scroll", measure);
    };
  }, []);

  useEffect(() => {
    const nav = navRef.current;
    const active = nav.querySelector('[aria-current="page"]');
    if (!active) return;
    // Buttons are positioned relative to the scroll container. Leave room for
    // the overlaid scroll arrows when bringing a deep-linked tab into view.
    const left = active.offsetLeft;
    if (left < nav.scrollLeft + 28) nav.scrollLeft = Math.max(0, left - 28);
    else if (left + active.offsetWidth > nav.scrollLeft + nav.clientWidth - 28) {
      nav.scrollLeft = left + active.offsetWidth - nav.clientWidth + 28;
    }
  }, [activeView]);

  const onKeyDown = (event) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step && event.key !== "Home" && event.key !== "End") return;
    const items = [...navRef.current.querySelectorAll(".dashboard-tab")];
    const index = items.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 :
      (index + step + items.length) % items.length;
    items[next].focus();
  };

  return (
    <div className="dashboard-navigation no-print">
      {overflow.left && (
        <button className="tab-scroll tab-scroll-prev" aria-label="Show previous dashboard tabs"
          onClick={() => navRef.current.scrollBy({ left: -navRef.current.clientWidth * 0.7 })}>
          ‹
        </button>
      )}
      <nav className="dashboard-tabs" aria-label="Dashboard views" ref={navRef} onKeyDown={onKeyDown}>
        {VIEWS.map((view) => (
          <button type="button" key={view.id} className="dashboard-tab"
            aria-current={activeView === view.id ? "page" : undefined}
            onClick={() => onNavigate(view.id)}>
            {view.label}
          </button>
        ))}
      </nav>
      {overflow.right && (
        <button className="tab-scroll tab-scroll-next" aria-label="Show more dashboard tabs"
          onClick={() => navRef.current.scrollBy({ left: navRef.current.clientWidth * 0.7 })}>
          ›
        </button>
      )}
    </div>
  );
}

export default function App() {
  const [activeView, setActiveView] = useState(() => {
    const tab = hashParam("tab");
    return isValidView(tab) ? tab : DEFAULT_VIEW;
  });
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    return onHashChange(() => {
      const tab = hashParam("tab");
      setActiveView(isValidView(tab) ? tab : DEFAULT_VIEW);
    });
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = useCallback((id) => {
    navigate({ tab: id });
    setActiveView(id);
  }, []);
  const view = viewById(activeView) || viewById(DEFAULT_VIEW);
  const Component = COMPONENTS[view.id];

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="dashboard-header">
        <div className="dashboard-masthead">
          <div className="dashboard-brand">
            <h1>OIC Digital Economy Index</h1>
            <p>OIC DEI · {META.countryCount} Member States · {REFERENCE_YEAR} Assessment</p>
          </div>
          <div className="dashboard-average" aria-label={`Global average ${fmt.score(OIC_AVERAGE)} out of 100`}>
            <span>GLOBAL AVERAGE</span>
            <strong>{fmt.score(OIC_AVERAGE)}</strong>
            <small>out of 100</small>
          </div>
        </div>
        <DashboardNavigation activeView={view.id} onNavigate={go} />
      </header>

      <main className="content app-main" id="main" tabIndex={-1} aria-label={view.label}>
        <Component />
      </main>

      <footer className="dashboard-footer">
        <p className="dashboard-citation">
          Salim, K., Abdul Hamid, B., Disli, M., Lutfi, K. I., &amp; Cahyono, K. N.
          (2026). Digital Economy Index: OIC Countries 2025 — Policy Report. INCEIF University.
        </p>
        <p>© 2026 INCEIF University — The Global University of Islamic Finance</p>
        <div className="dashboard-footer-tools">
          <span>{META.countryCount} member states · {REFERENCE_YEAR} assessment
            {META.sourceUpdated && <> · Data updated {new Intl.DateTimeFormat("en-GB", {
              day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
            }).format(new Date(`${META.sourceUpdated}T00:00:00Z`))}</>}
          </span>
          <button className="footer-search no-print" onClick={() => setPaletteOpen(true)}>
            Search countries and views <span aria-hidden="true">⌕</span>
          </button>
        </div>
      </footer>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)}
        onSelectView={go}
        onSelectCountry={(name) => {
          openCountry(name);
          setActiveView("profiles");
        }}
      />
    </div>
  );
}
