/**
 * Independently validate the generated dashboard data against its source file.
 *
 *   npm run validate:data
 *   node scripts/validate-dataset.mjs <workbook.xlsx>
 *
 * Cross-check the reference year against the separate `2025 ranked` sheet,
 * then verify every panel score, ADEI, derived rank, cluster, missing value and
 * Findex input, including the data shapes the dashboard actually consumes.
 */
import XLSX from "xlsx";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import * as data from "../src/data/index.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_WORKBOOK = "18 Oct_New findex_Master_Data collection.xlsx";
const RANKED = "2025 ranked";
const PANEL = "OIC_2024 norm";
const CLEAR = "OIC_2024 clear";
const ORIGIN = "OIC_2024 origin";
const REF = "ref";
const FINDEX_CODES = ["8.1.1", "8.1.2", "8.1.3"];
const EXPECTED_YEARS = [2021, 2022, 2023, 2024, 2025];
const TOLERANCE = 1e-4;
const dataset = JSON.parse(readFileSync(resolve(ROOT, "src/data/adei-dataset.json"), "utf8"));

let failures = 0;
let checks = 0;
function check(name, ok, detail) {
  checks++;
  if (ok) return true;
  failures++;
  console.error(`  FAIL  ${name}${detail ? ` - ${detail}` : ""}`);
  return false;
}
const section = (title) => console.log(`\n${title}`);
const finite = (v) => typeof v === "number" && Number.isFinite(v);
const numberOrNull = (v) => finite(v) ? v : null;
const text = (v) => v === null || v === undefined ? "" : String(v).trim();
const validScore = (v) => v === null || finite(v);
const sameValue = (expected, actual) => expected === null
  ? actual === null
  : finite(actual) && Math.abs(expected - actual) <= TOLERANCE;
const sameList = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const sorted = (items) => [...items].sort();
const sameMembers = (a, b) => sameList(sorted(a), sorted(b));
const canonical = (name) => data.META.nameAliases?.[text(name)] || text(name);
const rowKey = (name, year) => `${name}|${year}`;
const nullKey = (name, year, code) => `${name}|${year}|${code}`;
const clusterFor = (score) => score >= 60
  ? "Advanced Digital Economies"
  : score >= 40 ? "Emerging Digital Economies" : "Foundational Digital Economies";

function grid(wb, sheet) {
  const ws = wb.Sheets[sheet];
  if (!ws?.["!ref"]) throw new Error(`Workbook is missing the "${sheet}" sheet`);
  const range = XLSX.utils.decode_range(ws["!ref"]);
  range.s.c = 0;
  range.s.r = 0;
  return XLSX.utils.sheet_to_json(ws, {
    header: 1, raw: true, blankrows: true, defval: null, range,
  });
}

function columns(rows) {
  return Object.fromEntries(rows[3].flatMap((value, index) => {
    const code = text(value);
    return code ? [[code, index]] : [];
  }));
}

function sheetRecords(rows, colOf, sheet, scored = false) {
  const records = new Map();
  const duplicates = [];
  for (const row of rows.slice(7)) {
    const name = canonical(row[1]);
    const year = row[2];
    // Raw sheets include footer summaries such as `min` with year 0.
    if (!name || !Number.isInteger(year) || year < 1900 || year > 2100) continue;
    if (scored && !finite(row[colOf.ADEI])) continue;
    const key = rowKey(name, year);
    if (records.has(key)) duplicates.push(key);
    else records.set(key, { name, year, row });
  }
  check(`${sheet} has no duplicate country-year rows`, duplicates.length === 0, duplicates.slice(0, 5).join(", "));
  return records;
}

function compareScores(records, colOf, label) {
  const mismatches = [];
  let cells = 0;
  let adeiCells = 0;
  let shortcuts = 0;
  for (const { name, year, row } of records.values()) {
    const actual = data.getCountryYear(name, year);
    if (!actual) continue; // Exact country-year coverage is checked separately.
    for (const code of scoreCodes) {
      cells++;
      const expected = numberOrNull(row[colOf[code]]);
      if (!sameValue(expected, actual.scores[code])) {
        mismatches.push(`${name} ${year} ${code}: source ${expected}, app ${actual.scores[code]}`);
      }
    }
    adeiCells++;
    if (!sameValue(row[colOf.ADEI], actual.adei)) {
      mismatches.push(`${name} ${year} ADEI: source ${row[colOf.ADEI]}, app ${actual.adei}`);
    }
    for (const pillar of data.PILLARS) {
      shortcuts++;
      if (!sameValue(numberOrNull(row[colOf[pillar.id]]), actual[pillar.key])) {
        mismatches.push(`${name} ${year} ${pillar.key}: source ${row[colOf[pillar.id]]}, app ${actual[pillar.key]}`);
      }
    }
  }
  console.log(`  ${label}: ${cells.toLocaleString("en-US")} scores, ${adeiCells} ADEI values and ${shortcuts} pillar shortcuts`);
  check(`${label}: all values match`, mismatches.length === 0, `${mismatches.length} mismatch(es)${mismatches.length ? `; ${mismatches.slice(0, 5).join("; ")}` : ""}`);
}

const workbook = process.argv[2] || data.META.source || DEFAULT_WORKBOOK;
const workbookPath = resolve(ROOT, workbook);
if (!existsSync(workbookPath)) {
  console.error(`Workbook not found: ${workbookPath}`);
  process.exit(1);
}
console.log(`Validating ${workbook}`);
console.log(`  dataset built ${data.META.generatedAt}`);
section("Source provenance");
check("dataset source identifies the requested workbook", typeof data.META.source === "string" && resolve(ROOT, data.META.source).toLowerCase() === workbookPath.toLowerCase(), `metadata source: ${data.META.source}`);
if (data.META.sourceSha256 !== undefined) {
  const actualHash = createHash("sha256").update(readFileSync(workbookPath)).digest("hex");
  check("source workbook SHA-256 matches the generated data", typeof data.META.sourceSha256 === "string" && /^[a-f0-9]{64}$/i.test(data.META.sourceSha256) && actualHash === data.META.sourceSha256.toLowerCase());
}
if (data.META.sourceUpdated !== undefined) {
  const date = new Date(`${data.META.sourceUpdated}T00:00:00Z`);
  check("source update date is a valid ISO calendar date", typeof data.META.sourceUpdated === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data.META.sourceUpdated) && finite(date.getTime()) && date.toISOString().slice(0, 10) === data.META.sourceUpdated);
  console.log(`  workbook updated ${data.META.sourceUpdated}`);
}
check("generated data has no unresolved error-level quality issues", !data.DATA_QUALITY.some((issue) => issue.severity === "error"), data.DATA_QUALITY.filter((issue) => issue.severity === "error").map((issue) => issue.id).join(", "));

const wb = XLSX.readFile(workbookPath, { sheets: [RANKED, PANEL, CLEAR, ORIGIN, REF], cellDates: false });
const panelRows = grid(wb, PANEL);
const rankedRows = grid(wb, RANKED);
const panelCol = columns(panelRows);
const rankedCol = columns(rankedRows);
const scoreCodes = panelRows[3].map(text).filter((code) => /^\d+(\.\d+)*$/.test(code));
const rankedCodes = Object.keys(rankedCol).filter((code) => /^\d+(\.\d+)*$/.test(code));
const panelRecords = sheetRecords(panelRows, panelCol, PANEL, true);
const rankedRecords = sheetRecords(rankedRows, rankedCol, RANKED, true);
const sourceYears = [...new Set([...panelRecords.values()].map((row) => row.year))].sort((a, b) => a - b);
const sourceCountries = sorted(new Set([...panelRecords.values()].map((row) => row.name)));
const allRecords = data.YEARS.flatMap((year) => data.PANEL[year] || []);

section("Country and year coverage");
check("source and dashboard cover exactly 2021-2025", sameList(sourceYears, EXPECTED_YEARS) && sameList(data.YEARS, sourceYears));
check("reference year is the final source year", data.REFERENCE_YEAR === sourceYears.at(-1));
check("country count matches source and metadata", sourceCountries.length === data.META.countryCount && sameMembers(sourceCountries, data.COUNTRIES.map((country) => country.name)), `source ${sourceCountries.length}, reference-year app ${data.COUNTRIES.length}, metadata ${data.META.countryCount}`);
for (const year of sourceYears) {
  const expected = [...panelRecords.values()].filter((record) => record.year === year).map((record) => record.name);
  const actual = (data.PANEL[year] || []).map((record) => record.name);
  check(`${year}: exact country coverage (${expected.length} rows)`, sameMembers(expected, actual) && new Set(actual).size === actual.length);
}
check("generated observations contain exactly the source country-year rows", dataset.observations.length === panelRecords.size && sameMembers(dataset.observations.map((observation) => rowKey(observation.country, observation.year)), [...panelRecords.keys()]), `source ${panelRecords.size}, generated ${dataset.observations.length}`);
check("ranked sheet contains exactly the reference-year countries", [...rankedRecords.values()].every((record) => record.year === data.REFERENCE_YEAR) && sameMembers([...rankedRecords.values()].map((record) => record.name), data.COUNTRIES.map((country) => country.name)));

section("Score values and types");
check(`all ${scoreCodes.length} score codes are represented exactly once`, scoreCodes.length > 0 && sameList(dataset.codes, scoreCodes) && new Set(dataset.codes).size === scoreCodes.length && sameMembers(rankedCodes, scoreCodes));
check(`every generated score array has ${scoreCodes.length} finite-number-or-null values`, dataset.observations.every((observation) => Array.isArray(observation.scores) && observation.scores.length === scoreCodes.length && observation.scores.every(validScore)));
check("every app score object has exactly the source codes and finite-number-or-null values", allRecords.every((record) => sameMembers(Object.keys(record.scores), scoreCodes) && Object.values(record.scores).every(validScore)));
check("ADEI, years and ranks are finite numbers", allRecords.every((record) => finite(record.adei) && Number.isInteger(record.year) && Number.isInteger(record.rank) && record.rank > 0));
compareScores(rankedRecords, rankedCol, `Independent ${data.REFERENCE_YEAR} ranked sheet`);
compareScores(panelRecords, panelCol, "Full 2021-2025 panel");

section("Ranks and clusters");
for (const year of sourceYears) {
  const expected = [...panelRecords.values()].filter((record) => record.year === year).sort((a, b) => b.row[panelCol.ADEI] - a.row[panelCol.ADEI]);
  const actual = data.PANEL[year] || [];
  check(`${year}: ranks derive from descending source ADEI`, expected.every((record, index) => data.getCountryYear(record.name, year)?.rank === index + 1));
  check(`${year}: panel order is the complete rank sequence`, actual.every((record, index) => record.rank === index + 1));
  check(`${year}: clusters follow the published 60/40 thresholds`, expected.every((record) => {
    const actualRecord = data.getCountryYear(record.name, year);
    return actualRecord?.cluster === clusterFor(record.row[panelCol.ADEI]) && data.getCluster(actualRecord.adei).label === actualRecord.cluster;
  }));
}
check("reference-year ranks and clusters match the independent ranked sheet", [...rankedRecords.values()].every(({ name, year, row }) => {
  const actual = data.getCountryYear(name, year);
  return actual?.rank === row[rankedCol.Rank] && actual.cluster === text(row[rankedCol.Clusters]);
}));
check("COUNTRIES is the ordered reference-year panel", sameList(data.COUNTRIES.map((country) => country.name), (data.PANEL[data.REFERENCE_YEAR] || []).map((country) => country.name)));

section("Weights and aggregation");
const sourceWeights = Object.fromEntries(grid(wb, REF).filter((row) => Number.isInteger(row[0]) && row[0] >= 1 && row[0] <= 9 && text(row[1]) && finite(row[2])).map((row) => [String(row[0]), row[2]]));
check("all nine pillar weights match the source reference sheet", data.PILLARS.length === 9 && data.PILLARS.every((pillar) => finite(sourceWeights[pillar.id]) && pillar.weight === sourceWeights[pillar.id]));
const weightSum = data.PILLARS.reduce((sum, pillar) => sum + pillar.weight, 0);
check(`pillar weights sum to 100 (got ${weightSum})`, finite(weightSum) && Math.abs(weightSum - 100) < 1e-9);
let worstAdei = 0;
let complete = 0;
let incomplete = 0;
for (const record of allRecords) {
  if (!data.PILLARS.every((pillar) => finite(record[pillar.key]))) {
    incomplete++;
    continue;
  }
  complete++;
  const sum = data.PILLARS.reduce((total, pillar) => total + record[pillar.key] * sourceWeights[pillar.id] / 100, 0);
  worstAdei = Math.max(worstAdei, Math.abs(sum - record.adei));
}
console.log(`  weighted ADEI checked for ${complete} complete rows; ${incomplete} incomplete rows retain the workbook's ADEI`);
check(`complete rows match weighted ADEI (worst error ${worstAdei.toExponential(2)})`, complete > 0 && finite(worstAdei) && worstAdei < 0.01);
check("complete and incomplete aggregation counts cover the full panel", complete + incomplete === panelRecords.size);
check("OIC_AVERAGE equals the reference-year mean", finite(data.OIC_AVERAGE) && Math.abs(data.OIC_AVERAGE - data.COUNTRIES.reduce((sum, country) => sum + country.adei, 0) / data.COUNTRIES.length) < 1e-9);

section("Trend series");
check("each country trend matches source ADEI in every year", data.COUNTRIES.every((country) => {
  const series = data.TREND_DATA[country.name];
  return Array.isArray(series) && series.length === sourceYears.length && sourceYears.every((year, index) => {
    const source = panelRecords.get(rowKey(country.name, year));
    return sameValue(source ? source.row[panelCol.ADEI] : null, series[index]);
  });
}));
const avgSeries = data.TREND_DATA[data.OIC_AVERAGE_LABEL];
check("OIC average trend matches each year's source mean", Array.isArray(avgSeries) && avgSeries.length === sourceYears.length && sourceYears.every((year, index) => {
  const records = [...panelRecords.values()].filter((record) => record.year === year);
  const mean = records.reduce((sum, record) => sum + record.row[panelCol.ADEI], 0) / records.length;
  return finite(avgSeries[index]) && Math.abs(avgSeries[index] - mean) < 0.005001 && sameValue(mean, data.oicAverageFor(year));
}));
check("all trend values are finite numbers or explicit null", Object.values(data.TREND_DATA).every((series) => Array.isArray(series) && series.every(validScore)));

section("Missing data declarations");
const sourceNulls = new Set();
for (const { name, year, row } of panelRecords.values()) {
  for (const code of scoreCodes) if (!finite(row[panelCol[code]])) sourceNulls.add(nullKey(name, year, code));
}
const appNulls = new Set(allRecords.flatMap((record) => Object.entries(record.scores).filter(([, value]) => value === null).map(([code]) => nullKey(record.name, record.year, code))));
const declaredNulls = new Set();
let declarationsValid = true;
for (const issue of data.dataQualityBy("not-available")) {
  const detail = issue.detail;
  if (!detail || !scoreCodes.includes(detail.code) || !Array.isArray(detail.years) || !detail.countriesByYear) {
    declarationsValid = false;
    continue;
  }
  let count = 0;
  for (const [year, countries] of Object.entries(detail.countriesByYear)) {
    if (!sourceYears.includes(Number(year)) || !detail.years.includes(Number(year)) || !Array.isArray(countries) || new Set(countries).size !== countries.length) {
      declarationsValid = false;
      continue;
    }
    for (const country of countries) {
      const key = nullKey(country, Number(year), detail.code);
      if (declaredNulls.has(key)) declarationsValid = false;
      declaredNulls.add(key);
      count++;
    }
  }
  if (detail.count !== count || !sameMembers(detail.years, Object.keys(detail.countriesByYear).map(Number))) declarationsValid = false;
}
check(`${sourceNulls.size} source gaps are preserved exactly by country, year and code`, sameMembers([...sourceNulls], [...appNulls]));
check("missing-value declarations identify the exact source gaps and counts", declarationsValid && sameMembers([...sourceNulls], [...declaredNulls]), [...sourceNulls].filter((key) => !declaredNulls.has(key)).slice(0, 5).join(", "));

section("Findex source values and imputation");
const clearRows = grid(wb, CLEAR);
const originRows = grid(wb, ORIGIN);
const clearCol = columns(clearRows);
const originCol = columns(originRows);
const clearRecords = sheetRecords(clearRows, clearCol, CLEAR);
const originRecords = sheetRecords(originRows, originCol, ORIGIN);
check("Findex codes and reference year match the workbook", sameList(data.FINDEX.codes, FINDEX_CODES) && data.FINDEX.year === data.REFERENCE_YEAR && FINDEX_CODES.every((code) => clearCol[code] !== undefined && originCol[code] !== undefined));
check("raw Findex values cover exactly the dashboard countries", sameMembers(Object.keys(data.FINDEX.values), data.COUNTRIES.map((country) => country.name)));
const expectedImputed = Object.fromEntries(FINDEX_CODES.map((code) => [code, []]));
const rawMismatches = [];
const sourceDifferences = [];
let rawCells = 0;
for (const country of data.COUNTRIES) {
  const key = rowKey(country.name, data.REFERENCE_YEAR);
  const clear = clearRecords.get(key)?.row;
  const origin = originRecords.get(key)?.row;
  const actual = data.FINDEX.values[country.name];
  if (!clear || !origin || !actual || !sameMembers(Object.keys(actual), FINDEX_CODES)) {
    rawMismatches.push(`${country.name}: missing source row or Findex code`);
    continue;
  }
  for (const code of FINDEX_CODES) {
    rawCells++;
    const cleared = numberOrNull(clear[clearCol[code]]);
    const collected = numberOrNull(origin[originCol[code]]);
    if (!sameValue(cleared === null ? null : cleared * 100, actual[code])) rawMismatches.push(`${country.name} ${code}: clear ${cleared}, app ${actual[code]}`);
    if (collected === 0) expectedImputed[code].push(country.name);
    else if (collected !== null && cleared !== null && Math.abs(collected * 100 - cleared * 100) > 1e-6) {
      sourceDifferences.push({ country: country.name, code, collectedPercent: collected * 100, filledPercent: cleared * 100 });
    }
  }
}
check(`all ${rawCells} Findex percentages match the clear sheet's raw shares`, rawCells === data.COUNTRIES.length * FINDEX_CODES.length && rawMismatches.length === 0, rawMismatches.slice(0, 5).join("; "));
check("Findex percentages are finite numbers in 0-100 or explicit null", Object.values(data.FINDEX.values).every((values) => Object.values(values).every((value) => value === null || (finite(value) && value >= 0 && value <= 100))));
check("each imputation flag matches a zero observation in the origin sheet", sameMembers(Object.keys(data.FINDEX.imputed), FINDEX_CODES) && FINDEX_CODES.every((code) => Array.isArray(data.FINDEX.imputed[code]) && sameMembers(data.FINDEX.imputed[code], expectedImputed[code])));
check("imputed country union is exact", sameMembers(data.FINDEX_IMPUTED_COUNTRIES, [...new Set(Object.values(expectedImputed).flat())]));
const differencesMatch = (actual) => Array.isArray(actual) && actual.length === sourceDifferences.length
  && new Set(actual.map((difference) => `${difference.country}|${difference.code}`)).size === actual.length
  && actual.every((difference) => sourceDifferences.some((expected) => difference.country === expected.country && difference.code === expected.code
    && finite(difference.collectedPercent) && Math.abs(difference.collectedPercent - expected.collectedPercent) < 1e-6
    && finite(difference.filledPercent) && Math.abs(difference.filledPercent - expected.filledPercent) < 1e-6));
check("Findex origin/clear differences are declared exactly", differencesMatch(data.FINDEX.sourceDifferences));
const differenceIssues = data.dataQualityBy("findex-source-difference");
check("source-difference warnings identify every discrepancy accurately", differenceIssues.every((issue) => issue.severity === "warning") && differencesMatch(differenceIssues.flatMap((issue) => issue.detail?.differences || [])));
if (sourceDifferences.length) {
  console.log(`  source note: ${sourceDifferences.length} observed Findex input(s) differ between origin and clear; dashboard values follow clear and imputation flags follow origin`);
  for (const difference of sourceDifferences) console.log(`    ${difference.country} ${difference.code}: origin ${difference.collectedPercent.toFixed(6)}%, clear ${difference.filledPercent.toFixed(6)}%`);
}

section("Dashboard lookups and indicator structure");
check("every country has a mapped region", data.COUNTRIES.every((country) => country.region && country.region !== "Other"), data.COUNTRIES.filter((country) => !country.region || country.region === "Other").map((country) => country.name).join(", "));
check("every country has an ISO3 code", data.COUNTRIES.every((country) => typeof country.iso3 === "string" && /^[A-Z]{3}$/.test(country.iso3)));
const dashboard = readFileSync(resolve(ROOT, "oic_dashboard.jsx"), "utf8");
const coordBlock = dashboard.match(/const GEO_COORDS = \{([\s\S]*?)\n {2}\};/);
check("GEO_COORDS is present in oic_dashboard.jsx", Boolean(coordBlock));
if (coordBlock) {
  const coordNames = [...coordBlock[1].matchAll(/^\s*(?:"([^"]+)"|([\p{L}]+)):/gmu)].map((match) => match[1] || match[2]);
  check("map coordinates cover exactly the dataset countries", sameMembers(coordNames, data.COUNTRIES.map((country) => country.name)));
}
check("geography aliases resolve to the intended countries", Object.entries(data.GEO_NAME_MAP).every(([geo, name]) => data.findCountryByGeoName(geo)?.name === name));
const treeIndicators = Object.values(data.PILLAR_INDICATORS).flatMap((pillar) => pillar.indicators);
const treeSubs = treeIndicators.flatMap((indicator) => indicator.subIndicators || []);
check("indicator hierarchy counts match source codes", data.INDICATOR_COUNTS.pillars === 9 && treeIndicators.length === data.INDICATOR_COUNTS.indicators && treeSubs.length === data.INDICATOR_COUNTS.subIndicators && sameMembers([...data.PILLARS.map((pillar) => pillar.id), ...treeIndicators.map((indicator) => indicator.code), ...treeSubs.map((indicator) => indicator.code)], scoreCodes));
check("every pillar has indicators and every indicator has a readable label", data.PILLARS.every((pillar) => data.PILLAR_INDICATORS[pillar.key]?.indicators.length > 0) && [...treeIndicators, ...treeSubs].every((indicator) => typeof indicator.name === "string" && indicator.name.trim() && indicator.name !== indicator.code));

console.log(`\n${checks - failures}/${checks} checks passed${failures ? ` - ${failures} FAILED` : ""}`);
if (failures) process.exit(1);
