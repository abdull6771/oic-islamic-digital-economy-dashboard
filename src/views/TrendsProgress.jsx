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
  LineChart,
  Line,
} from "recharts";
import { styles } from "../styles/styles.js";
import CustomTooltip from "../components/CustomTooltip.jsx";
import {
  COUNTRIES,
  OIC_AVERAGE,
  OIC_AVERAGE_LABEL,
  TREND_DATA,
  YEARS,
  YEAR_RANGE,
  getCluster,
} from "../data/index.js";

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
    "United Arab Emirates": "var(--seq-7)",
    "Saudi Arabia": "var(--seq-6)",
    Malaysia: "var(--seq-5)",
    Indonesia: "var(--seq-4)",
    Qatar: "var(--seq-3)",
    Türkiye: "var(--seq-2)",
    Kazakhstan: "var(--seq-7)",
    Jordan: "var(--seq-5)",
    [OIC_AVERAGE_LABEL]: "var(--seq-7)",
  };

  const OTHER_COLORS = ["var(--seq-6)", "var(--seq-5)", "var(--seq-4)", "var(--seq-3)", "var(--seq-2)"];
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
                background: "var(--seq-5)",
                color: "var(--on-brand)",
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
                background: "var(--seq-2)",
                color: "var(--text)",
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
                  ? "var(--seq-7)"
                  : "var(--surface-2)",
                color: selectedCountries.includes(c) ? "var(--surface)" : "var(--seq-7)",
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
              stroke="var(--surface-2)"
              vertical={false}
            />
            <XAxis
              dataKey="year"
              tick={{ fill: "var(--text)", fontSize: 11, fontWeight: 600 }}
            />
            <YAxis
              domain={[25, 80]}
              tick={{ fill: "var(--text)", fontSize: 11, fontWeight: 600 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                fontSize: "12px",
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
                  stroke: "var(--on-brand)",
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
                stroke="var(--surface-2)"
                vertical={false}
              />
              <XAxis
                dataKey="range"
                tick={{ fill: "var(--text)", fontSize: 11, fontWeight: 600 }}
              />
              <YAxis
                tick={{ fill: "var(--text)", fontSize: 11, fontWeight: 600 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="count"
                name="Countries"
                fill="var(--seq-5)"
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
                  background: "var(--tint)",
                  border: "1px solid var(--border-strong)",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  marginTop: "12px",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--text)",
                    marginBottom: "6px",
                  }}
                >
                  Strategic Insight
                </div>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text)",
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
              background: "var(--surface-2)",
              borderRadius: "8px",
              border: "1px solid var(--tint-line)",
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
                      fontWeight: 700,
                      color: "var(--text)",
                    }}
                  >
                    {s.value}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--interactive)" }}>
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
                    borderBottom: "1px solid var(--tint-line)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "var(--text)",
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
                      color: "var(--interactive)",
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
                      background: "var(--tint)",
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

export default TrendsProgress;
