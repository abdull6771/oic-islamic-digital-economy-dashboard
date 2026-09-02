import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { styles } from "../styles/styles.js";
import CustomTooltip from "../components/CustomTooltip.jsx";
import {
  COUNTRIES,
  PILLARS,
  TREND_DATA,
  YEARS,
  YEAR_RANGE,
  getCluster,
} from "../data/index.js";

function ProgressTracker({ hideTrajectory = false }) {
  const TREND_FULL = TREND_DATA;
  const YEARS_L = YEARS.map(String);
  const scoreChange = (name) => {
    const h = TREND_FULL[name];
    const first = h?.[0];
    const last = h?.[h.length - 1];
    if (first === null || first === undefined) return null;
    if (last === null || last === undefined) return null;
    return parseFloat((last - first).toFixed(2));
  };
  const sorted = [...COUNTRIES].sort((a, b) => b.adei - a.adei);
  const lineData = YEARS_L.map((yr, yi) => {
    const row = { year: yr };
    Object.entries(TREND_FULL).forEach(([name, scores]) => {
      row[name] = scores[yi];
    });
    return row;
  });
  const fastestGrowing = [...COUNTRIES]
    .filter((c) => TREND_FULL[c.name])
    .map((c) => ({ ...c, growth: scoreChange(c.name) }))
    .sort((a, b) => b.growth - a.growth);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {!hideTrajectory && (
        <div style={styles.card}>
          <h2 className="t-h3" style={{ marginBottom: "var(--s-16)" }}>Score Trajectory {YEAR_RANGE}</h2>
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-strong)" />
              <XAxis dataKey="year" tick={{ fill: "var(--text)", fontSize: 11 }} />
              <YAxis
                domain={[0, 85]}
                tick={{ fill: "var(--text)", fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              {Object.keys(TREND_FULL)
                .slice(0, 10)
                .map((name, i) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={PILLARS[i % PILLARS.length].color}
                    strokeWidth={1.5}
                    dot={{ r: 2 }}
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
          {(() => {
            const names = Object.keys(TREND_FULL).slice(0, 10);
            const gains = names.map((n) => ({
              name: n,
              gain: TREND_FULL[n][4] - TREND_FULL[n][0],
            }));
            const top = gains.reduce((a, b) => (a.gain > b.gain ? a : b));
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
                  Among tracked countries, <strong>{top.name}</strong> recorded
                  the strongest 4-year growth of{" "}
                  <strong>+{top.gain.toFixed(1)} pts</strong> ({YEAR_RANGE}). The
                  upward trajectory across most countries reflects sustained
                  digital investment across the OIC bloc.
                </p>
              </div>
            );
          })()}
        </div>
      )}
      <div style={styles.card}>
        <h2 className="t-h3" style={{ marginBottom: "var(--s-16)" }}>🔄 Score Change 2021 → 2025</h2>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid var(--accent-line)" }}>
                {[
                  "Country",
                  "2025 Rank",
                  "2025 Score",
                  "4yr Change",
                  "Trajectory",
                  "Cluster",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 8px",
                      color: "var(--text)",
                      textAlign: "center",
                      fontSize: "11px",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, i) => {
                const hist = TREND_FULL[c.name];
                const change = hist ? scoreChange(c.name) : null;
                const cl = getCluster(c.adei);
                return (
                  <tr
                    key={c.name}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      background: i % 2 === 0 ? "transparent" : "var(--surface-2)",
                    }}
                  >
                    <td
                      style={{
                        padding: "8px",
                        color: "var(--text)",
                        fontWeight: 600,
                      }}
                    >
                      {c.name}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        textAlign: "center",
                        color: "var(--text)",
                        fontWeight: 700,
                      }}
                    >
                      #{c.rank}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        textAlign: "center",
                        fontWeight: 700,
                        color: cl.color,
                      }}
                    >
                      {c.adei.toFixed(1)}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        textAlign: "center",
                        fontWeight: 700,
                        color:
                          change === null
                            ? "var(--text-muted)"
                            : change >= 0
                              ? "var(--positive)"
                              : "var(--negative)",
                      }}
                    >
                      {change === null
                        ? "N/A"
                        : change >= 0
                          ? `+${change}`
                          : change}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        textAlign: "center",
                        fontSize: "11px",
                        color: "var(--text)",
                        fontFamily: "monospace",
                      }}
                    >
                      {hist
                        ? hist[0] === null
                          ? `New Entry (${hist[4]?.toFixed(0) ?? "—"})`
                          : hist
                              .map((v) => (v !== null ? v.toFixed(0) : "—"))
                              .join("→")
                        : "N/A"}
                    </td>
                    <td style={{ padding: "8px", textAlign: "center" }}>
                      <span
                        style={{
                          ...styles.badge(cl.color, cl.bg),
                          fontSize: "11px",
                        }}
                      >
                        {cl.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div style={styles.card}>
        <div style={{ ...styles.cardTitle, color: "var(--positive)" }}>
          🚀 Fastest Growing Countries (4-Year Score Gain)
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={fastestGrowing.map((c) => ({
              name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
              growth: c.growth,
            }))}
            barSize={28}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-strong)" />
            <XAxis
              dataKey="name"
              tick={{ fill: "var(--text)", fontSize: 11 }}
              angle={-20}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fill: "var(--text)", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="growth" name={`Score Gain (${YEAR_RANGE})`}>
              {fastestGrowing.map((c, i) => (
                <Cell key={i} fill={c.growth > 0 ? "var(--positive)" : "var(--negative)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {(() => {
          const topGrower = fastestGrowing[0];
          const declined = fastestGrowing.filter((c) => c.growth < 0);
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
                <strong>{topGrower?.name}</strong> is the fastest-growing OIC
                economy with a{" "}
                <strong>+{topGrower?.growth.toFixed(1)} pt</strong> gain over 4
                years.{" "}
                {declined.length > 0 ? (
                  <>
                    <strong>
                      {declined.length} countr
                      {declined.length > 1 ? "ies" : "y"}
                    </strong>{" "}
                    recorded a decline, with{" "}
                    <strong>{declined[declined.length - 1]?.name}</strong>{" "}
                    falling the most (
                    {declined[declined.length - 1]?.growth.toFixed(1)} pts).
                  </>
                ) : (
                  <>
                    All tracked countries recorded positive growth over the
                    period.
                  </>
                )}
              </p>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export default ProgressTracker;
