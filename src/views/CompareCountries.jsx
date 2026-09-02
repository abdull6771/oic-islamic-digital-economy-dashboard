import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
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

import { COUNTRIES, OIC_AVERAGE, PILLARS, REFERENCE_YEAR, getCluster } from "../data/index.js";
import { useChartTokens } from "../styles/tokens.js";
import { toneFor } from "../lib/clusters.js";
import * as fmt from "../lib/format.js";
import CustomTooltip from "../components/CustomTooltip.jsx";
import ChartFrame, { LegendKey, animation, axis, grid, referenceLineProps, SCORE_DOMAIN } from "../components/ChartFrame.jsx";
import {
  Badge,
  Card,
  EmptyState,
  InsightBlock,
  RankPill,
  ScoreBar,
  StatTile,
} from "../components/Primitives.jsx";

const MAX_SELECTED = 6;

/**
 * Series colours for the comparison. These are the categorical pillar hues -
 * already checked for separation under deuteranopia and protanopia - picked at
 * spread-out positions. Pillars and countries never share a legend, so there is
 * no ambiguity about what a hue means on a given chart.
 */
const SERIES_INDEX = [0, 3, 5, 7, 8, 1];

function CompareCountries() {
  const tokens = useChartTokens();
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
        : prev.length < MAX_SELECTED
          ? [...prev, name]
          : prev,
    );
  };

  const countries = COUNTRIES.filter((c) => selected.includes(c.name));
  const colorFor = (name) =>
    tokens.pillar[SERIES_INDEX[selected.indexOf(name) % SERIES_INDEX.length]];

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

  const avgScore =
    countries.length > 0
      ? countries.reduce((s, c) => s + c.adei, 0) / countries.length
      : 0;

  const groupCluster = () => {
    if (countries.length === 0) return null;
    const clusterCounts = { Advanced: 0, Emerging: 0, Foundational: 0 };
    countries.forEach((c) => {
      const label = getCluster(c.adei).label.split(" ")[0];
      if (label === "Advanced") clusterCounts.Advanced++;
      else if (label === "Emerging") clusterCounts.Emerging++;
      else clusterCounts.Foundational++;
    });
    return clusterCounts;
  };

  // Sorted copies: PILLARS is the exported array, so sorting it in place would
  // reorder the pillars for every other view in the session.
  const byGroupAverage = (dir) =>
    [...PILLARS].sort((a, b) => {
      const avgA = countries.reduce((s, c) => s + c[a.key], 0) / countries.length;
      const avgB = countries.reduce((s, c) => s + c[b.key], 0) / countries.length;
      return dir === "desc" ? avgB - avgA : avgA - avgB;
    });

  const groupAvgFor = (p) =>
    countries.reduce((s, c) => s + c[p.key], 0) / countries.length;

  const legend = countries.map((c) => (
    <LegendKey key={c.name} color={colorFor(c.name)}>
      {c.name}
    </LegendKey>
  ));

  const ranked = [...countries].sort((a, b) => b.adei - a.adei);

  return (
    <div className="stack">
      <Card
        title="Select countries for comparison"
        subtitle={`Up to ${MAX_SELECTED} member states · ${selected.length} selected`}
      >
        <div className="row" role="group" aria-label="Countries to compare" style={{ gap: "var(--s-8)" }}>
          {[...COUNTRIES]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((c) => {
              const on = selected.includes(c.name);
              return (
                <button
                  type="button"
                  key={c.name}
                  className="btn btn-sm"
                  aria-pressed={on}
                  disabled={!on && selected.length >= MAX_SELECTED}
                  onClick={() => toggleCountry(c.name)}
                  style={{ borderRadius: "var(--r-full)" }}
                >
                  {on && (
                    <span
                      className="swatch-dot"
                      style={{ background: colorFor(c.name), borderRadius: "var(--r-full)" }}
                      aria-hidden="true"
                    />
                  )}
                  {c.name}
                </button>
              );
            })}
        </div>
      </Card>

      {countries.length === 0 ? (
        <EmptyState title="No countries selected." icon="⇄">
          Choose up to {MAX_SELECTED} member states above to compare their pillar
          profiles.
        </EmptyState>
      ) : (
        <>
          <div className="cols-4">
            {ranked.map((c) => (
              <StatTile
                key={c.name}
                label={c.name}
                value={fmt.score(c.adei)}
                support={`${fmt.rank(c.rank)} · ${getCluster(c.adei).label.split(" ")[0]}`}
                delta={c.adei - OIC_AVERAGE}
              />
            ))}
          </div>

          {countries.length > 1 && (
            <Card title="Group summary" subtitle={`${fmt.SCORE_UNIT} · ${REFERENCE_YEAR}`} footer={fmt.SOURCE_LINE}>
              <div className="cols-3">
                <div>
                  <div className="t-overline muted">Average OIC DEI score</div>
                  <div className="t-metric">{fmt.score(avgScore)}</div>
                </div>
                <div>
                  <div className="t-overline muted">Countries selected</div>
                  <div className="t-metric">{countries.length}</div>
                </div>
                <div>
                  <div className="t-overline muted">Group composition</div>
                  <div className="t-metric-sm" style={{ marginTop: "var(--s-8)" }}>
                    {(() => {
                      const clusters = groupCluster();
                      if (clusters.Advanced > 0) return "Advanced Focus";
                      if (clusters.Emerging > 0) return "Mixed Growth";
                      return "Foundational";
                    })()}
                  </div>
                </div>
              </div>
            </Card>
          )}

          <ChartFrame
            title="Pillar performance comparison"
            subtitle={`${fmt.SCORE_UNIT} · ${REFERENCE_YEAR}`}
            summary={`Horizontal bars comparing ${countries.map((c) => c.name).join(", ")} across all ${PILLARS.length} pillars.`}
            legend={legend}
          >
            <ResponsiveContainer width="100%" height={Math.max(340, countries.length * 62)}>
              <BarChart data={barData} layout="vertical" margin={{ top: 8, right: 24, bottom: 4, left: 0 }}>
                <CartesianGrid {...grid(tokens, { horizontal: false })} />
                <XAxis type="number" domain={SCORE_DOMAIN} {...axis(tokens)} />
                <YAxis type="category" dataKey="name" {...axis(tokens)} width={92} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: tokens["surface-2"] }} />
                {countries.map((c) => (
                  <Bar key={c.name} dataKey={c.name} fill={colorFor(c.name)} maxBarSize={12} {...animation()} />
                ))}
                <ReferenceLine x={OIC_AVERAGE} {...referenceLineProps(tokens, { vertical: true })} />
              </BarChart>
            </ResponsiveContainer>

            {countries.length > 1 &&
              (() => {
                const leader = ranked[0];
                const spreadPillar = [...PILLARS].reduce((best, p) => {
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
                  <div style={{ marginTop: "var(--s-16)" }}>
                    <InsightBlock>
                      <strong>{leader.name}</strong> leads overall (OIC DEI{" "}
                      {fmt.score(leader.adei)}). The most divergent pillar is{" "}
                      <strong>{spreadPillar.name}</strong> with {spread} points spread,
                      indicating this as a key differentiation factor among selected
                      countries.
                    </InsightBlock>
                  </div>
                );
              })()}
          </ChartFrame>

          <ChartFrame
            title="Profile shape comparison"
            subtitle={`Nine-pillar shape per country · ${fmt.SCORE_UNIT} · ${REFERENCE_YEAR}`}
            summary={`Radar comparing the nine-pillar shape of ${countries.map((c) => c.name).join(", ")}.`}
            legend={legend}
            note="A radar exaggerates shape; read the bar chart above for exact magnitudes."
          >
            <ResponsiveContainer width="100%" height={360}>
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke={tokens.border} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: tokens["text-muted"], fontSize: 11 }} />
                <PolarRadiusAxis
                  domain={SCORE_DOMAIN}
                  tick={{ fill: tokens["text-subtle"], fontSize: 11 }}
                  axisLine={false}
                />
                {countries.map((c) => (
                  <Radar
                    key={c.name}
                    name={c.name}
                    dataKey={c.name}
                    stroke={colorFor(c.name)}
                    fill={colorFor(c.name)}
                    fillOpacity={0.1}
                    strokeWidth={2}
                    {...animation()}
                  />
                ))}
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>

            {countries.length > 1 &&
              (() => {
                const range = (c) =>
                  Math.max(...PILLARS.map((p) => c[p.key])) -
                  Math.min(...PILLARS.map((p) => c[p.key]));
                const mostBalanced = [...countries].sort((a, b) => range(a) - range(b))[0];
                const mostSpecialized = [...countries].sort((a, b) => range(b) - range(a))[0];
                return (
                  <div style={{ marginTop: "var(--s-16)" }}>
                    <InsightBlock>
                      <strong>{mostBalanced.name}</strong> demonstrates the most balanced
                      pillar portfolio, while <strong>{mostSpecialized.name}</strong> shows
                      the most concentrated profile with notable strengths and gaps,
                      indicating distinct strategic specialization.
                    </InsightBlock>
                  </div>
                );
              })()}
          </ChartFrame>

          <div className="cols-2">
            <Card
              title="Group strengths"
              subtitle="Four highest mean pillar scores across the selection"
              footer={fmt.SOURCE_LINE}
            >
              <div className="stack-sm">
                {byGroupAverage("desc")
                  .slice(0, 4)
                  .map((p) => (
                    <div key={p.id}>
                      <div className="row" style={{ gap: "var(--s-8)", flexWrap: "nowrap" }}>
                        <span className="swatch-dot" style={{ background: p.color }} aria-hidden="true" />
                        <span className="t-caption" style={{ flex: 1, minWidth: 0 }}>
                          {p.name}
                        </span>
                      </div>
                      <ScoreBar value={groupAvgFor(p)} color={p.color} label={p.name} />
                    </div>
                  ))}
              </div>
            </Card>

            <Card
              title="Group opportunities"
              subtitle="Four lowest mean pillar scores across the selection"
              footer={fmt.SOURCE_LINE}
            >
              <div className="stack-sm">
                {byGroupAverage("asc")
                  .slice(0, 4)
                  .map((p) => (
                    <div key={p.id}>
                      <div className="row" style={{ gap: "var(--s-8)", flexWrap: "nowrap" }}>
                        <span className="swatch-dot" style={{ background: p.color }} aria-hidden="true" />
                        <span className="t-caption" style={{ flex: 1, minWidth: 0 }}>
                          {p.name}
                        </span>
                      </div>
                      <ScoreBar value={groupAvgFor(p)} color={p.color} label={p.name} />
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default CompareCountries;
