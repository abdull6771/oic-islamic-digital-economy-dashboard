import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ReferenceLine,
} from "recharts";
import { styles } from "../styles/styles.js";
import CustomTooltip from "../components/CustomTooltip.jsx";
import {
  COUNTRIES,
  PILLARS,
  PILLAR_INDICATORS,
} from "../data/index.js";

function PillarAnalysis() {
  const [pillarIdx, setPillarIdx] = useState(0);
  const pillar = PILLARS[pillarIdx];
  const sorted = [...COUNTRIES].sort((a, b) => b[pillar.key] - a[pillar.key]);
  const avg =
    COUNTRIES.reduce((s, c) => s + c[pillar.key], 0) / COUNTRIES.length;

  // Editorial commentary per pillar. Deliberately carries no scores or country
  // rankings — those are read from the data and rendered alongside it, so the
  // copy cannot go stale when the workbook is refreshed.
  const INSIGHTS = {
    p1: "Institutions form the governance bedrock of digital transformation, combining political stability, regulatory quality and technology governance.",
    p2: "Infrastructure underpins all digital activity. Many African member states score below 20, marking foundational connectivity investment as the clearest opportunity.",
    p3: "Workforce capability remains a major area of focus, and conflict-affected states in particular show substantial room for capacity building.",
    p4: "E-Government is the OIC's standout strength: state-led digitisation has produced high service-delivery scores across very diverse economies.",
    p5: "Innovation is the OIC's key area for growth. Even the strongest performers sit well below the global frontier, reflecting limited private-sector R&D intensity relative to digital infrastructure.",
    p6: "Technological readiness varies more widely than any other pillar. GCC states score highest on the strength of AI strategies and emerging-technology adoption.",
    p7: "Market development is strongest across Southeast Asia and the Levant, where startup ecosystems and access to finance are deepest.",
    p8: "Financial Market Development is the most unevenly measured pillar. It combines stock-market capitalisation with Global Findex financial-inclusion data, and the Findex survey does not cover every member state — several high-income economies therefore carry an imputed floor value here rather than an observation. Islamic FinTech remains an emerging strategic advantage for the GCC and Malaysia.",
    p9: "SDG impact scores track progress on access and inclusion, particularly health-system integration and connectivity.",
  };

  const leaders = sorted.slice(0, 3);
  const scoreOf = (c) => c[pillar.key].toFixed(2);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Pillar Selector */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>Select Pillar to Analyze</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {PILLARS.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setPillarIdx(i)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: `1px solid ${i === pillarIdx ? p.color : "var(--text-subtle)"}`,
                cursor: "pointer",
                fontSize: "12px",
                background: i === pillarIdx ? `${p.color}20` : "transparent",
                color: i === pillarIdx ? p.color : "var(--text-muted)",
                fontWeight: i === pillarIdx ? 700 : 400,
              }}
            >
              {p.name} ({p.weight}%)
            </button>
          ))}
        </div>
      </div>

      {/* Pillar Stats */}
      <div style={styles.grid4}>
        {[
          { label: "Pillar Name", value: pillar.name, color: pillar.color },
          { label: "Weight", value: `${pillar.weight}%`, color: "var(--text)" },
          { label: "OIC Average", value: avg.toFixed(1), color: "var(--positive)" },
          { label: "Dimension", value: pillar.dim, color: "var(--info)" },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              ...styles.card,
              textAlign: "center",
              borderColor: `${pillar.color}40`,
            }}
          >
            <div style={{ fontSize: "18px", fontWeight: 700, color: s.color }}>
              {s.value}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text)",
                marginTop: "4px",
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Key Insight */}
      <div
        style={{
          ...styles.card,
          borderColor: `${pillar.color}40`,
          background: `linear-gradient(135deg, var(--surface) 0%, ${pillar.color}08 100%)`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "8px",
            ...styles.cardTitle,
            color: pillar.color,
          }}
        >
          <div>Key insight</div>
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
            color: "var(--text)",
            fontSize: "14px",
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          {INSIGHTS[pillar.key]}{" "}
          <strong style={{ color: "var(--text)" }}>{leaders[0].name}</strong> leads
          on {pillar.name} ({scoreOf(leaders[0])}), ahead of {leaders[1].name} (
          {scoreOf(leaders[1])}) and {leaders[2].name} ({scoreOf(leaders[2])}),
          against an OIC average of {avg.toFixed(2)}.
        </p>
      </div>

      {/* Indicators & Sub-Indicators */}
      {PILLAR_INDICATORS[pillar.key] && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Indicators & Sub-Indicators</div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {PILLAR_INDICATORS[pillar.key].indicators.map((indicator, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom:
                    idx < PILLAR_INDICATORS[pillar.key].indicators.length - 1
                      ? "12px"
                      : "0",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: pillar.color,
                    marginBottom: "6px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      background: pillar.color,
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
                        border: `1px solid ${pillar.color}40`,
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
                          color: pillar.color,
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
      )}

      {/* Full Rankings Bar Chart */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          All Countries — {pillar.name} Rankings
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={sorted.map((c) => ({
              name: c.name,
              score: parseFloat(c[pillar.key].toFixed(1)),
            }))}
            barSize={12}
          >
            <CartesianGrid
              strokeDasharray="0"
              stroke="var(--surface-2)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tickFormatter={(name) =>
                name.length > 15 ? name.slice(0, 14) + "…" : name
              }
              tick={{ fill: "var(--text-muted)", fontSize: 11, fontWeight: 500 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis domain={[0, 100]} tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="score"
              name={pillar.name}
              fill={pillar.color}
              fillOpacity={0.85}
              radius={[4, 4, 0, 0]}
            />
            <ReferenceLine
              y={avg}
              stroke="var(--accent)"
              strokeDasharray="4 4"
              label={{
                value: `Avg: ${avg.toFixed(1)}`,
                fill: "var(--accent-ink)",
                fontSize: 11,
                fontWeight: 600,
                position: "insideTopRight",
              }}
            />
          </BarChart>
        </ResponsiveContainer>
        <div
          style={{
            background: "var(--accent-soft)",
            border: "1px solid var(--accent)",
            borderRadius: "8px",
            padding: "10px 14px",
            marginTop: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "8px",
              marginBottom: "4px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--text)",
              }}
            >
              Key insight
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
              fontSize: "12px",
              color: "var(--text)",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            <strong>{sorted[0].name}</strong> leads in {pillar.name} with a
            score of <strong>{sorted[0][pillar.key].toFixed(1)}</strong>, while{" "}
            <strong>{sorted[sorted.length - 1].name}</strong> scores lowest at{" "}
            <strong>{sorted[sorted.length - 1][pillar.key].toFixed(1)}</strong>{" "}
            — a{" "}
            <strong>
              {(
                sorted[0][pillar.key] - sorted[sorted.length - 1][pillar.key]
              ).toFixed(0)}
              -point divide
            </strong>
            .{" "}
            <strong>
              {COUNTRIES.filter((c) => c[pillar.key] >= avg).length} of 57
            </strong>{" "}
            countries score at or above the OIC average of {avg.toFixed(1)}.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PillarAnalysis;
