import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { COUNTRIES, PILLARS, PILLAR_INDICATORS, REFERENCE_YEAR } from "../data/index.js";
import { useChartTokens, pillarColor } from "../styles/tokens.js";
import * as fmt from "../lib/format.js";
import CustomTooltip from "../components/CustomTooltip.jsx";
import PageActions from "../components/PageActions.jsx";
import ChartFrame, { animation, axis, grid, SCORE_DOMAIN } from "../components/ChartFrame.jsx";
import { Card, InsightBlock, StatTile } from "../components/Primitives.jsx";

// Editorial commentary per pillar. Deliberately carries no scores or country
// rankings — those are read from the data and rendered alongside it, so the
// copy cannot go stale when the workbook is refreshed.
const INSIGHTS = {
  p1: "Institutions form the governance bedrock of digital transformation, combining political stability, regulatory quality and technology governance.",
  p2: "Infrastructure underpins all digital activity. Many African member states score below 20, marking foundational connectivity investment as the clearest opportunity.",
  p3: "Workforce capability remains a major area of focus, and conflict-affected states in particular show substantial room for capacity building.",
  p4: "E-Government is the OIC's standout strength: state-led digitisation has produced high service-delivery scores across very diverse economies.",
  p5: "Innovation is the OIC's key area for growth. Even the strongest performers sit well below the global frontier, reflecting limited private-sector R&D intensity relative to digital infrastructure.",
  p6: "Technological readiness varies more widely than any other pillar. GCC states score highest on the strength of AI strategies and emerging-technology adoption.",
  p7: "Market development is strongest across Southeast Asia and the Levant, where startup ecosystems and access to finance are deepest.",
  p8: "Financial Market Development is the most unevenly measured pillar. It combines stock-market capitalisation with Global Findex financial-inclusion data, and the Findex survey does not cover every member state — several high-income economies therefore carry an imputed floor value here rather than an observation. Islamic FinTech remains an emerging strategic advantage for the GCC and Malaysia.",
  p9: "SDG impact scores track progress on access and inclusion, particularly health-system integration and connectivity.",
};

function PillarAnalysis() {
  const tokens = useChartTokens();
  const [pillarIdx, setPillarIdx] = useState(0);
  const pillar = PILLARS[pillarIdx];
  const mark = pillarColor(tokens, pillar.id);

  const sorted = [...COUNTRIES].sort((a, b) => b[pillar.key] - a[pillar.key]);
  const avg = COUNTRIES.reduce((s, c) => s + c[pillar.key], 0) / COUNTRIES.length;
  const leaders = sorted.slice(0, 3);
  const scoreOf = (c) => c[pillar.key].toFixed(2);
  const atOrAbove = COUNTRIES.filter((c) => c[pillar.key] >= avg).length;
  const lowest = sorted[sorted.length - 1];

  return (
    <div className="stack">
      <PageActions>
        <label className="field">
          <span className="visually-hidden">Pillar</span>
          <select
            className="select"
            value={pillarIdx}
            onChange={(e) => setPillarIdx(Number(e.target.value))}
          >
            {PILLARS.map((p, i) => (
              <option key={p.id} value={i}>
                {p.name} ({fmt.weight(p.weight)})
              </option>
            ))}
          </select>
        </label>
      </PageActions>

      <Card title="Select pillar to analyse" subtitle={`${PILLARS.length} weighted pillars`}>
        <div className="row" role="group" aria-label="Pillar" style={{ gap: "var(--s-8)" }}>
          {PILLARS.map((p, i) => (
            <button
              type="button"
              key={p.id}
              className="btn btn-sm"
              aria-pressed={i === pillarIdx}
              onClick={() => setPillarIdx(i)}
            >
              <span className="swatch-dot" style={{ background: p.color }} aria-hidden="true" />
              {p.name} ({fmt.weight(p.weight)})
            </button>
          ))}
        </div>
      </Card>

      <div className="cols-4">
        <StatTile label="Pillar" value={<span className="t-h3">{pillar.name}</span>} support={`Pillar ${pillar.id} of ${PILLARS.length}`} />
        <StatTile label="Weight in the index" value={fmt.weight(pillar.weight)} support="Share of the composite score" />
        <StatTile label="OIC average" value={fmt.score(avg)} support={`${atOrAbove} of ${COUNTRIES.length} at or above`} />
        <StatTile label="Dimension" value={<span className="t-h3">{pillar.dim}</span>} support="Framework grouping" />
      </div>

      <InsightBlock title="Key insight">
        {INSIGHTS[pillar.key]} <strong>{leaders[0].name}</strong> leads on {pillar.name} (
        {scoreOf(leaders[0])}), ahead of {leaders[1].name} ({scoreOf(leaders[1])}) and{" "}
        {leaders[2].name} ({scoreOf(leaders[2])}), against an OIC average of {avg.toFixed(2)}.
      </InsightBlock>

      {PILLAR_INDICATORS[pillar.key] && (
        <Card
          title="Indicators and sub-indicators"
          subtitle={`What ${pillar.name} is built from`}
          footer={fmt.SOURCE_LINE}
        >
          <div className="stack-sm">
            {PILLAR_INDICATORS[pillar.key].indicators.map((indicator) => (
              <div key={indicator.code}>
                <div className="row" style={{ gap: "var(--s-8)", flexWrap: "nowrap" }}>
                  <span
                    className="badge"
                    data-tone="neutral"
                    style={{ borderColor: "var(--border-strong)" }}
                  >
                    {indicator.code}
                  </span>
                  <span className="t-sm" style={{ fontWeight: 600 }}>
                    {indicator.name}
                  </span>
                </div>
                {indicator.subIndicators?.length > 0 && (
                  <div
                    className="row"
                    style={{ gap: "var(--s-8)", marginTop: "var(--s-8)", paddingLeft: "var(--s-16)" }}
                  >
                    {indicator.subIndicators.map((sub) => (
                      <span key={sub.code} className="panel-tight t-caption" style={{ padding: "var(--s-4) var(--s-8)" }}>
                        <span className="tnum muted" style={{ marginRight: "var(--s-4)" }}>
                          {sub.code}
                        </span>
                        {sub.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <ChartFrame
        title={`All countries — ${pillar.name}`}
        subtitle={`Ranked by ${pillar.name} score · ${fmt.SCORE_UNIT} · ${REFERENCE_YEAR}`}
        summary={`All ${COUNTRIES.length} member states ranked by ${pillar.name}. ${leaders[0].name} leads at ${fmt.score(leaders[0][pillar.key])}; ${lowest.name} is lowest at ${fmt.score(lowest[pillar.key])}. The pillar average is ${fmt.score(avg)}.`}
      >
        <ResponsiveContainer width="100%" height={420}>
          <BarChart
            data={sorted.map((c) => ({
              name: c.name,
              score: parseFloat(c[pillar.key].toFixed(1)),
            }))}
            margin={{ top: 8, right: 16, bottom: 4, left: 0 }}
          >
            <CartesianGrid {...grid(tokens)} />
            <XAxis
              dataKey="name"
              tickFormatter={(name) => (name.length > 15 ? name.slice(0, 14) + "…" : name)}
              {...axis(tokens)}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={96}
            />
            <YAxis domain={SCORE_DOMAIN} {...axis(tokens)} width={36} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: tokens["surface-2"] }} />
            <Bar dataKey="score" name={pillar.name} fill={mark} maxBarSize={14} {...animation()} />
            <ReferenceLine
              y={avg}
              stroke={tokens["text-subtle"]}
              strokeDasharray="4 4"
              label={{
                value: `Pillar avg ${fmt.score(avg)}`,
                fill: tokens["text-subtle"],
                fontSize: 11,
                position: "insideTopRight",
              }}
            />
          </BarChart>
        </ResponsiveContainer>

        <div style={{ marginTop: "var(--s-16)" }}>
          <InsightBlock title="Key insight">
            <strong>{sorted[0].name}</strong> leads in {pillar.name} with a score of{" "}
            <strong>{fmt.score(sorted[0][pillar.key])}</strong>, while{" "}
            <strong>{lowest.name}</strong> scores lowest at{" "}
            <strong>{fmt.score(lowest[pillar.key])}</strong> — a{" "}
            <strong>
              {(sorted[0][pillar.key] - lowest[pillar.key]).toFixed(0)}
              -point divide
            </strong>
            . <strong>{atOrAbove} of 57</strong> countries score at or above the OIC average
            of {fmt.score(avg)}.
          </InsightBlock>
        </div>
      </ChartFrame>
    </div>
  );
}

export default PillarAnalysis;
