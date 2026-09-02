import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  COUNTRIES,
  OIC_AVERAGE,
  OIC_AVERAGE_LABEL,
  REFERENCE_YEAR,
  TREND_DATA,
  YEARS,
  YEAR_RANGE,
  getCluster,
} from "../data/index.js";
import { useChartTokens } from "../styles/tokens.js";
import { CLUSTER_SHORT, toneFor } from "../lib/clusters.js";
import { openCountry } from "../lib/routing.js";
import * as fmt from "../lib/format.js";
import CustomTooltip from "../components/CustomTooltip.jsx";
import ChartFrame, { LegendKey, animation, axis, grid, referenceLineProps } from "../components/ChartFrame.jsx";
import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  InsightBlock,
  RankPill,
  ScoreBar,
  StatTile,
} from "../components/Primitives.jsx";

function TrendsProgress() {
  const tokens = useChartTokens();
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

  const toggleCountry = (name) =>
    setSelectedCountries((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );

  const selectAll = () => setSelectedCountries(availableCountries);
  const deselectAll = () => setSelectedCountries([]);

  // The OIC average reads as an annotation, not as a competitor: it is the only
  // dashed series and it takes the subtle neutral rather than a categorical hue.
  const colorFor = (name, i) =>
    name === OIC_AVERAGE_LABEL
      ? tokens["text-subtle"]
      : tokens.pillar[i % tokens.pillar.length];

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

  const bins = Array.from({ length: 10 }, (_, i) => ({
    range: `${i * 10}–${(i + 1) * 10}`,
    count: COUNTRIES.filter((c) => c.adei >= i * 10 && c.adei < (i + 1) * 10).length,
  }));

  const sorted = [...COUNTRIES].sort((a, b) => a.rank - b.rank);
  const peakBin = bins.reduce((a, b) => (a.count > b.count ? a : b));
  const stdDev = Math.sqrt(
    COUNTRIES.reduce((s, c) => s + (c.adei - OIC_AVERAGE) ** 2, 0) / COUNTRIES.length,
  );

  const nonAvg = selectedCountries.filter((c) => c !== OIC_AVERAGE_LABEL);
  const startYear = lineData[0];
  const endYear = lineData[lineData.length - 1];
  const gains = nonAvg
    .map((c) => ({ name: c, gain: (endYear?.[c] || 0) - (startYear?.[c] || 0) }))
    .filter((x) => x.gain !== 0);
  const topGainer = gains.length > 0 ? gains.reduce((a, b) => (a.gain > b.gain ? a : b)) : null;

  return (
    <div className="stack">
      <Card
        title="Filter countries"
        subtitle={`${selectedCountries.length} of ${availableCountries.length} series shown`}
        action={
          <>
            <Button size="sm" onClick={selectAll}>
              Select all
            </Button>
            <Button size="sm" onClick={deselectAll}>
              Clear
            </Button>
          </>
        }
      >
        <div className="row" role="group" aria-label="Countries to chart" style={{ gap: "var(--s-8)" }}>
          {availableCountries.map((c) => (
            <button
              type="button"
              key={c}
              className="btn btn-sm"
              aria-pressed={selectedCountries.includes(c)}
              onClick={() => toggleCountry(c)}
              style={{ borderRadius: "var(--r-full)" }}
            >
              {c}
            </button>
          ))}
        </div>
      </Card>

      <ChartFrame
        title={`OIC DEI score trends ${YEAR_RANGE}`}
        subtitle={`${fmt.SCORE_UNIT} · a gap in a line is a year with no observation, never a zero`}
        summary={
          topGainer
            ? `Trend lines ${YEAR_RANGE} for ${nonAvg.length} member states. ${topGainer.name} gained the most at ${fmt.delta(topGainer.gain)} points.`
            : `Trend lines ${YEAR_RANGE}. The OIC average stands at ${fmt.score(OIC_AVERAGE)}.`
        }
        legend={selectedCountries.map((c, i) => (
          <LegendKey key={c} color={colorFor(c, i)}>
            {c}
          </LegendKey>
        ))}
      >
        {selectedCountries.length === 0 ? (
          <EmptyState title="No series selected." icon="↗">
            Choose one or more countries above to draw their {YEAR_RANGE} trajectory.
          </EmptyState>
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={lineData} margin={{ top: 8, right: 24, bottom: 4, left: 0 }}>
              <CartesianGrid {...grid(tokens)} />
              <XAxis dataKey="year" {...axis(tokens)} />
              <YAxis domain={[25, 80]} {...axis(tokens)} width={36} />
              <Tooltip content={<CustomTooltip />} />
              {selectedCountries.map((country, i) => (
                <Line
                  key={country}
                  type="monotone"
                  dataKey={country}
                  stroke={colorFor(country, i)}
                  strokeWidth={country === OIC_AVERAGE_LABEL ? 2 : 2}
                  dot={{
                    fill: colorFor(country, i),
                    r: country === OIC_AVERAGE_LABEL ? 0 : 3,
                    strokeWidth: 0,
                  }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                  strokeDasharray={country === OIC_AVERAGE_LABEL ? "5 5" : undefined}
                  connectNulls={false}
                  {...animation()}
                />
              ))}
              {!selectedCountries.includes(OIC_AVERAGE_LABEL) && (
                <ReferenceLine y={OIC_AVERAGE} {...referenceLineProps(tokens)} />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}

        {nonAvg.length > 0 && (
          <div style={{ marginTop: "var(--s-16)" }}>
            <InsightBlock>
              {topGainer ? (
                <>
                  Among selected countries, <strong>{topGainer.name}</strong> shows the
                  strongest upward trajectory with a{" "}
                  <strong>+{topGainer.gain.toFixed(1)} pt</strong> gain from 2021 to 2025.
                </>
              ) : (
                <>
                  Tracking <strong>{nonAvg.length}</strong> countries over the {YEAR_RANGE}{" "}
                  period.
                </>
              )}{" "}
              The OIC average{" "}
              {selectedCountries.includes(OIC_AVERAGE_LABEL) ? (
                <>
                  is shown as a <strong>dashed reference line</strong>
                </>
              ) : (
                <>
                  currently stands at <strong>{OIC_AVERAGE.toFixed(1)}</strong>
                </>
              )}
              .
            </InsightBlock>
          </div>
        )}
      </ChartFrame>

      <div className="cols-3">
        <StatTile label="Mean" value={fmt.score(OIC_AVERAGE)} support="Across all member states" />
        <StatTile label="Median" value={fmt.score(sorted[28].adei)} support="29th of 57 by rank" />
        <StatTile label="Standard deviation" value={fmt.score(stdDev)} support="Score variability" />
      </div>

      <div className="cols-2">
        <ChartFrame
          title={`Score distribution (${REFERENCE_YEAR})`}
          subtitle={`Member states per 10-point band · ${fmt.SCORE_UNIT}`}
          summary={`Histogram of DEI scores in ten-point bands. The ${peakBin.range} band is most common with ${peakBin.count} countries.`}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={bins} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid {...grid(tokens)} />
              <XAxis dataKey="range" {...axis(tokens)} />
              <YAxis {...axis(tokens)} width={28} allowDecimals={false} />
              <Tooltip content={<CustomTooltip unit="Member states" digits={0} />} cursor={{ fill: tokens["surface-2"] }} />
              <Bar dataKey="count" name="Countries" fill={tokens["brand-700"]} maxBarSize={32} {...animation()} />
              <ReferenceLine x={peakBin.range} stroke="transparent" />
            </BarChart>
          </ResponsiveContainer>

          <div style={{ marginTop: "var(--s-16)" }}>
            <InsightBlock>
              The most common score band is <strong>{peakBin.range}</strong> with{" "}
              <strong>{peakBin.count} countries</strong>. The distribution is right-skewed,
              with a small cluster of high performers pulling the mean above the median —
              indicating that most OIC nations are still in early-to-mid digital development
              stages.
            </InsightBlock>
          </div>
        </ChartFrame>

        <Card
          title={`Country ladder (${REFERENCE_YEAR} rankings)`}
          subtitle={`${fmt.SCORE_UNIT} · sortable`}
          footer={fmt.SOURCE_LINE}
        >
          <DataTable
            caption={`All ${COUNTRIES.length} OIC member states ranked by Digital Economy Index score.`}
            maxHeight="360px"
            rowKey={(c) => c.name}
            onRowClick={(c) => openCountry(c.name)}
            initialSort={{ key: "rank", dir: "asc" }}
            rows={sorted}
            columns={[
              {
                key: "rank",
                label: "Rank",
                numeric: true,
                render: (c) => <RankPill rank={c.rank} top={c.rank <= 3} />,
              },
              { key: "name", label: "Country", nameCell: true },
              {
                key: "adei",
                label: "DEI",
                numeric: true,
                render: (c) => fmt.score(c.adei),
              },
              {
                key: "cluster",
                label: "Cluster",
                sortable: false,
                sortValue: (c) => c.adei,
                render: (c) => {
                  const tone = toneFor(getCluster(c.adei).label);
                  return (
                    <span style={{ display: "block", minWidth: "80px" }}>
                      <ScoreBar
                        value={c.adei}
                        color={`var(--cluster-${tone})`}
                        label={`${c.name}, ${CLUSTER_SHORT[tone]}`}
                        showValue={false}
                      />
                    </span>
                  );
                },
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}

export default TrendsProgress;
