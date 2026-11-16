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
  p2: "Infrastructure combines access to ICT, use of ICT, technological inclusion and logistical performance.",
  p3: "Workforce combines education expenditure, knowledge-intensive employment and ICT skills in the education system.",
  p4: "E-Government combines online government services, telecommunication infrastructure and human capital.",
  p5: "Innovation combines business-financed R&D, university–industry collaboration, knowledge impact and knowledge absorption.",
  p6: "Future Technologies combines the adoption of emerging technologies, investment in emerging technologies and AI strategy.",
  p7: "Market Development & Sophistication combines start-up financing, domestic credit to the private sector and diversification of local industry.",
  p8: "Financial Market Development combines stock-market capitalisation with Global Findex financial-inclusion data. Where Findex inputs are unavailable, the workbook uses an imputed floor value. That value contributes to the pillar score but is not an observation of the country's financial inclusion; consider source coverage when comparing countries.",
  p9: "This pillar combines scores for seven Sustainable Development Goals covering poverty, hunger, health, education, work, industry and partnerships.",
};

const countryGroup = (countries) => countries.length <= 3
  ? new Intl.ListFormat("en", { type: "conjunction" }).format(countries.map((country) => country.name))
  : `${countries.length} countries`;

function PillarAnalysis() {
  const tokens = useChartTokens();
  const [pillarIdx, setPillarIdx] = useState(0);
  const pillar = PILLARS[pillarIdx];
  const mark = pillarColor(tokens, pillar.id);

  const sorted = [...COUNTRIES].sort((a, b) => b[pillar.key] - a[pillar.key]);
  const avg = COUNTRIES.reduce((s, c) => s + c[pillar.key], 0) / COUNTRIES.length;
  const leaders = sorted.slice(0, 3);
  const atOrAbove = COUNTRIES.filter((c) => c[pillar.key] >= avg).length;
  const lowest = sorted[sorted.length - 1];
  const highestScore = sorted[0][pillar.key];
  const lowestScore = lowest[pillar.key];
  const highestCountries = sorted.filter((country) => country[pillar.key] === highestScore);
  const lowestCountries = sorted.filter((country) => country[pillar.key] === lowestScore);
  const highestDescription = highestCountries.length === 1
    ? `${highestCountries[0].name} leads in ${pillar.name} with a score of`
    : `${countryGroup(highestCountries)} share the highest ${pillar.name} score of`;
  const lowestDescription = lowestCountries.length === 1
    ? `${lowestCountries[0].name} scores lowest at`
    : `${countryGroup(lowestCountries)} share the lowest score of`;

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
        {INSIGHTS[pillar.key]} High-scoring countries include{" "}
        {leaders.map((country) => `${country.name} (${fmt.score(country[pillar.key])})`).join(", ")},
        against an OIC average of <strong>{fmt.score(avg)}</strong>.
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
        summary={`All ${COUNTRIES.length} member states ranked by ${pillar.name}. ${highestDescription} ${fmt.score(highestScore)}; ${lowestDescription} ${fmt.score(lowestScore)}. The pillar average is ${fmt.score(avg)}.`}
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
            {highestDescription}{" "}
            <strong>{fmt.score(highestScore)}</strong>, while{" "}
            {lowestDescription}{" "}
            <strong>{fmt.score(lowestScore)}</strong> — a{" "}
            <strong>
              {(highestScore - lowestScore).toFixed(0)}
              -point divide
            </strong>
            . <strong>{atOrAbove} of {COUNTRIES.length}</strong> countries score at or above the OIC average
            of {fmt.score(avg)}.
          </InsightBlock>
        </div>
      </ChartFrame>
    </div>
  );
}

export default PillarAnalysis;
