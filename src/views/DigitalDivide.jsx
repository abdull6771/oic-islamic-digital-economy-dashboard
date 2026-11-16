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

import { COUNTRIES, META, OIC_AVERAGE, REFERENCE_YEAR } from "../data/index.js";
import { useChartTokens } from "../styles/tokens.js";
import { openCountry } from "../lib/routing.js";
import * as fmt from "../lib/format.js";
import CustomTooltip from "../components/CustomTooltip.jsx";
import ChartFrame, { LegendKey, animation, axis, grid } from "../components/ChartFrame.jsx";
import { Card, Delta, InsightBlock, StatTile } from "../components/Primitives.jsx";

function DigitalDivide() {
  const tokens = useChartTokens();
  const sorted = [...COUNTRIES].sort((a, b) => b.adei - a.adei);
  const oicAvg = OIC_AVERAGE;
  const above = sorted.filter((c) => c.adei >= oicAvg);
  const below = sorted.filter((c) => c.adei < oicAvg);

  const gapData = sorted.map((c) => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
    fullName: c.name,
    gap: parseFloat((c.adei - oicAvg).toFixed(1)),
    score: parseFloat(c.adei.toFixed(1)),
  }));

  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];
  const spread = highest.adei - lowest.adei;

  return (
    <div className="stack">
      <div className="cols-4">
        <StatTile
          label="Above OIC average"
          value={above.length}
          support={`of ${META.countryCount} member states`}
        />
        <StatTile
          label="Below OIC average"
          value={below.length}
          support={`of ${META.countryCount} member states`}
        />
        <StatTile
          label="OIC average score"
          value={fmt.score(oicAvg)}
          support={`${fmt.SCORE_UNIT} · ${REFERENCE_YEAR}`}
        />
        <StatTile
          label="Maximum divide"
          value={`${spread.toFixed(0)} pts`}
          support={`${highest.name} to ${lowest.name}`}
        />
      </div>

      <ChartFrame
        title={`Gap from the OIC average (all ${META.countryCount} countries)`}
        subtitle={`Points above or below the OIC average of ${fmt.score(oicAvg)} · ${fmt.SCORE_UNIT} · ${REFERENCE_YEAR}`}
        summary={`Deviation from the OIC average for every member state. ${above.length} sit above it and ${below.length} below, spanning ${spread.toFixed(0)} points from ${highest.name} to ${lowest.name}.`}
        legend={
          <>
            <LegendKey color={tokens.positive}>▲ Above average</LegendKey>
            <LegendKey color={tokens.negative}>▼ Below average</LegendKey>
          </>
        }
      >
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={gapData} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid {...grid(tokens)} />
            <XAxis dataKey="name" {...axis(tokens)} angle={-45} textAnchor="end" height={96} interval={0} />
            <YAxis {...axis(tokens)} width={40} />
            <Tooltip
              content={<CustomTooltip unit={`Points from the OIC average of ${fmt.score(oicAvg)}`} />}
              cursor={{ fill: tokens["surface-2"] }}
            />
            <ReferenceLine
              y={0}
              stroke={tokens["text-subtle"]}
              strokeDasharray="4 4"
              label={{
                value: `OIC average ${fmt.score(oicAvg)}`,
                fill: tokens["text-subtle"],
                fontSize: 11,
                position: "insideTopRight",
              }}
            />
            <Bar dataKey="gap" name="Gap from OIC average" maxBarSize={12} {...animation()}>
              {gapData.map((d) => (
                <Cell key={d.fullName} fill={d.gap >= 0 ? tokens.positive : tokens.negative} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div style={{ marginTop: "var(--s-16)" }}>
          <InsightBlock>
            <strong>{above.length} countries</strong> exceed the OIC average (
            {oicAvg.toFixed(1)}), while <strong>{below.length} countries</strong> fall below
            it. The largest positive gap belongs to <strong>{highest.name}</strong> (+
            {(highest.adei - oicAvg).toFixed(1)} pts) and the largest deficit to{" "}
            <strong>{lowest.name}</strong> ({(lowest.adei - oicAvg).toFixed(1)} pts),
            representing a total intra-OIC divide of{" "}
            <strong>{spread.toFixed(0)} pts</strong>.
          </InsightBlock>
        </div>
      </ChartFrame>

      <div className="cols-2">
        <GapList
          title={`Above OIC average (${above.length})`}
          rows={above}
          oicAvg={oicAvg}
        />
        <GapList
          title={`Below OIC average (${below.length})`}
          rows={below}
          oicAvg={oicAvg}
        />
      </div>
    </div>
  );
}

function GapList({ title, rows, oicAvg }) {
  return (
    <Card
      title={title}
      subtitle={`Gap from the OIC average of ${fmt.score(oicAvg)}`}
      footer={fmt.SOURCE_LINE}
    >
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {rows.map((c) => (
          <li key={c.name}>
            <button
              type="button"
              className="row"
              onClick={() => openCountry(c.name)}
              style={{
                width: "100%",
                justifyContent: "space-between",
                flexWrap: "nowrap",
                gap: "var(--s-12)",
                padding: "var(--s-8) 0",
                borderBottom: "1px solid var(--border)",
                background: "none",
                border: 0,
                borderBottomWidth: "1px",
                borderBottomStyle: "solid",
                borderBottomColor: "var(--border)",
                textAlign: "left",
                cursor: "pointer",
              }}
              aria-label={`${c.name}, ${fmt.delta(c.adei - oicAvg)} points from the OIC average. Open profile.`}
            >
              <span className="t-sm" style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.name}
              </span>
              <Delta value={c.adei - oicAvg} />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default DigitalDivide;
