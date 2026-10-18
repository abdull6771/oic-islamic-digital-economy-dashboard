import { useCallback, useEffect, useRef, useState } from "react";

import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/components.css";

import { META, OIC_AVERAGE, REFERENCE_YEAR } from "./data/index.js";
import { DEFAULT_VIEW, GROUPS, VIEWS, isValidView, viewById } from "./lib/nav.js";
import { hashParam, navigate, onHashChange, openCountry } from "./lib/routing.js";
import * as fmt from "./lib/format.js";
import { Button, useMediaQuery } from "./components/Primitives.jsx";
import CommandPalette from "./components/CommandPalette.jsx";
import { PageActionsProvider } from "./components/PageActions.jsx";

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

/**
 * The live views. `IslamicDigitalSpecial`, `PriorityMatrix` and
 * `ProgressTracker` were commented out of the original TABS array and remain
 * unrouted; their code is still in src/views/ untouched.
 */
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

const THEME_KEY = "oic-dei-theme";
const SIDEBAR_KEY = "oic-dei-sidebar";
const THEME_ORDER = ["system", "light", "dark"];
const THEME_LABEL = { system: "System", light: "Light", dark: "Dark" };
const THEME_ICON = { system: "◐", light: "☀", dark: "☾" };

const readStored = (key, fallback) => {
  if (typeof window === "undefined") return fallback;
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

const store = (key, value) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* Private browsing or blocked storage: the preference just does not persist. */
  }
};

/* ── Theme ───────────────────────────────────────────────────────────────── */

function useTheme() {
  const [theme, setTheme] = useState(() => {
    const stored = readStored(THEME_KEY, "system");
    return THEME_ORDER.includes(stored) ? stored : "system";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
    store(THEME_KEY, theme);
  }, [theme]);

  const cycle = useCallback(
    () => setTheme((t) => THEME_ORDER[(THEME_ORDER.indexOf(t) + 1) % THEME_ORDER.length]),
    [],
  );

  return { theme, cycle };
}

/* ── Sidebar ─────────────────────────────────────────────────────────────── */

function Sidebar({ activeView, onNavigate, collapsed, onToggleCollapse, onCloseDrawer }) {
  const navRef = useRef(null);

  // Up/down move between destinations; Enter and Space activate, as buttons do.
  const onKeyDown = (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const items = Array.from(navRef.current?.querySelectorAll(".nav-item") || []);
    const index = items.indexOf(document.activeElement);
    if (index === -1) return;
    event.preventDefault();
    const next = event.key === "ArrowDown" ? index + 1 : index - 1;
    items[(next + items.length) % items.length]?.focus();
  };

  return (
    <aside className="app-sidebar no-print">
      <div className="sidebar-brand">
        <span className="sidebar-mark" aria-hidden="true">
          IU
        </span>
        <span className="sidebar-wordmark">
          <strong>INCEIF University</strong>
          <span>Digital Economy Index</span>
        </span>
      </div>

      <nav className="sidebar-nav" aria-label="Views" ref={navRef} onKeyDown={onKeyDown}>
        {GROUPS.map((group) => (
          <div className="nav-group" key={group.id}>
            <div className="nav-group-label t-overline">{group.label}</div>
            {VIEWS.filter((v) => v.group === group.id).map((view) => (
              <button
                type="button"
                key={view.id}
                className="nav-item"
                data-label={view.label}
                title={view.label}
                aria-current={activeView === view.id ? "page" : undefined}
                onClick={() => {
                  onNavigate(view.id);
                  onCloseDrawer();
                }}
              >
                <span className="nav-icon" aria-hidden="true">
                  {view.icon}
                </span>
                <span className="nav-label">{view.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-foot t-caption">
        <Button
          size="sm"
          onClick={onToggleCollapse}
          aria-pressed={collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{ width: "100%" }}
        >
          <span aria-hidden="true">{collapsed ? "»" : "«"}</span>
          <span className="nav-label">Collapse</span>
        </Button>
        <span>© 2026 INCEIF University</span>
      </div>
    </aside>
  );
}

/* ── App ─────────────────────────────────────────────────────────────────── */

export default function App() {
  const [activeView, setActiveView] = useState(() => {
    const tab = hashParam("tab");
    return isValidView(tab) ? tab : DEFAULT_VIEW;
  });
  const [collapsed, setCollapsed] = useState(() => readStored(SIDEBAR_KEY, "0") === "1");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [actionsNode, setActionsNode] = useState(null);
  const { theme, cycle } = useTheme();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // The hash is the source of truth, so a deep link, the map, the palette and
  // the back button all move the app the same way.
  useEffect(
    () =>
      onHashChange(() => {
        const tab = hashParam("tab");
        setActiveView(isValidView(tab) ? tab : DEFAULT_VIEW);
      }),
    [],
  );

  useEffect(() => store(SIDEBAR_KEY, collapsed ? "1" : "0"), [collapsed]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
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
    <div
      className="app-shell"
      data-sidebar={collapsed ? "collapsed" : "expanded"}
      data-drawer={drawerOpen ? "open" : "closed"}
    >
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <Sidebar
        activeView={view.id}
        onNavigate={go}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        onCloseDrawer={() => setDrawerOpen(false)}
      />
      <div
        className="app-scrim"
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      <div className="app-main">
        <header className="page-header">
          {!isDesktop && (
            <Button
              className="btn-icon no-print"
              aria-label="Open navigation"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
            >
              <span aria-hidden="true">☰</span>
            </Button>
          )}

          <h1 className="t-h3">{view.label}</h1>

          <div
            className="page-header-spacer page-header-tools"
            ref={setActionsNode}
          />

          <div className="page-header-tools no-print">
            <span className="stat-chip t-caption">
              <span className="t-overline" style={{ color: "var(--text-muted)" }}>
                OIC avg
              </span>
              <b>{fmt.score(OIC_AVERAGE)}</b>
            </span>

            <Button onClick={() => setPaletteOpen(true)} aria-label="Search countries and views">
              <span aria-hidden="true">⌕</span>
              <span className="t-caption">Search</span>
              <span className="kbd" aria-hidden="true">
                ⌘K
              </span>
            </Button>

            <Button
              className="btn-icon"
              onClick={cycle}
              aria-label={`Theme: ${THEME_LABEL[theme]}. Change theme.`}
              title={`Theme: ${THEME_LABEL[theme]}`}
            >
              <span aria-hidden="true">{THEME_ICON[theme]}</span>
            </Button>
          </div>
        </header>

        <main className="content" id="main" tabIndex={-1}>
          <PageActionsProvider value={actionsNode}>
            <Component />
          </PageActionsProvider>
        </main>

        <footer className="content" style={{ paddingTop: 0 }}>
          <hr className="hairline" />
          <p className="t-caption subtle prose">
            Salim, K., Abdul Hamid, B., Disli, M., Lutfi, K. I., &amp; Cahyono, K. N.
            (2026). Digital Economy Index: OIC Countries 2025 — Policy Report. INCEIF
            University.
          </p>
          <p className="t-caption subtle">
            © 2026 INCEIF University — The Global University of Islamic Finance ·{" "}
            {META.countryCount} member states · {REFERENCE_YEAR} assessment
            {META.sourceUpdated && <> · Data updated {new Intl.DateTimeFormat("en-GB", {
              day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
            }).format(new Date(`${META.sourceUpdated}T00:00:00Z`))}</>}
          </p>
        </footer>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelectView={go}
        onSelectCountry={(name) => {
          openCountry(name);
          setActiveView("profiles");
        }}
      />
    </div>
  );
}
