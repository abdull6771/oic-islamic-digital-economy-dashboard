import { useState } from "react";
import { styles } from "../styles/styles.js";
import {
  COUNTRIES,
  DATA_QUALITY,
  FINDEX,
  FINDEX_IMPUTED_COUNTRIES,
  INDICATOR_COUNTS,
  META,
  PILLARS,
  PILLAR_INDICATORS,
  REFERENCE_YEAR,
  YEARS,
} from "../data/index.js";

function Methodology() {
  const [activeTab, setActiveTab] = useState("overview");
  const SOURCES = [
    {
      indicator: "Political Environment (1.1)",
      code: "1.1.1–1.1.3",
      source: "World Bank Worldwide Governance Indicators (WGI), 2025",
    },
    {
      indicator: "Regulatory Environment (1.2)",
      code: "1.2.1–1.2.3",
      source: "World Bank Worldwide Governance Indicators (WGI), 2025",
    },
    {
      indicator: "Technology Governance (1.3)",
      code: "1.3.1–1.3.7",
      source:
        "Portulans Institute & Saïd Business School, University of Oxford (2021–2025)",
    },
    {
      indicator: "Access to ICT / Use of ICT",
      code: "2.1–2.2",
      source: "WIPO (2022–2025)",
    },
    {
      indicator: "Technological Inclusion (2.3)",
      code: "2.3.1–2.3.5",
      source:
        "Portulans Institute & Saïd Business School, University of Oxford (2021–2025)",
    },
    {
      indicator: "Logistical Performance",
      code: "2.4",
      source: "WIPO (2022–2025)",
    },
    {
      indicator: "Workforce (Education, Employment, ICT Skills)",
      code: "3.1–3.3",
      source:
        "WIPO (2022–2025); Portulans Institute & Saïd Business School (2021–2025)",
    },
    {
      indicator: "E-Government",
      code: "4.1–4.3",
      source: "World Bank (2025a)",
    },
    {
      indicator: "Innovation (R&D, Collaboration, Knowledge)",
      code: "5.1–5.4",
      source: "WIPO (2022–2025)",
    },
    {
      indicator: "Future Technologies (Adoption & Investment)",
      code: "6.1–6.2",
      source:
        "Portulans Institute & Saïd Business School, University of Oxford (2021–2025)",
    },
    {
      indicator: "AI Strategy",
      code: "6.3",
      source: "OECD (2025)",
    },
    {
      indicator: "Market Development & Sophistication",
      code: "7.1–7.3",
      source: "WIPO (2022–2025)",
    },
    {
      indicator: "FinTech and Financial Inclusion",
      code: "8.1.1–8.1.3",
      source: "World Bank Global Findex Database 2025 (2024 survey wave)",
    },
    {
      indicator: "Market Capitalization",
      code: "8.2",
      source: "WIPO (2022–2025)",
    },
    {
      indicator: "Sustainable Development Goals",
      code: "9.1–9.7",
      source:
        "Sustainable Development Solutions Network & Bertelsmann Stiftung (2025)",
    },
  ];

  const tabContents = {
    overview: (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={styles.card}>
          <h2 className="t-h3" style={{ marginBottom: "var(--s-16)" }}>Index Overview</h2>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "14px",
              lineHeight: 1.8,
              marginBottom: "16px",
            }}
          >
            The OIC Digital Economy Index (OIC DEI) is a comprehensive framework
            measuring digital economy maturity across all {META.countryCount}{" "}
            OIC member states. It applies the Arab Digital Economy Index (ADEI)
            structure to compute index scores for {REFERENCE_YEAR} using lagged
            annual data. The index comprises {INDICATOR_COUNTS.pillars} pillars,{" "}
            {INDICATOR_COUNTS.indicators} indicators, and{" "}
            {INDICATOR_COUNTS.subIndicators} sub-indicators (Al-Khouri, 2024).
            Greater weight is assigned to Institutions, Infrastructure, and
            Technological Readiness (
            {PILLARS.find((p) => p.key === "p1").weight}% each), reflecting their
            foundational role in digital transformation.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "16px",
              marginTop: "16px",
            }}
          >
            {[
              {
                label: "Pillars",
                value: String(INDICATOR_COUNTS.pillars),
                desc: "Structural dimensions",
              },
              {
                label: "Indicators",
                value: String(INDICATOR_COUNTS.indicators),
                desc: "Measurable factors",
              },
              {
                label: "Sub-Indicators",
                value: String(INDICATOR_COUNTS.subIndicators),
                desc: "Granular metrics",
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: "var(--tint)",
                  borderRadius: "10px",
                  padding: "16px",
                  textAlign: "center",
                  border: "1px solid var(--tint-line)",
                }}
              >
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "var(--text)",
                    marginBottom: "6px",
                  }}
                >
                  {item.value}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--text)",
                    marginBottom: "4px",
                  }}
                >
                  {item.label}
                </div>
                <div style={{ fontSize: "11px", color: "var(--interactive)" }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <h2 className="t-h3" style={{ marginBottom: "var(--s-16)" }}>
            {INDICATOR_COUNTS.pillars} Pillars, {INDICATOR_COUNTS.indicators}{" "}
            Indicators & {INDICATOR_COUNTS.subIndicators} Sub-Indicators
          </h2>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {PILLARS.map((p) => {
              const pillarData = PILLAR_INDICATORS[p.key];
              return (
                <div
                  key={p.key}
                  style={{
                    background: `${p.color}10`,
                    borderRadius: "10px",
                    border: `2px solid ${p.color}50`,
                    overflow: "hidden",
                  }}
                >
                  {/* Pillar Header */}
                  <div
                    style={{
                      background: `${p.color}25`,
                      padding: "14px",
                      borderBottom: `2px solid ${p.color}50`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "16px",
                            fontWeight: 700,
                            color: p.color,
                            marginBottom: "4px",
                          }}
                        >
                          P{p.id}: {p.name}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                          }}
                        >
                          {p.dim}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: p.color,
                          background: "var(--surface)",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: `2px solid ${p.color}`,
                        }}
                      >
                        {p.weight}%
                      </span>
                    </div>
                  </div>

                  {/* Indicators & Sub-Indicators */}
                  <div style={{ padding: "12px" }}>
                    {pillarData?.indicators?.map((indicator, idx) => (
                      <div
                        key={idx}
                        style={{
                          marginBottom:
                            idx < pillarData.indicators.length - 1
                              ? "12px"
                              : "0",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: p.color,
                            marginBottom: "6px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span
                            style={{
                              background: p.color,
                              color: "var(--on-brand)",
                              borderRadius: "4px",
                              padding: "2px 8px",
                              fontSize: "11px",
                              fontWeight: 700,
                            }}
                          >
                            {indicator.code}
                          </span>
                          {indicator.name}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "6px",
                            marginLeft: "12px",
                          }}
                        >
                          {indicator.subIndicators?.map((sub, subIdx) => (
                            <div
                              key={subIdx}
                              style={{
                                background: "var(--surface)",
                                border: `1px solid ${p.color}40`,
                                borderRadius: "6px",
                                padding: "6px 10px",
                                fontSize: "11px",
                                color: "var(--text)",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  color: p.color,
                                }}
                              >
                                {sub.code}
                              </span>
                              {sub.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    ),
    methodology: (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={styles.card}>
          <h2 className="t-h3" style={{ marginBottom: "var(--s-16)" }}>Data Processing & Normalization</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "var(--text)",
                  marginBottom: "12px",
                }}
              >
                Missing Value Imputation
              </div>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "13px",
                  lineHeight: 1.7,
                  marginBottom: "10px",
                }}
              >
                For incomplete data across OIC member states, missing values are
                computed using:
              </p>
              <div
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--tint-line)",
                  borderRadius: "6px",
                  padding: "12px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--text)",
                  marginBottom: "12px",
                }}
              >
                Min - (5% × Min)
              </div>
              <p
                style={{ color: "var(--text-muted)", fontSize: "12px", lineHeight: 1.6 }}
              >
                This conservative approach ensures data integrity while
                preventing underestimation of emerging markets.
              </p>
            </div>
            <div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "var(--text)",
                  marginBottom: "12px",
                }}
              >
                Min-Max Normalization
              </div>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "13px",
                  lineHeight: 1.7,
                  marginBottom: "10px",
                }}
              >
                All indicators are normalized to a standardized 0-100 scale:
              </p>
              <div
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--tint-line)",
                  borderRadius: "6px",
                  padding: "12px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--text)",
                  marginBottom: "12px",
                  lineHeight: 1.6,
                }}
              >
                (Value - Min) / (Max - Min) × 100
              </div>
              <p
                style={{ color: "var(--text-muted)", fontSize: "12px", lineHeight: 1.6 }}
              >
                Enables fair comparison across diverse indicators and geographic
                contexts.
              </p>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <h2 className="t-h3" style={{ marginBottom: "var(--s-16)" }}>Performance Clusters</h2>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}
          >
            {[
              {
                title: "Advanced Digital Economies",
                range: "Score ≥ 60",
                color: "var(--text)",
                bgColor: "var(--tint)",
                count: "6 States",
                desc: "Well positioned to transition from infrastructure expansion toward innovation leadership. Priorities include scaling frontier R&D, strengthening patent commercialization, and contributing to global AI and data governance frameworks.",
              },
              {
                title: "Emerging Digital Economies",
                range: "Score 40–59",
                color: "var(--interactive)",
                bgColor: "var(--surface-2)",
                count: "15 States",
                desc: "Established core infrastructure but would benefit from strengthening digital skills, institutional capacity, SME digital transformation, and innovation financing to avoid middle digital stagnation.",
              },
              {
                title: "Foundational Digital Economies",
                range: "Score < 40",
                color: "var(--text-muted)",
                bgColor: "var(--surface-2)",
                count: "36 States",
                desc: "Require continued emphasis on foundational investments: affordable broadband access, digital inclusion, baseline digital literacy, and regulatory modernization to enable broad-based participation.",
              },
            ].map((cluster) => (
              <div
                key={cluster.title}
                style={{
                  background: cluster.bgColor,
                  border: `1px solid ${cluster.color}40`,
                  borderRadius: "8px",
                  padding: "16px",
                  display: "flex",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    width: "4px",
                    background: cluster.color,
                    borderRadius: "2px",
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "8px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: cluster.color,
                        }}
                      >
                        {cluster.title}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--text-muted)",
                          marginTop: "2px",
                        }}
                      >
                        {cluster.range}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: cluster.color,
                        background: "rgba(255,255,255,0.5)",
                        padding: "4px 10px",
                        borderRadius: "4px",
                      }}
                    >
                      {cluster.count}
                    </div>
                  </div>
                  <p
                    style={{
                      color: "var(--text)",
                      fontSize: "13px",
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {cluster.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    sources: (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={styles.card}>
        <h2 className="t-h3" style={{ marginBottom: "var(--s-16)" }}>Primary Data Sources</h2>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "13px",
            lineHeight: 1.8,
            marginBottom: "16px",
          }}
        >
          All data sourced from internationally recognized organizations
          including World Bank, WIPO, OECD, Portulans Institute & Saïd Business
          School (University of Oxford), and the Sustainable Development
          Solutions Network. The 2025 edition uses lagged annual data from
          multiple reporting periods for accuracy.
        </p>
        <table className="data-table zebra" style={{ marginTop: "16px" }}>
          <caption className="visually-hidden">
            Every indicator in the index and the organisation the data comes from.
          </caption>
          <thead>
            <tr>
              {["Indicator", "Code", "Source"].map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SOURCES.map((s, i) => (
              <tr
                key={i}
                style={{
                  borderBottom: "1px solid var(--surface-2)",
                  background: i % 2 === 0 ? "transparent" : "var(--surface-2)",
                }}
              >
                <td style={{ padding: "10px 8px", color: "var(--text)" }}>
                  {s.indicator}
                </td>
                <td
                  style={{
                    padding: "10px 8px",
                    color: "var(--text)",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 600,
                  }}
                >
                  {s.code}
                </td>
                <td style={{ padding: "10px 8px", color: "var(--text-muted)" }}>
                  {s.source}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Coverage notes generated from the workbook by the data-build step, so
          they always describe the dataset actually on screen. */}
      <div style={styles.card}>
        <h2 className="t-h3" style={{ marginBottom: "var(--s-16)" }}>Data Coverage &amp; Known Limitations</h2>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "13px",
            lineHeight: 1.8,
            marginBottom: "16px",
          }}
        >
          Scores are read directly from{" "}
          <span style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>
            {META.source}
          </span>{" "}
          (sheet{" "}
          <span style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>
            {META.sheets.panel}
          </span>
          ), covering {META.countryCount} member states for {YEARS[0]}–
          {YEARS[YEARS.length - 1]}. The caveats below are detected when the
          dataset is built and are reproduced here unaltered rather than
          smoothed over.
        </p>

        <div
          style={{
            background: "var(--warning-bg)",
            border: "1px solid var(--warning-line)",
            borderRadius: "10px",
            padding: "16px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--warning)",
              marginBottom: "8px",
            }}
          >
            Global Findex coverage (sub-indicators{" "}
            {FINDEX.codes.join(", ")})
          </div>
          <p
            style={{
              fontSize: "13px",
              color: "var(--warning)",
              lineHeight: 1.7,
              margin: "0 0 10px 0",
            }}
          >
            The Global Findex survey does not cover every OIC member state. Where
            an economy has no observation, the workbook substitutes the
            documented floor value (minimum observed score less 5%) rather than
            leaving a gap, which depresses that country's Financial Market
            Development score and, through it, its overall index score. This
            affects {FINDEX_IMPUTED_COUNTRIES.length} of {META.countryCount}{" "}
            countries in {FINDEX.year}, including several high-income economies
            whose actual financial inclusion is far higher than the substituted
            value implies. Read pillar 8 for those countries with that in mind.
          </p>
          <div style={{ fontSize: "12px", color: "var(--warning)", lineHeight: 1.7 }}>
            <strong>Imputed:</strong> {FINDEX_IMPUTED_COUNTRIES.join(", ")}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {DATA_QUALITY.filter((issue) => issue.id !== "findex-coverage").map(
            (issue, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                  background: "var(--surface-2)",
                  border: "1px solid var(--tint-line)",
                  borderRadius: "8px",
                  padding: "12px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    color: issue.severity === "info" ? "var(--seq-6)" : "var(--warning)",
                    background:
                      issue.severity === "info" ? "var(--tint)" : "var(--warning-bg)",
                    borderRadius: "4px",
                    padding: "3px 7px",
                    whiteSpace: "nowrap",
                    marginTop: "2px",
                  }}
                >
                  {issue.severity}
                </span>
                <span
                  style={{ fontSize: "13px", color: "var(--text)", lineHeight: 1.7 }}
                >
                  {issue.message}
                </span>
              </div>
            ),
          )}
        </div>
      </div>
      </div>
    ),
  };

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "methodology", label: "Methodology" },
    { id: "sources", label: "Data Sources" },
  ];

  // Left/right move between tabs, as the tablist pattern expects.
  const onTabKeyDown = (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const i = TABS.findIndex((t) => t.id === activeTab);
    const next = event.key === "ArrowRight" ? i + 1 : i - 1;
    const tab = TABS[(next + TABS.length) % TABS.length];
    setActiveTab(tab.id);
    document.getElementById(`methodology-tab-${tab.id}`)?.focus();
  };

  return (
    <div className="stack view-prose">
      <div className="row" role="tablist" aria-label="Methodology sections" onKeyDown={onTabKeyDown}>
        {TABS.map((tab) => (
          <button
            type="button"
            key={tab.id}
            id={`methodology-tab-${tab.id}`}
            className="btn"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-pressed={activeTab === tab.id}
            aria-controls="methodology-panel"
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div id="methodology-panel" role="tabpanel" aria-labelledby={`methodology-tab-${activeTab}`}>
        {tabContents[activeTab]}
      </div>
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          fontSize: "12px",
          color: "var(--text-muted)",
          borderTop: "1px solid var(--border)",
          marginTop: "40px",
        }}
      >
        <p>
          *Al-Khouri, A. M. (2024). Arab Digital Economy Index 2024: The rise of
          artificial intelligence applications in the Arab economy. Arab
          Federation for Digital Economy
        </p>
      </div>
    </div>
  );
}

export default Methodology;
