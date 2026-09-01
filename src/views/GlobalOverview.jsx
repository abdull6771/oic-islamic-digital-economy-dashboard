import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Line,
  ReferenceLine,
} from "recharts";
import { styles } from "../styles/styles.js";
import CustomTooltip from "../components/CustomTooltip.jsx";
import WorldMap from "../components/WorldMap.jsx";
import {
  COUNTRIES,
  META,
  OIC_AVERAGE,
  PILLARS,
  getCluster,
} from "../data/index.js";

function GlobalOverview() {
  const sorted = [...COUNTRIES].sort((a, b) => a.rank - b.rank);
  const top10 = sorted.slice(0, 10);
  const bottom10 = sorted.slice(-10).reverse();
  const leaders = COUNTRIES.filter((c) => c.adei >= 60);
  const adopters = COUNTRIES.filter((c) => c.adei >= 40 && c.adei < 60);
  const emerging = COUNTRIES.filter((c) => c.adei < 40);

  const pillarAvgs = PILLARS.map((p) => ({
    name: p.short,
    avg: Math.round(
      COUNTRIES.reduce((s, c) => s + c[p.key], 0) / COUNTRIES.length,
    ),
    color: p.color,
  }));

  const bestPillar = pillarAvgs.reduce(
    (b, p) => (p.avg > b.avg ? p : b),
    pillarAvgs[0],
  );
  const weakestPillar = pillarAvgs.reduce(
    (w, p) => (p.avg < w.avg ? p : w),
    pillarAvgs[0],
  );

  const clusterData = [
    {
      name: "Advanced Digital Economies",
      count: leaders.length,
      score: leaders.reduce((s, c) => s + c.adei, 0) / leaders.length,
      color: "#1B4332",
      bg: "#D8F3DC",
      shortName: "Advanced",
    },
    {
      name: "Emerging Digital Economies",
      count: adopters.length,
      score: adopters.reduce((s, c) => s + c.adei, 0) / adopters.length,
      color: "#52B788",
      bg: "#E8F5E9",
      shortName: "Emerging",
    },
    {
      name: "Foundational Digital Economies",
      count: emerging.length,
      score: emerging.reduce((s, c) => s + c.adei, 0) / emerging.length,
      color: "#95D5B2",
      bg: "#F1F8F6",
      shortName: "Foundational",
    },
  ];

  const avg = COUNTRIES.reduce((s, c) => s + c.adei, 0) / COUNTRIES.length;
  const globalStats = {
    average: avg.toFixed(1),
    max: sorted[0].adei.toFixed(1),
    min: sorted[sorted.length - 1].adei.toFixed(1),
    stdDev: Math.sqrt(
      COUNTRIES.reduce((s, c) => s + Math.pow(c.adei - avg, 2), 0) /
        COUNTRIES.length,
    ).toFixed(1),
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* World Map */}
      <WorldMap />

      {/* Global Statistics Cards */}
      <div style={styles.grid4}>
        <div style={styles.card}>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#1B4332" }}>
            {sorted[0].adei.toFixed(1)}
          </div>
          <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>
            Highest Score
          </div>
          <div style={{ fontSize: "11px", color: "#2D6A4F", fontWeight: 600 }}>
            {sorted[0].name}
          </div>
        </div>
        <div style={styles.card}>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#2D6A4F" }}>
            {globalStats.average}
          </div>
          <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>
            OIC Average
          </div>
          <div style={{ fontSize: "11px", color: "#2D6A4F", fontWeight: 600 }}>
            All {META.countryCount} Countries
          </div>
        </div>
        <div style={styles.card}>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#40916C" }}>
            {sorted[sorted.length - 1].adei.toFixed(1)}
          </div>
          <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>
            Lowest Score
          </div>
          <div style={{ fontSize: "11px", color: "#2D6A4F", fontWeight: 600 }}>
            {sorted[sorted.length - 1].name}
          </div>
        </div>
        <div style={styles.card}>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#52B788" }}>
            {globalStats.stdDev}
          </div>
          <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>
            Standard Deviation
          </div>
          <div style={{ fontSize: "11px", color: "#2D6A4F", fontWeight: 600 }}>
            Score Variability
          </div>
        </div>
      </div>

      {/* Cluster Distribution */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>Performance Cluster Distribution</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          {clusterData.map((cl) => (
            <div
              key={cl.name}
              style={{
                background: cl.bg,
                borderRadius: "12px",
                padding: "20px 16px",
                border: `2px solid ${cl.color}`,
                textAlign: "center",
                transition: "all 0.3s ease",
              }}
            >
              <div
                style={{ fontSize: "40px", fontWeight: 900, color: cl.color }}
              >
                {cl.count}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#1B4332",
                  margin: "8px 0 4px",
                }}
              >
                {cl.shortName}
              </div>
              <div
                style={{ fontSize: "11px", color: "#2D6A4F", fontWeight: 500 }}
              >
                Avg Score: {cl.score.toFixed(1)}
              </div>
              <div
                style={{
                  marginTop: "12px",
                  height: "3px",
                  borderRadius: "2px",
                  background: cl.color,
                }}
              />
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            padding: "12px",
            background: "#D8F3DC",
            border: "1px solid #1B4332",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "8px",
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
          <div style={{ fontSize: "12px", color: "#1E293B", lineHeight: 1.6 }}>
            The 2025 OIC Digital Economy Index reveals a{" "}
            <strong>
              {(sorted[0].adei - sorted[sorted.length - 1].adei).toFixed(0)}
              -point digital divide
            </strong>{" "}
            between {sorted[0].name} ({sorted[0].adei.toFixed(0)}) and{" "}
            {sorted[sorted.length - 1].name} (
            {sorted[sorted.length - 1].adei.toFixed(0)}).{" "}
            <strong>E-Government outpaces Innovation:</strong> state-led
            digitization is the OIC's greatest strength, while private-sector
            R&D is the critical bottleneck. With{" "}
            <strong>{leaders.length} advanced</strong>,{" "}
            <strong>{adopters.length} emerging</strong>, and{" "}
            <strong>{emerging.length} foundational</strong> economies, tailored
            strategies aligned to digital maturity are essential — a
            one-size-fits-all digital policy is fundamentally ineffective.
          </div>
        </div>
      </div>

      {/* Top and Emerging Countries */}
      <div style={styles.grid2}>
        {/* Leading 10 */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Top 10 Performers</div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {top10.map((c, i) => {
              const cluster = getCluster(c.adei);
              const medalColors = {
                0: {
                  bg: "linear-gradient(135deg,#FFD700,#FFA500)",
                  label: "1",
                },
                1: {
                  bg: "linear-gradient(135deg,#C0C0C0,#A0A0A0)",
                  label: "2",
                },
                2: {
                  bg: "linear-gradient(135deg,#CD7F32,#A05A00)",
                  label: "3",
                },
              };
              const isMedal = i < 3;
              return (
                <div
                  key={c.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 12px",
                    background: i % 2 === 0 ? "transparent" : "#F8FDFC",
                    borderRadius: "6px",
                  }}
                >
                  <div
                    style={{
                      ...styles.rankBadge,
                      background: isMedal ? medalColors[i].bg : "#E2E8F0",
                      color: isMedal ? "#FFFFFF" : "#1B4332",
                      fontSize: "12px",
                      fontWeight: isMedal ? 900 : 700,
                      minWidth: "36px",
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "6px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#1B4332",
                        }}
                      >
                        {c.name}
                      </span>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: cluster.color,
                        }}
                      >
                        {c.adei.toFixed(1)}
                      </span>
                    </div>
                    <div style={styles.scoreBar(c.adei, cluster.color)} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Opportunity Focus: Emerging 10 */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Opportunity Focus: Foundation 10</div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {bottom10.map((c) => (
              <div
                key={c.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 12px",
                  background: c.adei < 25 ? "#F1F8F6" : "transparent",
                  borderRadius: "6px",
                }}
              >
                <div
                  style={{
                    ...styles.rankBadge,
                    background: "#E8F5E9",
                    color: "#52B788",
                    fontSize: "12px",
                    fontWeight: 700,
                    minWidth: "36px",
                  }}
                >
                  {c.rank}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#1B4332",
                      }}
                    >
                      {c.name}
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#95D5B2",
                      }}
                    >
                      {c.adei.toFixed(1)}
                    </span>
                  </div>
                  <div style={styles.scoreBar(c.adei, "#95D5B2")} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pillar Performance Analysis */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>Pillar Performance Across OIC</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={pillarAvgs} barSize={40}>
            <CartesianGrid
              strokeDasharray="0"
              stroke="#E2E8F0"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: "#1B4332", fontSize: 11, fontWeight: 600 }}
            />
            <YAxis domain={[0, 100]} tick={{ fill: "#64748B", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="avg" radius={[6, 6, 0, 0]}>
              {pillarAvgs.map((p, i) => (
                <Cell key={i} fill={p.color} />
              ))}
            </Bar>
            <ReferenceLine
              y={OIC_AVERAGE}
              stroke="#1B4332"
              strokeDasharray="4 4"
              strokeWidth={2}
            />
          </BarChart>
        </ResponsiveContainer>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            marginTop: "16px",
          }}
        >
          <div
            style={{
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
                marginBottom: "4px",
              }}
            >
              Strongest Pillar
            </div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: bestPillar.color,
              }}
            >
              {bestPillar.name}: {bestPillar.avg}/100
            </div>
          </div>
          <div
            style={{
              padding: "12px",
              background: "#F1F8F6",
              border: "1px solid #95D5B2",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#1B4332",
                marginBottom: "4px",
              }}
            >
              Greatest Opportunity
            </div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: weakestPillar.color,
              }}
            >
              {weakestPillar.name}: {weakestPillar.avg}/100
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive Score Heatmap */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>Comprehensive Score Heatmap</div>
        <div
          style={{ fontSize: "13px", color: "#64748B", marginBottom: "12px" }}
        >
          All {META.countryCount} OIC member states performance across{" "}
          {PILLARS.length} pillars
        </div>
        <div
          style={{ overflowX: "auto", maxHeight: "500px", overflowY: "auto" }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "11px",
            }}
          >
            <thead
              style={{
                position: "sticky",
                top: 0,
                background: "#F8FDFC",
                zIndex: 1,
              }}
            >
              <tr style={{ borderBottom: "2px solid #1B4332" }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 10px",
                    color: "#1B4332",
                    borderRight: "1px solid #E2E8F0",
                    fontWeight: 700,
                  }}
                >
                  Country
                </th>
                <th
                  style={{
                    textAlign: "center",
                    padding: "8px 6px",
                    color: "#1B4332",
                    borderRight: "1px solid #E2E8F0",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  Rank
                </th>
                <th
                  style={{
                    textAlign: "center",
                    padding: "8px 6px",
                    color: "#1B4332",
                    borderRight: "1px solid #E2E8F0",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  Score
                </th>
                {PILLARS.map((p) => (
                  <th
                    key={p.id}
                    style={{
                      padding: "8px 4px",
                      color: p.color,
                      borderRight: "1px solid #E2E8F0",
                      textAlign: "center",
                      fontSize: "10px",
                      fontWeight: 700,
                    }}
                  >
                    {p.short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, idx) => (
                <tr
                  key={c.name}
                  style={{
                    borderBottom: "1px solid #E2E8F0",
                    background: idx % 2 === 0 ? "transparent" : "#F8FDFC",
                  }}
                >
                  <td
                    style={{
                      padding: "8px 10px",
                      color: "#1B4332",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      borderRight: "1px solid #E2E8F0",
                    }}
                  >
                    {c.name}
                  </td>
                  <td
                    style={{
                      padding: "8px 6px",
                      textAlign: "center",
                      fontWeight: 700,
                      color: "#1B4332",
                      borderRight: "1px solid #E2E8F0",
                    }}
                  >
                    #{c.rank}
                  </td>
                  <td
                    style={{
                      padding: "8px 6px",
                      textAlign: "center",
                      fontWeight: 700,
                      color: getCluster(c.adei).color,
                      borderRight: "1px solid #E2E8F0",
                    }}
                  >
                    {c.adei.toFixed(1)}
                  </td>
                  {PILLARS.map((p) => {
                    const val = c[p.key];
                    const intensity = val / 100;
                    return (
                      <td
                        key={p.id}
                        style={{
                          padding: "6px 2px",
                          textAlign: "center",
                          borderRight: "1px solid #E2E8F0",
                        }}
                      >
                        <div
                          style={{
                            background: `rgba(27, 67, 50, ${0.1 + intensity * 0.9})`,
                            borderRadius: "4px",
                            padding: "4px 2px",
                            color: intensity > 0.6 ? "#FFFFFF" : "#1B4332",
                            fontWeight: 600,
                            fontSize: "10px",
                          }}
                        >
                          {val.toFixed(0)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default GlobalOverview;
