import { useState, useRef } from "react";
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
  ResponsiveContainer,
  Cell,
  PolarRadiusAxis,
  Area,
} from "recharts";
import { styles } from "../styles/styles.js";
import CustomTooltip from "../components/CustomTooltip.jsx";
import {
  COUNTRIES,
  OIC_AVERAGE,
  PILLARS,
  REGIONS,
  getCluster,
} from "../data/index.js";

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

export default CountryProfiles;
