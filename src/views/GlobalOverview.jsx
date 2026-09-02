import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { COUNTRIES, META, OIC_AVERAGE, PILLARS, REFERENCE_YEAR, getCluster } from "../data/index.js";
import { useChartTokens, pillarColor, seqVar, seqInkVar } from "../styles/tokens.js";
import { CLUSTER_SHORT, CLUSTER_TIER, toneFor } from "../lib/clusters.js";
import { openCountry } from "../lib/routing.js";
import * as fmt from "../lib/format.js";
import CustomTooltip from "../components/CustomTooltip.jsx";
import WorldMap from "../components/WorldMap.jsx";
import ChartFrame, { LegendKey, animation, axis, grid, referenceLineProps, SCORE_DOMAIN } from "../components/ChartFrame.jsx";
import {
  Card,
  ClusterBadge,
  InsightBlock,
  RankPill,
  ScoreBar,
  StatTile,
  TableScroll,
} from "../components/Primitives.jsx";

function GlobalOverview() {
  const tokens = useChartTokens();

  const sorted = [...COUNTRIES].sort((a, b) => a.rank - b.rank);
  const top10 = sorted.slice(0, 10);
  const bottom10 = sorted.slice(-10).reverse();
  const leaders = COUNTRIES.filter((c) => c.adei >= 60);
  const adopters = COUNTRIES.filter((c) => c.adei >= 40 && c.adei < 60);
  const emerging = COUNTRIES.filter((c) => c.adei < 40);

  const pillarAvgs = PILLARS.map((p) => ({
    id: p.id,
    name: p.short,
    avg: Math.round(COUNTRIES.reduce((s, c) => s + c[p.key], 0) / COUNTRIES.length),
  }));

  const bestPillar = pillarAvgs.reduce((b, p) => (p.avg > b.avg ? p : b), pillarAvgs[0]);
  const weakestPillar = pillarAvgs.reduce((w, p) => (p.avg < w.avg ? p : w), pillarAvgs[0]);

  const clusterData = [
    {
      name: "Advanced Digital Economies",
      count: leaders.length,
      score: leaders.reduce((s, c) => s + c.adei, 0) / leaders.length,
      shortName: "Advanced",
      band: "60 and above",
    },
    {
      name: "Emerging Digital Economies",
      count: adopters.length,
      score: adopters.reduce((s, c) => s + c.adei, 0) / adopters.length,
      shortName: "Emerging",
      band: "40 to 59",
    },
    {
      name: "Foundational Digital Economies",
      count: emerging.length,
      score: emerging.reduce((s, c) => s + c.adei, 0) / emerging.length,
      shortName: "Foundational",
      band: "below 40",
    },
  ];

  const avg = COUNTRIES.reduce((s, c) => s + c.adei, 0) / COUNTRIES.length;
  const stdDev = Math.sqrt(
    COUNTRIES.reduce((s, c) => s + Math.pow(c.adei - avg, 2), 0) / COUNTRIES.length,
  );

  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];

  return (
    <div className="stack">
      <WorldMap />

      {/* Headline figures. Four across on desktop, two on tablet, one on mobile. */}
      <div className="cols-4">
        <StatTile
          label="Highest score"
          value={fmt.score(highest.adei)}
          support={highest.name}
        />
        <StatTile
          label="OIC average"
          value={fmt.score(avg)}
          support={`All ${META.countryCount} member states`}
        />
        <StatTile
          label="Lowest score"
          value={fmt.score(lowest.adei)}
          support={lowest.name}
        />
        <StatTile
          label="Standard deviation"
          value={fmt.score(stdDev)}
          support="Score variability"
        />
      </div>

      <Card
        title="Performance cluster distribution"
        subtitle={`${fmt.SCORE_UNIT} · ${REFERENCE_YEAR}`}
        footer={fmt.SOURCE_LINE}
      >
        <div className="cols-3" style={{ marginBottom: "var(--s-20)" }}>
          {clusterData.map((cl) => {
            const tone = toneFor(cl.name);
            return (
              <div className="panel" key={cl.name}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <span className="t-overline muted">{cl.shortName}</span>
                  <span className="badge" data-tone={tone}>
                    <span className="tier" aria-hidden="true">
                      {CLUSTER_TIER[tone]}
                    </span>
                    {cl.band}
                  </span>
                </div>
                <div className="t-metric" style={{ marginTop: "var(--s-8)" }}>
                  {cl.count}
                </div>
                <div className="t-caption muted">
                  {cl.count === 1 ? "member state" : "member states"} · average{" "}
                  {fmt.score(cl.score)}
                </div>
                <div style={{ marginTop: "var(--s-12)" }}>
                  <ScoreBar
                    value={cl.score}
                    color={`var(--cluster-${tone})`}
                    label={`${cl.shortName} average`}
                    showValue={false}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <InsightBlock>
          The {REFERENCE_YEAR} OIC Digital Economy Index reveals a{" "}
          <strong>
            {(highest.adei - lowest.adei).toFixed(0)}
            -point digital divide
          </strong>{" "}
          between {highest.name} ({highest.adei.toFixed(0)}) and {lowest.name} (
          {lowest.adei.toFixed(0)}). <strong>E-Government outpaces Innovation:</strong>{" "}
          state-led digitization is the OIC&rsquo;s greatest strength, while private-sector
          R&amp;D is the critical bottleneck. With <strong>{leaders.length} advanced</strong>,{" "}
          <strong>{adopters.length} emerging</strong>, and{" "}
          <strong>{emerging.length} foundational</strong> economies, tailored strategies
          aligned to digital maturity are essential — a one-size-fits-all digital policy is
          fundamentally ineffective.
        </InsightBlock>
      </Card>

      <div className="cols-2">
        <RankingList
          title="Top 10 performers"
          subtitle={`${fmt.SCORE_UNIT} · ${REFERENCE_YEAR}`}
          rows={top10}
          markTopThree
        />
        <RankingList
          title="Opportunity focus: Foundation 10"
          subtitle={`${fmt.SCORE_UNIT} · ${REFERENCE_YEAR}`}
          rows={bottom10}
        />
      </div>

      <ChartFrame
        title="Pillar performance across the OIC"
        subtitle={`Mean score per pillar · ${fmt.SCORE_UNIT} · ${REFERENCE_YEAR}`}
        summary={`Mean pillar scores across all ${META.countryCount} OIC member states. ${bestPillar.name} is strongest at ${bestPillar.avg} and ${weakestPillar.name} weakest at ${weakestPillar.avg}, against an OIC average of ${fmt.score(OIC_AVERAGE)}.`}
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={pillarAvgs} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid {...grid(tokens)} />
            <XAxis dataKey="name" {...axis(tokens)} interval={0} height={48} angle={-20} textAnchor="end" />
            <YAxis domain={SCORE_DOMAIN} {...axis(tokens)} width={36} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: tokens["surface-2"] }} />
            <Bar dataKey="avg" name="Mean score" maxBarSize={44} {...animation()}>
              {pillarAvgs.map((p) => (
                <Cell key={p.id} fill={pillarColor(tokens, p.id)} />
              ))}
            </Bar>
            <ReferenceLine y={OIC_AVERAGE} {...referenceLineProps(tokens)} />
          </BarChart>
        </ResponsiveContainer>

        <div className="cols-2" style={{ marginTop: "var(--s-16)" }}>
          <div className="panel">
            <div className="t-overline muted">Strongest pillar</div>
            <div className="t-body" style={{ marginTop: "var(--s-4)", fontWeight: 600 }}>
              {bestPillar.name}: {bestPillar.avg}/100
            </div>
          </div>
          <div className="panel">
            <div className="t-overline muted">Greatest opportunity</div>
            <div className="t-body" style={{ marginTop: "var(--s-4)", fontWeight: 600 }}>
              {weakestPillar.name}: {weakestPillar.avg}/100
            </div>
          </div>
        </div>
      </ChartFrame>

      <Card
        title="Comprehensive score heatmap"
        subtitle={`All ${META.countryCount} OIC member states across ${PILLARS.length} pillars · ${fmt.SCORE_UNIT} · ${REFERENCE_YEAR}`}
        action={
          <div className="chart-legend">
            <LegendKey color="var(--seq-2)">Low</LegendKey>
            <LegendKey color="var(--seq-7)">High</LegendKey>
          </div>
        }
        footer={fmt.SOURCE_LINE}
      >
        <TableScroll maxHeight="520px">
          <table className="data-table">
            <caption className="visually-hidden">
              Digital Economy Index score and nine pillar scores for every OIC member
              state, ranked.
            </caption>
            <thead>
              <tr>
                <th scope="col">Country</th>
                <th scope="col" data-numeric="true">
                  Rank
                </th>
                <th scope="col" data-numeric="true">
                  DEI
                </th>
                {PILLARS.map((p) => (
                  <th key={p.id} scope="col" data-numeric="true" title={p.name}>
                    {p.short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr key={c.name}>
                  <td className="name-cell">{c.name}</td>
                  <td data-numeric="true">
                    <RankPill rank={c.rank} top={c.rank <= 3} />
                  </td>
                  <td data-numeric="true" style={{ fontWeight: 600 }}>
                    {fmt.score(c.adei)}
                  </td>
                  {PILLARS.map((p) => (
                    <td key={p.id} data-numeric="true" style={{ padding: "var(--s-4)" }}>
                      <span
                        className="heat-cell"
                        style={{
                          background: seqVar(c[p.key]),
                          color: seqInkVar(c[p.key]),
                        }}
                      >
                        {fmt.scoreCompact(c[p.key])}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      </Card>
    </div>
  );
}

/** A ranked list of countries: quiet rank pill, name, score bar. No medals. */
function RankingList({ title, subtitle, rows, markTopThree = false }) {
  return (
    <Card title={title} subtitle={subtitle} footer={fmt.SOURCE_LINE}>
      <ul className="stack-sm" style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {rows.map((c) => {
          const tone = toneFor(getCluster(c.adei).label);
          return (
            <li key={c.name}>
              <button
                type="button"
                className="row"
                onClick={() => openCountry(c.name)}
                style={{
                  width: "100%",
                  gap: "var(--s-12)",
                  flexWrap: "nowrap",
                  padding: "var(--s-4) 0",
                  background: "none",
                  border: 0,
                  textAlign: "left",
                  cursor: "pointer",
                }}
                aria-label={`${c.name}, rank ${c.rank}, score ${fmt.score(c.adei)}. Open profile.`}
              >
                <RankPill rank={c.rank} top={markTopThree && c.rank <= 3} />
                <span className="t-sm" style={{ flex: "0 0 40%", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
                  {c.name}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <ScoreBar
                    value={c.adei}
                    color={`var(--cluster-${tone})`}
                    label={c.name}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="t-caption subtle" style={{ marginTop: "var(--s-12)" }}>
        Bar colour shows the cluster: {CLUSTER_SHORT.advanced}, {CLUSTER_SHORT.emerging} or{" "}
        {CLUSTER_SHORT.foundational}. Select a country to open its profile.
      </div>
    </Card>
  );
}

export default GlobalOverview;
