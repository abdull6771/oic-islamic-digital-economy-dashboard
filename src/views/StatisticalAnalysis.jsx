import { COUNTRIES, META, PILLARS, REFERENCE_YEAR } from "../data/index.js";
import * as fmt from "../lib/format.js";
import { Card, InsightBlock, ScoreBar, StatTile, TableScroll } from "../components/Primitives.jsx";
import { LegendKey } from "../components/ChartFrame.jsx";

/**
 * Correlation runs −1 to +1, so it wants a diverging encoding, not the
 * sequential DEI ramp. The tint is capped at 45% of the hue so `--text` clears
 * AA on every cell in both themes.
 */
const corrCell = (v) => {
  const strength = Math.min(1, Math.abs(v)) * 45;
  const hue = v >= 0 ? "var(--seq-7)" : "var(--negative)";
  return `color-mix(in srgb, ${hue} ${strength.toFixed(0)}%, var(--surface))`;
};

function StatisticalAnalysis() {
  const corr = (k1, k2) => {
    const xs = COUNTRIES.map((c) => c[k1]);
    const ys = COUNTRIES.map((c) => c[k2]);
    const n = xs.length;
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
    const den = Math.sqrt(
      xs.reduce((s, x) => s + (x - mx) ** 2, 0) *
        ys.reduce((s, y) => s + (y - my) ** 2, 0),
    );
    return den === 0 ? 0 : parseFloat((num / den).toFixed(2));
  };

  const corrMatrix = PILLARS.map((p1) => ({
    name: p1.short,
    ...PILLARS.reduce((acc, p2) => {
      acc[p2.short] = corr(p1.key, p2.key);
      return acc;
    }, {}),
  }));

  const descStats = PILLARS.map((p) => {
    const vals = COUNTRIES.map((c) => c[p.key]).sort((a, b) => a - b);
    const mean = vals.reduce((a, b) => a + b) / vals.length;
    const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
    return {
      id: p.id,
      name: p.name,
      short: p.short,
      color: p.color,
      mean: mean.toFixed(1),
      median: vals[Math.floor(vals.length / 2)].toFixed(1),
      sd: Math.sqrt(variance).toFixed(1),
      min: vals[0].toFixed(1),
      max: vals[vals.length - 1].toFixed(1),
      q1: vals[Math.floor(vals.length * 0.25)].toFixed(1),
      q3: vals[Math.floor(vals.length * 0.75)].toFixed(1),
      range: (vals[vals.length - 1] - vals[0]).toFixed(1),
      meanValue: mean,
    };
  });

  const strongCorrs = [];
  corrMatrix.forEach((row, ri) => {
    PILLARS.forEach((p2, ci) => {
      const v = row[p2.short];
      if (Math.abs(v) >= 0.7 && ri < ci) {
        strongCorrs.push({ p1: PILLARS[ri].name, p2: p2.name, corr: v });
      }
    });
  });

  return (
    <div className="stack">
      <div className="cols-4">
        <StatTile label="OIC member states" value={META.countryCount} support="Complete panel" />
        <StatTile label="Pillars analysed" value={PILLARS.length} support="Weighted components" />
        <StatTile
          label="Strong correlations"
          value={strongCorrs.length}
          support="Pillar pairs at |r| ≥ 0.7"
        />
        <StatTile label="Score range" value="0–100" support={fmt.SCORE_UNIT} />
      </div>

      <Card
        title={`Descriptive statistics — all ${PILLARS.length} pillars`}
        subtitle={`n = ${META.countryCount} countries · ${fmt.SCORE_UNIT} · ${REFERENCE_YEAR}`}
        footer={fmt.SOURCE_LINE}
      >
        <TableScroll>
          <table className="data-table zebra">
            <caption className="visually-hidden">
              Mean, median, standard deviation, quartiles, minimum, maximum and range for
              each of the nine pillars.
            </caption>
            <thead>
              <tr>
                <th scope="col">Pillar</th>
                <th scope="col" data-numeric="true">Mean</th>
                <th scope="col" data-numeric="true">Median</th>
                <th scope="col" data-numeric="true">SD</th>
                <th scope="col" data-numeric="true">Q1</th>
                <th scope="col" data-numeric="true">Q3</th>
                <th scope="col" data-numeric="true">Min</th>
                <th scope="col" data-numeric="true">Max</th>
                <th scope="col" data-numeric="true">Range</th>
                <th scope="col">Mean vs 0–100</th>
              </tr>
            </thead>
            <tbody>
              {descStats.map((s) => (
                <tr key={s.id}>
                  <td className="name-cell">
                    <span className="row" style={{ gap: "var(--s-8)", flexWrap: "nowrap" }}>
                      <span className="swatch-dot" style={{ background: s.color }} aria-hidden="true" />
                      {s.name}
                    </span>
                  </td>
                  <td data-numeric="true"><strong>{s.mean}</strong></td>
                  <td data-numeric="true">{s.median}</td>
                  <td data-numeric="true">{s.sd}</td>
                  <td data-numeric="true">{s.q1}</td>
                  <td data-numeric="true">{s.q3}</td>
                  <td data-numeric="true">{s.min}</td>
                  <td data-numeric="true">{s.max}</td>
                  <td data-numeric="true">{s.range}</td>
                  <td style={{ minWidth: "120px" }}>
                    <ScoreBar
                      value={s.meanValue}
                      color={s.color}
                      label={`${s.name} mean`}
                      showValue={false}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      </Card>

      <Card
        title="Inter-pillar correlation analysis"
        subtitle={`Pearson r between every pair of pillars · n = ${META.countryCount} · ${REFERENCE_YEAR}`}
        action={
          <div className="chart-legend">
            <LegendKey color={corrCell(1)}>r = +1</LegendKey>
            <LegendKey color={corrCell(0)}>r = 0</LegendKey>
            <LegendKey color={corrCell(-1)}>r = −1</LegendKey>
          </div>
        }
        footer={fmt.SOURCE_LINE}
      >
        <TableScroll>
          <table className="data-table">
            <caption className="visually-hidden">
              Pearson correlation coefficient between each pair of the nine pillars.
            </caption>
            <thead>
              <tr>
                <th scope="col">Pillar</th>
                {PILLARS.map((p) => (
                  <th key={p.id} scope="col" data-numeric="true" title={p.name}>
                    {p.short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {corrMatrix.map((row, ri) => (
                <tr key={row.name}>
                  <th scope="row" className="name-cell" style={{ textAlign: "left", fontWeight: 500 }}>
                    <span className="row" style={{ gap: "var(--s-8)", flexWrap: "nowrap" }}>
                      <span
                        className="swatch-dot"
                        style={{ background: PILLARS[ri].color }}
                        aria-hidden="true"
                      />
                      {row.name}
                    </span>
                  </th>
                  {PILLARS.map((p2) => {
                    const v = row[p2.short];
                    return (
                      <td key={p2.id} data-numeric="true" style={{ padding: "var(--s-4)" }}>
                        <span
                          className="heat-cell"
                          style={{ background: corrCell(v), color: "var(--text)" }}
                        >
                          {v.toFixed(2)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>

        {strongCorrs.length > 0 && (
          <div style={{ marginTop: "var(--s-16)" }}>
            <InsightBlock title="Strong pillar relationships" provenance={null}>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {strongCorrs.map((s) => (
                  <li
                    className="row"
                    key={`${s.p1}-${s.p2}`}
                    style={{ justifyContent: "space-between", flexWrap: "nowrap" }}
                  >
                    <span className="t-body">
                      <strong>{s.p1}</strong> ↔ <strong>{s.p2}</strong>
                    </span>
                    <span className="t-body tnum" style={{ fontWeight: 600 }}>
                      r = {s.corr}
                    </span>
                  </li>
                ))}
              </ul>
            </InsightBlock>
          </div>
        )}
      </Card>
    </div>
  );
}

export default StatisticalAnalysis;
