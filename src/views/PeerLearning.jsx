import { useState } from "react";
import {
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PolarRadiusAxis,
  Area,
} from "recharts";
import { styles } from "../styles/styles.js";
import CustomTooltip from "../components/CustomTooltip.jsx";
import {
  COUNTRIES,
  PILLARS,
} from "../data/index.js";

function PeerLearning() {
  const [selected, setSelected] = useState("Egypt");
  const [pillarFocus, setPillarFocus] = useState("p4");
  const [viewMode, setViewMode] = useState("peers"); // 'peers' or 'cases'
  const country = COUNTRIES.find((c) => c.name === selected);
  const focusPillar = PILLARS.find((p) => p.key === pillarFocus);
  const peers = COUNTRIES.filter(
    (c) =>
      c.name !== selected &&
      Math.abs(c.adei - country.adei) <= 15 &&
      c[pillarFocus] > country[pillarFocus],
  )
    .sort((a, b) => b[pillarFocus] - a[pillarFocus])
    .slice(0, 6);
  const radarData = PILLARS.map((p) => {
    const row = {
      subject: p.short,
      [country.name]: parseFloat(country[p.key].toFixed(1)),
    };
    peers.slice(0, 3).forEach((peer) => {
      row[peer.name] = parseFloat(peer[p.key].toFixed(1));
    });
    return row;
  });
  const PEER_COLORS = [
    "var(--seq-7)",
    "var(--seq-6)",
    "var(--seq-5)",
    "var(--seq-4)",
    "var(--seq-3)",
    "var(--seq-2)",
  ];
  const CASE_STUDIES = {
    p1: {
      country: "Malaysia",
      lesson:
        "Established the Malaysia Digital Economy Blueprint (MyDIGITAL) with clear KPIs, transparent regulatory sandbox, and multi-ministry digital coordination.",
    },
    p2: {
      country: "UAE",
      lesson:
        "UAE Digital Infrastructure Strategy 2031 mandated 5G coverage for all populated areas, subsidized fiber to underserved zones through universal service obligations.",
    },
    p3: {
      country: "Jordan",
      lesson:
        "Jordan Digital Skills Initiative partnered with Google, Microsoft & Coursera to certify 100,000+ youth. Dedicated tech parks attracted diaspora talent.",
    },
    p4: {
      country: "Saudi Arabia",
      lesson:
        "Absher platform digitized 70+ government services. National digital ID became foundational for e-service delivery. E-procurement mandatory for government contracts.",
    },
    p5: {
      country: "UAE",
      lesson:
        "UAE National Innovation Strategy and dedicated R&D funding lifted the country to the OIC's highest Innovation score, well ahead of the next peer. Public-private research partnerships and targeted incentives remain the core transferrable lesson.",
    },
    p6: {
      country: "UAE",
      lesson:
        "UAE National AI Strategy 2031 — designated AI minister, mandatory AI procurement for federal agencies, partnerships with MIT/Oxford for AI research hubs.",
    },
    p7: {
      country: "Indonesia",
      lesson:
        "Making Indonesia 4.0 roadmap streamlined e-commerce regulations, created unicorn accelerator program, and lowered barriers for digital MSMEs through OSS licensing.",
    },
    p8: {
      country: "Malaysia",
      lesson:
        "Malaysia Islamic Fintech regulatory sandbox attracted 60+ licensed digital Islamic banks. Shariah-compliant robo-advisory and halal payment systems grew 340% since 2019.",
    },
    p9: {
      country: "Senegal",
      lesson:
        "Digital Senegal 2025 leveraged mobile money (Wave) for government social transfers, achieving 8M+ unbanked citizens' financial inclusion and connecting 2,000+ schools via 4G.",
    },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Selection Section */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>Select Country & Focus Area</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text)",
                marginBottom: "8px",
              }}
            >
              Select Country
            </label>
            <select
              style={styles.select}
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {[...COUNTRIES]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} (Rank #{c.rank}, Score: {c.adei.toFixed(1)})
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text)",
                marginBottom: "8px",
              }}
            >
              Learning Focus
            </label>
            <select
              style={styles.select}
              value={pillarFocus}
              onChange={(e) => setPillarFocus(e.target.value)}
            >
              {PILLARS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Country Status Overview */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>{country.name} — Digital Profile</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
          }}
        >
          {[
            {
              label: "OIC DEI Rank",
              value: `#${country.rank}`,
              color: "var(--text)",
            },
            {
              label: "OIC DEI Score",
              value: country.adei.toFixed(1),
              color: "var(--interactive)",
            },
            {
              label: `${focusPillar.name} Score`,
              value: country[pillarFocus].toFixed(1),
              color: focusPillar.color,
            },
            {
              label: "Performance Gap",
              value: `-${(Math.max(...COUNTRIES.map((c) => c[pillarFocus])) - country[pillarFocus]).toFixed(1)} pts`,
              color: "var(--negative)",
            },
          ].map((s, i) => (
            <div
              key={s.label}
              style={{
                background: `${s.color}10`,
                borderRadius: "10px",
                padding: "16px",
                border: `1px solid ${s.color}30`,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  marginBottom: "6px",
                }}
              >
                {s.label}
              </div>
              <div
                style={{ fontSize: "28px", fontWeight: 700, color: s.color }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* View Toggle */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "2px solid var(--surface-2)",
          paddingBottom: "12px",
        }}
      >
        {[
          { id: "peers", label: "Peer Benchmarking" },
          { id: "cases", label: "Success Stories" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id)}
            style={{
              padding: "10px 16px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
              background: viewMode === tab.id ? "var(--surface-2)" : "transparent",
              color: viewMode === tab.id ? "var(--seq-7)" : "var(--text-muted)",
              borderBottom: viewMode === tab.id ? "3px solid #1B4332" : "none",
              transition: "all 0.2s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Peer Benchmarking View */}
      {viewMode === "peers" && peers.length > 0 ? (
        <>
          <div style={styles.card}>
            <div style={styles.cardTitle}>
              Best Peer Comparables — Similar OIC DEI, Stronger in{" "}
              {focusPillar.name}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "14px",
              }}
            >
              {peers.map((peer, i) => (
                <div
                  key={peer.name}
                  style={{
                    background: `${PEER_COLORS[i]}10`,
                    borderRadius: "10px",
                    padding: "16px",
                    border: `1px solid ${PEER_COLORS[i]}30`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "var(--text)",
                          marginBottom: "3px",
                        }}
                      >
                        {peer.name}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--text-muted)",
                        }}
                      >
                        Rank #{peer.rank}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        background: PEER_COLORS[i],
                        color: "var(--on-brand)",
                        padding: "4px 10px",
                        borderRadius: "4px",
                        fontWeight: 600,
                      }}
                    >
                      {(peer[pillarFocus] - country[pillarFocus]).toFixed(1)}{" "}
                      pts ahead
                    </span>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px",
                      marginBottom: "10px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--text-muted)",
                          marginBottom: "2px",
                        }}
                      >
                        OIC DEI Score
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "var(--text)",
                        }}
                      >
                        {peer.adei.toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--text-muted)",
                          marginBottom: "2px",
                        }}
                      >
                        {focusPillar.short}
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: PEER_COLORS[i],
                        }}
                      >
                        {peer[pillarFocus].toFixed(1)}
                      </div>
                    </div>
                  </div>
                  <div
                    style={styles.scoreBar(peer[pillarFocus], PEER_COLORS[i])}
                  />
                </div>
              ))}
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>
              Comparative Profile — Radar Analysis
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--surface-2)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "var(--text)", fontSize: 11 }}
                />
                <PolarRadiusAxis
                  domain={[0, 100]}
                  tick={{ fill: "var(--text)", fontSize: 11 }}
                />
                <Radar
                  name={country.name}
                  dataKey={country.name}
                  stroke="var(--seq-7)"
                  fill="var(--seq-7)"
                  fillOpacity={0.25}
                  strokeWidth={2.5}
                />
                {peers.slice(0, 3).map((peer, i) => (
                  <Radar
                    key={peer.name}
                    name={peer.name}
                    dataKey={peer.name}
                    stroke={PEER_COLORS[i + 1]}
                    fill={PEER_COLORS[i + 1]}
                    fillOpacity={0.08}
                    strokeWidth={1.5}
                  />
                ))}
                <Legend
                  wrapperStyle={{
                    fontSize: "11px",
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {peers.length > 0 &&
            (() => {
              const topPeer = peers[0];
              const gap = (topPeer[pillarFocus] - country[pillarFocus]).toFixed(
                1,
              );
              return (
                <div
                  style={{
                    ...styles.card,
                    background: "var(--tint)",
                    border: "1px solid var(--tint-line)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "var(--text)",
                      }}
                    >
                      Strategic Insight
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 400,
                        color: "var(--text-subtle)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      AI-assisted insight
                    </div>
                  </div>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--text)",
                      margin: 0,
                      lineHeight: 1.7,
                    }}
                  >
                    <strong>{topPeer.name}</strong> achieves{" "}
                    <strong className="strong">{gap} points higher</strong>{" "}
                    performance in <strong>{focusPillar.name}</strong> despite
                    having comparable overall OIC DEI scores. This suggests
                    targeted policy intervention in this specific pillar可 yield
                    significant competitive gains for {country.name}. Target
                    learning areas include regulatory frameworks, infrastructure
                    investments, and institutional capacity building.
                  </p>
                </div>
              );
            })()}
        </>
      ) : (
        <>
          {/* Success Stories View */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>
              Success Stories — {focusPillar.name} Excellence
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              {[
                CASE_STUDIES[pillarFocus],
                CASE_STUDIES[pillarFocus === "p4" ? "p1" : "p4"],
              ]
                .filter(Boolean)
                .map((cs, i) => (
                  <div
                    key={i}
                    style={{
                      background: "var(--surface-2)",
                      borderRadius: "10px",
                      padding: "16px",
                      border: "1px solid var(--tint-line)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "var(--text)",
                        marginBottom: "12px",
                      }}
                    >
                      {cs.country}'s Approach
                    </div>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "var(--text)",
                        lineHeight: 1.7,
                        margin: 0,
                      }}
                    >
                      {cs.lesson}
                    </p>
                  </div>
                ))}
            </div>
          </div>

          <div style={{ ...styles.card, background: "var(--surface-2)" }}>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: "8px",
              }}
            >
              Implementation Roadmap
            </div>
            <ol
              style={{
                fontSize: "13px",
                color: "var(--text)",
                lineHeight: 1.8,
                margin: 0,
                paddingLeft: "20px",
              }}
            >
              <li>
                Study regulatory and policy frameworks from peer leaders in{" "}
                {focusPillar.name}
              </li>
              <li>
                Identify resource gaps and institutional capacity requirements
              </li>
              <li>
                Develop phased implementation plan with clear KPIs and timelines
              </li>
              <li>Secure cross-ministry coordination and stakeholder buy-in</li>
              <li>Monitor progress against peer benchmarks quarterly</li>
            </ol>
          </div>
        </>
      )}

      {peers.length === 0 && viewMode === "peers" && (
        <div style={{ ...styles.card, textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>
            Achievement
          </div>
          <div style={{ fontSize: "16px", color: "var(--text)", fontWeight: 700 }}>
            Leading Performance in {focusPillar.name}
          </div>
          <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "8px" }}>
            {country.name} is among the top performers in {focusPillar.name}{" "}
            relative to similar OIC DEI countries. Focus on maintaining
            competitive advantage and thought leadership.
          </div>
        </div>
      )}
    </div>
  );
}

export default PeerLearning;
