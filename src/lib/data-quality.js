import {
  FINDEX,
  INDICATOR_METADATA,
  PANEL,
  PILLARS,
  REFERENCE_YEAR,
  labelFor,
} from "../data/index.js";
import { indicatorSourceFor } from "../data/indicator-sources.js";

export const QUALITY_STATUSES = Object.freeze([
  { key: "observed", label: "Observed input", tone: "info" },
  { key: "imputed", label: "Imputed input", tone: "warning" },
  { key: "unavailable", label: "Unavailable", tone: "neutral" },
  { key: "discrepancy", label: "Source discrepancy", tone: "warning" },
  { key: "unclassified", label: "Not classified", tone: "neutral" },
].map(Object.freeze));

export const QUALITY_COVERAGE_NOTE =
  `Observed and imputed classifications are verified only for the ${FINDEX.year} Global Findex sub-indicators (${FINDEX.codes.join(", ")}). Other numeric scores are not classified: a workbook number alone does not establish whether its underlying input was observed or filled. Unavailable means the published score is not numeric. Aggregates are included and are not independent observations.`;

const STATUS_BY_KEY = Object.fromEntries(QUALITY_STATUSES.map((status) => [status.key, status]));
const DETAILS = Object.values(INDICATOR_METADATA)
  .filter((indicator) => indicator.level !== "pillar")
  .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
const PILLAR_BY_ID = Object.fromEntries(PILLARS.map((pillar) => [pillar.id, pillar]));
const PARENTS = new Set(DETAILS.filter((indicator) => indicator.parent).map((indicator) => indicator.parent));
const rowCache = new Map();
const finiteOrNull = (value) => Number.isFinite(value) ? value : null;
const normalizeSearch = (value) => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** The published score and input provenance are separate, including when their numbers coincide. */
export function getDataQualityRows(year = REFERENCE_YEAR) {
  const numericYear = Number(year);
  if (!PANEL[numericYear]) throw new Error("Choose an available assessment year.");
  if (rowCache.has(numericYear)) return rowCache.get(numericYear);
  const detailedFindex = numericYear === FINDEX.year;
  const rows = [...PANEL[numericYear]]
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((country) => DETAILS.map((indicator) => {
      const code = indicator.code;
      const score = finiteOrNull(country.scores[code]);
      const isAggregate = PARENTS.has(code);
      const isFindexInput = detailedFindex && FINDEX.codes.includes(code);
      const difference = isFindexInput && (FINDEX.sourceDifferences || []).find(
        (item) => item.country === country.name && item.code === code,
      );
      const imputed = isFindexInput && FINDEX.imputed[code]?.includes(country.name);
      const inputPercent = isFindexInput ? finiteOrNull(FINDEX.values[country.name]?.[code]) : null;
      let statusKey = "unclassified";
      const notes = [];

      if (score === null) {
        statusKey = "unavailable";
        notes.push("The workbook has no numeric score here. It remains unavailable, rather than being converted to zero.");
      } else if (difference) {
        statusKey = "discrepancy";
        notes.push(`The collected source input is ${difference.collectedPercent}%, while the filled input is ${difference.filledPercent}%. The dashboard retains the published score and filled input. Review this discrepancy before interpretation.`);
      } else if (imputed) {
        statusKey = "imputed";
        notes.push("The collected Global Findex input is unavailable. The workbook substitutes a floor value, which contributes to the published score; this is not a survey observation.");
      } else if (isFindexInput && inputPercent !== null) {
        statusKey = "observed";
        notes.push("A collected Global Findex input is present, with no documented imputation or source discrepancy for this country and indicator. This classification describes the input, not an independent observation of the index score.");
      } else {
        notes.push("This numeric workbook value has no verified observation/imputation classification in the dashboard. It must not be interpreted as a confirmed observed input.");
      }
      if (isAggregate) notes.push("This published aggregate combines sub-indicators; it is not an additional independent source observation.");
      if (isFindexInput && inputPercent !== null) notes.push("The Findex source input is a filled percentage of adults. It is a separate measure from the published index score.");
      if (!detailedFindex && FINDEX.codes.includes(code)) notes.push(`Detailed Findex flags describe ${FINDEX.year} only and are not applied to this historical year.`);

      const source = indicatorSourceFor(code, numericYear);
      const name = labelFor(code);
      return Object.freeze({
        id: `${numericYear}:${country.iso3 || country.name}:${code}`,
        country: country.name,
        iso3: country.iso3,
        region: country.region,
        year: numericYear,
        code,
        name,
        level: indicator.level,
        pillarId: indicator.pillar,
        pillarName: PILLAR_BY_ID[indicator.pillar].name,
        isAggregate,
        score,
        statusKey,
        status: STATUS_BY_KEY[statusKey],
        inputPercent,
        collectedPercent: difference ? difference.collectedPercent : statusKey === "observed" ? inputPercent : null,
        source: Object.freeze(source),
        sourceVariable: indicator.sourceVariable || null,
        notes: Object.freeze(notes),
        searchText: normalizeSearch([country.name, country.iso3, country.region, code, name, PILLAR_BY_ID[indicator.pillar].name, source.label].join(" ")),
      });
    }));
  Object.freeze(rows);
  rowCache.set(numericYear, rows);
  return rows;
}

/** Each search word can match country, indicator, source, region or pillar. */
export function filterDataQualityRows(rows, { search = "", country = "", region = "", pillar = "", status = "" } = {}) {
  const words = normalizeSearch(search).trim().split(/\s+/).filter(Boolean);
  const pillarId = String(pillar).replace(/^p/, "");
  return rows.filter((row) =>
    (!country || row.country === country) &&
    (!region || row.region === region) &&
    (!pillarId || row.pillarId === pillarId) &&
    (!status || row.statusKey === status) &&
    words.every((word) => row.searchText.includes(word)),
  );
}

export function summarizeDataQuality(rows) {
  const counts = Object.fromEntries(QUALITY_STATUSES.map(({ key }) => [key, 0]));
  for (const row of rows) counts[row.statusKey]++;
  return { total: rows.length, available: rows.filter((row) => row.score !== null).length, counts };
}

function csvCell(value) {
  if (value === null || value === undefined) return '""';
  // Keep free text inert when the downloaded CSV is opened in a spreadsheet.
  const text = typeof value === "string" && /^[\s]*[=+@-]/.test(value) ? `'${value}` : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function dataQualityCsv(rows) {
  const headers = ["Assessment year", "Country", "ISO3", "Region", "Pillar", "Indicator code", "Indicator", "Level", "Published index score", "Input status", "Findex filled input (% adults)", "Collected input (% adults, where verified)", "Source family", "Source variable", "Coverage notes"];
  const values = rows.map((row) => [row.year, row.country, row.iso3, row.region, row.pillarName, row.code, row.name, row.isAggregate ? "Aggregate" : row.level, row.score, row.status.label, row.inputPercent, row.collectedPercent, row.source.label, row.sourceVariable, [...row.notes, row.source.note].join(" ")]);
  return [headers, ...values].map((row) => row.map(csvCell).join(",")).join("\r\n");
}
