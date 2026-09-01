import {
  BarChart,
  Bar,
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
  Line,
  ReferenceLine,
} from "recharts";
import { styles } from "../styles/styles.js";
import CustomTooltip from "../components/CustomTooltip.jsx";
import {
  COUNTRIES,
  OIC_AVERAGE,
  REGIONS,
  getCluster,
} from "../data/index.js";

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

export default GeographicAnalysis;
