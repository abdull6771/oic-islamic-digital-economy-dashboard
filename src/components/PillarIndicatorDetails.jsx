import { COUNTRIES } from "../data/index.js";
import { getPillarDrilldown } from "../lib/indicator-drilldown.js";
import * as fmt from "../lib/format.js";
import { Badge, Card } from "./Primitives.jsx";

function IndicatorRow({ row, child = false }) {
  return (
    <tr className={child ? "indicator-child" : "indicator-parent"}>
      <th scope="row" className="indicator-name-cell">
        <div className="indicator-name">
          <span className="indicator-code">{row.code}</span>
          <span>{row.name}</span>
        </div>
        <details className="indicator-source">
          <summary>
            Source and notes <span className="visually-hidden">for {row.code} {row.name}</span>
          </summary>
          <div className="indicator-source-content">
            <p><strong>Source:</strong> {row.source.label}</p>
            {row.sourceVariable && <p><strong>Source variable:</strong> {row.sourceVariable}</p>}
            {row.source.note && <p>{row.source.note}</p>}
            {row.rawFindexPercent !== null && row.rawFindexPercent !== undefined && (
              <p><strong>Findex source input (adults, %):</strong> {fmt.percent(row.rawFindexPercent)}. This is the workbook source percentage; the data-status flag identifies filled inputs or source differences.</p>
            )}
            {row.notes.map((note, index) => <p key={index}>{note}</p>)}
          </div>
        </details>
      </th>
      <td data-numeric="true" className="indicator-score">{fmt.score(row.score)}</td>
      <td data-numeric="true">
        {fmt.score(row.average)}
        {row.benchmarkCount < COUNTRIES.length && (
          <span className="indicator-coverage">{row.benchmarkCount} of {COUNTRIES.length} countries</span>
        )}
      </td>
      <td data-numeric="true">
        <span className="indicator-delta" data-tone={row.delta === null ? "neutral" : fmt.deltaTone(row.delta)}>
          {fmt.delta(row.delta)}
        </span>
      </td>
      <td><Badge tone={row.status.tone}>{row.status.label}</Badge></td>
    </tr>
  );
}

export default function PillarIndicatorDetails({ country, pillar }) {
  const model = getPillarDrilldown(country, pillar.id);
  const panelId = `pillar-indicators-${pillar.id}`;
  const headingId = `${panelId}-heading`;
  const explanationId = `${panelId}-explanation`;

  return (
    <Card
      id={panelId}
      className="pillar-indicator-details"
      headingId={headingId}
      aria-labelledby={headingId}
      title={`${pillar.name}: indicators`}
      subtitle={`${model.country} · ${model.year} assessment`}
      footer={fmt.SOURCE_LINE}
    >
      <dl className="indicator-summary">
        <div>
          <dt>Pillar score</dt>
          <dd>{fmt.score(model.score)}<span> / 100</span></dd>
        </div>
        <div>
          <dt>OIC mean</dt>
          <dd>{fmt.score(model.average)}<span> / 100</span></dd>
        </div>
        <div>
          <dt>Difference from mean</dt>
          <dd className="indicator-delta" data-tone={model.delta === null ? "neutral" : fmt.deltaTone(model.delta)}>
            {fmt.delta(model.delta)}<span> points</span>
          </dd>
        </div>
      </dl>
      <p className="t-caption muted" id={explanationId}>
        Explore {model.indicatorCount} indicators{model.subIndicatorCount > 0 ? ` and ${model.subIndicatorCount} sub-indicators` : ""} behind this pillar.
        {" "}Scores use a 0–100 scale; differences are in score points. A dash means the workbook has no published score; missing values are excluded from the mean.
      </p>
      {model.benchmarkCount < COUNTRIES.length && (
        <p className="t-caption muted">The pillar mean covers {model.benchmarkCount} of {COUNTRIES.length} countries.</p>
      )}
      {model.notes.length > 0 && (
        <div className="indicator-method-note t-caption">
          {model.notes.map((note, index) => <p key={index}>{note}</p>)}
        </div>
      )}
      <p className="indicator-table-hint t-caption muted">On smaller screens, scroll the table horizontally to see every column.</p>
      <div
        className="table-scroll indicator-table-scroll"
        role="region"
        aria-label={`${pillar.name} indicator comparison table`}
        tabIndex={0}
      >
        <table className="data-table indicator-table" aria-describedby={explanationId}>
          <caption className="visually-hidden">
            {model.country}, {pillar.name}: published indicator scores against the OIC mean, {model.year}.
          </caption>
          <thead>
            <tr>
              <th scope="col">Indicator</th>
              <th scope="col" data-numeric="true">Country score</th>
              <th scope="col" data-numeric="true">OIC mean</th>
              <th scope="col" data-numeric="true">Difference (pts)</th>
              <th scope="col">Data status</th>
            </tr>
          </thead>
          {model.groups.map((group) => (
            <tbody key={group.code}>
              <IndicatorRow row={group} />
              {(group.subIndicators || []).map((row) => <IndicatorRow key={row.code} row={row} child />)}
            </tbody>
          ))}
        </table>
      </div>
    </Card>
  );
}
