import { useState } from "react";
import { styles } from "./styles/styles.js";
import { META, OIC_AVERAGE, REFERENCE_YEAR } from "./data/index.js";
import GlobalOverview from "./views/GlobalOverview.jsx";
import CountryProfiles from "./views/CountryProfiles.jsx";
import CompareCountries from "./views/CompareCountries.jsx";
import PillarAnalysis from "./views/PillarAnalysis.jsx";
import GeographicAnalysis from "./views/GeographicAnalysis.jsx";
import TrendsProgress from "./views/TrendsProgress.jsx";
import PolicyRecommendations from "./views/PolicyRecommendations.jsx";
import DigitalDivide from "./views/DigitalDivide.jsx";
import IslamicDigitalSpecial from "./views/IslamicDigitalSpecial.jsx";
import CustomIndexBuilder from "./views/CustomIndexBuilder.jsx";
import PriorityMatrix from "./views/PriorityMatrix.jsx";
import PeerLearning from "./views/PeerLearning.jsx";
import ProgressTracker from "./views/ProgressTracker.jsx";
import StatisticalAnalysis from "./views/StatisticalAnalysis.jsx";
import Methodology from "./views/Methodology.jsx";
import Acknowledgement from "./views/Acknowledgement.jsx";

const TABS = [
  { id: "overview", label: "Global Overview", component: GlobalOverview },
  { id: "profiles", label: "Country Profiles", component: CountryProfiles },
  { id: "compare", label: "Compare Countries", component: CompareCountries },
  { id: "pillar", label: "Pillar Analysis", component: PillarAnalysis },
  { id: "geo", label: "Geographic Analysis", component: GeographicAnalysis },
  { id: "trends", label: "Trends & Progress", component: TrendsProgress },
  { id: "divide", label: "Digital Divide", component: DigitalDivide },
  {
    id: "policy",
    label: "Strategic Recommendations",
    component: PolicyRecommendations,
  },
  /* {
    id: "islamic",
    label: "Islamic Digital Special",
    component: IslamicDigitalSpecial,
  }, */
  {
    id: "builder",
    label: "Custom Index Builder",
    component: CustomIndexBuilder,
  },
  /* { id: "matrix", label: "Priority Matrix", component: PriorityMatrix }, */
  { id: "peers", label: "Peer Learning", component: PeerLearning },
  /* { id: "progress", label: "Progress Tracker", component: ProgressTracker }, */
  {
    id: "stats",
    label: "Statistical Analysis",
    component: StatisticalAnalysis,
  },
  { id: "methodology", label: "Methodology", component: Methodology },
  {
    id: "acknowledgement",
    label: "Acknowledgements",
    component: Acknowledgement,
  },
];

// ─── FOOTER ──────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <div style={styles.footer}>
      © 2026 INCEIF University — The Global University of Islamic Finance
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const p = new URLSearchParams(window.location.hash.replace("#", ""));
    const t = p.get("tab");
    return t && TABS.find((x) => x.id === t) ? t : "overview";
  });
  const tab = TABS.find((t) => t.id === activeTab);
  const Component = tab.component;

  const handleTabChange = (id) => {
    setActiveTab(id);
    const p = new URLSearchParams(window.location.hash.replace("#", ""));
    p.set("tab", id);
    window.location.hash = p.toString();
  };

  return (
    <div style={styles.app}>
      {/* Google Fonts & Animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
        * { box-sizing: border-box; }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-4px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }
        
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #F8FAFC; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; transition: background 0.2s; }
        ::-webkit-scrollbar-thumb:hover { background: #B8922A; }
        
        select, input, button { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        select:hover, input:hover { border-color: #00a8e8; box-shadow: 0 2px 8px rgba(0, 168, 232, 0.12); }
        select:focus, input:focus { border-color: #00a8e8; box-shadow: 0 0 0 3px rgba(0, 168, 232, 0.1); outline: none; }
        
        button:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12); }
        button:active:not(:disabled) { transform: translateY(0); }
        
        table tbody tr:hover { background-color: #F1F5F950 !important; transition: background-color 0.2s ease; }
        table tbody tr { transition: background-color 0.2s ease; }
        
        select option { background: #FFFFFF; color: #1E293B; padding: 8px; }
      `}</style>

      {/* Header */}
      <div style={styles.header}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "32px",
            }}
          >
            <div style={{ flex: 1 }}>
              <h1
                style={{
                  margin: 0,
                  fontFamily: "'Georgia', serif",
                  fontSize: "28px",
                  fontWeight: 900,
                  color: "#FFFFFF",
                  letterSpacing: "0.08em",
                  textShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                }}
              >
                OIC Digital Economy Index
              </h1>
              <div
                style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: "13px",
                  color: "#B0D4FF",
                  marginTop: "6px",
                  letterSpacing: "0.05em",
                  fontWeight: 500,
                }}
              >
                OIC DEI · {META.countryCount} Member States · {REFERENCE_YEAR}{" "}
                Assessment
              </div>
            </div>
            <div
              style={{
                textAlign: "right",
                padding: "0 24px",
                borderLeft: "1px solid rgba(0, 168, 232, 0.3)",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#7dd3fc",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  marginBottom: "8px",
                }}
              >
                GLOBAL AVERAGE
              </div>
              <div
                style={{
                  fontSize: "42px",
                  fontWeight: 900,
                  color: "#FFFFFF",
                  fontFamily: "'Georgia', serif",
                  letterSpacing: "-0.02em",
                  background:
                    "linear-gradient(135deg, #00d4ff 0%, #00a8e8 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {OIC_AVERAGE.toFixed(1)}
              </div>
              <div
                style={{ fontSize: "11px", color: "#9dd9ff", marginTop: "4px" }}
              >
                out of 100
              </div>
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div style={styles.tabs}>
          {TABS.map((t) => (
            <button
              key={t.id}
              style={styles.tab(activeTab === t.id)}
              onClick={() => handleTabChange(t.id)}
              onMouseEnter={(e) => {
                if (activeTab !== t.id) {
                  e.target.style.background = "rgba(0, 168, 232, 0.08)";
                  e.target.style.color = "#B0D4FF";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== t.id) {
                  e.target.style.background = "transparent";
                  e.target.style.color = "#A0AEC0";
                }
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        <Component />
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          fontSize: "12px",
          color: "#64748B",
          borderTop: "1px solid #E2E8F0",
          marginTop: "40px",
        }}
      >
        <p>
          *Salim, K., Abdul Hamid, B., Disli, M., Lutfi, K. I., & Cahyono, K. N.
          (2026). Digital Economy Index: OIC Countries 2025 — Policy Report.
          INCEIF University.
        </p>
      </div>
      <Footer />
    </div>
  );
}
