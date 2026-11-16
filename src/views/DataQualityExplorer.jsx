import { useMemo, useState } from "react";
import { COUNTRIES, PILLARS, REFERENCE_YEAR, YEARS } from "../data/index.js";
import { Badge, Button, Card, EmptyState, TableScroll } from "../components/Primitives.jsx";
import {
  QUALITY_COVERAGE_NOTE,
  QUALITY_STATUSES,
  dataQualityCsv,
  filterDataQualityRows,
  getDataQualityRows,
  summarizeDataQuality,
} from "../lib/data-quality.js";
import "../styles/data-quality.css";

const COUNTRIES_ALPHABETICAL = [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));
const REGIONS = [...new Set(COUNTRIES.map((country) => country.region))].sort();
const initialFilters = { search: "", country: "", region: "", pillar: "", status: "" };
const number = (value) => value === null ? "Unavailable" : value.toFixed(2);

function downloadRows(rows, year) {
  const blob = new Blob(["\uFEFF", dataQualityCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `OIC_DEI_${year}_Data_Quality_${rows.length}_Values.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export default function DataQualityExplorer() {
  const [year, setYear] = useState(REFERENCE_YEAR);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const rows = useMemo(() => getDataQualityRows(year), [year]);
  const scope = useMemo(() => filterDataQualityRows(rows, { ...filters, status: "" }), [rows, filters]);
  const summary = useMemo(() => summarizeDataQuality(scope), [scope]);
  const matches = useMemo(() => filters.status ? scope.filter((row) => row.statusKey === filters.status) : scope, [scope, filters.status]);
  const pages = Math.max(1, Math.ceil(matches.length / pageSize));
  const currentPage = Math.min(page, pages);
  const start = (currentPage - 1) * pageSize;
  const visible = matches.slice(start, start + pageSize);
  const setFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value, ...(key === "region" ? { country: "" } : {}) }));
    setPage(1);
  };
  const reset = () => {
    setFilters(initialFilters);
    setYear(REFERENCE_YEAR);
    setPage(1);
  };

  return (
    <div className="quality-explorer stack">
      <Card title="Understand the data behind each score" subtitle="Search all 32 indicators and 21 sub-indicators, including published aggregates.">
        <div className="quality-coverage-note">
          <p>{QUALITY_COVERAGE_NOTE}</p>
          <p>Index scores and source percentages have separate columns. A numeric zero remains a published value; it does not establish an observed zero. Source publication and observation years may differ from the selected assessment year.</p>
        </div>
      </Card>

      <Card title="Explore country and indicator values" action={<Button onClick={reset}>Reset filters</Button>}>
        <div className="quality-filters">
          <label className="quality-search"><span>Search country or indicator</span><input type="search" value={filters.search} onChange={(event) => setFilter("search", event.target.value)} placeholder="Country, code, indicator or source" /></label>
          <label><span>Assessment year</span><select value={year} onChange={(event) => { setYear(Number(event.target.value)); setPage(1); }}>{[...YEARS].reverse().map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label><span>Region</span><select value={filters.region} onChange={(event) => setFilter("region", event.target.value)}><option value="">All regions</option>{REGIONS.map((region) => <option key={region}>{region}</option>)}</select></label>
          <label><span>Country</span><select value={filters.country} onChange={(event) => setFilter("country", event.target.value)}><option value="">All countries</option>{COUNTRIES_ALPHABETICAL.filter((country) => !filters.region || country.region === filters.region).map((country) => <option key={country.iso3}>{country.name}</option>)}</select></label>
          <label><span>Pillar</span><select value={filters.pillar} onChange={(event) => setFilter("pillar", event.target.value)}><option value="">All pillars</option>{PILLARS.map((pillar) => <option key={pillar.id} value={pillar.id}>{pillar.id}. {pillar.name}</option>)}</select></label>
          <label><span>Input status</span><select value={filters.status} onChange={(event) => setFilter("status", event.target.value)}><option value="">All statuses</option>{QUALITY_STATUSES.map((status) => <option key={status.key} value={status.key}>{status.label}</option>)}</select></label>
        </div>
        <div className="quality-counts" aria-label="Input status counts before the status filter">
          {QUALITY_STATUSES.map((status) => <div className="quality-count" key={status.key}><span className="t-caption">{status.label}</span><strong className="tnum">{summary.counts[status.key].toLocaleString()}</strong></div>)}
        </div>
        <p className="t-caption quality-scope-note">Counts cover {summary.total.toLocaleString()} values matching your country, region, pillar and search filters, before the input-status filter. They include aggregates and sub-indicators.</p>
      </Card>

      <Card title="Country-by-indicator table" subtitle={`${year} assessment · ${matches.length.toLocaleString()} matching values`} action={<Button onClick={() => downloadRows(matches, year)} disabled={!matches.length}>Download filtered CSV</Button>}>
        <p className="t-caption quality-table-note" id="quality-table-note">Scores generally use a 0–100 index scale. “Findex input” shows the workbook’s filled source percentage of adults only where available. Open coverage notes to review provenance and source-variable wording.</p>
        {!matches.length ? <EmptyState title="No values match these filters" action={<Button onClick={reset}>Reset filters</Button>}>Try another country, indicator or status.</EmptyState> : <>
          <TableScroll className="quality-table-scroll" maxHeight={680}>
            <table className="data-table quality-table" aria-describedby="quality-table-note">
              <caption className="visually-hidden">Published country-by-indicator values and source-input quality for the {year} assessment</caption>
              <thead><tr><th scope="col">Country</th><th scope="col">Indicator</th><th scope="col" data-numeric="true">Index score</th><th scope="col">Input status</th><th scope="col" data-numeric="true">Findex input<br />(% adults)</th><th scope="col">Coverage notes</th></tr></thead>
              <tbody>{visible.map((row) => <tr key={row.id}>
                <td className="name-cell"><strong>{row.country}</strong><span className="quality-cell-secondary">{row.region}</span></td>
                <td><span className="quality-code">{row.code}</span> {row.name}<span className="quality-cell-secondary">{row.pillarName}{row.isAggregate ? " · Aggregate" : row.level === "subIndicator" ? " · Sub-indicator" : " · Indicator"}</span></td>
                <td data-numeric="true" className="tnum">{number(row.score)}</td>
                <td><Badge tone={row.status.tone}>{row.status.label}</Badge></td>
                <td data-numeric="true" className="tnum">{row.inputPercent === null ? <span aria-label="Source input not available">—</span> : `${number(row.inputPercent)}%`}</td>
                <td><details className="quality-row-details"><summary>Coverage notes<span className="visually-hidden"> for {row.country}, {row.code}</span></summary><div><p><strong>Source:</strong> {row.source.label}</p>{row.sourceVariable && <p><strong>Source variable:</strong> {row.sourceVariable}</p>}<ul>{row.notes.map((note) => <li key={note}>{note}</li>)}<li>{row.source.note}</li></ul></div></details></td>
              </tr>)}</tbody>
            </table>
          </TableScroll>
          <div className="quality-pagination">
            <p className="t-caption" aria-live="polite">Showing {(start + 1).toLocaleString()}–{Math.min(start + pageSize, matches.length).toLocaleString()} of {matches.length.toLocaleString()} values</p>
            <div className="quality-page-controls"><label><span className="visually-hidden">Values per page</span><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}><option value={25}>25 per page</option><option value={50}>50 per page</option><option value={100}>100 per page</option></select></label><Button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</Button><span className="t-caption">Page {currentPage} of {pages}</span><Button disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>Next</Button></div>
          </div>
        </>}
      </Card>
    </div>
  );
}
