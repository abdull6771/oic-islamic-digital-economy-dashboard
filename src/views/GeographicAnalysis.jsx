import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import { COUNTRIES, OIC_AVERAGE, REFERENCE_YEAR, REGIONS, getCluster } from "../data/index.js";
import { useChartTokens } from "../styles/tokens.js";
import { CLUSTER_SHORT, clusterColor, toneFor } from "../lib/clusters.js";
import { openCountry } from "../lib/routing.js";
import * as fmt from "../lib/format.js";
import CustomTooltip from "../components/CustomTooltip.jsx";
import ChartFrame, { LegendKey, animation, axis, grid, referenceLineProps } from "../components/ChartFrame.jsx";
import { Card, InsightBlock, ScoreBar, StatTile } from "../components/Primitives.jsx";
// Approximate country centroids for the bubbles. The table lives in the entry
// shim because `npm run validate:data` reads it textually from there and
// cross-checks it against the workbook — see the comment beside it.
import { GEO_COORDS } from "../../oic_dashboard.jsx";

function GeographicAnalysis() {
  const tokens = useChartTokens();

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

  const clusterByRegion = regionStats.map((r) => ({
    name: r.region,
    Advanced: r.countries.filter((c) => c.adei >= 60).length,
    Emerging: r.countries.filter((c) => c.adei >= 40 && c.adei < 60).length,
    Foundational: r.countries.filter((c) => c.adei < 40).length,
  }));

  const mapData = COUNTRIES.filter((c) => GEO_COORDS[c.name]).map((c) => ({
    name: c.name,
    x: GEO_COORDS[c.name][1],
    y: GEO_COORDS[c.name][0],
    score: parseFloat(c.adei.toFixed(1)),
    cluster: getCluster(c.adei).label,
  }));

  const advanced = mapData.filter((d) => d.score >= 60);
  const foundational = mapData.filter((d) => d.score < 40);
  const topCountry = mapData.reduce((a, b) => (a.score > b.score ? a : b));
  const bottomCountry = mapData.reduce((a, b) => (a.score < b.score ? a : b));
  const topRegion = regionStats[0];
  const bottomRegion = regionStats[regionStats.length - 1];
  const mostAdvanced = [...clusterByRegion].sort((a, b) => b.Advanced - a.Advanced)[0];
  const mostEmerging = [...clusterByRegion].sort((a, b) => b.Foundational - a.Foundational)[0];
  const aboveAvgRegions = regionStats.filter((r) => r.avg >= OIC_AVERAGE).length;

  const clusterLegend = ["advanced", "emerging", "foundational"].map((tone) => (
    <LegendKey key={tone} color={`var(--cluster-${tone})`}>
      {CLUSTER_SHORT[tone]}
    </LegendKey>
  ));

  return (
    <div className="stack">
      <div className="cols-auto">
        {regionStats.slice(0, 5).map((r) => (
          <StatTile
            key={r.region}
            label={r.region}
            value={fmt.score(r.avg)}
            support={`${r.count} countries · range ${r.min.toFixed(0)}–${r.max.toFixed(0)}`}
            delta={r.avg - OIC_AVERAGE}
          />
        ))}
      </div>

      <ChartFrame
        title="Geographic distribution of OIC digital performance"
        subtitle={`Bubble position is approximate location, size is DEI score · ${fmt.SCORE_UNIT} · ${REFERENCE_YEAR}`}
        summary={`Scatter map of ${mapData.length} member states by approximate location. ${advanced.length} score 60 or above and ${foundational.length} below 40. ${topCountry.name} is highest at ${topCountry.score}; ${bottomCountry.name} lowest at ${bottomCountry.score}.`}
        legend={clusterLegend}
      >
        <ResponsiveContainer width="100%" height={340}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 24, left: 8 }}>
            <CartesianGrid {...grid(tokens)} vertical horizontal />
            <XAxis
              type="number"
              dataKey="x"
              domain={[-70, 130]}
              name="Longitude"
              {...axis(tokens)}
              label={{
                value: "West   Longitude   East",
                fill: tokens["text-muted"],
                fontSize: 12,
                position: "insideBottom",
                offset: -12,
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[-25, 55]}
              name="Latitude"
              {...axis(tokens)}
              width={44}
              label={{
                value: "Latitude",
                fill: tokens["text-muted"],
                fontSize: 12,
                angle: -90,
                position: "insideLeft",
              }}
            />
            <ZAxis type="number" dataKey="score" range={[40, 300]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3", stroke: tokens.border }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="tooltip-card">
                    <div className="tooltip-title">{d.name}</div>
                    <div className="tooltip-row">
                      <span
                        className="legend-swatch"
                        style={{ background: clusterColor(tokens, d.cluster) }}
                        aria-hidden="true"
                      />
                      <span className="tooltip-label">OIC DEI score</span>
                      <span className="tooltip-value">{d.score}</span>
                    </div>
                    <div className="tooltip-unit t-caption">
                      {CLUSTER_SHORT[toneFor(d.cluster)]} · {fmt.SCORE_UNIT}
                    </div>
                  </div>
                );
              }}
            />
            <Scatter data={mapData} name="Countries" {...animation()}>
              {mapData.map((d) => (
                <Cell key={d.name} fill={clusterColor(tokens, d.cluster)} fillOpacity={0.85} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        <div style={{ marginTop: "var(--s-16)" }}>
          <InsightBlock>
            The map reveals a clear{" "}
            <strong>geographic concentration of digital leaders</strong> in the Gulf and
            Southeast Asia, while Sub-Saharan Africa and parts of Central Asia remain
            predominantly foundational. <strong>{advanced.length} countries</strong> score
            above 60, with <strong>{foundational.length}</strong> scoring below 40.{" "}
            <strong>{topCountry.name}</strong> ({topCountry.score}) and{" "}
            <strong>{bottomCountry.name}</strong> ({bottomCountry.score}) represent the
            geographic extremes of the OIC digital divide.
          </InsightBlock>
        </div>
      </ChartFrame>

      <ChartFrame
        title="Regional average OIC DEI scores"
        subtitle={`Mean score per region, ranked · ${fmt.SCORE_UNIT} · ${REFERENCE_YEAR}`}
        summary={`Mean DEI score for each of the ${regionStats.length} regions. ${topRegion.region} leads at ${fmt.score(topRegion.avg)} and ${bottomRegion.region} is lowest at ${fmt.score(bottomRegion.avg)}, against an OIC average of ${fmt.score(OIC_AVERAGE)}.`}
      >
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={regionStats.map((r) => ({
              name: r.region,
              avg: parseFloat(r.avg.toFixed(1)),
            }))}
            margin={{ top: 8, right: 16, bottom: 4, left: 0 }}
          >
            <CartesianGrid {...grid(tokens)} />
            <XAxis dataKey="name" {...axis(tokens)} angle={-25} textAnchor="end" height={78} interval={0} />
            <YAxis domain={[0, 80]} {...axis(tokens)} width={36} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: tokens["surface-2"] }} />
            {/* One series, one colour: the bars are already sorted by value, so
                colouring them by region would encode nothing. */}
            <Bar dataKey="avg" name="Regional average" fill={tokens["brand-700"]} maxBarSize={44} {...animation()} />
            <ReferenceLine y={OIC_AVERAGE} {...referenceLineProps(tokens)} />
          </BarChart>
        </ResponsiveContainer>

        <div style={{ marginTop: "var(--s-16)" }}>
          <InsightBlock>
            <strong>{topRegion.region}</strong> is the highest-performing region (avg{" "}
            {fmt.score(topRegion.avg)}), while <strong>{bottomRegion.region}</strong> scores
            lowest (avg {fmt.score(bottomRegion.avg)}). The inter-regional gap of{" "}
            <strong>{(topRegion.avg - bottomRegion.avg).toFixed(1)} points</strong> highlights
            significant geographic disparity within the OIC.{" "}
            <strong>
              {aboveAvgRegions} of {regionStats.length}
            </strong>{" "}
            regions exceed the OIC average.
          </InsightBlock>
        </div>
      </ChartFrame>

      <ChartFrame
        title="Cluster distribution by region"
        subtitle={`Count of member states per cluster · ${REFERENCE_YEAR}`}
        summary={`Stacked counts of Advanced, Emerging and Foundational economies in each region. ${mostAdvanced.name} holds the most Advanced economies (${mostAdvanced.Advanced}); ${mostEmerging.name} the most Foundational (${mostEmerging.Foundational}).`}
        legend={clusterLegend}
      >
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={clusterByRegion} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid {...grid(tokens)} />
            <XAxis dataKey="name" {...axis(tokens)} angle={-25} textAnchor="end" height={78} interval={0} />
            <YAxis {...axis(tokens)} width={28} allowDecimals={false} />
            <Tooltip content={<CustomTooltip unit="Member states" digits={0} />} cursor={{ fill: tokens["surface-2"] }} />
            <Bar dataKey="Advanced" fill={tokens["cluster-advanced"]} stackId="a" maxBarSize={28} {...animation()} />
            <Bar dataKey="Emerging" fill={tokens["cluster-emerging"]} stackId="a" maxBarSize={28} {...animation()} />
            <Bar dataKey="Foundational" fill={tokens["cluster-foundational"]} stackId="a" maxBarSize={28} {...animation()} />
          </BarChart>
        </ResponsiveContainer>

        <div style={{ marginTop: "var(--s-16)" }}>
          <InsightBlock>
            <strong>{mostAdvanced.name}</strong> has the highest concentration of Advanced
            Digital Economies ({mostAdvanced.Advanced} countries).{" "}
            <strong>{mostEmerging.name}</strong> has the most Foundational Digital Economies (
            {mostEmerging.Foundational} countries), indicating the region&rsquo;s greatest need
            for targeted development support and capacity-building initiatives.
          </InsightBlock>
        </div>
      </ChartFrame>

      {regionStats.map((r) => (
        <Card
          key={r.region}
          title={r.region}
          subtitle={`${r.count} ${r.count === 1 ? "country" : "countries"} · average ${fmt.score(r.avg)} · ${fmt.SCORE_UNIT}`}
          footer={fmt.SOURCE_LINE}
        >
          <div className="cols-auto" style={{ gap: "var(--s-12)" }}>
            {[...r.countries]
              .sort((a, b) => b.adei - a.adei)
              .map((c) => {
                const tone = toneFor(getCluster(c.adei).label);
                return (
                  <button
                    type="button"
                    key={c.name}
                    className="panel-tight"
                    onClick={() => openCountry(c.name)}
                    style={{ textAlign: "left", cursor: "pointer" }}
                    aria-label={`${c.name}, score ${fmt.score(c.adei)}, rank ${c.rank}. Open profile.`}
                  >
                    <div className="t-caption" style={{ fontWeight: 600 }}>
                      {c.name}
                    </div>
                    <div className="t-caption muted tnum" style={{ marginBottom: "var(--s-4)" }}>
                      {fmt.rank(c.rank)} · {CLUSTER_SHORT[tone]}
                    </div>
                    <ScoreBar value={c.adei} color={`var(--cluster-${tone})`} label={c.name} />
                  </button>
                );
              })}
          </div>
        </Card>
      ))}
    </div>
  );
}

export default GeographicAnalysis;
