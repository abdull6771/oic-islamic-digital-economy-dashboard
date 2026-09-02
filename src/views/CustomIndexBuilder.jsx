import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { COUNTRIES, PILLARS, REFERENCE_YEAR } from "../data/index.js";
import { useChartTokens } from "../styles/tokens.js";
import { openCountry } from "../lib/routing.js";
import * as fmt from "../lib/format.js";
import CustomTooltip from "../components/CustomTooltip.jsx";
import ChartFrame, { LegendKey, animation, axis, grid, SCORE_DOMAIN } from "../components/ChartFrame.jsx";
import {
  Badge,
  Card,
  DataTable,
  Delta,
  InsightBlock,
  RangeSlider,
  RankPill,
} from "../components/Primitives.jsx";

function CustomIndexBuilder() {
  const tokens = useChartTokens();

  const defaultWeights = PILLARS.reduce((acc, p) => {
    acc[p.key] = p.weight;
    return acc;
  }, {});
  const [weights, setWeights] = useState(defaultWeights);
  const [preset, setPreset] = useState("official");

  const totalWeight = Object.values(weights).reduce((s, v) => s + v, 0);
  const balanced = Math.abs(totalWeight - 100) < 1;

  const normalize = (w) => {
    const total = Object.values(w).reduce((s, v) => s + v, 0);
    const out = {};
    Object.keys(w).forEach((k) => {
      out[k] = w[k] / total;
    });
    return out;
  };

  const computeCustomOICDEI = (country) => {
    const norm = normalize(weights);
    return PILLARS.reduce((s, p) => s + country[p.key] * norm[p.key], 0);
  };

  const customRanked = [...COUNTRIES]
    .map((c) => ({
      ...c,
      customScore: parseFloat(computeCustomOICDEI(c).toFixed(2)),
    }))
    .sort((a, b) => b.customScore - a.customScore)
    .map((c, i) => ({ ...c, customRank: i + 1, rankChange: c.rank - (i + 1) }));

  const PRESETS = {
    // The published weights, read from the workbook rather than restated here.
    official: { label: "Official OIC DEI Weights", w: defaultWeights },
    govFocus: {
      label: "Governance-Focused",
      w: { p1: 25, p2: 10, p3: 10, p4: 20, p5: 5, p6: 10, p7: 5, p8: 5, p9: 10 },
    },
    innovFocus: {
      label: "Innovation-First",
      w: { p1: 10, p2: 10, p3: 15, p4: 5, p5: 25, p6: 20, p7: 5, p8: 5, p9: 5 },
    },
    inclusive: {
      label: "Digital Inclusion",
      w: { p1: 10, p2: 20, p3: 20, p4: 10, p5: 5, p6: 10, p7: 5, p8: 5, p9: 15 },
    },
    market: {
      label: "Market-Driven",
      w: { p1: 10, p2: 10, p3: 10, p4: 5, p5: 15, p6: 15, p7: 20, p8: 15, p9: 0 },
    },
  };

  const applyPreset = (key) => {
    setPreset(key);
    setWeights(PRESETS[key].w);
  };

  const topMoverUp = customRanked
    .filter((c) => c.rankChange > 0)
    .sort((a, b) => b.rankChange - a.rankChange)
    .slice(0, 5);
  const topMoverDown = customRanked
    .filter((c) => c.rankChange < 0)
    .sort((a, b) => a.rankChange - b.rankChange)
    .slice(0, 5);
  const compData = customRanked.slice(0, 20).map((c) => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
    Official: parseFloat(c.adei.toFixed(1)),
    Custom: c.customScore,
  }));

  const biggestGainer = [...customRanked].sort((a, b) => b.rankChange - a.rankChange)[0];
  const biggestLoser = [...customRanked].sort((a, b) => a.rankChange - b.rankChange)[0];

  return (
    <div className="stack">
      <Card
        title="Custom index builder — sensitivity analysis tool"
        subtitle={`Re-weight the ${PILLARS.length} pillars and watch the ranking move`}
      >
        <p className="t-body-lg prose">
          Re-weight the 9 pillars to see how rankings shift under alternative policy
          priorities. Use presets or manually adjust sliders. Weights auto-normalize to
          100%. Essential for <strong>academic sensitivity analysis</strong> and{" "}
          <strong>scenario planning</strong>.
        </p>
      </Card>

      <Card title="Weight presets" subtitle="Five published scenarios">
        <div className="row" role="group" aria-label="Weight preset" style={{ gap: "var(--s-8)" }}>
          {Object.entries(PRESETS).map(([key, p]) => (
            <button
              type="button"
              key={key}
              className="btn"
              aria-pressed={preset === key}
              onClick={() => applyPreset(key)}
            >
              {p.label}
            </button>
          ))}
          {preset === "custom" && <Badge tone="info">Custom weights</Badge>}
        </div>
      </Card>

      <Card
        title="Pillar weights"
        subtitle="Raw weights, before normalisation"
        action={
          <span className="badge" data-tone={balanced ? "neutral" : "warning"}>
            <span aria-hidden="true">{balanced ? "✓" : "⚠"}</span>
            Total {totalWeight}%{balanced ? "" : " — will auto-normalise"}
          </span>
        }
        footer={`Weights are normalised to sum to 100% before the custom score is computed, so any total is valid. ${fmt.SOURCE_LINE}`}
      >
        <div className="cols-3">
          {PILLARS.map((p) => (
            <div key={p.key}>
              <RangeSlider
                id={`weight-${p.key}`}
                label={
                  <>
                    <span className="swatch-dot" style={{ background: p.color }} aria-hidden="true" />{" "}
                    {p.name}
                  </>
                }
                value={weights[p.key]}
                min={0}
                max={40}
                readout={`${weights[p.key]}%`}
                onChange={(value) => {
                  setPreset("custom");
                  setWeights((w) => ({ ...w, [p.key]: value }));
                }}
              />
              <div className="row t-caption subtle" style={{ justifyContent: "space-between", flexWrap: "nowrap" }}>
                <span>0%</span>
                <span>Official {fmt.weight(p.weight)}</span>
                <span>40%</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="cols-2">
        <Card title="Rank gainers" subtitle="Largest upward moves under these weights">
          {topMoverUp.length === 0 ? (
            <p className="t-body muted">No country gains a position under these weights.</p>
          ) : (
            <MoverList rows={topMoverUp} />
          )}
        </Card>
        <Card title="Rank losers" subtitle="Largest downward moves under these weights">
          {topMoverDown.length === 0 ? (
            <p className="t-body muted">No country loses a position under these weights.</p>
          ) : (
            <MoverList rows={topMoverDown} />
          )}
        </Card>
      </div>

      <ChartFrame
        title="Official vs custom score — leading 20 countries"
        subtitle={`${fmt.SCORE_UNIT} · ${REFERENCE_YEAR}`}
        summary={`Paired bars comparing the official DEI score with the custom re-weighted score for the top 20 countries. ${biggestGainer?.name} gains the most at ${fmt.rankDelta(biggestGainer?.rankChange)} places.`}
        legend={
          <>
            <LegendKey color={tokens["border-strong"]}>Official</LegendKey>
            <LegendKey color={tokens["brand-700"]}>Custom</LegendKey>
          </>
        }
      >
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={compData} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid {...grid(tokens)} />
            <XAxis dataKey="name" {...axis(tokens)} angle={-30} textAnchor="end" height={72} interval={0} />
            <YAxis domain={SCORE_DOMAIN} {...axis(tokens)} width={36} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: tokens["surface-2"] }} />
            <Bar dataKey="Official" fill={tokens["border-strong"]} maxBarSize={12} {...animation()} />
            <Bar dataKey="Custom" fill={tokens["brand-700"]} maxBarSize={12} {...animation()} />
          </BarChart>
        </ResponsiveContainer>

        <div style={{ marginTop: "var(--s-16)" }}>
          <InsightBlock>
            Under the current weight settings, <strong>{biggestGainer?.name}</strong> gains
            the most (+{biggestGainer?.rankChange} ranks, score{" "}
            {biggestGainer?.adei.toFixed(1)} → {biggestGainer?.customScore.toFixed(1)}), while{" "}
            <strong>{biggestLoser?.name}</strong> drops the most ({biggestLoser?.rankChange}{" "}
            ranks). Adjusting pillar weights reveals which countries are under- or
            over-valued by the official index.
          </InsightBlock>
        </div>
      </ChartFrame>

      <Card
        title="Full custom rankings"
        subtitle={`All ${COUNTRIES.length} member states re-ranked · sortable`}
        footer={fmt.SOURCE_LINE}
      >
        <DataTable
          caption="Custom rank, official rank, rank change, official score and custom score for every member state."
          maxHeight="440px"
          rowKey={(c) => c.name}
          onRowClick={(c) => openCountry(c.name)}
          initialSort={{ key: "customRank", dir: "asc" }}
          rows={customRanked}
          columns={[
            {
              key: "customRank",
              label: "Custom #",
              numeric: true,
              render: (c) => <RankPill rank={c.customRank} top={c.customRank <= 3} />,
            },
            { key: "rank", label: "Official #", numeric: true, render: (c) => fmt.rank(c.rank) },
            {
              key: "rankChange",
              label: "Δ Rank",
              numeric: true,
              render: (c) => <Delta value={c.rankChange} places />,
            },
            { key: "name", label: "Country", nameCell: true },
            {
              key: "adei",
              label: "Official score",
              numeric: true,
              render: (c) => fmt.score(c.adei),
            },
            {
              key: "customScore",
              label: "Custom score",
              numeric: true,
              render: (c) => <strong>{fmt.score(c.customScore)}</strong>,
            },
          ]}
        />
      </Card>
    </div>
  );
}

function MoverList({ rows }) {
  return (
    <ul className="stack-sm" style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {rows.map((c) => (
        <li className="panel-tight" key={c.name}>
          <div className="row" style={{ justifyContent: "space-between", flexWrap: "nowrap" }}>
            <span className="t-sm" style={{ fontWeight: 600, minWidth: 0 }}>
              {c.name}
            </span>
            <Delta value={c.rankChange} places unit=" places" />
          </div>
          <div className="t-caption muted tnum">
            {fmt.rank(c.rank)} → {fmt.rank(c.customRank)} · {fmt.score(c.adei)} →{" "}
            {fmt.score(c.customScore)}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default CustomIndexBuilder;
