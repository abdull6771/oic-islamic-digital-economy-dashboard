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

/** Approximate centroids, used to place the bubbles on the scatter map. */
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
