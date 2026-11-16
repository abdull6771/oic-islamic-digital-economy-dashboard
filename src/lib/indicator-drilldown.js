import {
  DATA_QUALITY,
  FINDEX,
  INDICATOR_METADATA,
  PANEL,
  PILLARS,
  PILLAR_INDICATORS,
  getCountryYear,
  labelFor,
} from "../data/index.js";
import { indicatorSourceFor } from "../data/indicator-sources.js";

const numeric = (value) => Number.isFinite(value) ? value : null;

/** Use only available values in the matching year's OIC benchmark. */
function benchmark(rows, code) {
  const values = rows.map((row) => row.scores[code]).filter(Number.isFinite);
  return {
    average: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null,
    benchmarkCount: values.length,
  };
}

/** Published indicator values with their hierarchy, benchmarks and provenance. */
export function getPillarDrilldown(country, pillarId) {
  const pillar = PILLARS.find((item) => item.id === String(pillarId).replace(/^p/, ""));
  if (!pillar) throw new Error("Choose a valid pillar for indicator drill-down.");
  const published = getCountryYear(country?.name, country?.year);
  if (!published || !country?.scores || PILLARS.some(
    (item) => country[item.key] !== published[item.key],
  ) || Object.keys(INDICATOR_METADATA).some(
    (code) => country.scores[code] !== published.scores[code],
  )) {
    throw new Error("Indicator drill-down requires a published country-year record.");
  }
  const year = published.year;
  const peers = PANEL[year];
  const detailedFindex = year === FINDEX.year;
  const imputedCodes = detailedFindex ? FINDEX.codes.filter(
    (code) => FINDEX.imputed[code]?.includes(published.name),
  ) : [];
  const differences = detailedFindex ? (FINDEX.sourceDifferences || []).filter(
    (item) => item.country === published.name,
  ) : [];

  function makeRow(code, childCodes = []) {
    const metadata = INDICATOR_METADATA[code];
    const score = numeric(published.scores[code]);
    const { average, benchmarkCount } = benchmark(peers, code);
    const isAggregate = childCodes.length > 0;
    const relatedCodes = isAggregate ? childCodes : [code];
    const hasImputedInputs = relatedCodes.some((item) => imputedCodes.includes(item));
    const relatedDifferences = differences.filter((item) => relatedCodes.includes(item.code));
    const notes = [];
    let status = { label: isAggregate ? "Published aggregate" : "Workbook value", tone: "neutral" };
    if (score === null) {
      status = { label: "Unavailable", tone: "neutral" };
      notes.push("The source workbook has no numeric value here. This stays unavailable and is excluded from the OIC mean rather than counted as zero.");
    } else if (relatedDifferences.length) {
      status = { label: isAggregate ? "Includes source difference" : "Source difference", tone: "warning" };
    } else if (hasImputedInputs) {
      status = { label: isAggregate ? "Includes imputed inputs" : "Imputed input", tone: "warning" };
    } else if (detailedFindex && FINDEX.codes.includes(code)) {
      status = { label: "Collected input", tone: "info" };
    }

    if (hasImputedInputs) {
      const affected = relatedCodes.filter((item) => imputedCodes.includes(item));
      notes.push(`The workbook substitutes a floor for unavailable Global Findex inputs (${affected.join(", ")}). These filled values contribute to the published score and are not survey observations.`);
    }
    for (const item of relatedDifferences) {
      notes.push(`${item.code} has a collected input of ${item.collectedPercent}% and a filled input of ${item.filledPercent}%. The dashboard retains the filled input and published score; review this source difference before interpretation.`);
    }
    if (isAggregate) {
      notes.push("This is the published aggregate of the sub-indicators below. It is not an additional independent observation.");
    } else if (!(detailedFindex && FINDEX.codes.includes(code)) && score !== null) {
      notes.push("A numeric workbook value alone does not establish that the underlying input was directly observed. Detailed imputation flags are available here only for the 2025 Findex inputs.");
    }
    if (benchmarkCount < peers.length) {
      notes.push(`The OIC mean uses ${benchmarkCount} of ${peers.length} available country values for this indicator and year.`);
    }
    const rawFindexPercent = detailedFindex && FINDEX.codes.includes(code)
      ? numeric(FINDEX.values[published.name]?.[code]) : null;
    if (rawFindexPercent !== null) {
      notes.push("The underlying Findex percentage is a filled source input expressed as a share of adults. It is separate from the index score shown in the comparison.");
    }
    return {
      code,
      name: labelFor(code),
      level: metadata.level,
      score,
      average,
      delta: score !== null && average !== null ? score - average : null,
      benchmarkCount,
      isAggregate,
      source: indicatorSourceFor(code, year),
      sourceVariable: metadata.sourceVariable,
      status,
      notes,
      rawFindexPercent,
      subIndicators: childCodes.map((child) => makeRow(child)),
    };
  }

  const groups = PILLAR_INDICATORS[pillar.key].indicators.map((indicator) =>
    makeRow(indicator.code, (indicator.subIndicators || []).map((item) => item.code)),
  );
  const score = numeric(published.scores[pillar.id]);
  const { average, benchmarkCount } = benchmark(peers, pillar.id);
  const notes = [
    "Displayed scores are the published master-panel values, generally on a 0-100 scale; source-variable units do not turn these scores into raw percentages. Source notes identify known representation differences.",
    "Each OIC average uses the available values for the same indicator and assessment year. It includes published filled inputs and numeric zeros, and excludes unavailable values.",
  ];
  if (score === null) notes.push("This country's pillar score is unavailable in the source workbook; its published overall ADEI is retained.");
  if (pillar.id === "8" && DATA_QUALITY.some((issue) =>
    issue.id === "financial-market-aggregation" && issue.detail?.observations?.some(
      (item) => item.country === published.name && item.year === year,
    ),
  )) notes.push("For this country and year, the source Financial Market Development pillar differs from the simple mean of 8.1 and 8.2. The dashboard preserves the published aggregate.");

  return {
    country: published.name,
    year,
    pillar,
    score,
    average,
    delta: score !== null && average !== null ? score - average : null,
    benchmarkCount,
    indicatorCount: groups.length,
    subIndicatorCount: groups.reduce((count, group) => count + group.subIndicators.length, 0),
    notes,
    groups,
  };
}
