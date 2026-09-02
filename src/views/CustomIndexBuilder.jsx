import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { styles } from "../styles/styles.js";
import CustomTooltip from "../components/CustomTooltip.jsx";
import {
  PILLARS,
} from "../data/index.js";

function CustomIndexBuilder() {
  const defaultWeights = PILLARS.reduce((acc, p) => {
    acc[p.key] = p.weight;
    return acc;
  }, {});
  const [weights, setWeights] = useState(defaultWeights);
  const [preset, setPreset] = useState("official");

  const totalWeight = Object.values(weights).reduce((s, v) => s + v, 0);

  const normalize = (w) => {
    const total = Object.values(w).reduce((s, v) => s + v, 0);
    const out = {};
    Object.keys(w).forEach((k) => {
      out[k] = w[k] / total;
    });
    return out;
  };

  const computeCustomOICDEI = (country) => {
    const norm = normalize(weights);
    return PILLARS.reduce((s, p) => s + country[p.key] * norm[p.key], 0);
  };

  const customRanked = [...COUNTRIES]
    .map((c) => ({
      ...c,
      customScore: parseFloat(computeCustomOICDEI(c).toFixed(2)),
    }))
    .sort((a, b) => b.customScore - a.customScore)
    .map((c, i) => ({ ...c, customRank: i + 1, rankChange: c.rank - (i + 1) }));

  const PRESETS = {
    // The published weights, read from the workbook rather than restated here.
    official: { label: "Official OIC DEI Weights", w: defaultWeights },
    govFocus: {
      label: "Governance-Focused",
      w: {
        p1: 25,
        p2: 10,
        p3: 10,
        p4: 20,
        p5: 5,
        p6: 10,
        p7: 5,
        p8: 5,
        p9: 10,
      },
    },
    innovFocus: {
      label: "Innovation-First",
      w: { p1: 10, p2: 10, p3: 15, p4: 5, p5: 25, p6: 20, p7: 5, p8: 5, p9: 5 },
    },
    inclusive: {
      label: "Digital Inclusion",
      w: {
        p1: 10,
        p2: 20,
        p3: 20,
        p4: 10,
        p5: 5,
        p6: 10,
        p7: 5,
        p8: 5,
        p9: 15,
      },
    },
    market: {
      label: "Market-Driven",
      w: {
        p1: 10,
        p2: 10,
        p3: 10,
        p4: 5,
        p5: 15,
        p6: 15,
        p7: 20,
        p8: 15,
        p9: 0,
      },
    },
  };

  const applyPreset = (key) => {
    setPreset(key);
    setWeights(PRESETS[key].w);
  };
  const topMoverUp = customRanked
    .filter((c) => c.rankChange > 0)
    .sort((a, b) => b.rankChange - a.rankChange)
    .slice(0, 5);
  const topMoverDown = customRanked
    .filter((c) => c.rankChange < 0)
    .sort((a, b) => a.rankChange - b.rankChange)
    .slice(0, 5);
  const compData = customRanked.slice(0, 20).map((c) => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
    Official: parseFloat(c.adei.toFixed(1)),
    Custom: c.customScore,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div
        style={{
          ...styles.card,
          borderColor: "var(--border-strong)",
          background: "linear-gradient(135deg,var(--surface),var(--surface-2))",
          borderWidth: "2px",
        }}
      >
        <div style={{ ...styles.cardTitle, color: "var(--text)" }}>
          Custom Index Builder — Sensitivity Analysis Tool
        </div>
        <p
          style={{
            color: "var(--text)",
            fontSize: "13px",
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          Re-weight the 9 pillars to see how rankings shift under alternative
          policy priorities. Use presets or manually adjust sliders. Weights
          auto-normalize to 100%. Essential for{" "}
          <strong style={{ color: "var(--text)" }}>
            academic sensitivity analysis
          </strong>{" "}
          and <strong style={{ color: "var(--text)" }}>scenario planning</strong>.
        </p>
      </div>
      <div style={styles.card}>
        <div style={styles.cardTitle}>Weight Presets</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {Object.entries(PRESETS).map(([key, p]) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid",
                cursor: "pointer",
                fontSize: "12px",
                background: preset === key ? "var(--tint)" : "var(--surface-2)",
                borderColor: preset === key ? "var(--seq-7)" : "var(--seq-2)",
                color: preset === key ? "var(--seq-7)" : "var(--seq-6)",
                fontWeight: preset === key ? 700 : 500,
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div style={styles.card}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <div style={styles.cardTitle}>Pillar Weights</div>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: Math.abs(totalWeight - 100) < 1 ? "var(--seq-5)" : "var(--seq-3)",
            }}
          >
            Total: {totalWeight}%{" "}
            {Math.abs(totalWeight - 100) < 1 ? "✓" : "(will auto-normalize)"}
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "16px",
          }}
        >
          {PILLARS.map((p) => (
            <div key={p.key}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}
              >
                <span
                  style={{ fontSize: "12px", color: p.color, fontWeight: 600 }}
                >
                  {p.name}
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--text)",
                  }}
                >
                  {weights[p.key]}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={weights[p.key]}
                onChange={(e) => {
                  setPreset("custom");
                  setWeights((w) => ({
                    ...w,
                    [p.key]: parseInt(e.target.value),
                  }));
                }}
                style={{
                  width: "100%",
                  accentColor: p.color,
                  cursor: "pointer",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  color: "var(--text)",
                }}
              >
                <span>0%</span>
                <span>Official: {p.weight}%</span>
                <span>40%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={styles.grid2}>
        <div
          style={{ ...styles.card, borderColor: "var(--tint-line)", borderWidth: "2px" }}
        >
          <div style={{ ...styles.cardTitle, color: "var(--interactive)" }}>
            Rank Gainers
          </div>
          {topMoverUp.map((c) => (
            <div
              key={c.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "8px",
                padding: "8px",
                background: "var(--tint)",
                borderRadius: "6px",
              }}
            >
              <div style={{ fontSize: "18px", color: "var(--interactive)" }}>↑</div>
              <div style={{ flex: 1 }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      color: "var(--text)",
                      fontWeight: 600,
                    }}
                  >
                    {c.name}
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      color: "var(--interactive)",
                      fontWeight: 700,
                    }}
                  >
                    +{c.rankChange} places
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "var(--interactive)" }}>
                  #{c.rank} → #{c.customRank} | {c.adei.toFixed(1)} →{" "}
                  {c.customScore.toFixed(1)}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div
          style={{ ...styles.card, borderColor: "var(--seq-3)", borderWidth: "2px" }}
        >
          <div style={{ ...styles.cardTitle, color: "var(--text-muted)" }}>
            Rank Decliners
          </div>
          {topMoverDown.map((c) => (
            <div
              key={c.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "8px",
                padding: "8px",
                background: "var(--surface-2)",
                borderRadius: "6px",
              }}
            >
              <div style={{ fontSize: "18px", color: "var(--text-muted)" }}>↓</div>
              <div style={{ flex: 1 }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      color: "var(--text)",
                      fontWeight: 600,
                    }}
                  >
                    {c.name}
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      color: "var(--text-muted)",
                      fontWeight: 700,
                    }}
                  >
                    {c.rankChange} places
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "var(--interactive)" }}>
                  #{c.rank} → #{c.customRank} | {c.adei.toFixed(1)} →{" "}
                  {c.customScore.toFixed(1)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          Official vs Custom Score — Leading 20 Countries
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={compData} barSize={12}>
            <CartesianGrid
              strokeDasharray="0"
              stroke="var(--surface-2)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: "var(--text)", fontSize: 11, fontWeight: 600 }}
              angle={-30}
              textAnchor="end"
              height={60}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "var(--text)", fontSize: 11, fontWeight: 600 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                fontSize: "12px",
                fontWeight: 600,
              }}
            />
            <Bar dataKey="Official" fill="var(--seq-2)" />
            <Bar dataKey="Custom" fill="var(--seq-5)" />
          </BarChart>
        </ResponsiveContainer>
        {(() => {
          const biggestGainer = [...customRanked].sort(
            (a, b) => b.rankChange - a.rankChange,
          )[0];
          const biggestLoser = [...customRanked].sort(
            (a, b) => a.rankChange - b.rankChange,
          )[0];
          const scoreDiff = biggestGainer
            ? (biggestGainer.customScore - biggestGainer.adei).toFixed(1)
            : 0;
          return (
            <div
              style={{
                background: "var(--tint)",
                border: "1px solid var(--border-strong)",
                borderRadius: "8px",
                padding: "12px 14px",
                marginTop: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "6px",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
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
                  fontSize: "12px",
                  color: "var(--text)",
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                Under the current weight settings,{" "}
                <strong>{biggestGainer?.name}</strong> gains the most (+
                {biggestGainer?.rankChange} ranks, score{" "}
                {biggestGainer?.adei.toFixed(1)} →{" "}
                {biggestGainer?.customScore.toFixed(1)}), while{" "}
                <strong>{biggestLoser?.name}</strong> drops the most (
                {biggestLoser?.rankChange} ranks). Adjusting pillar weights
                reveals which countries are under- or over-valued by the
                official index.
              </p>
            </div>
          );
        })()}
      </div>
      <div style={styles.card}>
        <div style={styles.cardTitle}>Full Custom Rankings</div>
        <div
          style={{ overflowX: "auto", maxHeight: "400px", overflowY: "auto" }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
            }}
          >
            <thead
              style={{ position: "sticky", top: 0, background: "var(--surface)" }}
            >
              <tr style={{ borderBottom: "1px solid var(--accent-line)" }}>
                {[
                  "Custom #",
                  "Official #",
                  "Δ Rank",
                  "Country",
                  "Official Score",
                  "Custom Score",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 8px",
                      color: "var(--text)",
                      textAlign: "center",
                      fontSize: "11px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customRanked.map((c, i) => (
                <tr
                  key={c.name}
                  style={{
                    borderBottom: "1px solid var(--border)",
                    background: i % 2 === 0 ? "transparent" : "var(--surface-2)",
                  }}
                >
                  <td
                    style={{
                      padding: "7px 8px",
                      textAlign: "center",
                      fontWeight: 700,
                      color: "var(--info)",
                    }}
                  >
                    #{c.customRank}
                  </td>
                  <td
                    style={{
                      padding: "7px 8px",
                      textAlign: "center",
                      color: "var(--text)",
                    }}
                  >
                    #{c.rank}
                  </td>
                  <td
                    style={{
                      padding: "7px 8px",
                      textAlign: "center",
                      fontWeight: 700,
                      color:
                        c.rankChange > 0
                          ? "var(--positive)"
                          : c.rankChange < 0
                            ? "var(--negative)"
                            : "var(--text-muted)",
                    }}
                  >
                    {c.rankChange > 0
                      ? `+${c.rankChange}`
                      : c.rankChange === 0
                        ? "–"
                        : c.rankChange}
                  </td>
                  <td
                    style={{
                      padding: "7px 8px",
                      color: "var(--text)",
                      fontWeight: 600,
                    }}
                  >
                    {c.name}
                  </td>
                  <td
                    style={{
                      padding: "7px 8px",
                      textAlign: "center",
                      color: "var(--text)",
                    }}
                  >
                    {c.adei.toFixed(1)}
                  </td>
                  <td
                    style={{
                      padding: "7px 8px",
                      textAlign: "center",
                      fontWeight: 700,
                      color: "var(--info)",
                    }}
                  >
                    {c.customScore.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CustomIndexBuilder;
