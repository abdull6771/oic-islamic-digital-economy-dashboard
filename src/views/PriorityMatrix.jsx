import { useState } from "react";
import { styles } from "../styles/styles.js";
import {
  COUNTRIES,
  PILLARS,
  REGIONS,
} from "../data/index.js";

function PriorityMatrix() {
  const [selected, setSelected] = useState("Jordan");
  const country = COUNTRIES.find((c) => c.name === selected);
  const matrixData = PILLARS.map((p) => {
    const currentScore = country[p.key];
    const potential = 100 - currentScore;
    const regionPeers = COUNTRIES.filter(
      (c) =>
        REGIONS[c.name] === REGIONS[country.name] && c.name !== country.name,
    );
    const peerAvg = regionPeers.length
      ? regionPeers.reduce((s, c) => s + c[p.key], 0) / regionPeers.length
      : 50;
    const achievability = Math.min(100, (peerAvg / 100) * 100);
    const impact = (p.weight / 100) * potential;
    let quadrant = "";
    if (achievability >= 40 && impact >= 10) quadrant = "Quick Wins";
    else if (achievability < 40 && impact >= 10)
      quadrant = "Long-Term Investment";
    else if (achievability >= 40 && impact < 10) quadrant = "Low Priority";
    else quadrant = "Deprioritize";
    return {
      name: p.name,
      short: p.short,
      color: p.color,
      currentScore,
      potential,
      achievability,
      impact,
      quadrant,
      weight: p.weight,
    };
  });
  const QUADRANT_COLORS = {
    "Quick Wins": "var(--positive)",
    "Long-Term Investment": "var(--warning)",
    "Low Priority": "var(--info)",
    Deprioritize: "var(--text-muted)",
  };
  const QUADRANT_DESC = {
    "Quick Wins": "High impact & achievable — Prioritize immediately",
    "Long-Term Investment":
      "High impact but difficult — Strategic multi-year focus",
    "Low Priority": "Achievable but lower reward — Maintain current effort",
    Deprioritize: "Low impact & difficult — Defer resources elsewhere",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <select
          style={styles.select}
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {[...COUNTRIES]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
        </select>
        <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          OIC DEI:{" "}
          <span style={{ color: "var(--text)", fontWeight: 700 }}>
            {country.adei.toFixed(1)}
          </span>{" "}
          | Rank{" "}
          <span style={{ color: "var(--text)", fontWeight: 700 }}>
            #{country.rank}
          </span>
        </div>
      </div>
      <div style={{ ...styles.card, borderColor: "var(--accent-line)" }}>
        <div style={styles.cardTitle}>
          📌 Priority Matrix — Impact vs. Achievability for {country.name}
        </div>
        <div
          style={{
            position: "relative",
            height: "420px",
            background: "var(--surface-2)",
            borderRadius: "10px",
            padding: "20px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 0,
              bottom: 0,
              width: "1px",
              background: "var(--border-strong)",
              transform: "translateX(-50%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              height: "1px",
              background: "var(--border-strong)",
              transform: "translateY(-50%)",
            }}
          />
          {[
            { label: "🚀 Quick Wins", x: "75%", y: "10%", color: "var(--positive)" },
            {
              label: "🏗 Long-Term Investment",
              x: "15%",
              y: "10%",
              color: "var(--warning)",
            },
            { label: "📌 Low Priority", x: "75%", y: "85%", color: "var(--info)" },
            { label: "⬇ Deprioritize", x: "15%", y: "85%", color: "var(--text-muted)" },
          ].map((q) => (
            <div
              key={q.label}
              style={{
                position: "absolute",
                left: q.x,
                top: q.y,
                fontSize: "11px",
                fontWeight: 700,
                color: q.color,
                transform: "translateX(-50%)",
                whiteSpace: "nowrap",
              }}
            >
              {q.label}
            </div>
          ))}
          <div
            style={{
              position: "absolute",
              bottom: "4px",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: "11px",
              color: "var(--text)",
            }}
          >
            ← Low Achievability | High Achievability →
          </div>
          <div
            style={{
              position: "absolute",
              left: "4px",
              top: "50%",
              transform: "translateY(-50%) rotate(-90deg)",
              fontSize: "11px",
              color: "var(--text)",
              whiteSpace: "nowrap",
            }}
          >
            ← Low Impact | High Impact →
          </div>
          {matrixData.map((d) => {
            const x = (d.achievability / 100) * 88 + 6;
            const y = 92 - (d.impact / 20) * 80;
            return (
              <div
                key={d.name}
                style={{
                  position: "absolute",
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: "translate(-50%,-50%)",
                  zIndex: 10,
                }}
              >
                <div
                  title={`${d.name}: Score ${d.currentScore.toFixed(0)}, Impact ${d.impact.toFixed(1)}`}
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    background: d.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--on-brand)",
                    textAlign: "center",
                    lineHeight: 1.1,
                    border: "2px solid var(--surface-2)",
                    boxShadow: `0 0 12px ${d.color}60`,
                    cursor: "pointer",
                  }}
                >
                  {d.short.slice(0, 6)}
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "-20px",
                    transform: "translateX(-50%)",
                    fontSize: "11px",
                    color: d.color,
                    whiteSpace: "nowrap",
                    fontWeight: 700,
                  }}
                >
                  {d.currentScore.toFixed(0)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
      >
        {Object.entries(QUADRANT_COLORS).map(([q, color]) => {
          const items = matrixData.filter((d) => d.quadrant === q);
          return (
            <div key={q} style={{ ...styles.card, borderColor: `${color}40` }}>
              <div style={{ ...styles.cardTitle, color }}>{q}</div>
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text)",
                  marginBottom: "10px",
                }}
              >
                {QUADRANT_DESC[q]}
              </div>
              {items.map((d) => (
                <div
                  key={d.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "5px 0",
                    borderBottom: "1px solid var(--border)",
                    fontSize: "12px",
                  }}
                >
                  <span style={{ color: d.color, fontWeight: 600 }}>
                    {d.name}
                  </span>
                  <span style={{ color: "var(--text-muted)" }}>
                    Score: {d.currentScore.toFixed(0)} | Gap:{" "}
                    {d.potential.toFixed(0)}
                  </span>
                </div>
              ))}
              {items.length === 0 && (
                <div style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                  None in this quadrant
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PriorityMatrix;
