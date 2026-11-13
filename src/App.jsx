import { useCallback, useEffect, useRef, useState } from "react";

import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/components.css";

import { META, OIC_AVERAGE, REFERENCE_YEAR } from "./data/index.js";
import { DEFAULT_VIEW, VIEWS, viewById } from "./lib/nav.js";
import { EDITION, IS_PUBLIC, CONTACT_EMAIL, canAccessView, resolveView } from "./lib/site-edition.js";
import { hashParam, navigate, onHashChange, openCountry } from "./lib/routing.js";
import * as fmt from "./lib/format.js";
import CommandPalette from "./components/CommandPalette.jsx";

import LandingPage from "./views/LandingPage.jsx";
import COMPONENTS from "#edition-views";

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
  const [activeView, setActiveView] = useState(() => resolveView(hashParam("tab")));
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    const syncRoute = () => {
      const tab = hashParam("tab");
      const allowed = resolveView(tab);
      if (tab && !canAccessView(tab)) {
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#tab=home`);
      }
      setActiveView(allowed);
    };
    syncRoute();
    return onHashChange(syncRoute);
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
    const allowed = resolveView(id);
    navigate({ tab: allowed });
    setActiveView(allowed);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);
  const view = viewById(activeView) || viewById(DEFAULT_VIEW);
  useEffect(() => {
    document.title = `${view.id === "home" ? "Home" : view.label} | OIC Digital Economy Policy Toolkit`;
  }, [view.id, view.label]);
  const Component = COMPONENTS[view.id];
  const search = <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)}
    onSelectView={go}
    onSelectCountry={(name) => {
      openCountry(name);
      setActiveView("profiles");
      window.scrollTo({ top: 0, behavior: "auto" });
    }}
  />;

  if (view.id === "home") {
    return <>
      <LandingPage edition={EDITION} onNavigate={go} contactEmail={CONTACT_EMAIL} />
      {search}
    </>;
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main" onClick={(event) => { event.preventDefault(); document.getElementById("main")?.focus(); }}>Skip to content</a>
      <header className="dashboard-header">
        <div className="dashboard-masthead">
          <div className="dashboard-brand">
            <h1><a className="dashboard-home-link" href="#tab=home" onClick={(event) => { event.preventDefault(); go("home"); }}>OIC Digital Economy Index</a></h1>
            <p>OIC DEI · {META.countryCount} Member States · {REFERENCE_YEAR} Assessment</p>
            {!IS_PUBLIC && <span className="edition-label">Internal version</span>}
          </div>
          <div className="dashboard-average" aria-label={`OIC average ${fmt.score(OIC_AVERAGE)} out of 100`}>
            <span>OIC AVERAGE</span>
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

      {search}
    </div>
  );
}
