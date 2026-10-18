import { useMemo, useState } from "react";
import history from "../data/revision-history.json" with { type: "json" };
import { labelFor } from "../data/index.js";
import { filterRevisionChanges, revisionFilterYears } from "../lib/revision-history.js";
import { Button, Card, StatTile, TableScroll } from "../components/Primitives.jsx";
import "../styles/update-history.css";

const show = (value) => Number.isFinite(value) ? value.toFixed(6).replace(/\.?0+$/, "") : "Unavailable";
const dateLabel = (value) => value ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)) : "Date unverified";
const changeText = (before, after) => !Number.isFinite(before) || !Number.isFinite(after) ? "—" : `${after - before > 0 ? "+" : ""}${(after - before).toFixed(6).replace(/\.?0+$/, "")}`;
const pageSize = 20;
const headlineChangeLabel = (row) => !row.before ? "Record added" : !row.after ? "Record removed" : row.before.adei !== row.after.adei ? row.before.rank !== row.after.rank ? "Composite score and rank changed" : "Composite score change only" : "Rank change only";

function downloadChanges(revision, rows) {
  const quote = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const lines = [["Workbook revision", "Country", "Assessment year", "Field", "Before", "After"]];
  for (const row of rows) {
    if (row.before?.adei !== row.after?.adei) lines.push([revision.source, row.country, row.year, "ADEI", row.before?.adei, row.after?.adei]);
    if (row.before?.rank !== row.after?.rank) lines.push([revision.source, row.country, row.year, "Rank", row.before?.rank, row.after?.rank]);
    for (const score of row.scores) lines.push([revision.source, row.country, row.year, `${score.code} ${labelFor(score.code)}`, score.before, score.after]);
  }
  const url = URL.createObjectURL(new Blob(["\uFEFF" + lines.map((line) => line.map(quote).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url; link.download = `OIC_DEI_Revision_${revision.id.slice(0, 12)}_Changes.csv`;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export default function UpdateHistory() {
  const [revisionId, setRevisionId] = useState(history.revisions.at(-1).id);
  const [year, setYear] = useState("all");
  const [type, setType] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const revision = history.revisions.find((entry) => entry.id === revisionId);
  const previous = history.revisions.find((entry) => entry.id === revision.previousId);
  const rows = useMemo(() => filterRevisionChanges(revision, { year, search, type }), [revision, year, search, type]);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleRows = rows.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const setFilter = (setter) => (event) => { setter(event.target.value); setPage(0); };
  const assessmentYear = revision.referenceYear;
  const referenceChanges = revision.changes.filter((row) => row.year === assessmentYear);
  return <div className="stack">
    <Card title="Workbook revision history" subtitle="Scores and rankings across the available source revisions">
      <p className="t-caption subtle">{history.scope} Earlier revisions without an archive are not reconstructed. The first revision is the comparison baseline.</p>
      <div className="history-revisions" aria-label="Choose workbook revision">
        {[...history.revisions].reverse().map((entry, index) => <button type="button" className="history-revision" key={entry.id} aria-pressed={entry.id === revisionId} onClick={() => { setRevisionId(entry.id); setYear("all"); setType("all"); setSearch(""); setPage(0); }}>
          <span className="t-overline">{entry.baseline ? "Baseline" : index === 0 ? "Latest revision" : "Earlier revision"}</span>
          <strong>{dateLabel(entry.sourceUpdated)}</strong>
          <span className="t-caption">{entry.source}</span>
          <span className="t-caption subtle">{entry.baseline ? `${entry.observationCount} country-year records` : `${entry.summary.adeiChanges} composite score changes · ${entry.summary.rankChanges} rank changes`}</span>
        </button>)}
      </div>
    </Card>
    <div className="cols-4">
      <StatTile label="Country-year records changed" value={revision.summary.changedCountryYears} support={revision.baseline ? "Baseline snapshot" : "Compared with the previous workbook"} />
      <StatTile label="Composite scores changed" value={revision.summary.adeiChanges} support="All assessment years" />
      <StatTile label="Rankings changed" value={revision.summary.rankChanges} support="Ranks recalculated from each year's scores" />
      <StatTile label={`${assessmentYear} records changed`} value={referenceChanges.length} support="Selected revision's reference assessment year" />
    </div>
    <Card title={revision.baseline ? "Baseline snapshot" : "Changes from the previous workbook"} subtitle={previous ? `Previous: ${previous.source}` : `${revision.countryCount} countries · ${revision.years.join(", ")}`}>
      <p className="t-caption subtle history-fingerprint">Workbook fingerprint: <code>{revision.id}</code></p>
      {revision.baseline ? <p>No earlier archived workbook is available for this baseline. Its zero change counts mean a comparison is unavailable.</p> : <>
        <p className="t-caption subtle">{revision.summary.pillarChanges} pillar score changes and {revision.summary.indicatorChanges} indicator or sub-indicator changes. {referenceChanges.length === 0 && `The ${assessmentYear} assessment is unchanged.`} {revision.summary.addedObservations > 0 && `${revision.summary.addedObservations} records added. `}{revision.summary.removedObservations > 0 && `${revision.summary.removedObservations} records removed.`} Expand a country's score details to see exact values; unavailable inputs remain distinct from zero.</p>
        <div className="history-filters">
          <label className="field"><span className="field-label">Search country or indicator code</span><input className="input" type="search" value={search} onChange={setFilter(setSearch)} placeholder="e.g. Malaysia or 8.2" /></label>
          <label className="field"><span className="field-label">Assessment year</span><select className="select" value={year} onChange={setFilter(setYear)}><option value="all">All years</option>{revisionFilterYears(revision).map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label className="field"><span className="field-label">Change type</span><select className="select" value={type} onChange={setFilter(setType)}><option value="all">All changes</option><option value="adei">Composite score</option><option value="rank">Ranking</option><option value="pillar">Pillar score</option><option value="indicator">Indicator score</option></select></label>
          <Button disabled={!rows.length} onClick={() => downloadChanges(revision, rows)}>Download changes (CSV)</Button>
        </div>
        <p className="t-caption" role="status">{rows.length} matching country-year records{rows.length > 0 && ` · Showing ${currentPage * pageSize + 1}–${Math.min((currentPage + 1) * pageSize, rows.length)}`}</p>
        <TableScroll><table className="data-table zebra history-table"><caption className="visually-hidden">Published score and recalculated rank changes for the selected workbook revision</caption><thead><tr><th scope="col">Country / year</th><th scope="col" data-numeric="true">Composite before → after</th><th scope="col" data-numeric="true">Score change</th><th scope="col" data-numeric="true">Rank before → after</th><th scope="col">Changed scores</th></tr></thead><tbody>
          {visibleRows.map((row) => <tr key={`${row.country}|${row.year}`}><th scope="row">{row.country}<div className="t-caption subtle">{row.year}{!row.before ? " · Record added" : !row.after ? " · Record removed" : ""}</div></th><td data-numeric="true">{show(row.before?.adei)} → {show(row.after?.adei)}</td><td data-numeric="true">{changeText(row.before?.adei, row.after?.adei)}</td><td data-numeric="true">{row.before ? `#${row.before.rank}` : "—"} → {row.after ? `#${row.after.rank}` : "—"}</td><td>{row.scores.length ? <details><summary>{row.scores.length} score changes</summary><ul className="history-score-list">{row.scores.map((score) => <li key={score.code}><strong>{score.code} {labelFor(score.code)}</strong><span>{show(score.before)} → {show(score.after)}</span></li>)}</ul></details> : headlineChangeLabel(row)}</td></tr>)}
          {!rows.length && <tr><td colSpan={5}>No changes match these filters.</td></tr>}
        </tbody></table></TableScroll>
        <div className="row history-pagination"><Button disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</Button><span className="t-caption">Page {currentPage + 1} of {pageCount}</span><Button disabled={currentPage + 1 >= pageCount} onClick={() => setPage(currentPage + 1)}>Next</Button></div>
      </>}
    </Card>
  </div>;
}
