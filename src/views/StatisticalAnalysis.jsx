import {
  Legend,
} from "recharts";
import { styles } from "../styles/styles.js";
import {
  COUNTRIES,
  META,
  PILLARS,
} from "../data/index.js";

function StatisticalAnalysis() {
  const corr = (k1, k2) => {
    const xs = COUNTRIES.map((c) => c[k1]);
    const ys = COUNTRIES.map((c) => c[k2]);
    const n = xs.length;
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
    const den = Math.sqrt(
      xs.reduce((s, x) => s + (x - mx) ** 2, 0) *
        ys.reduce((s, y) => s + (y - my) ** 2, 0),
    );
    return den === 0 ? 0 : parseFloat((num / den).toFixed(2));
  };
  const corrMatrix = PILLARS.map((p1) => ({
    name: p1.short,
    ...PILLARS.reduce((acc, p2) => {
      acc[p2.short] = corr(p1.key, p2.key);
      return acc;
    }, {}),
  }));
  const corrColor = (v) =>
    v >= 0.7
      ? "#1B4332"
      : v >= 0.4
        ? "#40916C"
        : v >= 0
          ? "#95D5B2"
          : v >= -0.4
            ? "#D4A574"
            : "#C1666B";
  const descStats = PILLARS.map((p) => {
    const vals = COUNTRIES.map((c) => c[p.key]).sort((a, b) => a - b);
    const mean = vals.reduce((a, b) => a + b) / vals.length;
    const variance =
      vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
    return {
      name: p.name,
      short: p.short,
      color: p.color,
      mean: mean.toFixed(1),
      median: vals[Math.floor(vals.length / 2)].toFixed(1),
      sd: Math.sqrt(variance).toFixed(1),
      min: vals[0].toFixed(1),
      max: vals[vals.length - 1].toFixed(1),
      q1: vals[Math.floor(vals.length * 0.25)].toFixed(1),
      q3: vals[Math.floor(vals.length * 0.75)].toFixed(1),
      range: (vals[vals.length - 1] - vals[0]).toFixed(1),
    };
  });

  const strongCorrs = [];
  corrMatrix.forEach((row, ri) => {
    PILLARS.forEach((p2, ci) => {
      const v = row[p2.short];
      if (Math.abs(v) >= 0.7 && ri < ci) {
        strongCorrs.push({
          p1: PILLARS[ri].name,
          p2: p2.name,
          corr: v,
        });
      }
    });
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Overview Summary */}
      <div style={styles.grid4}>
        <div style={styles.card}>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 900,
              color: "#1B4332",
            }}
          >
            57
          </div>
          <div style={{ fontSize: "12px", color: "#64748B" }}>
            OIC Member States
          </div>
        </div>
        <div style={styles.card}>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 900,
              color: "#2D6A4F",
            }}
          >
            9
          </div>
          <div style={{ fontSize: "12px", color: "#64748B" }}>
            Pillars Analyzed
          </div>
        </div>
        <div style={styles.card}>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 900,
              color: "#40916C",
            }}
          >
            {strongCorrs.length}
          </div>
          <div style={{ fontSize: "12px", color: "#64748B" }}>
            Strong Correlations
          </div>
        </div>
        <div style={styles.card}>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 900,
              color: "#52B788",
            }}
          >
            0–100
          </div>
          <div style={{ fontSize: "12px", color: "#64748B" }}>Score Range</div>
        </div>
      </div>

      {/* Descriptive Statistics */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          Descriptive Statistics — All {PILLARS.length} Pillars (n={META.countryCount}{" "}
          countries)
        </div>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid #1B4332" }}>
                {[
                  "Pillar",
                  "Mean",
                  "Median",
                  "Std Dev",
                  "Range",
                  "Min",
                  "Q1",
                  "Q3",
                  "Max",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 10px",
                      color: "#1B4332",
                      textAlign: "center",
                      fontFamily: "'Georgia',serif",
                      fontSize: "11px",
                      fontWeight: 700,
                      background: "#F8FDFC",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {descStats.map((s, i) => (
                <tr
                  key={s.short}
                  style={{
                    borderBottom: "1px solid #E2E8F0",
                    background: i % 2 === 0 ? "transparent" : "#F8FDFC",
                  }}
                >
                  <td
                    style={{
                      padding: "10px",
                      color: s.color,
                      fontWeight: 700,
                      fontSize: "12px",
                    }}
                  >
                    {s.short}
                  </td>
                  {[
                    s.mean,
                    s.median,
                    s.sd,
                    s.range,
                    s.min,
                    s.q1,
                    s.q3,
                    s.max,
                  ].map((v, vi) => (
                    <td
                      key={vi}
                      style={{
                        padding: "10px",
                        textAlign: "center",
                        color: "#1E293B",
                        fontSize: "11px",
                      }}
                    >
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginTop: "14px",
            padding: "12px",
            background: "#D8F3DC",
            border: "1px solid #1B4332",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#1B4332",
            }}
          >
            Key Observations
          </div>
          <div style={{ fontSize: "12px", color: "#1E293B", lineHeight: 1.6 }}>
            The OIC member states display wide variability in pillar
            performance, with standard deviations ranging from ~15–25 points.
            This indicates substantial dispersion in digital economy maturity
            across member countries, suggesting opportunities for peer learning
            and targeted capacity building.
          </div>
        </div>
      </div>

      {/* Inter-Pillar Correlation Matrix */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>Inter-Pillar Correlation Analysis</div>
        <div
          style={{ fontSize: "13px", color: "#64748B", marginBottom: "12px" }}
        >
          Pearson correlation coefficients (r) between pillar scores across all
          57 OIC countries. Values closer to 1 indicate strong positive
          relationships.
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", fontSize: "11px" }}>
            <thead>
              <tr style={{ background: "#F8FDFC" }}>
                <th
                  style={{
                    padding: "8px 10px",
                    color: "#1B4332",
                    fontWeight: 700,
                    borderBottom: "2px solid #1B4332",
                  }}
                >
                  Pillar
                </th>
                {PILLARS.map((p) => (
                  <th
                    key={p.key}
                    style={{
                      padding: "8px 6px",
                      color: p.color,
                      fontSize: "10px",
                      textAlign: "center",
                      fontWeight: 700,
                      borderBottom: "2px solid #1B4332",
                    }}
                  >
                    {p.short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {corrMatrix.map((row, ri) => (
                <tr key={row.name}>
                  <td
                    style={{
                      padding: "8px 10px",
                      color: PILLARS[ri].color,
                      fontWeight: 700,
                      borderRight: "1px solid #E2E8F0",
                    }}
                  >
                    {row.name}
                  </td>
                  {PILLARS.map((p2) => {
                    const v = row[p2.short];
                    const absV = Math.abs(v);
                    return (
                      <td
                        key={p2.key}
                        style={{ padding: "4px 2px", textAlign: "center" }}
                      >
                        <div
                          style={{
                            background: `${corrColor(v)}${Math.round(absV * 150)
                              .toString(16)
                              .padStart(2, "0")}`,
                            borderRadius: "4px",
                            padding: "6px 4px",
                            color: v === 1 ? "#FFFFFF" : "#1E293B",
                            fontWeight: v === 1 ? 900 : 600,
                            fontSize: "10px",
                          }}
                        >
                          {v}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Correlation Legend & Insights */}
        <div style={{ marginTop: "14px" }}>
          <div style={{ marginBottom: "10px" }}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {[
                ["#1B4332", "Strong (≥0.7)", "Highly related"],
                ["#40916C", "Moderate (0.4–0.7)", "Moderately related"],
                ["#95D5B2", "Weak (0–0.4)", "Weakly related"],
                ["#D4A574", "Very weak (−0.4–0)", "Minimal relationship"],
                ["#C1666B", "Negative (<−0.4)", "Inverse relationship"],
              ].map(([c, label, desc]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "11px",
                    color: "#1E293B",
                  }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      background: c,
                      borderRadius: "2px",
                    }}
                  />
                  <span style={{ fontWeight: 600 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {strongCorrs.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                marginTop: "12px",
                padding: "12px",
                background: "#D8F3DC",
                border: "1px solid #1B4332",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#1B4332",
                }}
              >
                Strong Pillar Relationships
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                {strongCorrs.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: "12px",
                      color: "#1E293B",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>
                      <strong>{s.p1}</strong> ↔ <strong>{s.p2}</strong>
                    </span>
                    <span
                      style={{
                        color: "#1B4332",
                        fontWeight: 700,
                      }}
                    >
                      r = {s.corr}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StatisticalAnalysis;
