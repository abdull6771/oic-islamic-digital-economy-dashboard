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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { COUNTRIES, FINDEX, OIC_AVERAGE, PILLARS, REFERENCE_YEAR, REGIONS, getCluster } from "../data/index.js";
import { useChartTokens } from "../styles/tokens.js";
import { toneFor } from "../lib/clusters.js";
import "../styles/country-profiles.css";
import { hashParam, navigate, onHashChange } from "../lib/routing.js";
import * as fmt from "../lib/format.js";
import { HEADLINE_RECOMMENDATIONS } from "../lib/country-report-data.js";
import CustomTooltip from "../components/CustomTooltip.jsx";
import CountryCombobox from "../components/CountryCombobox.jsx";
import PillarIndicatorDetails from "../components/PillarIndicatorDetails.jsx";
import ChartFrame, { animation, axis, SCORE_DOMAIN } from "../components/ChartFrame.jsx";
import {
  Badge,
  Button,
  Card,
  InsightBlock,
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
  const reportStatusRef = useRef(null);
  const reportBusyRef = useRef(false);
  const reportAbortRef = useRef(null);
  const mountedRef = useRef(true);
  const reportBusy = reportJob?.status === "running";

  useEffect(() => {
    if (!reportBusy) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    reportStatusRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "nearest",
    });
  }, [reportBusy]);

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

  const tone = toneFor(cluster.label);
  const clusterMark = `var(--cluster-${tone})`;
  const bestGap = country[bestVsAvg.key] - oicAvgByPillar[bestVsAvg.key];
  const worstGap = country[worstVsAvg.key] - oicAvgByPillar[worstVsAvg.key];

  return (
    <div className="country-profile">
      <div className="profile-toolbar no-print">
        <CountryCombobox value={selected} onChange={choose} hideLabel />
        <Badge tone={tone}>{cluster.label}</Badge>
        <span className="profile-region">
          Region: {region}
        </span>
        <div className="profile-actions">
          <Button className="profile-export-csv" onClick={exportCSV}>
            <span aria-hidden="true">⬇</span> Export CSV
          </Button>
          <Button className="profile-export-pdf" onClick={() => exportReports("single")} disabled={reportBusy}>
            <span aria-hidden="true">📄</span> Download PDF
          </Button>
          <Button
            variant="primary"
            className="profile-export-all"
            onClick={() => exportReports("all")}
            disabled={reportBusy}
            aria-describedby="country-report-download-help"
          >
            <span aria-hidden="true">⇩</span> Download all {COUNTRIES.length} reports (ZIP)
          </Button>
          <Button className="profile-copy-link" onClick={copyLink} aria-live="polite">
            <span aria-hidden="true">{copied ? "✓" : "🔗"}</span>
            {copied ? "Copied!" : "Copy Link"}
          </Button>
          <Button className="profile-print" onClick={() => window.print()}>
            <span aria-hidden="true">🖨</span> Print
          </Button>
        </div>
      </div>

      <section
        ref={reportStatusRef}
        className="profile-report-feedback no-print"
        aria-label="Country report download"
        hidden={!reportJob}
      >
        <div
          id="country-report-download-status"
          role={reportJob?.status === "error" ? "alert" : "status"}
          aria-live={reportJob?.status === "error" ? "assertive" : "polite"}
          aria-atomic="true"
        >
          {reportJob && <p className="t-caption">{reportJob.message}</p>}
        </div>
        {reportBusy && (
          <progress
            aria-label="Country report download progress"
            aria-describedby="country-report-download-status"
            max={reportJob.phase === "packaging" ? 100 : reportJob.total}
            value={reportJob.phase === "preparing" || reportJob.phase === "cancelling"
              ? undefined
              : reportJob.phase === "packaging" ? reportJob.percent : reportJob.completed}
          />
        )}
        <div className="row">
          {reportBusy && (
            <Button size="sm" onClick={cancelReportDownload} disabled={reportJob.phase === "cancelling"}>
              Cancel download
            </Button>
          )}
          {reportJob?.status === "error" && (
            <Button size="sm" onClick={() => exportReports(reportJob.kind, reportJob.targetCountry)}>
              Retry download
            </Button>
          )}
        </div>
      </section>

      <div className="profile-kpis">
        {[
          { label: "OIC DEI Score", value: fmt.score(country.adei), color: clusterMark },
          { label: "Global Rank", value: `${fmt.rank(country.rank)} of ${COUNTRIES.length}` },
          { label: "Regional Rank", value: `${fmt.rank(regionRank)} in ${region}`, color: "var(--profile-positive)" },
          { label: "Best Pillar", value: strengths[0].short, color: "var(--profile-positive)" },
          { label: "vs OIC Average", value: `${fmt.delta(country.adei - OIC_AVERAGE)} pts`, color: country.adei >= OIC_AVERAGE ? "var(--profile-positive)" : "var(--profile-negative)" },
        ].map((kpi) => (
          <div className="profile-kpi" key={kpi.label}>
            <div className="profile-kpi-value" style={{ color: kpi.color }}>{kpi.value}</div>
            <div className="profile-kpi-label">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="profile-charts">
        <ChartFrame
          className="profile-radar"
          title={<><span aria-hidden="true">📡</span> Pillar Radar Profile</>}
          source={null}
          summary={`Radar of ${country.name}'s nine pillar scores against the OIC average. It is above average in ${pillarsAboveAvg} of ${PILLARS.length} pillars.`}
        >
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={pillarData} outerRadius="70%">
              <PolarGrid stroke={tokens.border} />
              <PolarAngleAxis dataKey="subject" tick={{ fill: tokens["text-muted"], fontSize: 11 }} />
              <PolarRadiusAxis
                domain={SCORE_DOMAIN}
                tick={{ fill: tokens["text-subtle"], fontSize: 9 }}
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
                fillOpacity={0.25}
                strokeWidth={2.5}
                {...animation()}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>

          <div className="profile-chart-insight">
            <InsightBlock title="Key insight">
              {country.name} outperforms the OIC average in{" "}
              <strong>
                {pillarsAboveAvg} of {PILLARS.length} pillars
              </strong>
              . Strongest advantage in <strong style={{ color: bestVsAvg.color }}>{bestVsAvg.name}</strong> (
              <strong>{fmt.delta(bestGap)} pts</strong> vs OIC avg); largest gap in{" "}
              <strong style={{ color: worstVsAvg.color }}>{worstVsAvg.name}</strong> (
              <strong>{fmt.delta(worstGap)} pts</strong> vs OIC avg).
            </InsightBlock>
          </div>
        </ChartFrame>

        <Card
          className="profile-pillars"
          title="Pillar Score Breakdown"
        >
          <div className="profile-pillar-list">
            {PILLARS.map((p) => (
              <button
                key={p.id}
                type="button"
                className="pillar-disclosure profile-pillar"
                style={{ "--profile-pillar-color": p.color }}
                aria-label={`${p.name}: ${fmt.score(country[p.key])} out of 100. ${expandedPillarId === p.id ? "Hide" : "View"} indicators`}
                aria-expanded={expandedPillarId === p.id}
                aria-controls={expandedPillarId === p.id ? `pillar-indicators-${p.id}` : undefined}
                onClick={() => setExpandedPillarId((current) => current === p.id ? null : p.id)}
              >
                <span className="profile-pillar-label">
                  <span>{p.name}</span>
                  <strong>{fmt.score(country[p.key])}</strong>
                </span>
                <span className="profile-pillar-track" aria-hidden="true">
                  <span className="profile-pillar-fill" style={{ width: `${Math.max(0, Math.min(100, country[p.key] ?? 0))}%` }} />
                </span>
              </button>
            ))}
          </div>
          <p className="profile-pillar-help no-print">Select a pillar to explore its indicators.</p>
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

      <div className="profile-highlights">
        <Card className="profile-strengths" title={<><span aria-hidden="true">✅</span> Key Strengths</>}>
          <ul className="profile-highlight-list">
            {strengths.map((p) => (
              <li key={p.key}>
                <span className="profile-bullet" style={{ color: p.color }} aria-hidden="true">▪</span>{" "}
                {p.name}{" "}
                <strong className="tnum">{fmt.scoreCompact(country[p.key])}</strong>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="profile-growth" title={<><span aria-hidden="true">⚠</span> Areas for Growth</>}>
          <ul className="profile-highlight-list">
            {gaps.map((p) => (
              <li key={p.key}>
                <span className="profile-bullet" style={{ color: p.color }} aria-hidden="true">▪</span>{" "}
                {p.name}{" "}
                <strong className="tnum">{fmt.scoreCompact(country[p.key])}</strong>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="profile-recommendation">
          <div className="profile-recommendation-heading">
            <h2 className="t-h3">Headline Recommendation</h2>
            <span className="profile-provenance">AI-assisted insight</span>
          </div>
          <p>{HEADLINE_RECOMMENDATIONS[cluster.label]}</p>
        </Card>
      </div>

      <Card className="profile-narrative" title={<><span aria-hidden="true">📝</span> Narrative Assessment</>}>
        <p>
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
        className="profile-peers"
        title={`Regional Peer Comparison — ${region}`}
        source={null}
        summary={`${country.name} scores ${fmt.score(country.adei)} against regional peers, ranking ${fmt.rank(regionRank)} of ${regionPeers.length} in ${region}.`}
      >
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={peerCompData} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid stroke={tokens.border} strokeDasharray="3 3" />
            <XAxis dataKey="name" {...axis(tokens)} axisLine tick={{ fill: tokens["text-muted"], fontSize: 11 }} />
            <YAxis domain={SCORE_DOMAIN} {...axis(tokens)} axisLine width={36} tick={{ fill: tokens["text-muted"], fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: tokens["surface-2"] }} />
            <Bar dataKey="Score" maxBarSize={40} {...animation()}>
              {peerCompData.map((d, i) => (
                <Cell key={d.name} fill={i === 0 ? "var(--profile-gold)" : "var(--profile-peer)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="profile-chart-insight">
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
        </div>
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

      <p className="profile-source">{fmt.SOURCE_LINE} · {fmt.SCORE_UNIT} · {REFERENCE_YEAR} assessment</p>
    </div>
  );
}

export default CountryProfiles;
