import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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

import { COUNTRIES, FINDEX, OIC_AVERAGE, PILLARS, REFERENCE_YEAR, REGIONS, getCluster } from "../data/index.js";
import { useChartTokens, pillarColor } from "../styles/tokens.js";
import { clusterColor, toneFor } from "../lib/clusters.js";
import { hashParam, navigate, onHashChange } from "../lib/routing.js";
import * as fmt from "../lib/format.js";
import { HEADLINE_RECOMMENDATIONS } from "../lib/country-report-data.js";
import CustomTooltip from "../components/CustomTooltip.jsx";
import CountryCombobox from "../components/CountryCombobox.jsx";
import PageActions from "../components/PageActions.jsx";
import PillarIndicatorDetails from "../components/PillarIndicatorDetails.jsx";
import ChartFrame, { animation, axis, grid, referenceLineProps, SCORE_DOMAIN } from "../components/ChartFrame.jsx";
import {
  Badge,
  Button,
  Card,
  ClusterBadge,
  Delta,
  InsightBlock,
  StatTile,
} from "../components/Primitives.jsx";

function saveReportDownload(bytes, filename, mimeType) {
  const url = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
    // Give the browser time to consume the file before releasing its URL.
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }
}

function CountryProfiles() {
  const tokens = useChartTokens();
  const [selected, setSelected] = useState(() => {
    const c = hashParam("country");
    return c && COUNTRIES.find((x) => x.name === c) ? c : "United Arab Emirates";
  });
  const [copied, setCopied] = useState(false);
  const [expandedPillarId, setExpandedPillarId] = useState(null);
  const indicatorPanelRef = useRef(null);
  const [reportJob, setReportJob] = useState(null);
  const reportBusyRef = useRef(false);
  const reportAbortRef = useRef(null);
  const mountedRef = useRef(true);
  const reportBusy = reportJob?.status === "running";

  useEffect(() => {
    if (expandedPillarId === null || typeof window === "undefined") return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    indicatorPanelRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "nearest",
    });
  }, [expandedPillarId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      reportAbortRef.current?.abort();
    };
  }, []);

  // The hash is the source of truth, so the map, the command palette and a
  // pasted deep link all land on the same profile.
  useEffect(
    () =>
      onHashChange(() => {
        const c = hashParam("country");
        if (c && COUNTRIES.find((x) => x.name === c)) setSelected(c);
      }),
    [],
  );

  const choose = (name) => {
    setSelected(name);
    navigate({ tab: "profiles", country: name });
  };

  const country = COUNTRIES.find((c) => c.name === selected);
  const imputedFindexCodes = FINDEX.codes.filter((code) =>
    FINDEX.imputed[code]?.includes(country.name),
  );
  const findexSourceDifferences = (FINDEX.sourceDifferences || []).filter(
    (difference) => difference.country === country.name,
  );
  const cluster = getCluster(country.adei);
  const region = REGIONS[country.name] || "Other";

  const pillarData = PILLARS.map((p) => ({
    subject: p.short,
    A: country[p.key],
    OIC_Avg: COUNTRIES.reduce((s, c) => s + c[p.key], 0) / COUNTRIES.length,
    fullMark: 100,
  }));

  const peers = COUNTRIES.filter(
    (c) => REGIONS[c.name] === region && c.name !== selected,
  ).slice(0, 5);

  const strengths = [...PILLARS].sort((a, b) => country[b.key] - country[a.key]).slice(0, 3);
  const gaps = [...PILLARS].sort((a, b) => country[a.key] - country[b.key]).slice(0, 3);

  const regionPeers = COUNTRIES.filter((c) => REGIONS[c.name] === region).sort(
    (a, b) => a.rank - b.rank,
  );
  const regionRank = regionPeers.findIndex((c) => c.name === selected) + 1;

  const peerCompData = [country, ...peers].map((c) => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
    Score: parseFloat(c.adei.toFixed(1)),
  }));

  const oicAvgByPillar = PILLARS.reduce((acc, p) => {
    acc[p.key] = COUNTRIES.reduce((s, c) => s + c[p.key], 0) / COUNTRIES.length;
    return acc;
  }, {});
  const pillarsAboveAvg = PILLARS.filter((p) => country[p.key] > oicAvgByPillar[p.key]).length;
  const bestVsAvg = PILLARS.reduce(
    (best, p) =>
      country[p.key] - oicAvgByPillar[p.key] > country[best.key] - oicAvgByPillar[best.key]
        ? p
        : best,
    PILLARS[0],
  );
  const worstVsAvg = PILLARS.reduce(
    (worst, p) =>
      country[p.key] - oicAvgByPillar[p.key] < country[worst.key] - oicAvgByPillar[worst.key]
        ? p
        : worst,
    PILLARS[0],
  );
  const peerLeader = regionPeers[0];
  const gapToLeader = (peerLeader.adei - country.adei).toFixed(1);
  const isRegionLeader = regionRank === 1;
  const secondPlace = regionPeers[1];

  const exportCSV = () => {
    const headers = ["Pillar", "Score", "OIC Average", "vs OIC Avg"];
    const rows = PILLARS.map((p) => [
      p.name,
      country[p.key].toFixed(2),
      oicAvgByPillar[p.key].toFixed(2),
      (country[p.key] - oicAvgByPillar[p.key]).toFixed(2),
    ]);
    const meta = [
      [`Country,${country.name}`],
      [`OIC DEI Score,${country.adei.toFixed(2)}`],
      [`Global Rank,#${country.rank}`],
      [`Region,${region}`],
      ...(imputedFindexCodes.length
        ? [["Findex inputs using an imputed floor", imputedFindexCodes.join("; ")]]
        : []),
      ...findexSourceDifferences.map((difference) => [
        `Findex source difference ${difference.code}`,
        `Collected ${difference.collectedPercent}%; filled ${difference.filledPercent}%`,
      ]),
      [],
    ];
    const csv = [...meta, headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${country.name.replace(/[^a-z0-9]/gi, "_")}_OIC_DEI_Profile.csv`;
    a.click();
  };

  const exportReports = async (kind, reportCountry = country) => {
    // A ref closes the gap before React disables the buttons on the next render.
    if (reportBusyRef.current) return;
    reportBusyRef.current = true;
    const controller = new AbortController();
    reportAbortRef.current = controller;
    const allCountries = kind === "all";
    const total = allCountries ? COUNTRIES.length : 1;
    setReportJob({
      kind,
      targetCountry: reportCountry,
      status: "running",
      phase: "preparing",
      completed: 0,
      total,
      message: allCountries
        ? `Preparing reports for all ${total} countries...`
        : `Preparing ${reportCountry.name}'s PDF report...`,
    });

    try {
      const reports = await import("../lib/country-reports.js");
      if (controller.signal.aborted) throw new DOMException("Cancelled", "AbortError");
      let result;
      if (allCountries) {
        result = await reports.createAllCountryReports({
          signal: controller.signal,
          onProgress: (progress) => {
            if (!mountedRef.current || controller.signal.aborted) return;
            const message = progress.phase === "packaging"
              ? `Packaging ${progress.total} reports into one ZIP${progress.percent == null ? "" : `: ${Math.round(progress.percent)}%`}...`
              : `Preparing ${progress.country || "country reports"}: ${progress.completed} of ${progress.total} reports ready.`;
            setReportJob((current) => ({ ...current, ...progress, message }));
          },
        });
      } else {
        result = {
          bytes: reports.createCountryReportPdf(reportCountry),
          filename: reports.countryReportFilename(reportCountry),
          count: 1,
        };
      }
      if (controller.signal.aborted) throw new DOMException("Cancelled", "AbortError");
      if (!mountedRef.current) return;
      saveReportDownload(
        result.bytes,
        result.filename,
        allCountries ? "application/zip" : "application/pdf",
      );
      setReportJob((current) => ({
        ...current,
        status: "success",
        completed: result.count,
        message: allCountries
          ? `Your ZIP download has started with ${result.count} country PDF reports.`
          : `${reportCountry.name}'s PDF download has started.`,
      }));
    } catch (error) {
      if (!mountedRef.current) return;
      const cancelled = controller.signal.aborted || error?.name === "AbortError";
      setReportJob((current) => ({
        ...current,
        status: cancelled ? "cancelled" : "error",
        message: cancelled
          ? "Report download cancelled. You can start it again."
          : "Unable to prepare the report download. Please try again.",
      }));
    } finally {
      reportBusyRef.current = false;
      if (reportAbortRef.current === controller) reportAbortRef.current = null;
    }
  };

  const cancelReportDownload = () => {
    reportAbortRef.current?.abort();
    setReportJob((current) => ({
      ...current,
      phase: "cancelling",
      message: "Cancelling report download...",
    }));
  };

  const copyLink = () => {
    const hash = `#country=${encodeURIComponent(selected)}&tab=profiles`;
    const url = window.location.href.split("#")[0] + hash;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const clusterMark = clusterColor(tokens, cluster.label);
  const tone = toneFor(cluster.label);
  const bestGap = country[bestVsAvg.key] - oicAvgByPillar[bestVsAvg.key];
  const worstGap = country[worstVsAvg.key] - oicAvgByPillar[worstVsAvg.key];

  return (
    <div className="stack">
      {/* Contextual controls belong in the page header, next to the view title. */}
      <PageActions>
        <CountryCombobox value={selected} onChange={choose} hideLabel />
        <ClusterBadge cluster={cluster.label} short />
      </PageActions>

      <div className="row no-print">
        <span className="t-caption muted">
          Region: <strong style={{ color: "var(--text)" }}>{region}</strong>
        </span>
        <ClusterBadge cluster={cluster.label} />
        <div className="row push" style={{ gap: "var(--s-8)" }}>
          <Button onClick={exportCSV}>
            <span aria-hidden="true">↓</span> Export CSV
          </Button>
          <Button onClick={() => exportReports("single")} disabled={reportBusy}>
            <span aria-hidden="true">▤</span> Download PDF
          </Button>
          <Button onClick={copyLink} aria-live="polite">
            <span aria-hidden="true">{copied ? "✓" : "⧉"}</span>
            {copied ? "Copied" : "Copy link"}
          </Button>
          <Button onClick={() => window.print()}>
            <span aria-hidden="true">⎙</span> Print
          </Button>
        </div>
      </div>

      <Card
        title="Download country reports"
        subtitle={`${COUNTRIES.length} countries · ${REFERENCE_YEAR} assessment`}
        className="no-print"
        headingId="country-report-downloads"
      >
        <p id="country-report-download-help" className="t-caption prose muted" style={{ marginTop: 0 }}>
          Download one ZIP containing a separate PDF profile for every country in the dashboard.
          Each report includes scores, rankings, regional comparisons, recommendations, and data coverage notes.
        </p>
        <div className="row" style={{ gap: "var(--s-8)" }}>
          <Button
            variant="primary"
            onClick={() => exportReports("all")}
            disabled={reportBusy}
            aria-describedby="country-report-download-help"
          >
            Download all {COUNTRIES.length} reports (ZIP)
          </Button>
          <Button onClick={() => navigate({ tab: "reports" })} disabled={reportBusy}>
            Choose countries, regions or combined PDF
          </Button>
          {reportBusy && (
            <Button onClick={cancelReportDownload} disabled={reportJob.phase === "cancelling"}>
              Cancel download
            </Button>
          )}
          {reportJob?.status === "error" && (
            <Button onClick={() => exportReports(reportJob.kind, reportJob.targetCountry)}>
              Retry download
            </Button>
          )}
        </div>
        <div
          id="country-report-download-status"
          role={reportJob?.status === "error" ? "alert" : "status"}
          aria-live={reportJob?.status === "error" ? "assertive" : "polite"}
          aria-atomic="true"
        >
          {reportJob && (
            <p className="t-caption" style={{ marginBottom: 0 }}>
              {reportJob.message}
            </p>
          )}
        </div>
        {reportBusy && (
          <progress
            aria-label="Country report download progress"
            aria-describedby="country-report-download-status"
            max={reportJob.phase === "packaging" ? 100 : reportJob.total}
            value={reportJob.phase === "preparing" || reportJob.phase === "cancelling"
              ? undefined
              : reportJob.phase === "packaging" ? reportJob.percent : reportJob.completed}
            style={{ width: "100%", marginTop: "var(--s-12)", accentColor: "var(--interactive)" }}
          />
        )}
      </Card>

      {(imputedFindexCodes.length > 0 || findexSourceDifferences.length > 0) && (
        <Card title="Financial inclusion data coverage">
          {imputedFindexCodes.length > 0 && (
            <p className="t-caption prose muted">
              In {FINDEX.year}, {country.name} uses the workbook's imputed floor for{" "}
              {imputedFindexCodes.map((code) => `${code} (${FINDEX.labels[code]})`).join("; ")}.
              These values are not survey observations. Financial Market Development
              (pillar 8) and the overall score incorporate these floor values.
            </p>
          )}
          {findexSourceDifferences.map((difference) => (
            <p key={difference.code} className="t-caption prose muted">
              <strong>Source difference:</strong> {difference.code} ({FINDEX.labels[difference.code]})
              {" "}has a collected input of {fmt.percent(difference.collectedPercent)} and
              a filled input of {fmt.percent(difference.filledPercent)}. This is a
              difference between raw source inputs, not a missing observation.
              Validate the difference when interpreting pillar 8; the published
              pillar and overall scores are preserved.
            </p>
          ))}
        </Card>
      )}

      <div className="cols-4">
        <StatTile
          label="OIC DEI score"
          value={fmt.score(country.adei)}
          support={`${cluster.label}`}
        />
        <StatTile
          label="Global rank"
          value={fmt.rank(country.rank)}
          support={`of ${COUNTRIES.length} member states`}
        />
        <StatTile
          label="Regional rank"
          value={fmt.rank(regionRank)}
          support={`of ${regionPeers.length} in ${region}`}
        />
        <StatTile
          label="vs OIC average"
          value={fmt.delta(country.adei - OIC_AVERAGE)}
          delta={country.adei - OIC_AVERAGE}
          support={`OIC average ${fmt.score(OIC_AVERAGE)}`}
        />
      </div>

      <div className="cols-2">
        <ChartFrame
          title="Pillar radar profile"
          subtitle={`${country.name} against the OIC average · ${fmt.SCORE_UNIT} · ${REFERENCE_YEAR}`}
          summary={`Radar of ${country.name}'s nine pillar scores against the OIC average. It is above average in ${pillarsAboveAvg} of ${PILLARS.length} pillars.`}
          legend={
            <>
              <span className="legend-item t-overline">
                <span className="legend-swatch" style={{ background: clusterMark }} aria-hidden="true" />
                {country.name}
              </span>
              <span className="legend-item t-overline">
                <span className="legend-swatch" style={{ background: tokens["text-subtle"] }} aria-hidden="true" />
                OIC average
              </span>
            </>
          }
        >
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={pillarData} outerRadius="72%">
              <PolarGrid stroke={tokens.border} />
              <PolarAngleAxis dataKey="subject" tick={{ fill: tokens["text-muted"], fontSize: 11 }} />
              <PolarRadiusAxis
                domain={SCORE_DOMAIN}
                tick={{ fill: tokens["text-subtle"], fontSize: 11 }}
                axisLine={false}
              />
              <Radar
                name="OIC Average"
                dataKey="OIC_Avg"
                stroke={tokens["text-subtle"]}
                fill={tokens["text-subtle"]}
                fillOpacity={0.08}
                strokeDasharray="4 4"
                strokeWidth={1.5}
                {...animation()}
              />
              <Radar
                name={country.name}
                dataKey="A"
                stroke={clusterMark}
                fill={clusterMark}
                fillOpacity={0.22}
                strokeWidth={2}
                {...animation()}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>

          <div style={{ marginTop: "var(--s-16)" }}>
            <InsightBlock title="Key insight">
              {country.name} outperforms the OIC average in{" "}
              <strong>
                {pillarsAboveAvg} of {PILLARS.length} pillars
              </strong>
              . Strongest advantage in <strong>{bestVsAvg.name}</strong> (
              <strong>{fmt.delta(bestGap)} pts</strong> vs OIC avg); largest gap in{" "}
              <strong>{worstVsAvg.name}</strong> (
              <strong>{fmt.delta(worstGap)} pts</strong> vs OIC avg).
            </InsightBlock>
          </div>
        </ChartFrame>

        <Card
          title="Pillar score breakdown"
          subtitle={`${fmt.SCORE_UNIT} · ${REFERENCE_YEAR}`}
          footer={fmt.SOURCE_LINE}
        >
          <div className="stack-sm">
            {PILLARS.map((p) => (
              <button
                key={p.id}
                type="button"
                className="pillar-disclosure"
                aria-expanded={expandedPillarId === p.id}
                aria-controls={expandedPillarId === p.id ? `pillar-indicators-${p.id}` : undefined}
                onClick={() => setExpandedPillarId((current) => current === p.id ? null : p.id)}
              >
                <span className="pillar-disclosure-label">
                  <span className="swatch-dot" style={{ background: p.color }} aria-hidden="true" />
                  <span className="pillar-disclosure-name t-caption">
                    {p.name}
                  </span>
                  <span className="t-caption subtle tnum">{fmt.weight(p.weight)}</span>
                </span>
                <span className="score-bar">
                  <span className="score-bar-track" aria-hidden="true">
                    <span className="score-bar-fill" style={{ width: `${Math.max(0, Math.min(100, country[p.key] ?? 0))}%`, background: p.color }} />
                  </span>
                  <span className="score-bar-value t-caption">{fmt.score(country[p.key])}</span>
                </span>
                <span className="pillar-disclosure-action t-caption">
                  {expandedPillarId === p.id ? "Hide indicators" : "View indicators"}
                  <span aria-hidden="true">{expandedPillarId === p.id ? "−" : "+"}</span>
                </span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {expandedPillarId !== null && (
        <div ref={indicatorPanelRef} className="pillar-indicator-anchor">
          <PillarIndicatorDetails
            country={country}
            pillar={PILLARS.find((p) => p.id === expandedPillarId)}
          />
        </div>
      )}

      <div className="cols-3">
        <Card title="Key strengths" subtitle="Highest three pillar scores">
          <ul className="stack-sm" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {strengths.map((p) => (
              <li className="row t-sm" key={p.key} style={{ gap: "var(--s-8)", flexWrap: "nowrap" }}>
                <span className="swatch-dot" style={{ background: p.color }} aria-hidden="true" />
                <span style={{ flex: 1, minWidth: 0 }}>{p.name}</span>
                <strong className="tnum">{fmt.scoreCompact(country[p.key])}</strong>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Areas for growth" subtitle="Lowest three pillar scores">
          <ul className="stack-sm" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {gaps.map((p) => (
              <li className="row t-sm" key={p.key} style={{ gap: "var(--s-8)", flexWrap: "nowrap" }}>
                <span className="swatch-dot" style={{ background: p.color }} aria-hidden="true" />
                <span style={{ flex: 1, minWidth: 0 }}>{p.name}</span>
                <strong className="tnum">{fmt.scoreCompact(country[p.key])}</strong>
              </li>
            ))}
          </ul>
        </Card>

        <InsightBlock title="Headline recommendation">
          {HEADLINE_RECOMMENDATIONS[cluster.label]}
        </InsightBlock>
      </div>

      <Card title="Narrative assessment" footer={fmt.SOURCE_LINE}>
        <p className="t-body-lg prose">
          {country.name} scores <strong>{fmt.score(country.adei)}</strong> on the{" "}
          {REFERENCE_YEAR} OIC Digital Economy Index, placing it{" "}
          <strong>{fmt.rank(country.rank)}</strong> globally and{" "}
          <strong>{fmt.rank(regionRank)}</strong> within {region}. As a{" "}
          <strong>{cluster.label}</strong>, the country demonstrates notable capability in{" "}
          <strong>{strengths[0].name}</strong> ({fmt.scoreCompact(country[strengths[0].key])}),{" "}
          <strong>{strengths[1].name}</strong> ({fmt.scoreCompact(country[strengths[1].key])}), and{" "}
          <strong>{strengths[2].name}</strong> ({fmt.scoreCompact(country[strengths[2].key])}).
          However, notable areas for development remain in <strong>{gaps[0].name}</strong> (
          {fmt.scoreCompact(country[gaps[0].key])}) and <strong>{gaps[1].name}</strong> (
          {fmt.scoreCompact(country[gaps[1].key])}), which present the highest
          return-on-investment opportunity for targeted policy intervention.{" "}
          {country.adei >= OIC_AVERAGE
            ? `The country performs ${(country.adei - OIC_AVERAGE).toFixed(1)} points above the OIC average of ${OIC_AVERAGE.toFixed(1)}, positioning it as a potential regional knowledge-transfer hub.`
            : `Closing the ${(OIC_AVERAGE - country.adei).toFixed(1)}-point gap to the OIC average of ${OIC_AVERAGE.toFixed(1)} should serve as a near-term policy milestone.`}
        </p>
      </Card>

      <ChartFrame
        title={`Regional peer comparison — ${region}`}
        subtitle={`${country.name} and up to five regional peers · ${fmt.SCORE_UNIT} · ${REFERENCE_YEAR}`}
        summary={`${country.name} scores ${fmt.score(country.adei)} against regional peers, ranking ${fmt.rank(regionRank)} of ${regionPeers.length} in ${region}.`}
      >
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={peerCompData} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid {...grid(tokens)} />
            <XAxis dataKey="name" {...axis(tokens)} />
            <YAxis domain={SCORE_DOMAIN} {...axis(tokens)} width={36} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: tokens["surface-2"] }} />
            <Bar dataKey="Score" maxBarSize={48} {...animation()}>
              {peerCompData.map((d, i) => (
                <Cell key={d.name} fill={i === 0 ? clusterMark : tokens["border-strong"]} />
              ))}
            </Bar>
            <ReferenceLine y={OIC_AVERAGE} {...referenceLineProps(tokens)} />
          </BarChart>
        </ResponsiveContainer>

        <div style={{ marginTop: "var(--s-16)" }}>
          <InsightBlock title="Key insight">
            {isRegionLeader ? (
              secondPlace ? (
                <>
                  <strong>
                    {country.name} leads {region}
                  </strong>{" "}
                  with a score of <strong>{fmt.score(country.adei)}</strong>,{" "}
                  <strong>{(country.adei - secondPlace.adei).toFixed(1)} pts</strong> ahead of{" "}
                  <strong>{secondPlace.name}</strong> ({fmt.score(secondPlace.adei)}).
                </>
              ) : (
                <>
                  <strong>
                    {country.name} leads {region}
                  </strong>{" "}
                  with a score of <strong>{fmt.score(country.adei)}</strong>. It is currently
                  the only OIC member state in this region.
                </>
              )
            ) : (
              <>
                {country.name} ranks{" "}
                <strong>
                  {fmt.rank(regionRank)} in {region}
                </strong>{" "}
                with a score of <strong>{fmt.score(country.adei)}</strong>. Gap to regional
                leader <strong>{peerLeader.name}</strong>: <strong>{gapToLeader} pts</strong>.
                {regionRank === 2 && <> One position away from leading the region.</>}
              </>
            )}{" "}
            The region spans <strong>{regionPeers.length} OIC member states</strong>.
          </InsightBlock>
        </div>
      </ChartFrame>
    </div>
  );
}

export default CountryProfiles;
