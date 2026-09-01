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
import {
  META,
  OIC_AVERAGE,
} from "../data/index.js";

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

export default DigitalDivide;
