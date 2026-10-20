import { useEffect, useMemo, useRef, useState } from "react";
import { COUNTRIES, REFERENCE_YEAR, REGIONS } from "../data/index.js";
import { Button, Card } from "../components/Primitives.jsx";
import "../styles/report-downloads.css";

const SORTED_COUNTRIES = [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));
const REGION_GROUPS = [...new Set(COUNTRIES.map(({ name }) => REGIONS[name] || "Other"))]
  .sort((a, b) => a.localeCompare(b))
  .map((name) => ({ name, countries: SORTED_COUNTRIES.filter((country) => (REGIONS[country.name] || "Other") === name) }));
const searchText = (value) => value.normalize("NFKD").replace(/\p{Diacritic}/gu, "").toLowerCase();

function RegionChoice({ region, selected, disabled, onChange }) {
  const inputRef = useRef(null);
  const count = region.countries.filter(({ name }) => selected.has(name)).length;
  const partial = count > 0 && count < region.countries.length;
  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = partial;
  }, [partial]);
  return (
    <label className="report-region-choice">
      <input
        ref={inputRef}
        type="checkbox"
        checked={count === region.countries.length}
        aria-checked={partial ? "mixed" : count === region.countries.length}
        disabled={disabled}
        onChange={() => onChange(region, count !== region.countries.length)}
      />
      <span>{region.name}<span className="report-choice-meta">{count} of {region.countries.length} selected</span></span>
    </label>
  );
}

function saveDownload(result) {
  const url = URL.createObjectURL(new Blob([result.bytes], { type: result.mimeType }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = result.filename;
  document.body.appendChild(anchor);
  try { anchor.click(); } finally {
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }
}

function DownloadStatus({ job, id, onCancel, onRetry }) {
  const busy = job?.status === "running";
  return (
    <div className="report-download-status">
      <div id={id} role={job?.status === "error" ? "alert" : "status"} aria-live={job?.status === "error" ? "assertive" : "polite"} aria-atomic="true">
        {job && <p className="t-caption">{job.message}</p>}
      </div>
      {busy && <progress className="report-download-progress" aria-label="Country report download progress" aria-describedby={id} max={job.phase === "packaging" ? 100 : job.total} value={job.phase === "preparing" || job.phase === "cancelling" ? undefined : job.phase === "packaging" ? job.percent : job.completed} />}
      {(busy || job?.status === "error") && <div className="report-download-status-actions">
        {busy && <Button disabled={job.phase === "cancelling"} onClick={onCancel}>Cancel download</Button>}
        {job?.status === "error" && <Button onClick={onRetry}>Retry previous download</Button>}
      </div>}
    </div>
  );
}

export default function ReportDownloads() {
  const [selected, setSelected] = useState(() => new Set(COUNTRIES.map(({ name }) => name)));
  const [query, setQuery] = useState("");
  const [format, setFormat] = useState("zip");
  const [job, setJob] = useState(null);
  const busyRef = useRef(false);
  const controllerRef = useRef(null);
  const mountedRef = useRef(true);
  const busy = job?.status === "running";
  const filtered = useMemo(() => {
    const term = searchText(query.trim());
    return SORTED_COUNTRIES.filter((country) => searchText(`${country.name} ${country.iso3} ${REGIONS[country.name] || "Other"}`).includes(term));
  }, [query]);
  const selectedRegionCount = REGION_GROUPS.filter((region) => region.countries.every(({ name }) => selected.has(name))).length;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, []);

  const changeCountries = (countries, checked) => setSelected((current) => {
    const next = new Set(current);
    for (const { name } of countries) checked ? next.add(name) : next.delete(name);
    return next;
  });

  const download = async (request = { countryNames: [...selected], format }, location = "selection") => {
    if (busyRef.current || !request.countryNames.length) return;
    busyRef.current = true;
    const controller = new AbortController();
    controllerRef.current = controller;
    setJob({ request, location, status: "running", phase: "preparing", completed: 0, total: request.countryNames.length, message: `Preparing ${request.countryNames.length} country reports...` });
    try {
      const { createCountryReports } = await import("../lib/country-reports.js");
      if (controller.signal.aborted) throw new DOMException("Cancelled", "AbortError");
      const result = await createCountryReports({
        ...request,
        signal: controller.signal,
        onProgress(progress) {
          if (!mountedRef.current || controller.signal.aborted) return;
          const message = progress.phase === "packaging"
            ? `${request.format === "zip" ? "Packaging your ZIP" : "Finishing the combined PDF and contents"}: ${Math.round(progress.percent || 0)}%...`
            : `${progress.completed} of ${progress.total} reports ready${progress.country ? ` - ${progress.country}` : ""}.`;
          setJob((current) => ({ ...current, ...progress, message }));
        },
      });
      if (controller.signal.aborted) throw new DOMException("Cancelled", "AbortError");
      if (!mountedRef.current) return;
      saveDownload(result);
      setJob((current) => ({ ...current, status: "success", message: `Your ${request.format === "zip" ? "ZIP" : "combined PDF"} download has started with ${result.count} country ${result.count === 1 ? "report" : "reports"}.` }));
    } catch (error) {
      if (!mountedRef.current) return;
      const cancelled = controller.signal.aborted || error?.name === "AbortError";
      setJob((current) => ({ ...current, status: cancelled ? "cancelled" : "error", message: cancelled ? "Download cancelled. Your country selection is ready to use again." : "Unable to prepare your reports. Please retry the download." }));
    } finally {
      busyRef.current = false;
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  };

  const cancel = () => {
    controllerRef.current?.abort();
    setJob((current) => ({ ...current, phase: "cancelling", message: "Cancelling report download..." }));
  };

  return (
    <div className="stack report-downloads">
      <p className="t-body muted report-download-intro">
        Build a report collection for any countries or entire regions. Every profile includes
        scores, rankings, pillar comparisons, recommendations, and data coverage notes for the {REFERENCE_YEAR} assessment.
      </p>
      <Card title={`Download all ${COUNTRIES.length} country reports`} subtitle="The complete collection in one download" className="report-quick-download">
        <p className="t-body report-quick-description">
          Get every country profile as separate PDFs in one ZIP, or as a single combined PDF with a clickable contents page.
        </p>
        <div className="report-quick-actions">
          <Button variant="primary" disabled={busy} onClick={() => download({ countryNames: COUNTRIES.map(({ name }) => name), format: "zip" }, "all")} aria-describedby="report-all-export-help">
            Download all {COUNTRIES.length} reports (ZIP)
          </Button>
          <Button disabled={busy} onClick={() => download({ countryNames: COUNTRIES.map(({ name }) => name), format: "combined" }, "all")} aria-describedby="report-all-export-help">
            Download all {COUNTRIES.length} reports (combined PDF)
          </Button>
        </div>
        <p id="report-all-export-help" className="t-caption muted">
          Includes all {COUNTRIES.length} countries in the current dataset, regardless of the selection below. Preparing the collection may take a moment.
        </p>
        <DownloadStatus job={job?.location === "all" ? job : null} id="report-all-export-status" onCancel={cancel} onRetry={() => download(job.request, job.location)} />
      </Card>
      <Card title="1. Select countries and regions" subtitle={`${COUNTRIES.length} countries available`} headingId="report-country-selection">
        <fieldset className="report-fieldset" disabled={busy} aria-labelledby="report-country-selection">
          <div className="report-selection-toolbar">
            <p className="t-caption" role="status" aria-live="polite"><strong>{selected.size} of {COUNTRIES.length}</strong> countries selected{selectedRegionCount ? ` across ${selectedRegionCount} complete ${selectedRegionCount === 1 ? "region" : "regions"}` : ""}.</p>
            <div className="row">
              <Button onClick={() => setSelected(new Set(COUNTRIES.map(({ name }) => name)))} disabled={busy || selected.size === COUNTRIES.length}>Select all {COUNTRIES.length}</Button>
              <Button onClick={() => setSelected(new Set())} disabled={busy || selected.size === 0}>Clear selection</Button>
            </div>
          </div>
          <div className="report-selector-grid">
            <div>
              <h3 className="t-overline report-section-label" id="report-regions-label">Select entire regions</h3>
              <div className="report-region-list" role="group" aria-labelledby="report-regions-label">
                {REGION_GROUPS.map((region) => <RegionChoice key={region.name} region={region} selected={selected} disabled={busy} onChange={(group, checked) => changeCountries(group.countries, checked)} />)}
              </div>
            </div>
            <div>
              <label className="t-overline report-section-label" htmlFor="report-country-search">Choose individual countries</label>
              <input id="report-country-search" className="input report-country-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search country, ISO code, or region" aria-controls="report-country-list" />
              {query.trim() && <div className="report-filter-actions">
                <span className="t-caption muted">{filtered.length} matching {filtered.length === 1 ? "country" : "countries"}</span>
                <Button size="sm" disabled={busy || !filtered.length || filtered.every(({ name }) => selected.has(name))} onClick={() => changeCountries(filtered, true)}>Select matches</Button>
                <Button size="sm" disabled={busy || !filtered.some(({ name }) => selected.has(name))} onClick={() => changeCountries(filtered, false)}>Clear matches</Button>
              </div>}
              <div className="report-country-list" id="report-country-list" role="group" aria-label="Country selection">
                {filtered.map((country) => <label className="report-country-choice" key={country.name}>
                  <input type="checkbox" checked={selected.has(country.name)} onChange={(event) => changeCountries([country], event.target.checked)} />
                  <span>{country.name}<span className="report-choice-meta">{REGIONS[country.name] || "Other"}</span></span>
                  <span className="report-country-rank t-caption muted">#{country.rank}</span>
                </label>)}
                {!filtered.length && <p className="t-caption muted report-no-matches">No countries match this search. Try another country name, ISO code, or region.</p>}
              </div>
            </div>
          </div>
        </fieldset>
      </Card>
      <Card title="2. Choose the download format" headingId="report-format-heading">
        <fieldset className="report-fieldset report-format-grid" disabled={busy} aria-labelledby="report-format-heading">
          <label className={`report-format-choice${format === "zip" ? " is-selected" : ""}`}>
            <input type="radio" name="report-format" value="zip" checked={format === "zip"} onChange={() => setFormat("zip")} />
            <span><strong>Individual PDFs in one ZIP</strong><span className="report-choice-meta">A separate PDF for each selected country, bundled in a single download.</span></span>
          </label>
          <label className={`report-format-choice${format === "combined" ? " is-selected" : ""}`}>
            <input type="radio" name="report-format" value="combined" checked={format === "combined"} onChange={() => setFormat("combined")} />
            <span><strong>One combined PDF</strong><span className="report-choice-meta">All selected profiles with a clickable contents page and continuous page numbers.</span></span>
          </label>
        </fieldset>
        <div className="report-download-actions">
          <Button variant="primary" disabled={busy || !selected.size} onClick={() => download()} aria-describedby="report-export-help">
            Download {selected.size || "selected"} {selected.size === 1 ? "country" : "countries"} ({format === "zip" ? "ZIP" : "combined PDF"})
          </Button>
        </div>
        <p id="report-export-help" className="t-caption muted">{selected.size ? "Reports follow the published OIC ranking. Large collections may take a moment to prepare." : "Select at least one country or region to prepare a download."}</p>
        <DownloadStatus job={job?.location === "selection" ? job : null} id="report-export-status" onCancel={cancel} onRetry={() => download(job.request, job.location)} />
      </Card>
    </div>
  );
}
