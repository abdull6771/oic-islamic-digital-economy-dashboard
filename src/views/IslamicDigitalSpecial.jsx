import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
} from "recharts";
import { styles } from "../styles/styles.js";
import {
  COUNTRIES,
} from "../data/index.js";

function IslamicDigitalSpecial() {
  const fintech = [...COUNTRIES].sort((a, b) => b.p8 - a.p8).slice(0, 15);
  const innovators = [...COUNTRIES].sort((a, b) => b.p5 - a.p5).slice(0, 15);

  const QUADRANT_DATA = COUNTRIES.map((c) => ({
    name: c.name,
    x: c.p5,
    y: c.p8,
    z: c.adei,
    color: c.adei >= 60 ? "var(--positive)" : c.adei >= 40 ? "var(--warning)" : "var(--negative)",
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div
        style={{
          ...styles.card,
          borderColor: "var(--accent-line)",
          background: "var(--surface)",
        }}
      >
        <div style={styles.cardTitle}>
          🕌 Islamic Digital Economy Special Analysis
        </div>
        <p
          style={{
            color: "var(--text)",
            fontSize: "14px",
            lineHeight: 1.8,
            margin: 0,
          }}
        >
          A unique strategic opportunity is emerging within the OIC bloc: the
          convergence of{" "}
          <strong style={{ color: "var(--text)" }}>Islamic Finance</strong> and{" "}
          <strong style={{ color: "var(--positive)" }}>digital technology</strong>.
          Nations such as Malaysia, Saudi Arabia, and the UAE are leveraging
          Islamic Fintech as a globally competitive advantage. Meanwhile,
          Innovation remains a key systemic area for growth for the OIC — the
          region produces far more digital consumers than digital innovators.
        </p>
      </div>

      {/* Innovation vs Financial Markets Scatter */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          Innovation vs. Financial Market Development (Scatter)
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-strong)" />
            <XAxis
              type="number"
              dataKey="x"
              name="Innovation Score"
              domain={[0, 100]}
              tick={{ fill: "var(--text)", fontSize: 11 }}
              label={{
                value: "Innovation →",
                fill: "var(--text)",
                fontSize: 11,
                position: "insideBottom",
                offset: -5,
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Financial Market Score"
              domain={[0, 100]}
              tick={{ fill: "var(--text)", fontSize: 11 }}
              label={{
                value: "Financial Markets →",
                fill: "var(--text)",
                fontSize: 11,
                angle: -90,
                position: "insideLeft",
              }}
            />
            <ZAxis type="number" dataKey="z" range={[40, 400]} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div style={styles.tooltip}>
                    <div style={{ color: "var(--text)", fontWeight: 700 }}>
                      {d.name}
                    </div>
                    <div>Innovation: {d.x.toFixed(1)}</div>
                    <div>Fin. Markets: {d.y.toFixed(1)}</div>
                    <div>OIC DEI: {d.z.toFixed(1)}</div>
                  </div>
                );
              }}
            />
            <Scatter data={QUADRANT_DATA}>
              {QUADRANT_DATA.map((d, i) => (
                <Cell key={i} fill={d.color} fillOpacity={0.7} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        {(() => {
          const innovAvg =
            COUNTRIES.reduce((s, c) => s + c.p5, 0) / COUNTRIES.length;
          const finAvg =
            COUNTRIES.reduce((s, c) => s + c.p8, 0) / COUNTRIES.length;
          const highBoth = QUADRANT_DATA.filter(
            (d) => d.x >= innovAvg && d.y >= finAvg,
          );
          const topInnovator = QUADRANT_DATA.reduce((a, b) =>
            a.x > b.x ? a : b,
          );
          const topFintech = QUADRANT_DATA.reduce((a, b) =>
            a.y > b.y ? a : b,
          );
          return (
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
                Only <strong>{highBoth.length} countries</strong> score above
                the OIC average in both Innovation and Financial Markets — the
                rare "dual leaders". <strong>{topInnovator.name}</strong> leads
                in Innovation ({topInnovator.x.toFixed(1)}) and{" "}
                <strong>{topFintech.name}</strong> in Financial Market
                Development ({topFintech.y.toFixed(1)}). Most OIC nations
                concentrate in the lower-left quadrant, signalling a systemic
                gap in private-sector digital innovation.
              </p>
            </div>
          );
        })()}
      </div>

      <div style={styles.grid2}>
        {/* Leading Islamic Fintech */}
        <div style={styles.card}>
          <div style={{ ...styles.cardTitle, color: "var(--negative)" }}>
            🏦 Leading 15 — Financial Market Development
          </div>
          {fintech.map((c, i) => (
            <div
              key={c.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  ...styles.rankBadge,
                  background:
                    i < 3
                      ? "linear-gradient(135deg,#EC4899,#9D174D)"
                      : "var(--surface)",
                  color: "var(--text)",
                  fontSize: "11px",
                }}
              >
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {c.name}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--negative)",
                    }}
                  >
                    {c.p8.toFixed(1)}
                  </span>
                </div>
                <div style={styles.scoreBar(c.p8, "var(--negative)")} />
              </div>
            </div>
          ))}
        </div>

        {/* Leading Innovators */}
        <div style={styles.card}>
          <div style={{ ...styles.cardTitle, color: "var(--negative)" }}>
            Leading 15 — Innovation Leaders
          </div>
          {innovators.map((c, i) => (
            <div
              key={c.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  ...styles.rankBadge,
                  background:
                    i < 3
                      ? "linear-gradient(135deg,#EF4444,#7F1D1D)"
                      : "var(--surface)",
                  color: "var(--text)",
                  fontSize: "11px",
                }}
              >
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {c.name}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--negative)",
                    }}
                  >
                    {c.p5.toFixed(1)}
                  </span>
                </div>
                <div style={styles.scoreBar(c.p5, "var(--negative)")} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default IslamicDigitalSpecial;
