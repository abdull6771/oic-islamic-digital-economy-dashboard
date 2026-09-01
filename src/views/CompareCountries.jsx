import { useState } from "react";
import {
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PolarRadiusAxis,
} from "recharts";
import { styles } from "../styles/styles.js";
import CustomTooltip from "../components/CustomTooltip.jsx";
import {
  COUNTRIES,
  PILLARS,
  getCluster,
} from "../data/index.js";

function CompareCountries() {
  const [selected, setSelected] = useState([
    "United Arab Emirates",
    "Malaysia",
    "Saudi Arabia",
    "Indonesia",
  ]);

  const toggleCountry = (name) => {
    setSelected((prev) =>
      prev.includes(name)
        ? prev.filter((n) => n !== name)
        : prev.length < 6
          ? [...prev, name]
          : prev,
    );
  };

  const countries = COUNTRIES.filter((c) => selected.includes(c.name));

  const barData = PILLARS.map((p) => {
    const row = { name: p.short };
    countries.forEach((c) => {
      row[c.name] = parseFloat(c[p.key].toFixed(1));
    });
    return row;
  });

  const radarData = PILLARS.map((p) => {
    const row = { subject: p.short };
    countries.forEach((c) => {
      row[c.name] = parseFloat(c[p.key].toFixed(1));
    });
    return row;
  });

  const COMPARE_COLORS = [
    "#1B4332",
    "#2D6A4F",
    "#40916C",
    "#52B788",
    "#74C69D",
    "#95D5B2",
  ];

  const avgScore =
    countries.length > 0
      ? (countries.reduce((s, c) => s + c.adei, 0) / countries.length).toFixed(
          1,
        )
      : 0;

  const groupCluster = () => {
    if (countries.length === 0) return null;
    const clusterCounts = { Advanced: 0, Emerging: 0, Foundational: 0 };
    countries.forEach((c) => {
      const cluster = getCluster(c.adei);
      const label = cluster.label.split(" ")[0];
      if (label === "Advanced") clusterCounts.Advanced++;
      else if (label === "Emerging") clusterCounts.Emerging++;
      else clusterCounts.Foundational++;
    });
    return clusterCounts;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Country Selection */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          Select Countries for Comparison (up to 6)
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {[...COUNTRIES]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((c) => (
              <button
                key={c.name}
                onClick={() => toggleCountry(c.name)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  border: "1px solid",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: selected.includes(c.name) ? 600 : 500,
                  background: selected.includes(c.name)
                    ? "#D8F3DC"
                    : "transparent",
                  borderColor: selected.includes(c.name)
                    ? "#1B4332"
                    : "#CBD5E1",
                  color: selected.includes(c.name) ? "#1B4332" : "#64748B",
                  fontFamily: "'Georgia', serif",
                  transition: "all 0.2s",
                }}
              >
                {c.name}
              </button>
            ))}
        </div>
      </div>

      {countries.length > 0 && (
        <>
          {/* Quick Overview Cards */}
          <div style={styles.grid4}>
            {countries
              .sort((a, b) => b.adei - a.adei)
              .map((c, i) => {
                const cluster = getCluster(c.adei);
                return (
                  <div
                    key={c.name}
                    style={{
                      ...styles.card,
                      border: `2px solid ${cluster.color}`,
                      background: cluster.bg,
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "24px",
                        fontWeight: 900,
                        color: cluster.color,
                      }}
                    >
                      {c.adei.toFixed(1)}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#1B4332",
                        fontWeight: 600,
                        marginTop: "4px",
                      }}
                    >
                      {c.name}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#2D6A4F",
                        marginTop: "4px",
                      }}
                    >
                      Rank #{c.rank} • {cluster.label.split(" ")[0]}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Group Summary */}
          {countries.length > 1 && (
            <div style={styles.card}>
              <div style={styles.cardTitle}>Group Summary</div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "16px",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: 900,
                      color: "#1B4332",
                    }}
                  >
                    {avgScore}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748B" }}>
                    Average OIC DEI Score
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: 900,
                      color: "#2D6A4F",
                    }}
                  >
                    {countries.length}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748B" }}>
                    Countries Selected
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 700,
                      color: "#40916C",
                    }}
                  >
                    {(() => {
                      const clusters = groupCluster();
                      if (clusters.Advanced > 0) return "Advanced Focus";
                      if (clusters.Emerging > 0) return "Mixed Growth";
                      return "Foundational";
                    })()}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748B" }}>
                    Group Composition
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pillar Bar Comparison */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>Pillar Performance Comparison</div>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={barData} layout="vertical" barSize={10}>
                <CartesianGrid
                  strokeDasharray="0"
                  stroke="#E2E8F0"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fill: "#64748B", fontSize: 10, fontWeight: 500 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "#1B4332", fontSize: 10, fontWeight: 600 }}
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{
                    fontSize: "12px",
                    fontFamily: "'Georgia', serif",
                    paddingTop: "12px",
                  }}
                />
                {countries.map((c, i) => (
                  <Bar
                    key={c.name}
                    dataKey={c.name}
                    fill={COMPARE_COLORS[selected.indexOf(c.name)]}
                    radius={[0, 4, 4, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
            {countries.length > 1 &&
              (() => {
                const leader = [...countries].sort(
                  (a, b) => b.adei - a.adei,
                )[0];
                const spreadPillar = PILLARS.reduce((best, p) => {
                  const s =
                    Math.max(...countries.map((c) => c[p.key])) -
                    Math.min(...countries.map((c) => c[p.key]));
                  const bs =
                    Math.max(...countries.map((c) => c[best.key])) -
                    Math.min(...countries.map((c) => c[best.key]));
                  return s > bs ? p : best;
                }, PILLARS[0]);
                const spread = (
                  Math.max(...countries.map((c) => c[spreadPillar.key])) -
                  Math.min(...countries.map((c) => c[spreadPillar.key]))
                ).toFixed(1);
                return (
                  <div
                    style={{
                      background: "#D8F3DC",
                      border: "1px solid #1B4332",
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
                          color: "#1B4332",
                        }}
                      >
                        Strategic Insight
                      </div>
                      <div
                        style={{
                          fontSize: "9px",
                          fontWeight: 400,
                          color: "#94A3B8",
                          whiteSpace: "nowrap",
                        }}
                      >
                        AI-assisted insight
                      </div>
                    </div>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#1E293B",
                        margin: 0,
                        lineHeight: 1.6,
                      }}
                    >
                      <strong>{leader.name}</strong> leads overall (OIC DEI{" "}
                      {leader.adei.toFixed(1)}). The most divergent pillar is{" "}
                      <strong>{spreadPillar.name}</strong> with {spread} points
                      spread, indicating this as a key differentiation factor
                      among selected countries.
                    </p>
                  </div>
                );
              })()}
          </div>

          {/* Radar Comparison */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>Profile Shape Comparison</div>
            <ResponsiveContainer width="100%" height={340}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "#1B4332", fontSize: 10, fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  domain={[0, 100]}
                  tick={{ fill: "#64748B", fontSize: 9 }}
                />
                {countries.map((c, i) => (
                  <Radar
                    key={c.name}
                    name={c.name}
                    dataKey={c.name}
                    stroke={COMPARE_COLORS[selected.indexOf(c.name)]}
                    fill={COMPARE_COLORS[selected.indexOf(c.name)]}
                    fillOpacity={0.12}
                    strokeWidth={2.5}
                  />
                ))}
                <Legend
                  wrapperStyle={{
                    fontSize: "12px",
                    fontFamily: "'Georgia', serif",
                    paddingTop: "12px",
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
            {countries.length > 1 &&
              (() => {
                const mostBalanced = [...countries].sort((a, b) => {
                  const range = (c) =>
                    Math.max(...PILLARS.map((p) => c[p.key])) -
                    Math.min(...PILLARS.map((p) => c[p.key]));
                  return range(a) - range(b);
                })[0];
                const mostSpecialized = [...countries].sort((a, b) => {
                  const range = (c) =>
                    Math.max(...PILLARS.map((p) => c[p.key])) -
                    Math.min(...PILLARS.map((p) => c[p.key]));
                  return range(b) - range(a);
                })[0];
                return (
                  <div
                    style={{
                      background: "#D8F3DC",
                      border: "1px solid #1B4332",
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
                          color: "#1B4332",
                        }}
                      >
                        Strategic Insight
                      </div>
                      <div
                        style={{
                          fontSize: "9px",
                          fontWeight: 400,
                          color: "#94A3B8",
                          whiteSpace: "nowrap",
                        }}
                      >
                        AI-assisted insight
                      </div>
                    </div>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#1E293B",
                        margin: 0,
                        lineHeight: 1.6,
                      }}
                    >
                      <strong>{mostBalanced.name}</strong> demonstrates the most
                      balanced pillar portfolio, while{" "}
                      <strong>{mostSpecialized.name}</strong> shows the most
                      concentrated profile with notable strengths and gaps,
                      indicating distinct strategic specialization.
                    </p>
                  </div>
                );
              })()}
          </div>

          {/* Strengths & Weaknesses */}
          <div style={styles.grid2}>
            {/* Group Strengths */}
            <div style={styles.card}>
              <div
                style={{
                  ...styles.cardTitle,
                  background: "#D8F3DC",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  marginBottom: "12px",
                }}
              >
                Group Strengths
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {PILLARS.sort((a, b) => {
                  const avgA =
                    countries.reduce((s, c) => s + c[a.key], 0) /
                    countries.length;
                  const avgB =
                    countries.reduce((s, c) => s + c[b.key], 0) /
                    countries.length;
                  return avgB - avgA;
                })
                  .slice(0, 4)
                  .map((p) => {
                    const avg = (
                      countries.reduce((s, c) => s + c[p.key], 0) /
                      countries.length
                    ).toFixed(1);
                    return (
                      <div
                        key={p.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px",
                          background: "#F8FDFC",
                          borderRadius: "6px",
                          fontSize: "12px",
                        }}
                      >
                        <span style={{ color: "#1B4332", fontWeight: 600 }}>
                          {p.name}
                        </span>
                        <span
                          style={{
                            color: "#40916C",
                            fontWeight: 700,
                            fontSize: "13px",
                          }}
                        >
                          {avg}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Group Opportunities */}
            <div style={styles.card}>
              <div
                style={{
                  ...styles.cardTitle,
                  background: "#F1F8F6",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  marginBottom: "12px",
                }}
              >
                Group Opportunities
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {PILLARS.sort((a, b) => {
                  const avgA =
                    countries.reduce((s, c) => s + c[a.key], 0) /
                    countries.length;
                  const avgB =
                    countries.reduce((s, c) => s + c[b.key], 0) /
                    countries.length;
                  return avgA - avgB;
                })
                  .slice(0, 4)
                  .map((p) => {
                    const avg = (
                      countries.reduce((s, c) => s + c[p.key], 0) /
                      countries.length
                    ).toFixed(1);
                    return (
                      <div
                        key={p.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px",
                          background: "#F8FDFC",
                          borderRadius: "6px",
                          fontSize: "12px",
                        }}
                      >
                        <span style={{ color: "#1B4332", fontWeight: 600 }}>
                          {p.name}
                        </span>
                        <span
                          style={{
                            color: "#95D5B2",
                            fontWeight: 700,
                            fontSize: "13px",
                          }}
                        >
                          {avg}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CompareCountries;
