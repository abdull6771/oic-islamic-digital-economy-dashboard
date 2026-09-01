/**
 * Validate the generated dataset against the workbook it came from.
 *
 *   npm run validate:data
 *   node scripts/validate-dataset.mjs <workbook.xlsx>
 *
 * This re-reads the Excel file independently of `build-dataset.mjs` - it walks
 * the `2025 ranked` sheet rather than `OIC_2024 norm` - so a mistake in the
 * build script's column mapping shows up as a mismatch rather than being
 * reproduced by both sides. It also checks the data layer the views actually
 * import, so a lookup the dashboard depends on (region, map coordinates,
 * ranking order) cannot quietly go missing.
 *
 * Exits non-zero on any failure, so it works as a pre-commit or CI gate.
 */
import XLSX from "xlsx";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import * as data from "../src/data/index.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_WORKBOOK = "New findex_Master_Data collection.xlsx";
const RANKED = "2025 ranked";
const TOLERANCE = 1e-4;

let failures = 0;
let checks = 0;

function check(name, ok, detail) {
  checks++;
  if (ok) return true;
  failures++;
  console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  return false;
}

function section(title) {
  console.log(`\n${title}`);
}

function grid(wb, sheet) {
  const ws = wb.Sheets[sheet];
  const range = XLSX.utils.decode_range(ws["!ref"]);
  range.s.c = 0;
  range.s.r = 0;
  return XLSX.utils.sheet_to_json(ws, {
    header: 1,
    raw: true,
    blankrows: true,
    defval: null,
    range,
  });
}

const workbook = process.argv[2] || DEFAULT_WORKBOOK;
const workbookPath = resolve(ROOT, workbook);
if (!existsSync(workbookPath)) {
  console.error(`Workbook not found: ${workbookPath}`);
  process.exit(1);
}

const wb = XLSX.readFile(workbookPath, { sheets: [RANKED], cellDates: false });
const rows = grid(wb, RANKED);
const codeRow = rows[3].map((v) => (v === null ? null : String(v).trim()));
const colOf = {};
codeRow.forEach((c, i) => {
  if (c) colOf[c] = i;
});

const alias = data.META.nameAliases || {};
const canonical = (n) => alias[n] || n;

// Every scored row of the reference-year sheet, keyed by canonical name.
const excel = {};
for (const row of rows.slice(7)) {
  const name = row[1] === null ? "" : canonical(String(row[1]).trim());
  if (!name || typeof row[colOf.ADEI] !== "number") continue;
  excel[name] = row;
}

console.log(`Validating ${data.META.source}`);
console.log(`  dataset built ${data.META.generatedAt}`);
console.log(
  `  cross-checking the app's data layer against sheet "${RANKED}" (the build reads "${data.META.sheets.panel}")`,
);

// ── 1. Country coverage ──────────────────────────────────────────────────────
section("Country coverage");
const excelNames = Object.keys(excel).sort();
const appNames = data.COUNTRIES.map((c) => c.name).sort();
check(
  "every country in the sheet is in the dashboard",
  excelNames.every((n) => appNames.includes(n)),
  excelNames.filter((n) => !appNames.includes(n)).join(", "),
);
check(
  "the dashboard shows no country the sheet does not have",
  appNames.every((n) => excelNames.includes(n)),
  appNames.filter((n) => !excelNames.includes(n)).join(", "),
);
check(
  `country count matches meta (${data.META.countryCount})`,
  appNames.length === data.META.countryCount &&
    excelNames.length === data.META.countryCount,
  `sheet ${excelNames.length}, app ${appNames.length}`,
);

// ── 2. Scores, pillar by pillar, country by country ──────────────────────────
section(`Scores for ${data.REFERENCE_YEAR}`);
let scoreMismatches = 0;
let comparedCells = 0;
for (const country of data.COUNTRIES) {
  const row = excel[country.name];
  if (!row) continue;
  for (const code of Object.keys(colOf)) {
    if (!/^\d+(\.\d+)*$/.test(code)) continue;
    const expected = row[colOf[code]];
    const actual = country.scores[code];
    if (typeof expected !== "number") {
      // The sheet has no numeric value here; the app must not invent one.
      if (actual !== null && actual !== undefined) {
        scoreMismatches++;
        if (scoreMismatches <= 5)
          console.error(
            `  FAIL  ${country.name} ${code}: sheet has ${JSON.stringify(expected)}, app has ${actual}`,
          );
      }
      continue;
    }
    comparedCells++;
    if (Math.abs(expected - actual) > TOLERANCE) {
      scoreMismatches++;
      if (scoreMismatches <= 5)
        console.error(
          `  FAIL  ${country.name} ${code}: sheet ${expected}, app ${actual}`,
        );
    }
  }
}
check(
  `all ${comparedCells} indicator values match the sheet`,
  scoreMismatches === 0,
  `${scoreMismatches} mismatch(es)`,
);

let adeiMismatches = 0;
for (const country of data.COUNTRIES) {
  const row = excel[country.name];
  if (!row) continue;
  if (Math.abs(row[colOf.ADEI] - country.adei) > TOLERANCE) {
    adeiMismatches++;
    console.error(
      `  FAIL  ${country.name} ADEI: sheet ${row[colOf.ADEI]}, app ${country.adei}`,
    );
  }
}
check("every ADEI score matches the sheet", adeiMismatches === 0);

// Pillar keys the views read (`c.p1` … `c.p9`) must equal the pillar columns.
let pillarKeyMismatches = 0;
for (const country of data.COUNTRIES) {
  const row = excel[country.name];
  if (!row) continue;
  for (const pillar of data.PILLARS) {
    if (Math.abs(row[colOf[pillar.id]] - country[pillar.key]) > TOLERANCE)
      pillarKeyMismatches++;
  }
}
check(
  "pillar shortcuts p1…p9 match their indicator columns",
  pillarKeyMismatches === 0,
  `${pillarKeyMismatches} mismatch(es)`,
);

// ── 3. Ranks and clusters ────────────────────────────────────────────────────
section("Ranks and clusters");
let rankMismatches = 0;
let clusterMismatches = 0;
for (const country of data.COUNTRIES) {
  const row = excel[country.name];
  if (!row) continue;
  if (row[colOf.Rank] !== country.rank) {
    rankMismatches++;
    console.error(
      `  FAIL  ${country.name}: sheet rank ${row[colOf.Rank]}, app rank ${country.rank}`,
    );
  }
  const sheetCluster = String(row[colOf.Clusters] ?? "").trim();
  if (sheetCluster && sheetCluster !== country.cluster) {
    clusterMismatches++;
    console.error(
      `  FAIL  ${country.name}: sheet cluster "${sheetCluster}", app "${country.cluster}"`,
    );
  }
}
check("ranks match the sheet", rankMismatches === 0);
check("clusters match the sheet", clusterMismatches === 0);
check(
  "ranks are a complete 1…N sequence",
  data.COUNTRIES.map((c) => c.rank)
    .sort((a, b) => a - b)
    .every((r, i) => r === i + 1),
);
check(
  "COUNTRIES is ordered by rank",
  data.COUNTRIES.every((c, i) => i === 0 || c.rank > data.COUNTRIES[i - 1].rank),
);
check(
  "getCluster agrees with the stored cluster for every country",
  data.COUNTRIES.every((c) => data.getCluster(c.adei).label === c.cluster),
);

// ── 4. Weights and aggregation ───────────────────────────────────────────────
section("Weights and aggregation");
const weightSum = data.PILLARS.reduce((s, p) => s + p.weight, 0);
check(`pillar weights sum to 100 (got ${weightSum})`, Math.abs(weightSum - 100) < 1e-9);
let worstAdei = 0;
for (const country of data.COUNTRIES) {
  const recomputed = data.PILLARS.reduce(
    (s, p) => s + (country[p.key] * p.weight) / 100,
    0,
  );
  worstAdei = Math.max(worstAdei, Math.abs(recomputed - country.adei));
}
check(
  `ADEI equals the weighted pillar sum (worst error ${worstAdei.toExponential(2)})`,
  worstAdei < 0.01,
);
check(
  `OIC_AVERAGE equals the mean of every country's ADEI`,
  Math.abs(
    data.OIC_AVERAGE -
      data.COUNTRIES.reduce((s, c) => s + c.adei, 0) / data.COUNTRIES.length,
  ) < 1e-9,
);

// ── 5. Trend series ──────────────────────────────────────────────────────────
section("Trend series");
check(
  "every country has a trend series of one point per year",
  data.COUNTRIES.every(
    (c) => data.TREND_DATA[c.name]?.length === data.YEARS.length,
  ),
);
check(
  "the last trend point equals the reference-year ADEI",
  data.COUNTRIES.every((c) => {
    const series = data.TREND_DATA[c.name];
    return Math.abs(series[series.length - 1] - c.adei) < TOLERANCE;
  }),
);
const avgSeries = data.TREND_DATA[data.OIC_AVERAGE_LABEL];
check(
  "the OIC average series exists and covers every year",
  Array.isArray(avgSeries) && avgSeries.length === data.YEARS.length,
);
check(
  "the OIC average for the reference year matches OIC_AVERAGE",
  Math.abs(avgSeries[avgSeries.length - 1] - data.OIC_AVERAGE) < 0.01,
);
check(
  "no trend point is NaN or undefined",
  Object.values(data.TREND_DATA)
    .flat()
    .every((v) => v === null || Number.isFinite(v)),
);

// ── 6. Lookups the views depend on ───────────────────────────────────────────
section("Dashboard lookups");
check(
  "every country has a region",
  data.COUNTRIES.every((c) => c.region && c.region !== "Other"),
  data.COUNTRIES.filter((c) => !c.region || c.region === "Other")
    .map((c) => c.name)
    .join(", "),
);
check(
  "every country has an ISO3 code",
  data.COUNTRIES.every((c) => c.iso3),
  data.COUNTRIES.filter((c) => !c.iso3)
    .map((c) => c.name)
    .join(", "),
);

// The world map keys off GEO_COORDS / GEO_NAME_MAP inside the dashboard file;
// read the coordinate table straight out of the source so drift is caught here.
const dashboard = readFileSync(resolve(ROOT, "oic_dashboard.jsx"), "utf8");
const coordBlock = dashboard.match(/const GEO_COORDS = \{([\s\S]*?)\n {2}\};/);
check("GEO_COORDS is present in oic_dashboard.jsx", Boolean(coordBlock));
if (coordBlock) {
  const coordNames = [
    ...coordBlock[1].matchAll(/^\s*(?:"([^"]+)"|([A-Za-zÀ-ÿ]+)):/gm),
  ].map((m) => m[1] || m[2]);
  check(
    "every country has map coordinates",
    data.COUNTRIES.every((c) => coordNames.includes(c.name)),
    data.COUNTRIES.filter((c) => !coordNames.includes(c.name))
      .map((c) => c.name)
      .join(", "),
  );
  check(
    "GEO_COORDS has no entry for a country that is not in the dataset",
    coordNames.every((n) => data.COUNTRIES.some((c) => c.name === n)),
    coordNames.filter((n) => !data.COUNTRIES.some((c) => c.name === n)).join(", "),
  );
}
check(
  "findCountryByGeoName resolves the aliased map names",
  Object.entries(data.GEO_NAME_MAP).every(
    ([geo, canonicalName]) =>
      data.findCountryByGeoName(geo)?.name === canonicalName,
  ),
  Object.entries(data.GEO_NAME_MAP)
    .filter(([geo, c]) => data.findCountryByGeoName(geo)?.name !== c)
    .map(([geo]) => geo)
    .join(", "),
);

// ── 7. Indicator structure ───────────────────────────────────────────────────
section("Indicator structure");
const treeIndicators = Object.values(data.PILLAR_INDICATORS).flatMap(
  (p) => p.indicators,
);
const treeSubs = treeIndicators.flatMap((i) => i.subIndicators || []);
check(
  `${data.INDICATOR_COUNTS.indicators} indicators in the tree`,
  treeIndicators.length === data.INDICATOR_COUNTS.indicators,
  `tree has ${treeIndicators.length}`,
);
check(
  `${data.INDICATOR_COUNTS.subIndicators} sub-indicators in the tree`,
  treeSubs.length === data.INDICATOR_COUNTS.subIndicators,
  `tree has ${treeSubs.length}`,
);
check(
  "every pillar in the tree has at least one indicator",
  data.PILLARS.every(
    (p) => data.PILLAR_INDICATORS[p.key].indicators.length > 0,
  ),
);
check(
  "every indicator and sub-indicator has a non-empty label",
  [...treeIndicators, ...treeSubs].every(
    (i) => typeof i.name === "string" && i.name.trim() && i.name !== i.code,
  ),
);
check(
  "every code in the tree exists as a column in the sheet",
  [...treeIndicators, ...treeSubs].every((i) => colOf[i.code] !== undefined),
  [...treeIndicators, ...treeSubs]
    .filter((i) => colOf[i.code] === undefined)
    .map((i) => i.code)
    .join(", "),
);

// ── 8. Missing data is carried, not invented ─────────────────────────────────
section("Missing data");
const nullCells = data.COUNTRIES.flatMap((c) =>
  Object.entries(c.scores).filter(([, v]) => v === null),
);
check(
  `reference year has no gaps (${nullCells.length} null cells)`,
  nullCells.length === 0,
  nullCells.map(([code]) => code).join(", "),
);
const historicNulls = data.YEARS.flatMap((y) =>
  (data.PANEL[y] || []).flatMap((c) =>
    Object.entries(c.scores)
      .filter(([, v]) => v === null)
      .map(([code]) => `${code}@${y}`),
  ),
);
const declaredNulls = new Set(
  data
    .dataQualityBy("not-available")
    .flatMap((i) => i.detail.years.map((y) => `${i.detail.code}@${y}`)),
);
check(
  "every gap in the panel is one the build step declared",
  historicNulls.every((k) => declaredNulls.has(k)),
  [...new Set(historicNulls.filter((k) => !declaredNulls.has(k)))].join(", "),
);
check(
  "no score is NaN",
  data.YEARS.every((y) =>
    (data.PANEL[y] || []).every((c) =>
      Object.values(c.scores).every((v) => v === null || Number.isFinite(v)),
    ),
  ),
);

// ── 9. Findex block ──────────────────────────────────────────────────────────
section("Findex source values");
check(
  "a raw Findex reading is present for every country",
  data.COUNTRIES.every((c) => data.FINDEX.values[c.name]),
  data.COUNTRIES.filter((c) => !data.FINDEX.values[c.name])
    .map((c) => c.name)
    .join(", "),
);
check(
  "Findex percentages are within 0–100",
  Object.values(data.FINDEX.values).every((v) =>
    Object.values(v).every((p) => p === null || (p >= 0 && p <= 100)),
  ),
);
check(
  "every imputed country is one of the dataset's countries",
  data.FINDEX_IMPUTED_COUNTRIES.every((n) =>
    data.COUNTRIES.some((c) => c.name === n),
  ),
);

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(
  `\n${checks - failures}/${checks} checks passed` +
    (failures ? ` — ${failures} FAILED` : ""),
);
if (failures) process.exit(1);
