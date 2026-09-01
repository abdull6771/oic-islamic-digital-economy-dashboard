import { useState, useMemo, useEffect, useRef } from "react";
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
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
  LineChart,
  Line,
  PolarRadiusAxis,
  ReferenceLine,
} from "recharts";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleLinear } from "d3-scale";

// ─── DATA ───────────────────────────────────────────────────────────────────
// Every score, rank and weight below is generated from the master Excel
// workbook by `npm run build:data` and reaches the views through the data
// layer. Nothing in this file hard-codes an index value — see DATA.md.
import {
  COUNTRIES,
  DATA_QUALITY,
  FINDEX,
  FINDEX_IMPUTED_COUNTRIES,
  INDICATOR_COUNTS,
  META,
  OIC_AVERAGE,
  OIC_AVERAGE_LABEL,
  PILLARS,
  PILLAR_INDICATORS,
  REFERENCE_YEAR,
  REGIONS,
  TREND_DATA,
  YEARS,
  YEAR_RANGE,
  findCountryByGeoName,
  getCluster,
} from "./src/data/index.js";

// ─── STYLES ─────────────────────────────────────────────────────────────────
const styles = {
  app: {
    fontFamily: "'Georgia', serif",
    background: "#F8FAFC",
    minHeight: "100vh",
    color: "#1E293B",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    background: "linear-gradient(135deg, #001f3f 0%, #00152b 100%)",
    borderBottom: "1px solid #00a8e8",
    padding: "28px 40px 0 40px",
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  tabs: {
    display: "flex",
    overflowX: "auto",
    gap: "0",
    background: "rgba(0, 0, 0, 0.2)",
    borderTop: "1px solid rgba(0, 168, 232, 0.3)",
    borderBottom: "1px solid #00152b",
    padding: "0",
    marginTop: "28px",
  },
  tab: (active) => ({
    padding: "16px 24px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
    whiteSpace: "nowrap",
    border: "none",
    outline: "none",
    fontFamily: "'Georgia', serif",
    letterSpacing: "0.04em",
    background: active ? "rgba(0, 168, 232, 0.15)" : "transparent",
    color: active ? "#00d4ff" : "#A0AEC0",
    borderBottom: active ? "3px solid #00d4ff" : "3px solid transparent",
    borderRight: "1px solid rgba(0, 168, 232, 0.1)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  }),
  content: {
    padding: "32px 32px",
    maxWidth: "1400px",
    margin: "0 auto",
    flex: 1,
  },
  footer: {
    background: "linear-gradient(135deg, #001f3f 0%, #00152b 100%)",
    borderTop: "1px solid #00a8e8",
    padding: "24px 40px",
    textAlign: "center",
    color: "#A0AEC0",
    fontSize: "13px",
    fontFamily: "'Georgia', serif",
    marginTop: "40px",
    boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.1)",
  },
  card: {
    background: "linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 100%)",
    border: "1px solid #CBD5E1",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)",
    transition: "all 0.3s ease",
  },
  cardTitle: {
    fontSize: "14px",
    fontFamily: "'Georgia', serif",
    color: "#000000",
    letterSpacing: "0.05em",
    marginBottom: "16px",
    fontWeight: 600,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    margin: "24px 0",
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "24px",
    margin: "24px 0",
  },
  grid4: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    margin: "24px 0",
  },
  scoreBar: (val, color) => ({
    height: "8px",
    borderRadius: "4px",
    background: `linear-gradient(90deg, ${color} ${val}%, #E2E8F0 ${val}%)`,
    marginTop: "6px",
    boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.05)",
  }),
  badge: (color, bg) => ({
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: 600,
    color,
    background: bg,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
  }),
  rankBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #B8922A, #A07810)",
    color: "#F8FAFC",
    fontSize: "13px",
    fontWeight: 900,
    boxShadow: "0 4px 8px rgba(184, 146, 42, 0.2)",
  },
  select: {
    background: "#FFFFFF",
    border: "1px solid #CBD5E1",
    color: "#1E293B",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13px",
    fontFamily: "'Georgia', serif",
    cursor: "pointer",
    outline: "none",
    transition: "all 0.2s ease",
  },
  selectHover: {
    background: "#FFFFFF",
    border: "1px solid #00a8e8",
    color: "#1E293B",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13px",
    fontFamily: "'Georgia', serif",
    cursor: "pointer",
    outline: "none",
    boxShadow: "0 2px 8px rgba(0, 168, 232, 0.12)",
  },
  tooltip: {
    background: "#FFFFFF",
    border: "1px solid #B8922A40",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "12px",
    fontFamily: "'Georgia', serif",
    color: "#1E293B",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
  },
};

// ─── TOOLTIP ─────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        ...styles.tooltip,
        animation: "fadeIn 0.2s ease-in",
      }}
    >
      <div
        style={{
          color: "#000000",
          fontWeight: 700,
          marginBottom: "8px",
          fontSize: "13px",
        }}
      >
        {label}
      </div>
      {payload.map((p, i) => (
        <div
          key={i}
          style={{
            color: p.color || "#1E293B",
            marginBottom: "2px",
            fontSize: "12px",
          }}
        >
          <span style={{ fontWeight: 500 }}>{p.name}:</span>{" "}
          <span style={{ fontWeight: 700, color: p.color || "#000000" }}>
            {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── WORLD MAP COMPONENT ────────────────────────────────────────────────────
function WorldMap() {
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json")
      .then((res) => res.json())
      .then((data) => {
        const countries = data.objects.countries.geometries.map(
          (geom, idx) => ({
            ...geom,
            id: idx,
          }),
        );
        setGeoData({
          type: "FeatureCollection",
          features: countries.map((geom) => ({
            type: "Feature",
            properties: { id: geom.id },
            geometry: geom,
          })),
        });
      })
      .catch((err) => console.error("Failed to load map data:", err));
  }, []);

  const getCountryColor = (countryName) => {
    const country = findCountryByGeoName(countryName);

    if (!country) return "#E2E8F0";

    const cluster = getCluster(country.adei);
    if (cluster.label === "Advanced Digital Economies") return "#10B981";
    if (cluster.label === "Emerging Digital Economies") return "#F59E0B";
    return "#EF4444";
  };

  const getCountryInfo = (countryName) => findCountryByGeoName(countryName);

  const geoUrl =
    "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>OIC Countries Map</div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "0px",
          gap: "0px",
        }}
      >
        <div style={{ flex: 1 }}>
          <svg
            width="100%"
            height="800"
            style={{ border: "1px solid #E2E8F0", borderRadius: "8px" }}
          >
            <ComposableMap projection="geoEqualEarth">
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const countryName = geo.properties.name;
                    const country = getCountryInfo(countryName);
                    const fill = country
                      ? getCountryColor(countryName)
                      : "#F1F5F9";

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onMouseEnter={() => setHoveredCountry(countryName)}
                        onMouseLeave={() => setHoveredCountry(null)}
                        style={{
                          default: {
                            fill: fill,
                            stroke: "#FFFFFF",
                            strokeWidth: 0.75,
                            outline: "none",
                            cursor: country ? "pointer" : "default",
                            transition: "fill 0.2s ease",
                          },
                          hover: {
                            fill: country ? fill : "#F1F5F9",
                            stroke: "#B8922A",
                            strokeWidth: 1.5,
                            outline: "none",
                            cursor: country ? "pointer" : "default",
                            filter: "brightness(1.1)",
                          },
                          pressed: {
                            fill: fill,
                            stroke: "#B8922A",
                            strokeWidth: 1.5,
                            outline: "none",
                          },
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ComposableMap>
          </svg>
        </div>
        <div
          style={{
            width: "80px",
            padding: "4px",
            background: "#F8FAFC",
            borderRadius: "0px 8px 8px 0px",
            border: "1px solid #E2E8F0",
            borderLeft: "none",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: "8px",
              fontWeight: 600,
              color: "#64748B",
              marginBottom: "3px",
            }}
          >
            Legend
          </div>
          {[
            {
              label: "Advanced",
              color: "#10B981",
              count: COUNTRIES.filter(
                (c) =>
                  getCluster(c.adei).label === "Advanced Digital Economies",
              ).length,
            },
            {
              label: "Emerging",
              color: "#F59E0B",
              count: COUNTRIES.filter(
                (c) =>
                  getCluster(c.adei).label === "Emerging Digital Economies",
              ).length,
            },
            {
              label: "Foundational",
              color: "#EF4444",
              count: COUNTRIES.filter(
                (c) =>
                  getCluster(c.adei).label === "Foundational Digital Economies",
              ).length,
            },
            {
              label: "Non-OIC",
              color: "#F1F5F9",
              count: "Other",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "3px",
                marginBottom: "2px",
                fontSize: "8px",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "2px",
                  background: item.color,
                  border: "1px solid #CBD5E1",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  color: "#1E293B",
                  fontWeight: 500,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </span>
              {typeof item.count === "number" && (
                <span
                  style={{
                    color: "#64748B",
                    marginLeft: "auto",
                    fontSize: "8px",
                  }}
                >
                  ({item.count})
                </span>
              )}
            </div>
          ))}
          {hoveredCountry && getCountryInfo(hoveredCountry) && (
            <div
              style={{
                marginTop: "6px",
                paddingTop: "4px",
                borderTop: "1px solid #E2E8F0",
              }}
            >
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: 600,
                  color: "#000000",
                  marginBottom: "2px",
                }}
              >
                {hoveredCountry}
              </div>
              <div style={{ fontSize: "8px", color: "#64748B" }}>
                Score:{" "}
                <strong>
                  {getCountryInfo(hoveredCountry).adei.toFixed(1)}
                </strong>
              </div>
              <div style={{ fontSize: "8px", color: "#64748B" }}>
                Rank: <strong>#{getCountryInfo(hoveredCountry).rank}</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── GLOBAL OVERVIEW TAB ────────────────────────────────────────────────────
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

// ─── COUNTRY PROFILES TAB ───────────────────────────────────────────────────
function CountryProfiles() {
  const [selected, setSelected] = useState(() => {
    const p = new URLSearchParams(window.location.hash.replace("#", ""));
    const c = p.get("country");
    return c && COUNTRIES.find((x) => x.name === c)
      ? c
      : "United Arab Emirates";
  });
  const [search, setSearch] = useState("");
  const [showDrop, setShowDrop] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropRef = useRef(null);
  const country = COUNTRIES.find((c) => c.name === selected);
  const cluster = getCluster(country.adei);
  const region = REGIONS[country.name] || "Other";

  const pillarData = PILLARS.map((p) => ({
    subject: p.short,
    A: country[p.key],
    OIC_Avg: COUNTRIES.reduce((s, c) => s + c[p.key], 0) / COUNTRIES.length,
    fullMark: 100,
  }));

  const peers = COUNTRIES.filter(
    (c) => REGIONS[c.name] === region && c.name !== selected,
  ).slice(0, 5);

  const strengths = [...PILLARS]
    .sort((a, b) => country[b.key] - country[a.key])
    .slice(0, 3);
  const gaps = [...PILLARS]
    .sort((a, b) => country[a.key] - country[b.key])
    .slice(0, 3);

  const regionPeers = COUNTRIES.filter((c) => REGIONS[c.name] === region).sort(
    (a, b) => a.rank - b.rank,
  );
  const regionRank = regionPeers.findIndex((c) => c.name === selected) + 1;

  const peerCompData = [country, ...peers].map((c) => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
    Score: parseFloat(c.adei.toFixed(1)),
    fill: c.name === selected ? "#B8922A" : "#CBD5E1",
  }));

  // Key insight computations
  const oicAvgByPillar = PILLARS.reduce((acc, p) => {
    acc[p.key] = COUNTRIES.reduce((s, c) => s + c[p.key], 0) / COUNTRIES.length;
    return acc;
  }, {});
  const pillarsAboveAvg = PILLARS.filter(
    (p) => country[p.key] > oicAvgByPillar[p.key],
  ).length;
  const bestVsAvg = PILLARS.reduce(
    (best, p) =>
      country[p.key] - oicAvgByPillar[p.key] >
      country[best.key] - oicAvgByPillar[best.key]
        ? p
        : best,
    PILLARS[0],
  );
  const worstVsAvg = PILLARS.reduce(
    (worst, p) =>
      country[p.key] - oicAvgByPillar[p.key] <
      country[worst.key] - oicAvgByPillar[worst.key]
        ? p
        : worst,
    PILLARS[0],
  );
  const peerLeader = regionPeers[0];
  const gapToLeader = (peerLeader.adei - country.adei).toFixed(1);
  const isRegionLeader = regionRank === 1;
  const secondPlace = regionPeers[1];

  const exportCSV = () => {
    const headers = ["Pillar", "Score", "OIC Average", "vs OIC Avg"];
    const rows = PILLARS.map((p) => [
      p.name,
      country[p.key].toFixed(2),
      oicAvgByPillar[p.key].toFixed(2),
      (country[p.key] - oicAvgByPillar[p.key]).toFixed(2),
    ]);
    const meta = [
      [`Country,${country.name}`],
      [`OIC DEI Score,${country.adei.toFixed(2)}`],
      [`Global Rank,#${country.rank}`],
      [`Region,${region}`],
      [],
    ];
    const csv = [...meta, headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${country.name.replace(/[^a-z0-9]/gi, "_")}_OIC_DEI_Profile.csv`;
    a.click();
  };

  const exportPDF = () => {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    script.onload = () => {
      // Calculate strongest & weakest pillars
      const pillarGaps = PILLARS.map((p) => ({
        pillar: p,
        gap: country[p.key] - oicAvgByPillar[p.key],
        score: country[p.key],
      })).sort((a, b) => b.gap - a.gap);
      const strongest = pillarGaps[0];
      const weakest = pillarGaps[pillarGaps.length - 1];

      // Regional comparison
      const regionPeers = [...COUNTRIES]
        .filter((c) => REGIONS[c.name] === REGIONS[country.name])
        .sort((a, b) => b.adei - a.adei);
      const globalLeader = [...COUNTRIES].sort((a, b) => b.adei - a.adei)[0];
      const gapToLeader = (globalLeader.adei - country.adei).toFixed(1);
      const regionLeaderGap =
        regionPeers[0].name === country.name
          ? 0
          : (regionPeers[0].adei - country.adei).toFixed(1);

      // Get top 3 regional performers
      const top3Regional = regionPeers.slice(0, 3);

      const element = document.createElement("div");
      element.style.padding = "20px";
      element.style.fontFamily = "Arial, sans-serif";
      element.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1B4332; margin: 0;">OIC Digital Economy Index</h1>
          <h2 style="color: #2D6A4F; margin: 10px 0; font-size: 24px;">${country.name}</h2>
          <p style="color: #64748B; margin: 5px 0;">Country Profile Report · 2025</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px;">
          <div style="background: #D8F3DC; padding: 15px; border-radius: 8px; border-left: 4px solid #1B4332;">
            <p style="color: #1B4332; font-weight: bold; margin: 0 0 5px 0;">OIC DEI Score</p>
            <h3 style="color: #1B4332; margin: 0; font-size: 28px;">${country.adei.toFixed(1)}/100</h3>
          </div>
          <div style="background: #EEF2FF; padding: 15px; border-radius: 8px; border-left: 4px solid #6366F1;">
            <p style="color: #6366F1; font-weight: bold; margin: 0 0 5px 0;">Global Rank</p>
            <h3 style="color: #6366F1; margin: 0; font-size: 28px;">#${country.rank}</h3>
          </div>
          <div style="background: #FEF3C7; padding: 15px; border-radius: 8px; border-left: 4px solid #D97706;">
            <p style="color: #B45309; font-weight: bold; margin: 0 0 5px 0;">Region</p>
            <h3 style="color: #B45309; margin: 0; font-size: 20px;">${region}</h3>
          </div>
          <div style="background: #DBEAFE; padding: 15px; border-radius: 8px; border-left: 4px solid #2563EB;">
            <p style="color: #1E40AF; font-weight: bold; margin: 0 0 5px 0;">Rank in Region</p>
            <h3 style="color: #1E40AF; margin: 0; font-size: 28px;">#${regionRank}</h3>
          </div>
        </div>

        <h3 style="color: #1B4332; border-bottom: 2px solid #40916C; padding-bottom: 10px; margin-top: 30px;">Digital Economy Classification</h3>
        <div style="background: ${cluster.bg}; border: 1px solid ${cluster.color}40; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <p style="color: ${cluster.color}; font-weight: bold; margin: 0 0 10px 0; font-size: 16px;">${cluster.label}</p>
          <p style="color: #1E293B; margin: 0; line-height: 1.6;">${HEADLINE_REC[cluster.label]}</p>
        </div>

        <h3 style="color: #1B4332; border-bottom: 2px solid #40916C; padding-bottom: 10px; margin-top: 30px;">Performance Highlights</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
          <div style="background: #D8F3DC; padding: 15px; border-radius: 8px; border-left: 4px solid #10B981;">
            <p style="color: #10B981; font-weight: bold; margin: 0 0 5px 0; font-size: 12px;">STRONGEST PILLAR</p>
            <p style="color: #1B4332; font-weight: bold; margin: 0 0 3px 0; font-size: 14px;">${strongest.pillar.name}</p>
            <p style="color: #64748B; margin: 0; font-size: 12px;">Score: <strong>${strongest.score.toFixed(1)}</strong> (+${strongest.gap.toFixed(1)} vs OIC avg)</p>
          </div>
          <div style="background: #FEE2E2; padding: 15px; border-radius: 8px; border-left: 4px solid #EF4444;">
            <p style="color: #EF4444; font-weight: bold; margin: 0 0 5px 0; font-size: 12px;">AREA FOR IMPROVEMENT</p>
            <p style="color: #1B4332; font-weight: bold; margin: 0 0 3px 0; font-size: 14px;">${weakest.pillar.name}</p>
            <p style="color: #64748B; margin: 0; font-size: 12px;">Score: <strong>${weakest.score.toFixed(1)}</strong> (${weakest.gap.toFixed(1)} vs OIC avg)</p>
          </div>
        </div>

        <h3 style="color: #1B4332; border-bottom: 2px solid #40916C; padding-bottom: 10px; margin-top: 30px;">Regional & Global Context</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
          <div style="background: #F0FDF4; padding: 15px; border-radius: 8px; border: 1px solid #86EFAC;">
            <p style="color: #16A34A; font-weight: bold; margin: 0 0 8px 0;">Regional Position</p>
            <p style="color: #1E293B; margin: 0 0 5px 0; font-size: 13px;">Ranked <strong>#${regionRank}</strong> in ${region}</p>
            <p style="color: #1E293B; margin: 0; font-size: 13px;">Gap to regional leader: <strong>${regionLeaderGap === 0 ? "You are the leader!" : "+" + regionLeaderGap}</strong></p>
          </div>
          <div style="background: #EFF6FF; padding: 15px; border-radius: 8px; border: 1px solid #93C5FD;">
            <p style="color: #1E40AF; font-weight: bold; margin: 0 0 8px 0;">Global Benchmark</p>
            <p style="color: #1E293B; margin: 0 0 5px 0; font-size: 13px;">Global leader: <strong>${globalLeader.name}</strong></p>
            <p style="color: #1E293B; margin: 0; font-size: 13px;">Gap to close: <strong>${gapToLeader} points</strong></p>
          </div>
        </div>

        <h3 style="color: #1B4332; border-bottom: 2px solid #40916C; padding-bottom: 10px; margin-top: 30px;">Pillar Score Performance</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #1B4332; color: white;">
              <th style="padding: 10px; text-align: left; border: 1px solid #E2E8F0;">Pillar</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #E2E8F0;">Score</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #E2E8F0;">OIC Avg</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #E2E8F0;">vs Avg</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #E2E8F0;">Performance</th>
            </tr>
          </thead>
          <tbody>
            ${PILLARS.map((p) => {
              const gap = country[p.key] - oicAvgByPillar[p.key];
              const barWidth = Math.max(0, (country[p.key] / 100) * 150);
              return `
              <tr style="background: ${PILLARS.indexOf(p) % 2 === 0 ? "#FFFFFF" : "#F8FAFC"}; border: 1px solid #E2E8F0;">
                <td style="padding: 10px; border: 1px solid #E2E8F0; color: ${p.color}; font-weight: bold; font-size: 12px;">${p.name}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #E2E8F0; font-weight: bold;">${country[p.key].toFixed(1)}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #E2E8F0; font-size: 12px;">${oicAvgByPillar[p.key].toFixed(1)}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #E2E8F0; color: ${gap >= 0 ? "#10B981" : "#EF4444"}; font-weight: bold;">${gap >= 0 ? "+" : ""}${gap.toFixed(1)}</td>
                <td style="padding: 5px; border: 1px solid #E2E8F0;">
                  <div style="background: ${p.color}; width: ${barWidth}px; height: 20px; border-radius: 4px; opacity: 0.7;"></div>
                </td>
              </tr>
            `;
            }).join("")}
          </tbody>
        </table>

        <h3 style="color: #1B4332; border-bottom: 2px solid #40916C; padding-bottom: 10px; margin-top: 30px;">Top Regional Performers</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px;">
          ${top3Regional
            .map(
              (c, idx) => `
            <div style="background: #F8FAFC; padding: 12px; border-radius: 8px; border: 1px solid #E2E8F0;">
              <p style="color: #1B4332; font-weight: bold; margin: 0 0 5px 0; font-size: 13px;">#${idx + 1} ${c.name}</p>
              <p style="color: #64748B; margin: 0; font-size: 12px;">Score: <strong>${c.adei.toFixed(1)}</strong></p>
            </div>
          `,
            )
            .join("")}
        </div>

        <h3 style="color: #1B4332; border-bottom: 2px solid #40916C; padding-bottom: 10px; margin-top: 30px;">Strategic Recommendations</h3>
        <div style="line-height: 1.8; font-size: 13px; color: #1E293B; margin-bottom: 20px;">
          <p><strong style="color: #1B4332;">1. Strengthen Your Position</strong><br/>Focus on enhancing ${strongest.pillar.name} where you have competitive advantage. This pillar is your key differentiator.</p>
          <p><strong style="color: #1B4332;">2. Bridge the Gap</strong><br/>Prioritize ${weakest.pillar.name} to reduce the ${Math.abs(weakest.gap).toFixed(1)} point gap from OIC average. This is critical for overall advancement.</p>
          <p><strong style="color: #1B4332;">3. Benchmark Learning</strong><br/>Study successful implementations from ${top3Regional[0].name} and other regional leaders to accelerate progress toward advanced digital economy status.</p>
          <p><strong style="color: #1B4332;">4. Close Global Gap</strong><br/>To reach ${globalLeader.name}'s level, focus investments on digital infrastructure, innovation, and workforce development aligned with your classification tier.</p>
        </div>

        <div style="page-break-inside: avoid; margin-top: 30px; border-top: 2px solid #E2E8F0; padding-top: 15px; background: #F8FAFC; padding: 15px; border-radius: 8px;">
          <p style="color: #1B4332; font-weight: bold; margin: 0 0 10px 0;">Report Summary</p>
          <p style="color: #64748B; font-size: 12px; margin: 0 0 5px 0;">
            <strong>Generated:</strong> ${new Date().toLocaleDateString()} · <strong>Assessment:</strong> OIC Digital Economy Index 2025
          </p>
          <p style="color: #94A3B8; font-size: 11px; margin: 0;">
            This report provides a comprehensive analysis of ${country.name}'s digital readiness. For updates and interactive analysis, visit the OIC Digital Economy Index Dashboard.
          </p>
        </div>
      `;

      const opt = {
        margin: 10,
        filename: `${country.name.replace(/[^a-z0-9]/gi, "_")}_OIC_DEI_Profile.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
      };

      window.html2pdf().set(opt).from(element).save();
    };
    document.head.appendChild(script);
  };

  const copyLink = () => {
    const hash = `#country=${encodeURIComponent(selected)}&tab=profiles`;
    const url = window.location.href.split("#")[0] + hash;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const HEADLINE_REC = {
    "Advanced Digital Economies":
      "Transition from digital follower to global standard-setter. Lead OIC in AI governance, digital export frameworks, and Islamic Fintech international standards.",
    "Emerging Digital Economies":
      "Bridge the gap to Advanced Digital Economies status by targeting private-sector digital adoption, R&D investment, and advanced skills development.",
    "Foundational Digital Economies":
      "Establish core digital infrastructure and implement nationwide digital literacy programs as the immediate national priority.",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header: selector + badge + print */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        {/* Searchable country selector */}
        <div style={{ position: "relative" }} ref={dropRef}>
          <input
            value={showDrop ? search : selected}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowDrop(true);
            }}
            onFocus={() => {
              setSearch("");
              setShowDrop(true);
            }}
            onBlur={() => setTimeout(() => setShowDrop(false), 150)}
            placeholder="Search country…"
            style={{ ...styles.select, minWidth: "220px" }}
          />
          {showDrop && (
            <div
              style={{
                position: "absolute",
                top: "105%",
                left: 0,
                right: 0,
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                maxHeight: "240px",
                overflowY: "auto",
                zIndex: 200,
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              }}
            >
              {[...COUNTRIES]
                .sort((a, b) => a.name.localeCompare(b.name))
                .filter((c) =>
                  c.name.toLowerCase().includes(search.toLowerCase()),
                )
                .map((c) => (
                  <div
                    key={c.name}
                    onMouseDown={() => {
                      setSelected(c.name);
                      setSearch("");
                      setShowDrop(false);
                    }}
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      fontSize: "13px",
                      color: c.name === selected ? "#B8922A" : "#1E293B",
                      background:
                        c.name === selected ? "#FDF6E3" : "transparent",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#F1F5F9")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        c.name === selected ? "#FDF6E3" : "transparent")
                    }
                  >
                    {c.name}
                  </div>
                ))}
            </div>
          )}
        </div>
        <div
          style={{
            ...styles.badge(cluster.color, cluster.bg),
            fontSize: "13px",
            padding: "4px 12px",
          }}
        >
          {cluster.label}
        </div>
        <div style={{ color: "#64748B", fontSize: "13px" }}>
          Region: <span style={{ color: "#64748B" }}>{region}</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          <button
            onClick={exportCSV}
            style={{
              ...styles.select,
              background: "#F0FDF4",
              color: "#10B981",
              borderColor: "#10B98140",
              cursor: "pointer",
            }}
          >
            ⬇ Export CSV
          </button>
          <button
            onClick={exportPDF}
            style={{
              ...styles.select,
              background: "#FEE2E2",
              color: "#DC2626",
              borderColor: "#DC262640",
              cursor: "pointer",
            }}
          >
            📄 Download PDF
          </button>
          <button
            onClick={copyLink}
            style={{
              ...styles.select,
              background: "#FDF6E3",
              color: "#000000",
              borderColor: "#B8922A40",
              cursor: "pointer",
            }}
          >
            {copied ? "✅ Copied!" : "🔗 Copy Link"}
          </button>
          <button
            onClick={() => window.print()}
            style={{
              ...styles.select,
              background: "#EEF2FF",
              color: "#6366F1",
              borderColor: "#6366F140",
              cursor: "pointer",
            }}
          >
            🖨 Print
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "12px",
        }}
      >
        {[
          {
            label: "OIC DEI Score",
            value: country.adei.toFixed(1),
            color: cluster.color,
          },
          {
            label: "Global Rank",
            value: `#${country.rank} of 57`,
            color: "#000000",
          },
          {
            label: "Regional Rank",
            value: `#${regionRank} in ${region}`,
            color: "#10B981",
          },
          {
            label: "Best Pillar",
            value: PILLARS.reduce(
              (b, p) => (country[p.key] > country[b.key] ? p : b),
              PILLARS[0],
            ).short,
            color: "#10B981",
          },
          {
            label: "vs OIC Average",
            value: `${country.adei > OIC_AVERAGE ? "+" : ""}${(country.adei - OIC_AVERAGE).toFixed(1)} pts`,
            color: country.adei >= OIC_AVERAGE ? "#10B981" : "#EF4444",
          },
        ].map((kpi, i) => (
          <div key={i} style={{ ...styles.card, textAlign: "center" }}>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 900,
                color: kpi.color,
                fontFamily: "'Georgia', serif",
              }}
            >
              {kpi.value}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#1E293B",
                marginTop: "4px",
                letterSpacing: "0.05em",
              }}
            >
              {kpi.label}
            </div>
          </div>
        ))}
      </div>

      <div style={styles.grid2}>
        {/* Radar Chart */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>📡 Pillar Radar Profile</div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={pillarData}>
              <PolarGrid stroke="#E2E8F0" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: "#64748B", fontSize: 11, fontWeight: 500 }}
              />
              <PolarRadiusAxis
                domain={[0, 100]}
                tick={{ fill: "#64748B", fontSize: 9 }}
              />
              <Radar
                name="OIC Average"
                dataKey="OIC_Avg"
                stroke="#94A3B8"
                fill="#94A3B8"
                fillOpacity={0.08}
                strokeDasharray="4 4"
                strokeWidth={2}
              />
              <Radar
                name={country.name}
                dataKey="A"
                stroke={cluster.color}
                fill={cluster.color}
                fillOpacity={0.25}
                strokeWidth={2.5}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
          {/* Key Insight */}
          <div
            style={{
              background: "#FDF6E3",
              border: "1px solid #F0C96A",
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
                  color: "#000000",
                }}
              >
                Key insight
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
              {country.name} outperforms the OIC average in{" "}
              <strong>
                {pillarsAboveAvg} of {PILLARS.length} pillars
              </strong>
              . Strongest advantage in{" "}
              <strong style={{ color: bestVsAvg.color }}>
                {bestVsAvg.name}
              </strong>{" "}
              (
              <strong>
                +
                {(
                  country[bestVsAvg.key] - oicAvgByPillar[bestVsAvg.key]
                ).toFixed(1)}{" "}
                pts
              </strong>{" "}
              vs OIC avg); largest gap in{" "}
              <strong style={{ color: worstVsAvg.color }}>
                {worstVsAvg.name}
              </strong>{" "}
              (
              <strong>
                {(
                  country[worstVsAvg.key] - oicAvgByPillar[worstVsAvg.key]
                ).toFixed(1)}{" "}
                pts
              </strong>{" "}
              vs OIC avg).
            </p>
          </div>
        </div>

        {/* Pillar Scores */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Pillar Score Breakdown</div>
          {PILLARS.map((p) => (
            <div key={p.id} style={{ marginBottom: "12px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "4px",
                }}
              >
                <span style={{ fontSize: "12px", color: "#64748B" }}>
                  {p.name}
                </span>
                <span
                  style={{ fontSize: "12px", fontWeight: 700, color: p.color }}
                >
                  {country[p.key].toFixed(1)}
                </span>
              </div>
              <div
                style={{
                  height: "8px",
                  borderRadius: "4px",
                  background: "#F1F5F9",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${country[p.key]}%`,
                    background: `linear-gradient(90deg, ${p.color}80, ${p.color})`,
                    borderRadius: "4px",
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths, Gaps & Recommendation */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "16px",
        }}
      >
        <div style={{ ...styles.card, borderColor: "#10B98140" }}>
          <div style={{ ...styles.cardTitle, color: "#10B981" }}>
            ✅ Key Strengths
          </div>
          {strengths.map((p) => (
            <div
              key={p.key}
              style={{ fontSize: "13px", color: "#64748B", padding: "4px 0" }}
            >
              <span style={{ color: p.color }}>●</span> {p.name}{" "}
              <strong style={{ color: "#64748B" }}>
                {country[p.key].toFixed(0)}
              </strong>
            </div>
          ))}
        </div>
        <div style={{ ...styles.card, borderColor: "#EF444440" }}>
          <div style={{ ...styles.cardTitle, color: "#EF4444" }}>
            ⚠ Areas for Growth
          </div>
          {gaps.map((p) => (
            <div
              key={p.key}
              style={{ fontSize: "13px", color: "#64748B", padding: "4px 0" }}
            >
              <span style={{ color: p.color }}>●</span> {p.name}{" "}
              <strong style={{ color: "#EF4444" }}>
                {country[p.key].toFixed(0)}
              </strong>
            </div>
          ))}
        </div>
        <div style={{ ...styles.card, borderColor: "#B8922A40" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "8px",
              ...styles.cardTitle,
              color: "#000000",
            }}
          >
            <div>Headline Recommendation</div>
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
            {HEADLINE_REC[cluster.label]}
          </p>
        </div>
      </div>

      {/* Narrative Assessment */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>📝 Narrative Assessment</div>
        <p
          style={{
            color: "#1E293B",
            fontSize: "14px",
            lineHeight: 1.8,
            margin: 0,
          }}
        >
          {country.name} scores{" "}
          <strong style={{ color: cluster.color }}>
            {country.adei.toFixed(1)}
          </strong>{" "}
          on the 2025 OIC Digital Economy Index, placing it{" "}
          <strong style={{ color: "#000000" }}>#{country.rank}</strong> globally
          and <strong style={{ color: "#10B981" }}>#{regionRank}</strong> within{" "}
          {region}. As a{" "}
          <strong style={{ color: cluster.color }}>{cluster.label}</strong>, the
          country demonstrates notable capability in{" "}
          <strong style={{ color: strengths[0].color }}>
            {strengths[0].name}
          </strong>{" "}
          ({country[strengths[0].key].toFixed(0)}),{" "}
          <strong style={{ color: strengths[1].color }}>
            {strengths[1].name}
          </strong>{" "}
          ({country[strengths[1].key].toFixed(0)}), and{" "}
          <strong style={{ color: strengths[2].color }}>
            {strengths[2].name}
          </strong>{" "}
          ({country[strengths[2].key].toFixed(0)}). However, notable areas for
          development remain in{" "}
          <strong style={{ color: gaps[0].color }}>{gaps[0].name}</strong> (
          {country[gaps[0].key].toFixed(0)}) and{" "}
          <strong style={{ color: gaps[1].color }}>{gaps[1].name}</strong> (
          {country[gaps[1].key].toFixed(0)}), which present the highest
          return-on-investment opportunity for targeted policy intervention.{" "}
          {country.adei >= OIC_AVERAGE
            ? `The country performs ${(country.adei - OIC_AVERAGE).toFixed(1)} points above the OIC average of ${OIC_AVERAGE.toFixed(1)}, positioning it as a potential regional knowledge-transfer hub.`
            : `Closing the ${(OIC_AVERAGE - country.adei).toFixed(1)}-point gap to the OIC average of ${OIC_AVERAGE.toFixed(1)} should serve as a near-term policy milestone.`}
        </p>
      </div>

      {/* Regional Peer Comparison */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>Regional Peer Comparison — {region}</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={peerCompData} barSize={40}>
            <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
            <XAxis dataKey="name" tick={{ fill: "#1E293B", fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fill: "#1E293B", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="Score">
              {peerCompData.map((d, i) => (
                <Cell key={i} fill={i === 0 ? "#B8922A" : "#CBD5E1"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {/* Key Insight */}
        <div
          style={{
            background: "#FDF6E3",
            border: "1px solid #F0C96A",
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
                color: "#000000",
              }}
            >
              Key insight
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
            {isRegionLeader ? (
              secondPlace ? (
                <>
                  <strong>
                    {country.name} leads {region}
                  </strong>{" "}
                  with a score of <strong>{country.adei.toFixed(1)}</strong>,{" "}
                  <strong>
                    {(country.adei - secondPlace.adei).toFixed(1)} pts
                  </strong>{" "}
                  ahead of <strong>{secondPlace.name}</strong> (
                  {secondPlace.adei.toFixed(1)}).
                </>
              ) : (
                <>
                  <strong>
                    {country.name} leads {region}
                  </strong>{" "}
                  with a score of <strong>{country.adei.toFixed(1)}</strong>. It
                  is currently the only OIC member state in this region.
                </>
              )
            ) : (
              <>
                {country.name} ranks{" "}
                <strong>
                  #{regionRank} in {region}
                </strong>{" "}
                with a score of <strong>{country.adei.toFixed(1)}</strong>. Gap
                to regional leader <strong>{peerLeader.name}</strong>:{" "}
                <strong>{gapToLeader} pts</strong>.
                {regionRank === 2 && (
                  <> One position away from leading the region.</>
                )}
              </>
            )}{" "}
            The region spans{" "}
            <strong>{regionPeers.length} OIC member states</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── COMPARE COUNTRIES TAB ──────────────────────────────────────────────────
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

// ─── PILLAR ANALYSIS TAB ─────────────────────────────────────────────────────
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
                border: `1px solid ${i === pillarIdx ? p.color : "#CBD5E1"}`,
                cursor: "pointer",
                fontSize: "12px",
                background: i === pillarIdx ? `${p.color}20` : "transparent",
                color: i === pillarIdx ? p.color : "#64748B",
                fontFamily: "'Georgia', serif",
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
          { label: "Weight", value: `${pillar.weight}%`, color: "#000000" },
          { label: "OIC Average", value: avg.toFixed(1), color: "#10B981" },
          { label: "Dimension", value: pillar.dim, color: "#8B5CF6" },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              ...styles.card,
              textAlign: "center",
              borderColor: `${pillar.color}40`,
            }}
          >
            <div style={{ fontSize: "18px", fontWeight: 900, color: s.color }}>
              {s.value}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#1E293B",
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
          background: `linear-gradient(135deg, #FFFFFF 0%, ${pillar.color}08 100%)`,
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
            color: "#1E293B",
            fontSize: "14px",
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          {INSIGHTS[pillar.key]}{" "}
          <strong style={{ color: "#1B4332" }}>{leaders[0].name}</strong> leads
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
                      color: "#FFFFFF",
                      borderRadius: "4px",
                      padding: "2px 8px",
                      fontSize: "10px",
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
                        background: "#FFFFFF",
                        border: `1px solid ${pillar.color}40`,
                        borderRadius: "6px",
                        padding: "6px 10px",
                        fontSize: "11px",
                        color: "#1E293B",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "9px",
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
              stroke="#E2E8F0"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tickFormatter={(name) =>
                name.length > 15 ? name.slice(0, 14) + "…" : name
              }
              tick={{ fill: "#64748B", fontSize: 9, fontWeight: 500 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis domain={[0, 100]} tick={{ fill: "#64748B", fontSize: 11 }} />
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
              stroke="#B8922A"
              strokeDasharray="4 4"
              label={{
                value: `Avg: ${avg.toFixed(1)}`,
                fill: "#B8922A",
                fontSize: 11,
                fontWeight: 600,
                position: "insideTopRight",
              }}
            />
          </BarChart>
        </ResponsiveContainer>
        <div
          style={{
            background: "#FDF6E3",
            border: "1px solid #F0C96A",
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
                color: "#000000",
              }}
            >
              Key insight
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

// ─── GEOGRAPHIC ANALYSIS TAB ─────────────────────────────────────────────────
function GeographicAnalysis() {
  const regionGroups = {};
  COUNTRIES.forEach((c) => {
    const r = REGIONS[c.name] || "Other";
    if (!regionGroups[r]) regionGroups[r] = [];
    regionGroups[r].push(c);
  });

  const regionStats = Object.entries(regionGroups)
    .map(([region, countries]) => ({
      region,
      count: countries.length,
      avg: countries.reduce((s, c) => s + c.adei, 0) / countries.length,
      max: Math.max(...countries.map((c) => c.adei)),
      min: Math.min(...countries.map((c) => c.adei)),
      countries,
    }))
    .sort((a, b) => b.avg - a.avg);

  const REGION_COLORS = {
    GCC: "#1B4332",
    "Southeast Asia": "#2D6A4F",
    "Central Asia": "#40916C",
    "South Asia": "#52B788",
    "Middle East": "#74C69D",
    "North Africa": "#95D5B2",
    "West Africa": "#1F4E38",
    "East Africa": "#388E7F",
    "Central Africa": "#2D6A4F",
    "Southeastern Africa": "#40916C",
    "South America": "#52B788",
    Europe: "#74C69D",
    Americas: "#1B4332",
  };

  const clusterByRegion = regionStats.map((r) => ({
    name: r.region,
    Advanced: r.countries.filter((c) => c.adei >= 60).length,
    Emerging: r.countries.filter((c) => c.adei >= 40 && c.adei < 60).length,
    Foundational: r.countries.filter((c) => c.adei < 40).length,
  }));

  const GEO_COORDS = {
    "United Arab Emirates": [24.0, 54.0],
    "Saudi Arabia": [24.0, 45.0],
    Malaysia: [4.0, 108.0],
    Qatar: [25.3, 51.5],
    Indonesia: [-5.0, 117.0],
    Türkiye: [39.0, 35.0],
    Kazakhstan: [48.0, 68.0],
    Jordan: [31.0, 37.0],
    Tunisia: [34.0, 9.0],
    Morocco: [32.0, -5.0],
    Oman: [21.0, 57.0],
    Uzbekistan: [41.0, 64.0],
    Bahrain: [26.0, 50.5],
    Egypt: [26.0, 30.0],
    Kuwait: [29.5, 47.5],
    Albania: [41.0, 20.0],
    Senegal: [14.0, -14.0],
    "Kyrgyz Republic": [41.5, 75.0],
    Azerbaijan: [40.5, 47.5],
    Algeria: [28.0, 3.0],
    "Iran, Islamic Rep.": [32.0, 53.0],
    Bangladesh: [24.0, 90.0],
    "Brunei Darussalam": [4.5, 114.7],
    Pakistan: [30.0, 70.0],
    Nigeria: [10.0, 8.0],
    Benin: [9.3, 2.3],
    Uganda: [1.0, 32.0],
    "Cote d'Ivoire": [7.5, -5.5],
    Lebanon: [33.9, 35.9],
    Cameroon: [5.0, 12.0],
    Tajikistan: [39.0, 71.0],
    Mali: [17.0, -4.0],
    Maldives: [3.2, 73.2],
    Togo: [8.0, 1.2],
    Suriname: [4.0, -56.0],
    Mozambique: [-18.0, 35.0],
    Mauritania: [20.0, -12.0],
    "Burkina Faso": [12.0, -2.0],
    Gabon: [-1.0, 12.0],
    Guyana: [5.0, -59.0],
    "Sierra Leone": [8.5, -11.8],
    Iraq: [33.0, 44.0],
    Guinea: [11.0, -12.0],
    Gambia: [13.5, -16.6],
    Niger: [17.0, 8.0],
    Yemen: [15.0, 48.0],
    Turkmenistan: [40.0, 59.0],
    Chad: [15.0, 19.0],
    Djibouti: [11.5, 43.0],
    Comoros: [-11.6, 43.3],
    "Guinea-Bissau": [11.8, -15.2],
    Palestine: [31.9, 35.2],
    "Syrian Arab Republic": [35.0, 38.0],
    Libya: [27.0, 17.0],
    Sudan: [15.0, 30.0],
    Afghanistan: [33.0, 65.0],
    Somalia: [6.0, 46.2],
  };

  const mapData = COUNTRIES.filter((c) => GEO_COORDS[c.name]).map((c) => ({
    name: c.name,
    x: GEO_COORDS[c.name][1],
    y: GEO_COORDS[c.name][0],
    score: parseFloat(c.adei.toFixed(1)),
    color: c.adei >= 60 ? "#1B4332" : c.adei >= 40 ? "#52B788" : "#95D5B2",
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Regional Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "12px",
        }}
      >
        {regionStats.slice(0, 5).map((r) => (
          <div
            key={r.region}
            style={{
              ...styles.card,
              background:
                REGION_COLORS[r.region] === "#1B4332" ? "#D8F3DC" : "#F8FDFC",
              borderColor: REGION_COLORS[r.region],
              borderWidth: "2px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: REGION_COLORS[r.region],
                fontWeight: 700,
                marginBottom: "8px",
              }}
            >
              {r.region}
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 900,
                color: REGION_COLORS[r.region],
              }}
            >
              {r.avg.toFixed(1)}
            </div>
            <div style={{ fontSize: "11px", color: "#64748B" }}>
              {r.count} countries
            </div>
            <div
              style={{
                fontSize: "10px",
                color: "#64748B",
                marginTop: "6px",
                fontWeight: 500,
              }}
            >
              Range: {r.min.toFixed(0)}–{r.max.toFixed(0)}
            </div>
          </div>
        ))}
      </div>

      {/* Geographic Scatter Map */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          Geographic Distribution of OIC Digital Performance
        </div>
        <div
          style={{
            display: "flex",
            gap: "16px",
            fontSize: "11px",
            color: "#1B4332",
            marginBottom: "12px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "12px",
                height: "12px",
                background: "#1B4332",
                borderRadius: "50%",
              }}
            />
            Advanced (60+)
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "12px",
                height: "12px",
                background: "#52B788",
                borderRadius: "50%",
              }}
            />
            Emerging (40–60)
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "12px",
                height: "12px",
                background: "#95D5B2",
                borderRadius: "50%",
              }}
            />
            Foundational (&lt;40)
          </span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
            <CartesianGrid strokeDasharray="0" stroke="#E2E8F0" />
            <XAxis
              type="number"
              dataKey="x"
              domain={[-70, 130]}
              name="Longitude"
              tick={{ fill: "#1B4332", fontSize: 9, fontWeight: 600 }}
              label={{
                value: "West   Longitude   East",
                fill: "#1B4332",
                fontSize: 10,
                fontWeight: 600,
                position: "insideBottom",
                offset: -2,
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[-25, 55]}
              name="Latitude"
              tick={{ fill: "#1B4332", fontSize: 9, fontWeight: 600 }}
              label={{
                value: "Latitude",
                fill: "#1B4332",
                fontSize: 10,
                fontWeight: 600,
                angle: -90,
                position: "insideLeft",
              }}
            />
            <ZAxis type="number" dataKey="score" range={[40, 300]} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div style={styles.tooltip}>
                    <div style={{ color: d.color, fontWeight: 700 }}>
                      {d.name}
                    </div>
                    <div style={{ fontSize: "12px" }}>
                      OIC DEI Score:{" "}
                      <span style={{ fontWeight: 700 }}>{d.score}</span>
                    </div>
                  </div>
                );
              }}
            />
            <Scatter data={mapData} name="Countries">
              {mapData.map((d, i) => (
                <Cell key={i} fill={d.color} fillOpacity={0.85} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div
          style={{
            fontSize: "11px",
            color: "#64748B",
            marginTop: "8px",
            fontStyle: "italic",
          }}
        >
          Bubble position represents approximate geographic location; bubble
          size indicates OIC DEI score magnitude.
        </div>
        {(() => {
          const advanced = mapData.filter((d) => d.score >= 60);
          const foundational = mapData.filter((d) => d.score < 40);
          const topCountry = mapData.reduce((a, b) =>
            a.score > b.score ? a : b,
          );
          const bottomCountry = mapData.reduce((a, b) =>
            a.score < b.score ? a : b,
          );
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
                The map reveals a clear{" "}
                <strong>geographic concentration of digital leaders</strong> in
                the Gulf and Southeast Asia, while Sub-Saharan Africa and parts
                of Central Asia remain predominantly foundational.{" "}
                <strong>{advanced.length} countries</strong> (dark green) score
                above 60, with <strong>{foundational.length}</strong> (light
                green) scoring below 40. <strong>{topCountry.name}</strong> (
                {topCountry.score}) and <strong>{bottomCountry.name}</strong> (
                {bottomCountry.score}) represent the geographic extremes of the
                OIC digital divide.
              </p>
            </div>
          );
        })()}
      </div>

      {/* Regional Average Chart */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>Regional Average OIC DEI Scores</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={regionStats.map((r) => ({
              name: r.region,
              avg: parseFloat(r.avg.toFixed(1)),
            }))}
            barSize={40}
          >
            <CartesianGrid
              strokeDasharray="0"
              stroke="#E2E8F0"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: "#1B4332", fontSize: 10, fontWeight: 600 }}
              angle={-20}
              textAnchor="end"
              height={60}
            />
            <YAxis
              domain={[0, 80]}
              tick={{ fill: "#1B4332", fontSize: 11, fontWeight: 600 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="avg" name="Regional Average" radius={[6, 6, 0, 0]}>
              {regionStats.map((r, i) => (
                <Cell key={i} fill={REGION_COLORS[r.region] || "#1B4332"} />
              ))}
            </Bar>
            <ReferenceLine
              y={OIC_AVERAGE}
              stroke="#1B4332"
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{
                value: `OIC Average: ${OIC_AVERAGE.toFixed(1)}`,
                fill: "#1B4332",
                fontSize: 11,
                fontWeight: 700,
              }}
            />
          </BarChart>
        </ResponsiveContainer>
        {(() => {
          const topRegion = regionStats.reduce((a, b) =>
            a.avg > b.avg ? a : b,
          );
          const bottomRegion = regionStats.reduce((a, b) =>
            a.avg < b.avg ? a : b,
          );
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
                <strong>{topRegion.region}</strong> is the highest-performing
                region (avg {topRegion.avg.toFixed(1)}), while{" "}
                <strong>{bottomRegion.region}</strong> scores lowest (avg{" "}
                {bottomRegion.avg.toFixed(1)}). The inter-regional gap of{" "}
                <strong>
                  {(topRegion.avg - bottomRegion.avg).toFixed(1)} points
                </strong>{" "}
                highlights significant geographic disparity within the OIC.{" "}
                <strong>
                  {regionStats.filter((r) => r.avg >= OIC_AVERAGE).length} of{" "}
                  {regionStats.length}
                </strong>{" "}
                regions exceed the OIC average.
              </p>
            </div>
          );
        })()}
      </div>

      {/* Cluster Distribution by Region */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>Cluster Distribution by Region</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={clusterByRegion} barSize={20}>
            <CartesianGrid
              strokeDasharray="0"
              stroke="#E2E8F0"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: "#1B4332", fontSize: 10, fontWeight: 600 }}
              angle={-20}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fill: "#1B4332", fontSize: 11, fontWeight: 600 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                fontSize: "12px",
                paddingTop: "12px",
                fontWeight: 600,
              }}
            />
            <Bar
              dataKey="Advanced"
              fill="#1B4332"
              stackId="a"
              radius={[4, 4, 0, 0]}
            />
            <Bar dataKey="Emerging" fill="#52B788" stackId="a" />
            <Bar dataKey="Foundational" fill="#95D5B2" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
        {(() => {
          const mostAdvanced = [...clusterByRegion].sort(
            (a, b) => b.Advanced - a.Advanced,
          )[0];
          const mostEmerging = [...clusterByRegion].sort(
            (a, b) => b.Foundational - a.Foundational,
          )[0];
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
                <strong>{mostAdvanced.name}</strong> has the highest
                concentration of Advanced Digital Economies (
                {mostAdvanced.Advanced} countries).{" "}
                <strong>{mostEmerging.name}</strong> has the most Foundational
                Digital Economies ({mostEmerging.Foundational} countries),
                indicating the region's greatest need for targeted development
                support and capacity-building initiatives.
              </p>
            </div>
          );
        })()}
      </div>

      {/* Regional Country Tables */}
      {regionStats.map((r) => (
        <div key={r.region} style={styles.card}>
          <div
            style={{
              ...styles.cardTitle,
              color: REGION_COLORS[r.region],
            }}
          >
            {r.region} ({r.count} countries • Avg: {r.avg.toFixed(1)})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {[...r.countries]
              .sort((a, b) => b.adei - a.adei)
              .map((c) => {
                const cl = getCluster(c.adei);
                return (
                  <div
                    key={c.name}
                    style={{
                      background: cl.bg,
                      borderRadius: "8px",
                      padding: "10px 14px",
                      border: `1px solid ${cl.color}`,
                      minWidth: "140px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#1B4332",
                      }}
                    >
                      {c.name}
                    </div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: 900,
                        color: cl.color,
                        marginTop: "4px",
                      }}
                    >
                      {c.adei.toFixed(1)}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#2D6A4F",
                        fontWeight: 600,
                        marginTop: "2px",
                      }}
                    >
                      Rank #{c.rank}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── TRENDS TAB ─────────────────────────────────────────────────────────────
function TrendsProgress() {
  const availableCountries = [
    OIC_AVERAGE_LABEL,
    ...[...COUNTRIES].map((c) => c.name).sort(),
  ];
  const [selectedCountries, setSelectedCountries] = useState([
    "United Arab Emirates",
    "Saudi Arabia",
    "Malaysia",
    "Indonesia",
    "Türkiye",
    OIC_AVERAGE_LABEL,
  ]);

  const toggleCountry = (name) => {
    setSelectedCountries((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  const selectAll = () => setSelectedCountries(availableCountries);
  const deselectAll = () => setSelectedCountries([]);

  const trendColors = {
    "United Arab Emirates": "#1B4332",
    "Saudi Arabia": "#2D6A4F",
    Malaysia: "#40916C",
    Indonesia: "#52B788",
    Qatar: "#74C69D",
    Türkiye: "#95D5B2",
    Kazakhstan: "#1F4E38",
    Jordan: "#388E7F",
    [OIC_AVERAGE_LABEL]: "#1B4332",
  };

  const OTHER_COLORS = ["#2D6A4F", "#40916C", "#52B788", "#74C69D", "#95D5B2"];
  const getColor = (c, i) =>
    trendColors[c] || OTHER_COLORS[i % OTHER_COLORS.length];

  // Every point comes from the workbook panel. A year a country was not scored
  // stays null, which Recharts draws as a break in the line — never as a zero
  // and never as an interpolated guess.
  const lineData = YEARS.map((year, yi) => {
    const row = { year };
    selectedCountries.forEach((country) => {
      row[country] = TREND_DATA[country]?.[yi] ?? null;
    });
    return row;
  });

  // Score distribution
  const bins = Array.from({ length: 10 }, (_, i) => ({
    range: `${i * 10}–${(i + 1) * 10}`,
    count: COUNTRIES.filter((c) => c.adei >= i * 10 && c.adei < (i + 1) * 10)
      .length,
  }));

  // Country ladder (rank sorted)
  const sorted = [...COUNTRIES].sort((a, b) => a.rank - b.rank);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={styles.card}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <div style={{ ...styles.cardTitle, marginBottom: 0 }}>
            Filter Countries
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={selectAll}
              style={{
                background: "#40916C",
                color: "#FFFFFF",
                border: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "11px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              style={{
                background: "#95D5B2",
                color: "#1B4332",
                border: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "11px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Deselect All
            </button>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {availableCountries.map((c) => (
            <button
              key={c}
              onClick={() => toggleCountry(c)}
              style={{
                background: selectedCountries.includes(c)
                  ? "#1B4332"
                  : "#F0F9F7",
                color: selectedCountries.includes(c) ? "#FFFFFF" : "#1B4332",
                border: selectedCountries.includes(c)
                  ? "none"
                  : "1px solid #D8F3DC",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: selectedCountries.includes(c) ? 600 : 500,
                transition: "all 0.2s ease",
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Trend Lines */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>OIC DEI Score Trends {YEAR_RANGE}</div>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={lineData}>
            <CartesianGrid
              strokeDasharray="0"
              stroke="#E2E8F0"
              vertical={false}
            />
            <XAxis
              dataKey="year"
              tick={{ fill: "#1B4332", fontSize: 11, fontWeight: 600 }}
            />
            <YAxis
              domain={[25, 80]}
              tick={{ fill: "#1B4332", fontSize: 11, fontWeight: 600 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                fontSize: "12px",
                fontFamily: "'Georgia', serif",
                paddingTop: "12px",
              }}
            />
            {selectedCountries.map((country, i) => (
              <Line
                key={country}
                type="monotone"
                dataKey={country}
                stroke={getColor(country, i)}
                strokeWidth={country === OIC_AVERAGE_LABEL ? 3 : 2.5}
                dot={{
                  fill: getColor(country, i),
                  r: country === OIC_AVERAGE_LABEL ? 0 : 4,
                  strokeWidth: country === OIC_AVERAGE_LABEL ? 0 : 2,
                  stroke: "#FFFFFF",
                }}
                strokeDasharray={country === OIC_AVERAGE_LABEL ? "5 5" : undefined}
                isAnimationActive={true}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        {selectedCountries.filter((c) => c !== OIC_AVERAGE_LABEL).length > 0 &&
          (() => {
            const nonAvg = selectedCountries.filter((c) => c !== OIC_AVERAGE_LABEL);
            const startYear = lineData[0];
            const endYear = lineData[lineData.length - 1];
            const gains = nonAvg
              .map((c) => ({
                name: c,
                gain: (endYear[c] || 0) - (startYear[c] || 0),
              }))
              .filter((x) => x.gain !== 0);
            const topGainer =
              gains.length > 0
                ? gains.reduce((a, b) => (a.gain > b.gain ? a : b))
                : null;
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
                  {topGainer ? (
                    <>
                      Among selected countries,{" "}
                      <strong>{topGainer.name}</strong> shows the strongest
                      upward trajectory with a{" "}
                      <strong>+{topGainer.gain.toFixed(1)} pt</strong> gain from
                      2021 to 2025.
                    </>
                  ) : (
                    <>
                      Tracking <strong>{nonAvg.length}</strong> countries over
                      the {YEAR_RANGE} period.
                    </>
                  )}{" "}
                  The OIC average{" "}
                  {selectedCountries.includes(OIC_AVERAGE_LABEL) ? (
                    <>
                      is shown as a <strong>dashed reference line</strong>
                    </>
                  ) : (
                    <>
                      currently stands at{" "}
                      <strong>{OIC_AVERAGE.toFixed(1)}</strong>
                    </>
                  )}
                  .
                </p>
              </div>
            );
          })()}
      </div>

      <div style={styles.grid2}>
        {/* Score Distribution */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Score Distribution (2025)</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={bins} barSize={28}>
              <CartesianGrid
                strokeDasharray="0"
                stroke="#E2E8F0"
                vertical={false}
              />
              <XAxis
                dataKey="range"
                tick={{ fill: "#1B4332", fontSize: 10, fontWeight: 600 }}
              />
              <YAxis
                tick={{ fill: "#1B4332", fontSize: 11, fontWeight: 600 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="count"
                name="Countries"
                fill="#40916C"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          {(() => {
            const peakBin = bins.reduce((a, b) => (a.count > b.count ? a : b));
            const aboveMedianBins = bins.filter((b) => {
              const mid = parseInt(b.range.split("–")[0]) + 5;
              return mid >= OIC_AVERAGE;
            });
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
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#1B4332",
                    marginBottom: "6px",
                  }}
                >
                  Strategic Insight
                </div>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#1E293B",
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  The most common score band is <strong>{peakBin.range}</strong>{" "}
                  with <strong>{peakBin.count} countries</strong>. The
                  distribution is right-skewed, with a small cluster of high
                  performers pulling the mean above the median — indicating that
                  most OIC nations are still in early-to-mid digital development
                  stages.
                </p>
              </div>
            );
          })()}
          <div
            style={{
              marginTop: "12px",
              padding: "12px",
              background: "#F0F9F7",
              borderRadius: "8px",
              border: "1px solid #D8F3DC",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "8px",
                textAlign: "center",
              }}
            >
              {[
                { label: "Mean", value: OIC_AVERAGE.toFixed(1) },
                { label: "Median", value: sorted[28].adei.toFixed(1) },
                {
                  label: "Std Dev",
                  value: Math.sqrt(
                    COUNTRIES.reduce(
                      (s, c) => s + (c.adei - OIC_AVERAGE) ** 2,
                      0,
                    ) / COUNTRIES.length,
                  ).toFixed(1),
                },
              ].map((s) => (
                <div key={s.label}>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 900,
                      color: "#1B4332",
                    }}
                  >
                    {s.value}
                  </div>
                  <div style={{ fontSize: "11px", color: "#2D6A4F" }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Country Ladder */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Country Ladder (2025 Rankings)</div>
          <div style={{ maxHeight: "280px", overflowY: "auto" }}>
            {sorted.map((c, i) => {
              const cl = getCluster(c.adei);
              return (
                <div
                  key={c.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 0",
                    borderBottom: "1px solid #D8F3DC",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#1B4332",
                      width: "20px",
                      textAlign: "right",
                    }}
                  >
                    {i + 1}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      fontSize: "12px",
                      color: "#2D6A4F",
                      fontWeight: 500,
                    }}
                  >
                    {c.name}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: cl.color,
                    }}
                  >
                    {c.adei.toFixed(1)}
                  </div>
                  <div
                    style={{
                      width: "60px",
                      height: "4px",
                      borderRadius: "2px",
                      background: "#D8F3DC",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${c.adei}%`,
                        background: cl.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ marginTop: "10px" }}>
        <ProgressTracker hideTrajectory={true} />
      </div>
    </div>
  );
}

// ─── POLICY RECOMMENDATIONS TAB ─────────────────────────────────────────────
function PolicyRecommendations() {
  const [selected, setSelected] = useState("United Arab Emirates");
  const country = COUNTRIES.find((c) => c.name === selected);
  const cluster = getCluster(country.adei);

  const generateRecommendations = (c) => {
    const recs = [];
    const p = PILLARS.reduce((acc, pillar) => {
      acc[pillar.key] = c[pillar.key];
      return acc;
    }, {});

    if (p.p5 < 40)
      recs.push({
        pillar: "Innovation",
        priority: "IMMEDIATE",
        action:
          "Innovation is the primary bottleneck in OIC's digital transformation. R&D activity remains predominantly state-funded with limited private-sector participation. Incentivize private-sector R&D participation, strengthen venture financing ecosystems, and establish structured commercialization pathways linking university research centers with industry and investment capital.",
        icon: "🔬",
      });
    if (p.p3 < 40)
      recs.push({
        pillar: "Workforce",
        priority: "HIGH",
        action:
          "Many OIC economies remain structurally concentrated in primary sectors rather than knowledge-intensive industries. Launch national digital skills programs targeting youth and women. Expand knowledge-intensive employment through STEM education, professional certifications, and workforce upskilling initiatives.",
        icon: "🎓",
      });
    if (p.p2 < 50)
      recs.push({
        pillar: "Infrastructure",
        priority: "HIGH",
        action:
          "Expand reliable broadband infrastructure, reduce access costs, and treat digital connectivity as a critical public utility. Pursue public-private partnerships for infrastructure financing and leverage Islamic Social Finance (Zakat/Waqf) for digital inclusion programs in underserved areas.",
        icon: "📡",
      });
    if (p.p1 < 50)
      recs.push({
        pillar: "Institutions",
        priority: "HIGH",
        action:
          "Strengthen digital governance frameworks and regulatory quality. Establish an independent digital regulator and implement GDPR-aligned data protection laws.",
        icon: "⚖",
      });
    if (p.p4 < 60)
      recs.push({
        pillar: "E-Government",
        priority: "MEDIUM",
        action:
          "Expand national e-ID and digital public service portals. Adopt open data standards and interoperable government systems. Benchmark against UAE PASS and Saudi Arabia's Absher.",
        icon: "🏛",
      });
    if (p.p8 < 30)
      recs.push({
        pillar: "Financial Market Development",
        priority: "MEDIUM",
        action:
          "Develop Islamic FinTech regulatory sandbox to attract digital finance innovation. In many OIC economies, a substantial population remains outside the formal banking system. Promote mobile banking, digital wallets, and Shariah-compliant FinTech solutions to drive financial inclusion, especially in rural areas.",
        icon: "💰",
      });
    if (p.p6 < 40)
      recs.push({
        pillar: "Future Technologies",
        priority: "MEDIUM",
        action:
          "Many Emerging and Foundational Digital Economies have yet to formalize national AI strategies or mobilize sustained capital toward frontier technologies. Create a national AI strategy with clear governance frameworks and investment incentives for advanced digital sectors to capture value from the next wave of technological transformation.",
        icon: "🤖",
      });
    if (p.p7 < 40)
      recs.push({
        pillar: "Market Development & Sophistication",
        priority: "MEDIUM",
        action:
          "Limited access to growth-stage financing constrains start-up scaling, while insufficient industrial diversification narrows the domestic demand base. Reduce digital trade barriers, streamline e-commerce regulations, expand start-up financing accessibility, and support SME digital adoption.",
        icon: "🛒",
      });

    if (!recs.length)
      recs.push({
        pillar: "Leadership",
        priority: "STRATEGIC",
        action:
          "Maintain leadership position by expanding digital exports, establishing regional tech hubs, and leading OIC digital standards. Invest in cutting-edge research in AI, quantum computing, and blockchain.",
        icon: "🚀",
      });

    return recs;
  };

  const recs = generateRecommendations(country);

  const PRIORITY_STYLES = {
    IMMEDIATE: { color: "#EF4444", bg: "#FEE2E2", border: "#EF4444" },
    HIGH: { color: "#F59E0B", bg: "#FEF3C7", border: "#F59E0B" },
    MEDIUM: { color: "#3B82F6", bg: "#DBEAFE", border: "#3B82F6" },
    STRATEGIC: { color: "#10B981", bg: "#D1FAE5", border: "#10B981" },
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
        <div
          style={{
            ...styles.badge(cluster.color, cluster.bg),
            fontSize: "13px",
            padding: "4px 12px",
          }}
        >
          {cluster.label} · Score: {country.adei.toFixed(1)} · Rank #
          {country.rank}
        </div>
      </div>

      <div
        style={{
          ...styles.card,
          borderColor: `${cluster.color}40`,
          background: `linear-gradient(135deg, #FFFFFF, ${cluster.color}08)`,
        }}
      >
        <div style={{ ...styles.cardTitle, color: cluster.color }}>
          Strategic Context for {country.name}
        </div>
        <p
          style={{
            color: "#1E293B",
            fontSize: "13px",
            lineHeight: 1.8,
            margin: 0,
          }}
        >
          {country.name} is classified as a{" "}
          <strong style={{ color: cluster.color }}>{cluster.label}</strong> with
          an OIC DEI score of{" "}
          <strong style={{ color: "#000000" }}>
            {country.adei.toFixed(1)}
          </strong>{" "}
          (Rank #{country.rank} of {META.countryCount} OIC states). The
          following evidence-based recommendations are derived from pillar-level
          gap analysis relative to OIC leading nations and global best
          practices.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {recs.map((rec, i) => {
          const ps = PRIORITY_STYLES[rec.priority];
          return (
            <div
              key={i}
              style={{
                ...styles.card,
                border: `1px solid ${ps.border}40`,
                background: ps.bg,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    fontSize: "28px",
                    minWidth: "36px",
                    textAlign: "center",
                  }}
                >
                  {rec.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <span
                      style={{
                        ...styles.badge(ps.color, `${ps.border}20`),
                        fontSize: "10px",
                      }}
                    >
                      {rec.priority}
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#1E293B",
                        fontFamily: "'Georgia', serif",
                      }}
                    >
                      {rec.pillar}
                    </span>
                    <span style={{ fontSize: "11px", color: "#64748B" }}>
                      Current Score:{" "}
                      {country[
                        PILLARS.find(
                          (p) =>
                            p.name === rec.pillar ||
                            p.short === rec.pillar ||
                            p.pillar === rec.pillar,
                        )?.key || "p1"
                      ]?.toFixed(1)}
                    </span>
                  </div>
                  <p
                    style={{
                      color: "#1E293B",
                      fontSize: "13px",
                      lineHeight: 1.7,
                      margin: 0,
                    }}
                  >
                    {rec.action}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* OIC-wide Recommendations */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>OIC-Wide Strategic Recommendations</div>
        {[
          {
            icon: "🎯",
            title: "1. Aligning Policy with Digital Maturity",
            desc: "National digital strategies should reflect a country's current digital maturity. Foundational economies: prioritize affordable broadband and digital literacy. Emerging economies: accelerate SME digitalization and workforce upskilling. Advanced economies: scale private-sector R&D and advance frontier technologies.",
          },
          {
            icon: "🔗",
            title: "2. Transforming the Digital Divide into Intra-OIC Synergy",
            desc: "Establish structured intra-OIC corridors for knowledge transfer, venture capital mobilization, and digital trade facilitation. Create common standards for e-commerce governance, digital identity recognition, cybersecurity protocols, and Shariah-compliant FinTech solutions.",
          },
          {
            icon: "🧠",
            title:
              "3. Shared OIC Digital Talent & Innovation Mobility Framework",
            desc: "Develop a bloc-level mechanism to facilitate digital talent movement, harmonize skills certification standards, and co-finance regional centers of excellence in AI, data science, and Islamic FinTech. Structured university-industry collaboration can reduce brain drain and position the OIC as a coordinated digital knowledge hub.",
          },
          {
            icon: "🕌",
            title: "4. Leveraging Islamic Finance for Inclusive Growth",
            desc: "Deploy Zakat and Waqf-backed microfinance for digital inclusion in Foundational economies. Use Shariah-compliant venture capital and equity crowdfunding for Emerging economy start-ups. Advanced economies should pioneer regulatory standards for digital Sukuk and Shariah-compliant FinTech frameworks.",
          },
        ].map((r, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: "12px",
              padding: "12px 0",
              borderBottom: "1px solid #FFFFFF",
            }}
          >
            <span style={{ fontSize: "20px" }}>{r.icon}</span>
            <div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#1E293B",
                  marginBottom: "4px",
                  fontFamily: "'Georgia', serif",
                }}
              >
                {r.title}
              </div>
              <div
                style={{ fontSize: "12px", color: "#1E293B", lineHeight: 1.6 }}
              >
                {r.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DIGITAL DIVIDE TAB ─────────────────────────────────────────────────────
function DigitalDivide() {
  const sorted = [...COUNTRIES].sort((a, b) => b.adei - a.adei);
  const oicAvg = OIC_AVERAGE;
  const above = sorted.filter((c) => c.adei >= oicAvg);
  const below = sorted.filter((c) => c.adei < oicAvg);

  const gapData = sorted.map((c) => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
    gap: parseFloat((c.adei - oicAvg).toFixed(1)),
    score: parseFloat(c.adei.toFixed(1)),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={styles.grid4}>
        {[
          {
            label: "Countries Above OIC Avg",
            value: above.length,
            color: "#40916C",
          },
          {
            label: "Countries Below OIC Avg",
            value: below.length,
            color: "#74C69D",
          },
          {
            label: "OIC Average Score",
            value: oicAvg.toFixed(1),
            color: "#1B4332",
          },
          {
            label: "Max Digital Divide",
            value: `${(sorted[0].adei - sorted[sorted.length - 1].adei).toFixed(0)} pts`,
            color: "#52B788",
          },
        ].map((k, i) => (
          <div
            key={i}
            style={{
              ...styles.card,
              textAlign: "center",
              background: i === 0 ? "#D8F3DC" : "#F0F9F7",
              border: `1px solid ${k.color}`,
            }}
          >
            <div style={{ fontSize: "28px", fontWeight: 900, color: k.color }}>
              {k.value}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#1B4332",
                marginTop: "4px",
                fontWeight: 600,
              }}
            >
              {k.label}
            </div>
          </div>
        ))}
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>
          Gap from OIC Average (All {META.countryCount} Countries)
        </div>
        <ResponsiveContainer width="100%" height={360}>
          <BarChart data={gapData} barSize={10}>
            <CartesianGrid
              strokeDasharray="0"
              stroke="#E2E8F0"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: "#1B4332", fontSize: 9, fontWeight: 600 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fill: "#1B4332", fontSize: 11, fontWeight: 600 }} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={0}
              stroke="#1B4332"
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{
                value: "OIC Average",
                fill: "#1B4332",
                fontSize: 11,
                fontWeight: 700,
              }}
            />
            <Bar dataKey="gap" name="Gap from OIC Avg">
              {gapData.map((d, i) => (
                <Cell key={i} fill={d.gap >= 0 ? "#40916C" : "#95D5B2"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
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
            <strong>{above.length} countries</strong> exceed the OIC average (
            {oicAvg.toFixed(1)}), while{" "}
            <strong>{below.length} countries</strong> fall below it. The largest
            positive gap belongs to <strong>{sorted[0].name}</strong> (+
            {(sorted[0].adei - oicAvg).toFixed(1)} pts) and the largest deficit
            to <strong>{sorted[sorted.length - 1].name}</strong> (
            {(sorted[sorted.length - 1].adei - oicAvg).toFixed(1)} pts),
            representing a total intra-OIC divide of{" "}
            <strong>
              {(sorted[0].adei - sorted[sorted.length - 1].adei).toFixed(0)} pts
            </strong>
            .
          </p>
        </div>
      </div>

      <div style={styles.grid2}>
        <div
          style={{ ...styles.card, borderColor: "#40916C", borderWidth: "2px" }}
        >
          <div style={{ ...styles.cardTitle, color: "#40916C" }}>
            Above OIC Average ({above.length})
          </div>
          {above.map((c) => (
            <div
              key={c.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid #D8F3DC",
                fontSize: "12px",
              }}
            >
              <span style={{ color: "#2D6A4F", fontWeight: 500 }}>
                {c.name}
              </span>
              <span style={{ color: "#40916C", fontWeight: 700 }}>
                +{(c.adei - oicAvg).toFixed(1)}
              </span>
            </div>
          ))}
        </div>
        <div
          style={{ ...styles.card, borderColor: "#95D5B2", borderWidth: "2px" }}
        >
          <div style={{ ...styles.cardTitle, color: "#74C69D" }}>
            Below OIC Average ({below.length})
          </div>
          {below.map((c) => (
            <div
              key={c.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid #D8F3DC",
                fontSize: "12px",
              }}
            >
              <span style={{ color: "#2D6A4F", fontWeight: 500 }}>
                {c.name}
              </span>
              <span style={{ color: "#74C69D", fontWeight: 700 }}>
                {(c.adei - oicAvg).toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── INNOVATION SPECIAL TAB ─────────────────────────────────────────────────
function IslamicDigitalSpecial() {
  const fintech = [...COUNTRIES].sort((a, b) => b.p8 - a.p8).slice(0, 15);
  const innovators = [...COUNTRIES].sort((a, b) => b.p5 - a.p5).slice(0, 15);

  const QUADRANT_DATA = COUNTRIES.map((c) => ({
    name: c.name,
    x: c.p5,
    y: c.p8,
    z: c.adei,
    color: c.adei >= 60 ? "#10B981" : c.adei >= 40 ? "#F59E0B" : "#EF4444",
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div
        style={{
          ...styles.card,
          borderColor: "#B8922A40",
          background: "linear-gradient(135deg, #FFFFFF 0%, #B8922A08 100%)",
        }}
      >
        <div style={styles.cardTitle}>
          🕌 Islamic Digital Economy Special Analysis
        </div>
        <p
          style={{
            color: "#1E293B",
            fontSize: "14px",
            lineHeight: 1.8,
            margin: 0,
          }}
        >
          A unique strategic opportunity is emerging within the OIC bloc: the
          convergence of{" "}
          <strong style={{ color: "#000000" }}>Islamic Finance</strong> and{" "}
          <strong style={{ color: "#10B981" }}>digital technology</strong>.
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
            <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
            <XAxis
              type="number"
              dataKey="x"
              name="Innovation Score"
              domain={[0, 100]}
              tick={{ fill: "#1E293B", fontSize: 11 }}
              label={{
                value: "Innovation →",
                fill: "#1E293B",
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
              tick={{ fill: "#1E293B", fontSize: 11 }}
              label={{
                value: "Financial Markets →",
                fill: "#1E293B",
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
                    <div style={{ color: "#000000", fontWeight: 700 }}>
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
                background: "#FDF6E3",
                border: "1px solid #F0C96A",
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
                    color: "#000000",
                  }}
                >
                  Key insight
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
          <div style={{ ...styles.cardTitle, color: "#EC4899" }}>
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
                      : "#FFFFFF",
                  color: "#1E293B",
                  fontSize: "10px",
                }}
              >
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ fontSize: "12px", color: "#64748B" }}>
                    {c.name}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#EC4899",
                    }}
                  >
                    {c.p8.toFixed(1)}
                  </span>
                </div>
                <div style={styles.scoreBar(c.p8, "#EC4899")} />
              </div>
            </div>
          ))}
        </div>

        {/* Leading Innovators */}
        <div style={styles.card}>
          <div style={{ ...styles.cardTitle, color: "#EF4444" }}>
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
                      : "#FFFFFF",
                  color: "#1E293B",
                  fontSize: "10px",
                }}
              >
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ fontSize: "12px", color: "#64748B" }}>
                    {c.name}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#EF4444",
                    }}
                  >
                    {c.p5.toFixed(1)}
                  </span>
                </div>
                <div style={styles.scoreBar(c.p5, "#EF4444")} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CUSTOM INDEX BUILDER ────────────────────────────────────────────────────
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
          borderColor: "#1B433240",
          background: "linear-gradient(135deg,#FFFFFF,#D8F3DC40)",
          borderWidth: "2px",
        }}
      >
        <div style={{ ...styles.cardTitle, color: "#1B4332" }}>
          Custom Index Builder — Sensitivity Analysis Tool
        </div>
        <p
          style={{
            color: "#1E293B",
            fontSize: "13px",
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          Re-weight the 9 pillars to see how rankings shift under alternative
          policy priorities. Use presets or manually adjust sliders. Weights
          auto-normalize to 100%. Essential for{" "}
          <strong style={{ color: "#1B4332" }}>
            academic sensitivity analysis
          </strong>{" "}
          and <strong style={{ color: "#1B4332" }}>scenario planning</strong>.
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
                fontFamily: "'Georgia',serif",
                background: preset === key ? "#D8F3DC" : "#F0F9F7",
                borderColor: preset === key ? "#1B4332" : "#95D5B2",
                color: preset === key ? "#1B4332" : "#2D6A4F",
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
              color: Math.abs(totalWeight - 100) < 1 ? "#40916C" : "#74C69D",
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
                    fontWeight: 900,
                    color: "#1E293B",
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
                  fontSize: "10px",
                  color: "#1E293B",
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
          style={{ ...styles.card, borderColor: "#40916C", borderWidth: "2px" }}
        >
          <div style={{ ...styles.cardTitle, color: "#40916C" }}>
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
                background: "#D8F3DC",
                borderRadius: "6px",
              }}
            >
              <div style={{ fontSize: "18px", color: "#40916C" }}>↑</div>
              <div style={{ flex: 1 }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#1B4332",
                      fontWeight: 600,
                    }}
                  >
                    {c.name}
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#40916C",
                      fontWeight: 700,
                    }}
                  >
                    +{c.rankChange} places
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "#2D6A4F" }}>
                  #{c.rank} → #{c.customRank} | {c.adei.toFixed(1)} →{" "}
                  {c.customScore.toFixed(1)}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div
          style={{ ...styles.card, borderColor: "#74C69D", borderWidth: "2px" }}
        >
          <div style={{ ...styles.cardTitle, color: "#74C69D" }}>
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
                background: "#F0F9F7",
                borderRadius: "6px",
              }}
            >
              <div style={{ fontSize: "18px", color: "#74C69D" }}>↓</div>
              <div style={{ flex: 1 }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#1B4332",
                      fontWeight: 600,
                    }}
                  >
                    {c.name}
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#74C69D",
                      fontWeight: 700,
                    }}
                  >
                    {c.rankChange} places
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "#2D6A4F" }}>
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
              stroke="#E2E8F0"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: "#1B4332", fontSize: 10, fontWeight: 600 }}
              angle={-30}
              textAnchor="end"
              height={60}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#1B4332", fontSize: 11, fontWeight: 600 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                fontSize: "12px",
                fontFamily: "'Georgia', serif",
                fontWeight: 600,
              }}
            />
            <Bar dataKey="Official" fill="#95D5B2" />
            <Bar dataKey="Custom" fill="#40916C" />
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
              style={{ position: "sticky", top: 0, background: "#FFFFFF" }}
            >
              <tr style={{ borderBottom: "1px solid #B8922A40" }}>
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
                      color: "#000000",
                      textAlign: "center",
                      fontFamily: "'Georgia',serif",
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
                    borderBottom: "1px solid #F1F5F9",
                    background: i % 2 === 0 ? "transparent" : "#64748B10",
                  }}
                >
                  <td
                    style={{
                      padding: "7px 8px",
                      textAlign: "center",
                      fontWeight: 900,
                      color: "#8B5CF6",
                    }}
                  >
                    #{c.customRank}
                  </td>
                  <td
                    style={{
                      padding: "7px 8px",
                      textAlign: "center",
                      color: "#1E293B",
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
                          ? "#10B981"
                          : c.rankChange < 0
                            ? "#EF4444"
                            : "#64748B",
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
                      color: "#1E293B",
                      fontWeight: 600,
                    }}
                  >
                    {c.name}
                  </td>
                  <td
                    style={{
                      padding: "7px 8px",
                      textAlign: "center",
                      color: "#000000",
                    }}
                  >
                    {c.adei.toFixed(1)}
                  </td>
                  <td
                    style={{
                      padding: "7px 8px",
                      textAlign: "center",
                      fontWeight: 700,
                      color: "#8B5CF6",
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

// ─── PRIORITY MATRIX ─────────────────────────────────────────────────────────
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
    "Quick Wins": "#10B981",
    "Long-Term Investment": "#F59E0B",
    "Low Priority": "#3B82F6",
    Deprioritize: "#64748B",
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
        <div style={{ fontSize: "13px", color: "#64748B" }}>
          OIC DEI:{" "}
          <span style={{ color: "#000000", fontWeight: 700 }}>
            {country.adei.toFixed(1)}
          </span>{" "}
          | Rank{" "}
          <span style={{ color: "#000000", fontWeight: 700 }}>
            #{country.rank}
          </span>
        </div>
      </div>
      <div style={{ ...styles.card, borderColor: "#B8922A40" }}>
        <div style={styles.cardTitle}>
          📌 Priority Matrix — Impact vs. Achievability for {country.name}
        </div>
        <div
          style={{
            position: "relative",
            height: "420px",
            background: "#F1F5F9",
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
              background: "#CBD5E1",
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
              background: "#CBD5E1",
              transform: "translateY(-50%)",
            }}
          />
          {[
            { label: "🚀 Quick Wins", x: "75%", y: "10%", color: "#10B981" },
            {
              label: "🏗 Long-Term Investment",
              x: "15%",
              y: "10%",
              color: "#F59E0B",
            },
            { label: "📌 Low Priority", x: "75%", y: "85%", color: "#3B82F6" },
            { label: "⬇ Deprioritize", x: "15%", y: "85%", color: "#64748B" },
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
                fontFamily: "'Georgia',serif",
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
              color: "#1E293B",
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
              color: "#1E293B",
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
                    fontSize: "9px",
                    fontWeight: 700,
                    color: "#F8FAFC",
                    textAlign: "center",
                    lineHeight: 1.1,
                    border: "2px solid #F8FAFC",
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
                    fontSize: "9px",
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
                  color: "#1E293B",
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
                    borderBottom: "1px solid #F1F5F9",
                    fontSize: "12px",
                  }}
                >
                  <span style={{ color: d.color, fontWeight: 600 }}>
                    {d.name}
                  </span>
                  <span style={{ color: "#64748B" }}>
                    Score: {d.currentScore.toFixed(0)} | Gap:{" "}
                    {d.potential.toFixed(0)}
                  </span>
                </div>
              ))}
              {items.length === 0 && (
                <div style={{ color: "#64748B", fontSize: "12px" }}>
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

// ─── PEER LEARNING ────────────────────────────────────────────────────────────
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
    "#1B4332",
    "#2D6A4F",
    "#40916C",
    "#52B788",
    "#74C69D",
    "#95D5B2",
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
                color: "#1B4332",
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
                color: "#1B4332",
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
              color: "#1B4332",
            },
            {
              label: "OIC DEI Score",
              value: country.adei.toFixed(1),
              color: "#2D6A4F",
            },
            {
              label: `${focusPillar.name} Score`,
              value: country[pillarFocus].toFixed(1),
              color: focusPillar.color,
            },
            {
              label: "Performance Gap",
              value: `-${(Math.max(...COUNTRIES.map((c) => c[pillarFocus])) - country[pillarFocus]).toFixed(1)} pts`,
              color: "#EF4444",
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
                  color: "#64748B",
                  marginBottom: "6px",
                }}
              >
                {s.label}
              </div>
              <div
                style={{ fontSize: "28px", fontWeight: 900, color: s.color }}
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
          borderBottom: "2px solid #E8F5E9",
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
              fontFamily: "'Georgia', serif",
              background: viewMode === tab.id ? "#1B433210" : "transparent",
              color: viewMode === tab.id ? "#1B4332" : "#64748B",
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
                          color: "#1E293B",
                          marginBottom: "3px",
                        }}
                      >
                        {peer.name}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#64748B",
                        }}
                      >
                        Rank #{peer.rank}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        background: PEER_COLORS[i],
                        color: "#FFFFFF",
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
                          fontSize: "10px",
                          color: "#64748B",
                          marginBottom: "2px",
                        }}
                      >
                        OIC DEI Score
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#1B4332",
                        }}
                      >
                        {peer.adei.toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#64748B",
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
                <PolarGrid stroke="#E8F5E9" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "#1E293B", fontSize: 11 }}
                />
                <PolarRadiusAxis
                  domain={[0, 100]}
                  tick={{ fill: "#1E293B", fontSize: 9 }}
                />
                <Radar
                  name={country.name}
                  dataKey={country.name}
                  stroke="#1B4332"
                  fill="#1B4332"
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
                    fontFamily: "'Georgia',serif",
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
                    background: "#D8F3DC",
                    border: "1px solid #40916C40",
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
                      fontSize: "13px",
                      color: "#1E293B",
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
                      background: "#1B433210",
                      borderRadius: "10px",
                      padding: "16px",
                      border: "1px solid #40916C40",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#1B4332",
                        marginBottom: "12px",
                      }}
                    >
                      {cs.country}'s Approach
                    </div>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#1E293B",
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

          <div style={{ ...styles.card, background: "#E8F5E915" }}>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#1B4332",
                marginBottom: "8px",
              }}
            >
              Implementation Roadmap
            </div>
            <ol
              style={{
                fontSize: "13px",
                color: "#1E293B",
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
          <div style={{ fontSize: "16px", color: "#000000", fontWeight: 700 }}>
            Leading Performance in {focusPillar.name}
          </div>
          <div style={{ fontSize: "13px", color: "#64748B", marginTop: "8px" }}>
            {country.name} is among the top performers in {focusPillar.name}{" "}
            relative to similar OIC DEI countries. Focus on maintaining
            competitive advantage and thought leadership.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PROGRESS TRACKER ────────────────────────────────────────────────────────
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
          <div style={styles.cardTitle}>Score Trajectory {YEAR_RANGE}</div>
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
              <XAxis dataKey="year" tick={{ fill: "#1E293B", fontSize: 11 }} />
              <YAxis
                domain={[0, 85]}
                tick={{ fill: "#1E293B", fontSize: 11 }}
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
                  background: "#FDF6E3",
                  border: "1px solid #F0C96A",
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
                      color: "#000000",
                    }}
                  >
                    Key insight
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
        <div style={styles.cardTitle}>🔄 Score Change 2021 → 2025</div>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid #B8922A40" }}>
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
                      color: "#000000",
                      textAlign: "center",
                      fontFamily: "'Georgia',serif",
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
                      borderBottom: "1px solid #F1F5F9",
                      background: i % 2 === 0 ? "transparent" : "#64748B10",
                    }}
                  >
                    <td
                      style={{
                        padding: "8px",
                        color: "#1E293B",
                        fontWeight: 600,
                      }}
                    >
                      {c.name}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        textAlign: "center",
                        color: "#000000",
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
                            ? "#64748B"
                            : change >= 0
                              ? "#10B981"
                              : "#EF4444",
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
                        fontSize: "10px",
                        color: "#1E293B",
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
                          fontSize: "9px",
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
        <div style={{ ...styles.cardTitle, color: "#10B981" }}>
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
            <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#1E293B", fontSize: 10 }}
              angle={-20}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fill: "#1E293B", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="growth" name={`Score Gain (${YEAR_RANGE})`}>
              {fastestGrowing.map((c, i) => (
                <Cell key={i} fill={c.growth > 0 ? "#10B981" : "#EF4444"} />
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
                background: "#FDF6E3",
                border: "1px solid #F0C96A",
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
                    color: "#000000",
                  }}
                >
                  Key insight
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

// ─── STATISTICAL ANALYSIS ─────────────────────────────────────────────────────
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

// ─── METHODOLOGY ──────────────────────────────────────────────────────────────
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
          <div style={styles.cardTitle}>Index Overview</div>
          <p
            style={{
              color: "#64748B",
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
                  background: "#D8F3DC",
                  borderRadius: "10px",
                  padding: "16px",
                  textAlign: "center",
                  border: "1px solid #40916C40",
                }}
              >
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 900,
                    color: "#1B4332",
                    marginBottom: "6px",
                  }}
                >
                  {item.value}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#1B4332",
                    marginBottom: "4px",
                  }}
                >
                  {item.label}
                </div>
                <div style={{ fontSize: "11px", color: "#2D6A4F" }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>
            {INDICATOR_COUNTS.pillars} Pillars, {INDICATOR_COUNTS.indicators}{" "}
            Indicators & {INDICATOR_COUNTS.subIndicators} Sub-Indicators
          </div>
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
                            color: "#64748B",
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
                          background: "#FFFFFF",
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
                              color: "#FFFFFF",
                              borderRadius: "4px",
                              padding: "2px 8px",
                              fontSize: "10px",
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
                                background: "#FFFFFF",
                                border: `1px solid ${p.color}40`,
                                borderRadius: "6px",
                                padding: "6px 10px",
                                fontSize: "11px",
                                color: "#1E293B",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "9px",
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
          <div style={styles.cardTitle}>Data Processing & Normalization</div>
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
                  color: "#1B4332",
                  marginBottom: "12px",
                }}
              >
                Missing Value Imputation
              </div>
              <p
                style={{
                  color: "#64748B",
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
                  background: "#1B433210",
                  border: "1px solid #40916C40",
                  borderRadius: "6px",
                  padding: "12px",
                  fontFamily: "monospace",
                  fontSize: "12px",
                  color: "#1B4332",
                  marginBottom: "12px",
                }}
              >
                Min - (5% × Min)
              </div>
              <p
                style={{ color: "#64748B", fontSize: "12px", lineHeight: 1.6 }}
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
                  color: "#1B4332",
                  marginBottom: "12px",
                }}
              >
                Min-Max Normalization
              </div>
              <p
                style={{
                  color: "#64748B",
                  fontSize: "13px",
                  lineHeight: 1.7,
                  marginBottom: "10px",
                }}
              >
                All indicators are normalized to a standardized 0-100 scale:
              </p>
              <div
                style={{
                  background: "#1B433210",
                  border: "1px solid #40916C40",
                  borderRadius: "6px",
                  padding: "12px",
                  fontFamily: "monospace",
                  fontSize: "12px",
                  color: "#1B4332",
                  marginBottom: "12px",
                  lineHeight: 1.6,
                }}
              >
                (Value - Min) / (Max - Min) × 100
              </div>
              <p
                style={{ color: "#64748B", fontSize: "12px", lineHeight: 1.6 }}
              >
                Enables fair comparison across diverse indicators and geographic
                contexts.
              </p>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>Performance Clusters</div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}
          >
            {[
              {
                title: "Advanced Digital Economies",
                range: "Score ≥ 60",
                color: "#1B4332",
                bgColor: "#D8F3DC",
                count: "6 States",
                desc: "Well positioned to transition from infrastructure expansion toward innovation leadership. Priorities include scaling frontier R&D, strengthening patent commercialization, and contributing to global AI and data governance frameworks.",
              },
              {
                title: "Emerging Digital Economies",
                range: "Score 40–59",
                color: "#52B788",
                bgColor: "#E8F5E9",
                count: "15 States",
                desc: "Established core infrastructure but would benefit from strengthening digital skills, institutional capacity, SME digital transformation, and innovation financing to avoid middle digital stagnation.",
              },
              {
                title: "Foundational Digital Economies",
                range: "Score < 40",
                color: "#95D5B2",
                bgColor: "#F1F8F6",
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
                          color: "#64748B",
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
                      color: "#1E293B",
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
        <div style={styles.cardTitle}>Primary Data Sources</div>
        <p
          style={{
            color: "#64748B",
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
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px",
            marginTop: "16px",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "2px solid #40916C40" }}>
              {["Indicator", "Code", "Source"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "12px 8px",
                    color: "#1B4332",
                    textAlign: "left",
                    fontWeight: 700,
                    fontSize: "12px",
                  }}
                >
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
                  borderBottom: "1px solid #E8F5E9",
                  background: i % 2 === 0 ? "transparent" : "#F1F8F615",
                }}
              >
                <td style={{ padding: "10px 8px", color: "#1E293B" }}>
                  {s.indicator}
                </td>
                <td
                  style={{
                    padding: "10px 8px",
                    color: "#1B4332",
                    fontFamily: "monospace",
                    fontWeight: 600,
                  }}
                >
                  {s.code}
                </td>
                <td style={{ padding: "10px 8px", color: "#64748B" }}>
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
        <div style={styles.cardTitle}>Data Coverage &amp; Known Limitations</div>
        <p
          style={{
            color: "#64748B",
            fontSize: "13px",
            lineHeight: 1.8,
            marginBottom: "16px",
          }}
        >
          Scores are read directly from{" "}
          <span style={{ fontFamily: "monospace", color: "#1B4332" }}>
            {META.source}
          </span>{" "}
          (sheet{" "}
          <span style={{ fontFamily: "monospace", color: "#1B4332" }}>
            {META.sheets.panel}
          </span>
          ), covering {META.countryCount} member states for {YEARS[0]}–
          {YEARS[YEARS.length - 1]}. The caveats below are detected when the
          dataset is built and are reproduced here unaltered rather than
          smoothed over.
        </p>

        <div
          style={{
            background: "#FFF7ED",
            border: "1px solid #FDBA74",
            borderRadius: "10px",
            padding: "16px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#9A3412",
              marginBottom: "8px",
            }}
          >
            Global Findex coverage (sub-indicators{" "}
            {FINDEX.codes.join(", ")})
          </div>
          <p
            style={{
              fontSize: "13px",
              color: "#7C2D12",
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
          <div style={{ fontSize: "12px", color: "#7C2D12", lineHeight: 1.7 }}>
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
                  background: "#F1F8F6",
                  border: "1px solid #40916C30",
                  borderRadius: "8px",
                  padding: "12px",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    color: issue.severity === "info" ? "#2D6A4F" : "#9A3412",
                    background:
                      issue.severity === "info" ? "#D8F3DC" : "#FFE4D5",
                    borderRadius: "4px",
                    padding: "3px 7px",
                    whiteSpace: "nowrap",
                    marginTop: "2px",
                  }}
                >
                  {issue.severity}
                </span>
                <span
                  style={{ fontSize: "13px", color: "#1E293B", lineHeight: 1.7 }}
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "2px solid #E8F5E9",
          paddingBottom: "12px",
        }}
      >
        {[
          { id: "overview", label: "Overview" },
          { id: "methodology", label: "Methodology" },
          { id: "sources", label: "Data Sources" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "12px 20px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
              fontFamily: "'Georgia', serif",
              background: activeTab === tab.id ? "#1B433210" : "transparent",
              color: activeTab === tab.id ? "#1B4332" : "#64748B",
              borderBottom: activeTab === tab.id ? "3px solid #1B4332" : "none",
              transition: "all 0.2s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabContents[activeTab]}
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          fontSize: "12px",
          color: "#64748B",
          borderTop: "1px solid #E2E8F0",
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

// ─── TABS CONFIG ─────────────────────────────────────────────────────────────
// ─── ACKNOWLEDGEMENT ─────────────────────────────────────────────────────────
function Acknowledgement() {
  const cardStyle = {
    background: "linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 100%)",
    border: "1px solid #CBD5E1",
    borderRadius: "12px",
    padding: "32px 36px",
    marginBottom: "24px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)",
    transition: "all 0.3s ease",
  };
  const headingStyle = {
    fontFamily: "'Georgia', serif",
    fontSize: "16px",
    fontWeight: 600,
    color: "#000000",
    letterSpacing: "0.05em",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  };
  const bodyStyle = {
    color: "#1E293B",
    fontSize: "14px",
    lineHeight: 1.8,
    fontFamily: "'Georgia', serif",
  };
  const nameStyle = {
    display: "inline-block",
    background: "linear-gradient(135deg, #FEF9EC, #FFFBF0)",
    border: "1px solid #F0D67A",
    borderRadius: "6px",
    padding: "6px 14px",
    margin: "4px 6px",
    fontSize: "13px",
    color: "#1E293B",
    fontWeight: 500,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
    transition: "all 0.2s ease",
  };
  const authorEntry = {
    fontSize: "14px",
    color: "#1E293B",
    padding: "10px 0",
    borderBottom: "1px solid #E2E8F0",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    transition: "all 0.2s ease",
  };

  return (
    <>
      <div
        style={{ maxWidth: "1000px", margin: "0 auto", padding: "32px 16px" }}
      >
        {/* Hero Banner */}
        <div
          style={{
            background: "linear-gradient(135deg, #001f3f 0%, #00152b 100%)",
            borderRadius: "14px",
            padding: "48px 40px",
            marginBottom: "32px",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "300px",
              height: "300px",
              background:
                "radial-gradient(circle, rgba(0,168,232,0.1) 0%, transparent 70%)",
              borderRadius: "50%",
              transform: "translate(60px,-60px)",
            }}
          />
          <div style={{ position: "relative", zIndex: 1 }}>
            <h2
              style={{
                fontFamily: "'Georgia', serif",
                color: "#FFFFFF",
                fontSize: "28px",
                fontWeight: 900,
                margin: "0 0 8px",
                letterSpacing: "0.02em",
              }}
            >
              Acknowledgements
            </h2>
            <p
              style={{
                color: "#E0E7FF",
                fontSize: "14px",
                margin: 0,
                fontStyle: "italic",
                letterSpacing: "0.03em",
                fontWeight: 500,
              }}
            >
              OIC Digital Economy Index (OIC DEI) · 2025 Assessment · Policy
              Report
            </p>
          </div>
        </div>

        {/* About the Project */}
        <div style={cardStyle}>
          <div style={headingStyle}>
            <span style={{ fontSize: "20px" }}>📋</span> About the Project
          </div>
          <p style={bodyStyle}>
            This report was prepared as part of the{" "}
            <strong style={{ color: "#000000" }}>
              Islamic Digital Economy Project
            </strong>
            , supported by a grant from the{" "}
            <strong style={{ color: "#000000" }}>
              Islamic Economics Research &amp; Innovation Fund (IERIF)
            </strong>
            . The project aims to advance research and policy dialogue on the
            development of the Islamic digital economy and to provide
            data-driven insights for policymakers, researchers, and industry
            stakeholders.
          </p>
        </div>

        {/* INCEIF */}
        <div style={cardStyle}>
          <div style={headingStyle}>
            <span style={{ fontSize: "20px" }}>🏛</span> About INCEIF University
          </div>
          <p style={bodyStyle}>
            <strong style={{ color: "#000000" }}>
              INCEIF University — The Global University of Islamic Finance
            </strong>{" "}
            is a world-class institution dedicated to advancing knowledge and
            expertise in Islamic finance and economics. Established by Bank
            Negara Malaysia, INCEIF provides postgraduate education and
            spearheads cutting-edge research that bridges Islamic principles
            with contemporary financial and digital economy challenges. Through
            its academic programmes and research initiatives, INCEIF contributes
            to shaping evidence-based policy and building human capital for the
            global Islamic economy.
          </p>
        </div>

        {/* Research Team */}
        <div style={cardStyle}>
          <div style={headingStyle}>
            <span style={{ fontSize: "20px" }}>🔬</span> Research Team
          </div>
          <p style={{ ...bodyStyle, marginBottom: "20px" }}>
            The research team for this project includes:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>
            {[
              "Assoc. Prof. Dr. Kinan Salim",
              "Prof. Dr. Baharom Abd Hamid",
              "Prof. Dr. Ahmet Faruk Aysan",
              "Prof. Dr. Nafis Alam",
              "Assoc. Prof. Dr. Mustafa Disli",
              "Dr. Nur Huda Othman",
              "Ruslena Ramli",
              "Haitham Alnaeb",
            ].map((name) => (
              <span key={name} style={nameStyle}>
                {name}
              </span>
            ))}
          </div>
        </div>

        {/* Authors */}
        <div style={cardStyle}>
          <div style={headingStyle}>
            <span style={{ fontSize: "20px" }}>✍️</span> Authors
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {[
              "Assoc. Prof. Dr. Kinan Salim",
              "Prof. Dr. Baharom Abdul Hamid",
              "Assoc. Prof. Dr. Mustafa Disli",
              "Khairunnisa Ismah Lutfi",
              "Kurniagung Nur Cahyono",
            ].map((name, i) => (
              <div key={name} style={authorEntry}>
                <span
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #B8922A, #A07810)",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: 700,
                    flexShrink: 0,
                    boxShadow: "0 2px 4px rgba(184, 146, 42, 0.2)",
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ fontWeight: 500, color: "#000000" }}>
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Development Team */}
        <div style={cardStyle}>
          <div style={headingStyle}>
            <span style={{ fontSize: "20px" }}>💻</span> Dashboard Development
            Team
          </div>
          <p style={{ ...bodyStyle, marginBottom: "20px" }}>
            The authors acknowledge the valuable contribution of the dashboard
            development team, whose work in designing and developing the
            interactive dashboard significantly enhanced the accessibility and
            usability of the project's data and findings.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>
            {[
              { name: "Haitham Alnaeb", url: null },
              {
                name: "Abdullahi Ahmad Babura",
                url: "https://abdullahiahmad.vercel.app/",
              },
              { name: "Amnan Hanani", url: null },
            ].map((person) => (
              <span key={person.name} style={nameStyle}>
                {person.url ? (
                  <a
                    href={person.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "inherit",
                      textDecoration: "none",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = "#B8922A";
                      e.target.style.textDecoration = "underline";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = "inherit";
                      e.target.style.textDecoration = "none";
                    }}
                  >
                    {person.name}
                  </a>
                ) : (
                  person.name
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div
          style={{
            ...cardStyle,
            background: "linear-gradient(135deg, #FEF9EC 0%, #FFFBF0 100%)",
            border: "1px solid #F0D67A",
            borderLeft: "4px solid #B8922A",
          }}
        >
          <div style={headingStyle}>
            <span style={{ fontSize: "20px" }}>⚖️</span> Disclaimer
          </div>
          <p style={{ ...bodyStyle, color: "#1E293B", fontSize: "13px" }}>
            The views expressed in this report are those of the authors and do
            not necessarily reflect the official positions of INCEIF University,
            IERIF, or any affiliated organisations. The data presented is
            intended for research and informational purposes only.
          </p>
        </div>

        {/* Footer Attribution */}
        <div
          style={{
            background: "#F8FAFC",
            borderTop: "2px solid #E2E8F0",
            borderRadius: "8px",
            marginTop: "40px",
            padding: "32px 40px",
            maxWidth: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              marginBottom: "16px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                color: "#1E293B",
                letterSpacing: "0.02em",
              }}
            >
              <strong style={{ color: "#1E293B" }}>
                OIC Digital Economy Index (OIC DEI)
              </strong>{" "}
              · Developed by INCEIF University
            </div>
            <div
              style={{
                display: "flex",
                gap: "20px",
                fontSize: "12px",
                color: "#1E293B",
              }}
            >
              <a
                href="#"
                style={{
                  color: "#00a8e8",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
              >
                Methodology
              </a>
              <a
                href="#"
                style={{
                  color: "#00a8e8",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
              >
                Data Sources
              </a>
              <a
                href="#"
                style={{
                  color: "#00a8e8",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
              >
                Contact
              </a>
            </div>
          </div>
          <div
            style={{
              borderTop: "1px solid #E2E8F0",
              paddingTop: "16px",
              fontSize: "12px",
              color: "#1E293B",
              letterSpacing: "0.01em",
              lineHeight: "1.6",
              textAlign: "center",
            }}
          >
            <p style={{ margin: "0 0 8px 0" }}>
              © 2026{" "}
              <strong style={{ color: "#000000" }}>INCEIF University</strong> —
              The Global University of Islamic Finance
            </p>
            <p style={{ margin: 0, fontSize: "11px", color: "#475569" }}>
              This dashboard is for informational purposes only. Data presented
              reflects the 2025 OIC Digital Economy Assessment. The findings do
              not necessarily reflect the views of INCEIF University.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

const TABS = [
  { id: "overview", label: "Global Overview", component: GlobalOverview },
  { id: "profiles", label: "Country Profiles", component: CountryProfiles },
  { id: "compare", label: "Compare Countries", component: CompareCountries },
  { id: "pillar", label: "Pillar Analysis", component: PillarAnalysis },
  { id: "geo", label: "Geographic Analysis", component: GeographicAnalysis },
  { id: "trends", label: "Trends & Progress", component: TrendsProgress },
  { id: "divide", label: "Digital Divide", component: DigitalDivide },
  {
    id: "policy",
    label: "Strategic Recommendations",
    component: PolicyRecommendations,
  },
  /* {
    id: "islamic",
    label: "Islamic Digital Special",
    component: IslamicDigitalSpecial,
  }, */
  {
    id: "builder",
    label: "Custom Index Builder",
    component: CustomIndexBuilder,
  },
  /* { id: "matrix", label: "Priority Matrix", component: PriorityMatrix }, */
  { id: "peers", label: "Peer Learning", component: PeerLearning },
  /* { id: "progress", label: "Progress Tracker", component: ProgressTracker }, */
  {
    id: "stats",
    label: "Statistical Analysis",
    component: StatisticalAnalysis,
  },
  { id: "methodology", label: "Methodology", component: Methodology },
  {
    id: "acknowledgement",
    label: "Acknowledgements",
    component: Acknowledgement,
  },
];

// ─── FOOTER ──────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <div style={styles.footer}>
      © 2026 INCEIF University — The Global University of Islamic Finance
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const p = new URLSearchParams(window.location.hash.replace("#", ""));
    const t = p.get("tab");
    return t && TABS.find((x) => x.id === t) ? t : "overview";
  });
  const tab = TABS.find((t) => t.id === activeTab);
  const Component = tab.component;

  const handleTabChange = (id) => {
    setActiveTab(id);
    const p = new URLSearchParams(window.location.hash.replace("#", ""));
    p.set("tab", id);
    window.location.hash = p.toString();
  };

  return (
    <div style={styles.app}>
      {/* Google Fonts & Animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
        * { box-sizing: border-box; }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-4px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }
        
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #F8FAFC; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; transition: background 0.2s; }
        ::-webkit-scrollbar-thumb:hover { background: #B8922A; }
        
        select, input, button { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        select:hover, input:hover { border-color: #00a8e8; box-shadow: 0 2px 8px rgba(0, 168, 232, 0.12); }
        select:focus, input:focus { border-color: #00a8e8; box-shadow: 0 0 0 3px rgba(0, 168, 232, 0.1); outline: none; }
        
        button:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12); }
        button:active:not(:disabled) { transform: translateY(0); }
        
        table tbody tr:hover { background-color: #F1F5F950 !important; transition: background-color 0.2s ease; }
        table tbody tr { transition: background-color 0.2s ease; }
        
        select option { background: #FFFFFF; color: #1E293B; padding: 8px; }
      `}</style>

      {/* Header */}
      <div style={styles.header}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "32px",
            }}
          >
            <div style={{ flex: 1 }}>
              <h1
                style={{
                  margin: 0,
                  fontFamily: "'Georgia', serif",
                  fontSize: "28px",
                  fontWeight: 900,
                  color: "#FFFFFF",
                  letterSpacing: "0.08em",
                  textShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                }}
              >
                OIC Digital Economy Index
              </h1>
              <div
                style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: "13px",
                  color: "#B0D4FF",
                  marginTop: "6px",
                  letterSpacing: "0.05em",
                  fontWeight: 500,
                }}
              >
                OIC DEI · {META.countryCount} Member States · {REFERENCE_YEAR}{" "}
                Assessment
              </div>
            </div>
            <div
              style={{
                textAlign: "right",
                padding: "0 24px",
                borderLeft: "1px solid rgba(0, 168, 232, 0.3)",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#7dd3fc",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  marginBottom: "8px",
                }}
              >
                GLOBAL AVERAGE
              </div>
              <div
                style={{
                  fontSize: "42px",
                  fontWeight: 900,
                  color: "#FFFFFF",
                  fontFamily: "'Georgia', serif",
                  letterSpacing: "-0.02em",
                  background:
                    "linear-gradient(135deg, #00d4ff 0%, #00a8e8 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {OIC_AVERAGE.toFixed(1)}
              </div>
              <div
                style={{ fontSize: "11px", color: "#9dd9ff", marginTop: "4px" }}
              >
                out of 100
              </div>
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div style={styles.tabs}>
          {TABS.map((t) => (
            <button
              key={t.id}
              style={styles.tab(activeTab === t.id)}
              onClick={() => handleTabChange(t.id)}
              onMouseEnter={(e) => {
                if (activeTab !== t.id) {
                  e.target.style.background = "rgba(0, 168, 232, 0.08)";
                  e.target.style.color = "#B0D4FF";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== t.id) {
                  e.target.style.background = "transparent";
                  e.target.style.color = "#A0AEC0";
                }
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        <Component />
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          fontSize: "12px",
          color: "#64748B",
          borderTop: "1px solid #E2E8F0",
          marginTop: "40px",
        }}
      >
        <p>
          *Salim, K., Abdul Hamid, B., Disli, M., Lutfi, K. I., & Cahyono, K. N.
          (2026). Digital Economy Index: OIC Countries 2025 — Policy Report.
          INCEIF University.
        </p>
      </div>
      <Footer />
    </div>
  );
}
