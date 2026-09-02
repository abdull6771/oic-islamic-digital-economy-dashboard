import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { COUNTRIES, OIC_AVERAGE, PILLARS, REFERENCE_YEAR, REGIONS, getCluster } from "../data/index.js";
import { useChartTokens, pillarColor } from "../styles/tokens.js";
import { clusterColor, toneFor } from "../lib/clusters.js";
import { hashParam, navigate, onHashChange } from "../lib/routing.js";
import * as fmt from "../lib/format.js";
import CustomTooltip from "../components/CustomTooltip.jsx";
import CountryCombobox from "../components/CountryCombobox.jsx";
import PageActions from "../components/PageActions.jsx";
import ChartFrame, { animation, axis, grid, referenceLineProps, SCORE_DOMAIN } from "../components/ChartFrame.jsx";
import {
  Badge,
  Button,
  Card,
  ClusterBadge,
  Delta,
  InsightBlock,
  ScoreBar,
  StatTile,
} from "../components/Primitives.jsx";

const HEADLINE_REC = {
  "Advanced Digital Economies":
    "Transition from digital follower to global standard-setter. Lead OIC in AI governance, digital export frameworks, and Islamic Fintech international standards.",
  "Emerging Digital Economies":
    "Bridge the gap to Advanced Digital Economies status by targeting private-sector digital adoption, R&D investment, and advanced skills development.",
  "Foundational Digital Economies":
    "Establish core digital infrastructure and implement nationwide digital literacy programs as the immediate national priority.",
};

function CountryProfiles() {
  const tokens = useChartTokens();
  const [selected, setSelected] = useState(() => {
    const c = hashParam("country");
    return c && COUNTRIES.find((x) => x.name === c) ? c : "United Arab Emirates";
  });
  const [copied, setCopied] = useState(false);

  // The hash is the source of truth, so the map, the command palette and a
  // pasted deep link all land on the same profile.
  useEffect(
    () =>
      onHashChange(() => {
        const c = hashParam("country");
        if (c && COUNTRIES.find((x) => x.name === c)) setSelected(c);
      }),
    [],
  );

  const choose = (name) => {
    setSelected(name);
    navigate({ tab: "profiles", country: name });
  };

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

  const strengths = [...PILLARS].sort((a, b) => country[b.key] - country[a.key]).slice(0, 3);
  const gaps = [...PILLARS].sort((a, b) => country[a.key] - country[b.key]).slice(0, 3);

  const regionPeers = COUNTRIES.filter((c) => REGIONS[c.name] === region).sort(
    (a, b) => a.rank - b.rank,
  );
  const regionRank = regionPeers.findIndex((c) => c.name === selected) + 1;

  const peerCompData = [country, ...peers].map((c) => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
    Score: parseFloat(c.adei.toFixed(1)),
  }));

  const oicAvgByPillar = PILLARS.reduce((acc, p) => {
    acc[p.key] = COUNTRIES.reduce((s, c) => s + c[p.key], 0) / COUNTRIES.length;
    return acc;
  }, {});
  const pillarsAboveAvg = PILLARS.filter((p) => country[p.key] > oicAvgByPillar[p.key]).length;
  const bestVsAvg = PILLARS.reduce(
    (best, p) =>
      country[p.key] - oicAvgByPillar[p.key] > country[best.key] - oicAvgByPillar[best.key]
        ? p
        : best,
    PILLARS[0],
  );
  const worstVsAvg = PILLARS.reduce(
    (worst, p) =>
      country[p.key] - oicAvgByPillar[p.key] < country[worst.key] - oicAvgByPillar[worst.key]
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
      const pillarGaps = PILLARS.map((p) => ({
        pillar: p,
        gap: country[p.key] - oicAvgByPillar[p.key],
        score: country[p.key],
      })).sort((a, b) => b.gap - a.gap);
      const strongest = pillarGaps[0];
      const weakest = pillarGaps[pillarGaps.length - 1];

      const regionPeersPdf = [...COUNTRIES]
        .filter((c) => REGIONS[c.name] === REGIONS[country.name])
        .sort((a, b) => b.adei - a.adei);
      const globalLeader = [...COUNTRIES].sort((a, b) => b.adei - a.adei)[0];
      const gapToGlobalLeader = (globalLeader.adei - country.adei).toFixed(1);
      const regionLeaderGap =
        regionPeersPdf[0].name === country.name
          ? 0
          : (regionPeersPdf[0].adei - country.adei).toFixed(1);
      const top3Regional = regionPeersPdf.slice(0, 3);

      // The report is a document, so it pins the light token set and is attached
      // off-screen: custom properties only resolve for an element in the tree.
      const element = document.createElement("div");
      element.setAttribute("data-report", "light");
      element.style.cssText =
        "position:fixed;left:-10000px;top:0;width:794px;padding:32px;background:var(--surface);color:var(--text);font-family:var(--font-ui);font-size:13px;line-height:1.6;";

      const H2 = "font-family:var(--font-display);font-size:22px;font-weight:400;color:var(--text);border-bottom:1px solid var(--border-strong);padding-bottom:8px;margin:28px 0 12px;letter-spacing:-0.01em;";
      const TILE = "border:1px solid var(--border);border-radius:10px;padding:14px;background:var(--surface);";
      const LABEL = "font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-muted);margin:0 0 6px 0;";
      const VALUE = "font-size:24px;font-weight:600;margin:0;color:var(--text);font-variant-numeric:tabular-nums;";
      const CELL = "padding:8px 10px;border-bottom:1px solid var(--border);";

      element.innerHTML = `
        <div style="border-bottom:1px solid var(--border-strong);padding-bottom:16px;margin-bottom:24px;">
          <p style="${LABEL}">OIC Digital Economy Index · Country profile</p>
          <h1 style="font-family:var(--font-display);font-size:38px;font-weight:400;letter-spacing:-0.02em;margin:4px 0 6px;color:var(--text);">${country.name}</h1>
          <p style="margin:0;color:var(--text-muted);font-size:12px;">${fmt.SCORE_UNIT} · ${REFERENCE_YEAR} assessment · ${region}</p>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:8px;">
          <div style="${TILE}">
            <p style="${LABEL}">DEI score</p>
            <p style="${VALUE}">${fmt.score(country.adei)}</p>
          </div>
          <div style="${TILE}">
            <p style="${LABEL}">Global rank</p>
            <p style="${VALUE}">${fmt.rank(country.rank)}</p>
          </div>
          <div style="${TILE}">
            <p style="${LABEL}">Rank in region</p>
            <p style="${VALUE}">${fmt.rank(regionRank)}</p>
          </div>
          <div style="${TILE}">
            <p style="${LABEL}">vs OIC average</p>
            <p style="${VALUE};color:${country.adei >= OIC_AVERAGE ? "var(--positive)" : "var(--negative)"};">${fmt.delta(country.adei - OIC_AVERAGE)}</p>
          </div>
        </div>

        <h2 style="${H2}">Digital Economy Classification</h2>
        <div style="background:var(--surface-2);border-left:3px solid var(--interactive);border-radius:0 6px 6px 0;padding:14px 18px;">
          <p style="${LABEL}">${cluster.label}</p>
          <p style="color:var(--text);margin:0;max-width:72ch;">${HEADLINE_REC[cluster.label]}</p>
        </div>

        <h2 style="${H2}">Performance Highlights</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div style="${TILE}">
            <p style="${LABEL}">Strongest pillar</p>
            <p style="margin:0 0 4px;font-weight:600;font-size:14px;">${strongest.pillar.name}</p>
            <p style="margin:0;color:var(--text-muted);font-size:12px;">Score <strong>${fmt.score(strongest.score)}</strong> · <span style="color:var(--positive);">▲ ${fmt.delta(strongest.gap)}</span> vs OIC avg</p>
          </div>
          <div style="${TILE}">
            <p style="${LABEL}">Area for improvement</p>
            <p style="margin:0 0 4px;font-weight:600;font-size:14px;">${weakest.pillar.name}</p>
            <p style="margin:0;color:var(--text-muted);font-size:12px;">Score <strong>${fmt.score(weakest.score)}</strong> · <span style="color:var(--negative);">▼ ${fmt.delta(weakest.gap)}</span> vs OIC avg</p>
          </div>
        </div>

        <h2 style="${H2}">Regional &amp; Global Context</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div style="${TILE}">
            <p style="${LABEL}">Regional position</p>
            <p style="margin:0 0 4px;font-size:13px;">Ranked <strong>${fmt.rank(regionRank)}</strong> in ${region}</p>
            <p style="margin:0;font-size:13px;color:var(--text-muted);">Gap to regional leader: <strong>${regionLeaderGap === 0 ? "You are the leader!" : "+" + regionLeaderGap}</strong></p>
          </div>
          <div style="${TILE}">
            <p style="${LABEL}">Global benchmark</p>
            <p style="margin:0 0 4px;font-size:13px;">Global leader: <strong>${globalLeader.name}</strong></p>
            <p style="margin:0;font-size:13px;color:var(--text-muted);">Gap to close: <strong>${gapToGlobalLeader} points</strong></p>
          </div>
        </div>

        <h2 style="${H2}">Pillar Score Performance</h2>
        <table style="width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;">
          <thead>
            <tr>
              <th style="${CELL}border-bottom:1px solid var(--border-strong);text-align:left;${LABEL}margin:0;">Pillar</th>
              <th style="${CELL}border-bottom:1px solid var(--border-strong);text-align:right;${LABEL}margin:0;">Score</th>
              <th style="${CELL}border-bottom:1px solid var(--border-strong);text-align:right;${LABEL}margin:0;">OIC avg</th>
              <th style="${CELL}border-bottom:1px solid var(--border-strong);text-align:right;${LABEL}margin:0;">vs avg</th>
              <th style="${CELL}border-bottom:1px solid var(--border-strong);text-align:left;${LABEL}margin:0;">Performance</th>
            </tr>
          </thead>
          <tbody>
            ${PILLARS.map((p) => {
              const gap = country[p.key] - oicAvgByPillar[p.key];
              const barWidth = Math.max(0, (country[p.key] / 100) * 150);
              return `
              <tr>
                <td style="${CELL}">${p.name}</td>
                <td style="${CELL}text-align:right;font-weight:600;">${fmt.score(country[p.key])}</td>
                <td style="${CELL}text-align:right;color:var(--text-muted);">${fmt.score(oicAvgByPillar[p.key])}</td>
                <td style="${CELL}text-align:right;font-weight:600;color:${gap >= 0 ? "var(--positive)" : "var(--negative)"};">${gap >= 0 ? "▲" : "▼"} ${fmt.delta(gap)}</td>
                <td style="${CELL}">
                  <span style="display:block;width:150px;height:6px;border-radius:999px;background:var(--surface-2);">
                    <span style="display:block;width:${barWidth}px;height:6px;border-radius:999px;background:${p.color};"></span>
                  </span>
                </td>
              </tr>
            `;
            }).join("")}
          </tbody>
        </table>

        <h2 style="${H2}">Top Regional Performers</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
          ${top3Regional
            .map(
              (c, idx) => `
            <div style="${TILE}">
              <p style="${LABEL}">${fmt.rank(idx + 1)} in region</p>
              <p style="margin:0 0 4px;font-weight:600;font-size:13px;">${c.name}</p>
              <p style="margin:0;color:var(--text-muted);font-size:12px;">Score <strong>${fmt.score(c.adei)}</strong></p>
            </div>
          `,
            )
            .join("")}
        </div>

        <h2 style="${H2}">Strategic Recommendations</h2>
        <div style="font-size:13px;color:var(--text);max-width:72ch;">
          <p><strong>1. Strengthen Your Position</strong><br/>Focus on enhancing ${strongest.pillar.name} where you have competitive advantage. This pillar is your key differentiator.</p>
          <p><strong>2. Bridge the Gap</strong><br/>Prioritize ${weakest.pillar.name} to reduce the ${Math.abs(weakest.gap).toFixed(1)} point gap from OIC average. This is critical for overall advancement.</p>
          <p><strong>3. Benchmark Learning</strong><br/>Study successful implementations from ${top3Regional[0].name} and other regional leaders to accelerate progress toward advanced digital economy status.</p>
          <p><strong>4. Close Global Gap</strong><br/>To reach ${globalLeader.name}'s level, focus investments on digital infrastructure, innovation, and workforce development aligned with your classification tier.</p>
        </div>

        <div style="page-break-inside:avoid;margin-top:28px;border-top:1px solid var(--border-strong);padding-top:14px;">
          <p style="${LABEL}">Report summary</p>
          <p style="color:var(--text-muted);font-size:12px;margin:0 0 4px;">
            <strong>Generated:</strong> ${new Date().toLocaleDateString()} · <strong>Assessment:</strong> OIC Digital Economy Index ${REFERENCE_YEAR}
          </p>
          <p style="color:var(--text-subtle);font-size:11px;margin:0;max-width:72ch;">
            This report provides a comprehensive analysis of ${country.name}'s digital readiness. For updates and interactive analysis, visit the OIC Digital Economy Index Dashboard. ${fmt.SOURCE_LINE}.
          </p>
        </div>
      `;

      document.body.appendChild(element);

      const opt = {
        margin: 10,
        filename: `${country.name.replace(/[^a-z0-9]/gi, "_")}_OIC_DEI_Profile.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
      };

      window
        .html2pdf()
        .set(opt)
        .from(element)
        .save()
        .then(() => element.remove())
        .catch(() => element.remove());
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

  const clusterMark = clusterColor(tokens, cluster.label);
  const tone = toneFor(cluster.label);
  const bestGap = country[bestVsAvg.key] - oicAvgByPillar[bestVsAvg.key];
  const worstGap = country[worstVsAvg.key] - oicAvgByPillar[worstVsAvg.key];

  return (
    <div className="stack">
      {/* Contextual controls belong in the page header, next to the view title. */}
      <PageActions>
        <CountryCombobox value={selected} onChange={choose} hideLabel />
        <ClusterBadge cluster={cluster.label} short />
      </PageActions>

      <div className="row no-print">
        <span className="t-caption muted">
          Region: <strong style={{ color: "var(--text)" }}>{region}</strong>
        </span>
        <ClusterBadge cluster={cluster.label} />
        <div className="row push" style={{ gap: "var(--s-8)" }}>
          <Button onClick={exportCSV}>
            <span aria-hidden="true">↓</span> Export CSV
          </Button>
          <Button onClick={exportPDF}>
            <span aria-hidden="true">▤</span> Download PDF
          </Button>
          <Button onClick={copyLink} aria-live="polite">
            <span aria-hidden="true">{copied ? "✓" : "⧉"}</span>
            {copied ? "Copied" : "Copy link"}
          </Button>
          <Button onClick={() => window.print()}>
            <span aria-hidden="true">⎙</span> Print
          </Button>
        </div>
      </div>

      <div className="cols-4">
        <StatTile
          label="OIC DEI score"
          value={fmt.score(country.adei)}
          support={`${cluster.label}`}
        />
        <StatTile
          label="Global rank"
          value={fmt.rank(country.rank)}
          support={`of ${COUNTRIES.length} member states`}
        />
        <StatTile
          label="Regional rank"
          value={fmt.rank(regionRank)}
          support={`of ${regionPeers.length} in ${region}`}
        />
        <StatTile
          label="vs OIC average"
          value={fmt.delta(country.adei - OIC_AVERAGE)}
          delta={country.adei - OIC_AVERAGE}
          support={`OIC average ${fmt.score(OIC_AVERAGE)}`}
        />
      </div>

      <div className="cols-2">
        <ChartFrame
          title="Pillar radar profile"
          subtitle={`${country.name} against the OIC average · ${fmt.SCORE_UNIT} · ${REFERENCE_YEAR}`}
          summary={`Radar of ${country.name}'s nine pillar scores against the OIC average. It is above average in ${pillarsAboveAvg} of ${PILLARS.length} pillars.`}
          legend={
            <>
              <span className="legend-item t-overline">
                <span className="legend-swatch" style={{ background: clusterMark }} aria-hidden="true" />
                {country.name}
              </span>
              <span className="legend-item t-overline">
                <span className="legend-swatch" style={{ background: tokens["text-subtle"] }} aria-hidden="true" />
                OIC average
              </span>
            </>
          }
        >
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={pillarData} outerRadius="72%">
              <PolarGrid stroke={tokens.border} />
              <PolarAngleAxis dataKey="subject" tick={{ fill: tokens["text-muted"], fontSize: 11 }} />
              <PolarRadiusAxis
                domain={SCORE_DOMAIN}
                tick={{ fill: tokens["text-subtle"], fontSize: 11 }}
                axisLine={false}
              />
              <Radar
                name="OIC Average"
                dataKey="OIC_Avg"
                stroke={tokens["text-subtle"]}
                fill={tokens["text-subtle"]}
                fillOpacity={0.08}
                strokeDasharray="4 4"
                strokeWidth={1.5}
                {...animation()}
              />
              <Radar
                name={country.name}
                dataKey="A"
                stroke={clusterMark}
                fill={clusterMark}
                fillOpacity={0.22}
                strokeWidth={2}
                {...animation()}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>

          <div style={{ marginTop: "var(--s-16)" }}>
            <InsightBlock title="Key insight">
              {country.name} outperforms the OIC average in{" "}
              <strong>
                {pillarsAboveAvg} of {PILLARS.length} pillars
              </strong>
              . Strongest advantage in <strong>{bestVsAvg.name}</strong> (
              <strong>{fmt.delta(bestGap)} pts</strong> vs OIC avg); largest gap in{" "}
              <strong>{worstVsAvg.name}</strong> (
              <strong>{fmt.delta(worstGap)} pts</strong> vs OIC avg).
            </InsightBlock>
          </div>
        </ChartFrame>

        <Card
          title="Pillar score breakdown"
          subtitle={`${fmt.SCORE_UNIT} · ${REFERENCE_YEAR}`}
          footer={fmt.SOURCE_LINE}
        >
          <div className="stack-sm">
            {PILLARS.map((p) => (
              <div key={p.id}>
                <div className="row" style={{ gap: "var(--s-8)", flexWrap: "nowrap" }}>
                  <span className="swatch-dot" style={{ background: p.color }} aria-hidden="true" />
                  <span className="t-caption" style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name}
                  </span>
                  <span className="t-caption subtle tnum">{fmt.weight(p.weight)}</span>
                </div>
                <div style={{ marginTop: "var(--s-4)" }}>
                  <ScoreBar value={country[p.key]} color={p.color} label={p.name} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="cols-3">
        <Card title="Key strengths" subtitle="Highest three pillar scores">
          <ul className="stack-sm" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {strengths.map((p) => (
              <li className="row t-sm" key={p.key} style={{ gap: "var(--s-8)", flexWrap: "nowrap" }}>
                <span className="swatch-dot" style={{ background: p.color }} aria-hidden="true" />
                <span style={{ flex: 1, minWidth: 0 }}>{p.name}</span>
                <strong className="tnum">{fmt.scoreCompact(country[p.key])}</strong>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Areas for growth" subtitle="Lowest three pillar scores">
          <ul className="stack-sm" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {gaps.map((p) => (
              <li className="row t-sm" key={p.key} style={{ gap: "var(--s-8)", flexWrap: "nowrap" }}>
                <span className="swatch-dot" style={{ background: p.color }} aria-hidden="true" />
                <span style={{ flex: 1, minWidth: 0 }}>{p.name}</span>
                <strong className="tnum">{fmt.scoreCompact(country[p.key])}</strong>
              </li>
            ))}
          </ul>
        </Card>

        <InsightBlock title="Headline recommendation">
          {HEADLINE_REC[cluster.label]}
        </InsightBlock>
      </div>

      <Card title="Narrative assessment" footer={fmt.SOURCE_LINE}>
        <p className="t-body-lg prose">
          {country.name} scores <strong>{fmt.score(country.adei)}</strong> on the{" "}
          {REFERENCE_YEAR} OIC Digital Economy Index, placing it{" "}
          <strong>{fmt.rank(country.rank)}</strong> globally and{" "}
          <strong>{fmt.rank(regionRank)}</strong> within {region}. As a{" "}
          <strong>{cluster.label}</strong>, the country demonstrates notable capability in{" "}
          <strong>{strengths[0].name}</strong> ({fmt.scoreCompact(country[strengths[0].key])}),{" "}
          <strong>{strengths[1].name}</strong> ({fmt.scoreCompact(country[strengths[1].key])}), and{" "}
          <strong>{strengths[2].name}</strong> ({fmt.scoreCompact(country[strengths[2].key])}).
          However, notable areas for development remain in <strong>{gaps[0].name}</strong> (
          {fmt.scoreCompact(country[gaps[0].key])}) and <strong>{gaps[1].name}</strong> (
          {fmt.scoreCompact(country[gaps[1].key])}), which present the highest
          return-on-investment opportunity for targeted policy intervention.{" "}
          {country.adei >= OIC_AVERAGE
            ? `The country performs ${(country.adei - OIC_AVERAGE).toFixed(1)} points above the OIC average of ${OIC_AVERAGE.toFixed(1)}, positioning it as a potential regional knowledge-transfer hub.`
            : `Closing the ${(OIC_AVERAGE - country.adei).toFixed(1)}-point gap to the OIC average of ${OIC_AVERAGE.toFixed(1)} should serve as a near-term policy milestone.`}
        </p>
      </Card>

      <ChartFrame
        title={`Regional peer comparison — ${region}`}
        subtitle={`${country.name} and up to five regional peers · ${fmt.SCORE_UNIT} · ${REFERENCE_YEAR}`}
        summary={`${country.name} scores ${fmt.score(country.adei)} against regional peers, ranking ${fmt.rank(regionRank)} of ${regionPeers.length} in ${region}.`}
      >
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={peerCompData} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid {...grid(tokens)} />
            <XAxis dataKey="name" {...axis(tokens)} />
            <YAxis domain={SCORE_DOMAIN} {...axis(tokens)} width={36} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: tokens["surface-2"] }} />
            <Bar dataKey="Score" maxBarSize={48} {...animation()}>
              {peerCompData.map((d, i) => (
                <Cell key={d.name} fill={i === 0 ? clusterMark : tokens["border-strong"]} />
              ))}
            </Bar>
            <ReferenceLine y={OIC_AVERAGE} {...referenceLineProps(tokens)} />
          </BarChart>
        </ResponsiveContainer>

        <div style={{ marginTop: "var(--s-16)" }}>
          <InsightBlock title="Key insight">
            {isRegionLeader ? (
              secondPlace ? (
                <>
                  <strong>
                    {country.name} leads {region}
                  </strong>{" "}
                  with a score of <strong>{fmt.score(country.adei)}</strong>,{" "}
                  <strong>{(country.adei - secondPlace.adei).toFixed(1)} pts</strong> ahead of{" "}
                  <strong>{secondPlace.name}</strong> ({fmt.score(secondPlace.adei)}).
                </>
              ) : (
                <>
                  <strong>
                    {country.name} leads {region}
                  </strong>{" "}
                  with a score of <strong>{fmt.score(country.adei)}</strong>. It is currently
                  the only OIC member state in this region.
                </>
              )
            ) : (
              <>
                {country.name} ranks{" "}
                <strong>
                  {fmt.rank(regionRank)} in {region}
                </strong>{" "}
                with a score of <strong>{fmt.score(country.adei)}</strong>. Gap to regional
                leader <strong>{peerLeader.name}</strong>: <strong>{gapToLeader} pts</strong>.
                {regionRank === 2 && <> One position away from leading the region.</>}
              </>
            )}{" "}
            The region spans <strong>{regionPeers.length} OIC member states</strong>.
          </InsightBlock>
        </div>
      </ChartFrame>
    </div>
  );
}

export default CountryProfiles;
