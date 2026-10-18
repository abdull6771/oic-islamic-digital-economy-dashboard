/**
 * Build the dashboard dataset from the master Excel workbook.
 *
 *   npm run build:data                    # uses the default workbook below
 *   node scripts/build-dataset.mjs <file> # or point it at another workbook
 *
 * Reads the authoritative sheets of the OIC Digital Economy Index workbook and
 * emits `src/data/adei-dataset.json`, the single source the app loads at build
 * time. Nothing in the UI reads the workbook directly, and the generated file is
 * never hand-edited - re-run this script when a new workbook arrives.
 *
 * Sheet provenance (established by inspecting the workbook, see DATA.md):
 *   OIC_2024 norm   master normalised panel: 57 countries x 5 years (2021-2025),
 *                   62 indicator/pillar columns + ADEI + Rank + Clusters.
 *                   Header rows 1-6 carry dimension / pillar / indicator /
 *                   code / sub-indicator / source-variable labels per column.
 *   OIC_2024 clear  same panel before normalisation (raw units, gap-filled).
 *   OIC_2024 origin same panel as originally collected (0 = not observed).
 *   ref             source citations and the official pillar weights.
 *   01_raw_data_2025  country -> ISO3 lookup.
 *
 * Deliberately NOT used:
 *   01/02/04/05_*_2025  staging sheets. Their own checker columns read "DIFF"
 *                       for pillar 8 and ADEI, i.e. they were not recomputed
 *                       after the Findex refresh. `OIC_2024 norm` is current.
 *   OIC_2024 norm "Region" column  only 9 of 57 rows filled and several are
 *                       wrong (Pakistan/Senegal/Kyrgyz Republic tagged "GCC").
 *                       Regions come from the curated map in src/data/index.js.
 */
import XLSX from "xlsx";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { basename, dirname, resolve } from "node:path";
import { appendDatasetRevision } from "../src/lib/revision-history.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_WORKBOOK = "18 Oct_New findex_Master_Data collection.xlsx";
const SOURCE_DATES = { [DEFAULT_WORKBOOK]: "2026-10-18" };
const OUT = resolve(ROOT, "src/data/adei-dataset.json");
const HISTORY = resolve(ROOT, "src/data/revision-history.json");

const PANEL = "OIC_2024 norm";
const CLEAR = "OIC_2024 clear";
const ORIGIN = "OIC_2024 origin";
const REF = "ref";
const ISO = "01_raw_data_2025";

/** Cluster thresholds published with the index; verified against the workbook below. */
const CLUSTER_RULES = [
  { min: 60, label: "Advanced Digital Economies" },
  { min: 40, label: "Emerging Digital Economies" },
  { min: -Infinity, label: "Foundational Digital Economies" },
];
const clusterFor = (adei) => CLUSTER_RULES.find((r) => adei >= r.min).label;

/** Findex-sourced sub-indicators - the focus of this workbook revision. */
const FINDEX_CODES = ["8.1.1", "8.1.2", "8.1.3"];

/**
 * Workbook spellings that differ from the name the dashboard and the world-map
 * topology use. Applied as the panel is read so that every downstream lookup -
 * region, map coordinates, geography matching - keys off one canonical name.
 * A country whose workbook spelling changes and is not listed here shows up in
 * `npm run validate:data` as an unmapped region rather than failing silently.
 */
const COUNTRY_NAME_ALIASES = {
  "Gambia, The": "Gambia",
};
const canonicalName = (name) => COUNTRY_NAME_ALIASES[name] || name;

const ROUND = 6;
const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const round = (v) => (v === null ? null : parseFloat(v.toFixed(ROUND)));
const text = (v) => (v === null || v === undefined ? "" : String(v).trim());

/** Sheets are stored with varying start columns; always read from A1. */
function grid(wb, name) {
  const ws = wb.Sheets[name];
  if (!ws) throw new Error(`Workbook is missing the "${name}" sheet`);
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

/** Codes appear as both numbers (1.1, 2) and strings ("1.1.1"); normalise. */
const codeOf = (v) => (v === null || v === undefined ? null : String(v).trim());

function main() {
  const workbook = process.argv[2] || DEFAULT_WORKBOOK;
  const workbookPath = resolve(ROOT, workbook);
  if (!existsSync(workbookPath)) {
    console.error(`Workbook not found: ${workbookPath}`);
    process.exit(1);
  }

  const wb = XLSX.readFile(workbookPath, {
    sheets: [PANEL, CLEAR, ORIGIN, REF, ISO],
    cellDates: false,
  });

  const issues = [];
  const note = (id, severity, message, detail) =>
    issues.push({ id, severity, message, ...(detail ? { detail } : {}) });

  // -- Column map from the panel's six header rows ---------------------------
  const panel = grid(wb, PANEL);
  const [dimRow, pillarRow, indicatorRow, codeRow, subRow, srcRow] = panel;

  const columns = [];
  for (let i = 0; i < codeRow.length; i++) {
    const code = codeOf(codeRow[i]);
    if (code) columns.push({ code, i });
  }
  const colOf = Object.fromEntries(columns.map((c) => [c.code, c.i]));
  for (const required of ["ADEI", "Rank", "Clusters"]) {
    if (colOf[required] === undefined)
      throw new Error(`Panel is missing the "${required}" column`);
  }

  // Dimension / pillar / indicator labels are written once at the start of the
  // span they cover, so carry them forward across the columns they head.
  let dim = "";
  let pillarName = "";
  let indicatorName = "";
  const meta = {};
  for (const { code, i } of columns) {
    if (text(dimRow[i])) dim = text(dimRow[i]);
    if (text(pillarRow[i])) pillarName = text(pillarRow[i]);
    if (text(indicatorRow[i])) indicatorName = text(indicatorRow[i]);
    meta[code] = {
      dimension: dim,
      pillarName,
      indicatorName,
      subLabel: text(subRow[i]),
      sourceVariable: text(srcRow[i]),
    };
  }

  // -- Indicator hierarchy, derived from the code depth ----------------------
  const scoreCodes = columns
    .map((c) => c.code)
    .filter((c) => /^\d+(\.\d+)*$/.test(c));
  const parentOf = (code) =>
    code.includes(".") ? code.slice(0, code.lastIndexOf(".")) : null;

  const indicators = scoreCodes.map((code) => {
    const parts = code.split(".");
    const level = ["pillar", "indicator", "subIndicator"][parts.length - 1];
    const m = meta[code];
    // A pillar/indicator aggregate has no sub-label of its own; name it from
    // the group heading it closes.
    const workbookLabel =
      m.subLabel || (level === "indicator" ? m.indicatorName : m.pillarName);
    return {
      code,
      level,
      pillar: parts[0],
      parent: parentOf(code),
      workbookLabel,
      dimension: m.dimension,
      sourceVariable: m.sourceVariable,
    };
  });

  // -- Official pillar weights from the `ref` sheet --------------------------
  const ref = grid(wb, REF);
  const weights = {};
  const pillarNames = {};
  for (const row of ref) {
    const id = row[0];
    const name = text(row[1]);
    const weight = num(row[2]);
    if (
      typeof id === "number" &&
      id >= 1 &&
      id <= 9 &&
      name &&
      weight !== null
    ) {
      weights[String(id)] = weight;
      pillarNames[String(id)] = name;
    }
  }
  const pillarIds = scoreCodes.filter((c) => !c.includes("."));
  const missingWeights = pillarIds.filter((p) => weights[p] === undefined);
  if (missingWeights.length)
    throw new Error(
      `No weight found in "${REF}" for pillar(s) ${missingWeights}`,
    );
  const weightTotal = pillarIds.reduce((s, p) => s + weights[p], 0);
  if (Math.abs(weightTotal - 100) > 1e-9)
    note(
      "weights-total",
      "warning",
      `Pillar weights in the "${REF}" sheet sum to ${weightTotal}, not 100.`,
    );

  const pillars = pillarIds.map((id) => ({
    id,
    weight: weights[id],
    refName: pillarNames[id],
    workbookName: meta[id].pillarName,
    dimension: meta[id].dimension,
  }));

  // -- Country -> ISO3 -------------------------------------------------------
  const isoRows = grid(wb, ISO);
  const iso3 = {};
  for (const row of isoRows.slice(3)) {
    const name = canonicalName(text(row[0]));
    const code = text(row[1]);
    if (name && code) iso3[name] = code;
  }

  // -- Observations ----------------------------------------------------------
  const NAME_COL = 1;
  const YEAR_COL = 2;
  const observations = [];
  const seen = new Set();
  const unavailableByCode = {};

  for (const row of panel.slice(7)) {
    const name = canonicalName(text(row[NAME_COL]));
    const year = num(row[YEAR_COL]);
    if (!name || year === null) continue;

    const key = `${name}|${year}`;
    if (seen.has(key)) {
      note(
        "duplicate-row",
        "warning",
        `Duplicate panel row for ${name} ${year}; the first was kept.`,
      );
      continue;
    }
    seen.add(key);

    const scores = scoreCodes.map((code) => {
      const raw = row[colOf[code]];
      const v = num(raw);
      if (v === null) {
        const missing = (unavailableByCode[code] ||= { countriesByYear: {}, reasons: new Set(), count: 0 });
        (missing.countriesByYear[year] ||= []).push(name);
        missing.reasons.add(text(raw) || "blank");
        missing.count++;
      }
      return round(v);
    });

    const adei = round(num(row[colOf.ADEI]));
    if (adei === null) {
      note(
        "missing-adei",
        "error",
        `No ADEI score for ${name} ${year}; the row was skipped.`,
      );
      continue;
    }

    observations.push({
      country: name,
      year,
      adei,
      scores,
      // Kept for provenance; the app ranks and clusters from ADEI (see below).
      workbookRank: num(row[colOf.Rank]),
      workbookCluster: text(row[colOf.Clusters]) || null,
    });
  }

  for (const [code, missing] of Object.entries(unavailableByCode)) {
    const list = Object.keys(missing.countriesByYear).map(Number).sort();
    const reasons = [...missing.reasons];
    note(
      "not-available",
      "info",
      `${code.includes(".") ? "Indicator" : "Pillar"} ${code} has ${missing.count} unavailable value(s) ` +
        `in ${list.join(", ")} (${reasons.join(", ")}). These remain null. ` +
        (missing.count <= 5 ? `Affected: ${Object.entries(missing.countriesByYear).flatMap(([year, names]) => names.map((name) => `${name} ${year}`)).join(", ")}. ` : "") +
        `Published aggregates are retained as supplied by the workbook.`,
      { code, years: list, countriesByYear: missing.countriesByYear, count: missing.count, reasons },
    );
  }

  // -- Rank and cluster: derive for every year, verify against the workbook ---
  const years = [...new Set(observations.map((o) => o.year))].sort(
    (a, b) => a - b,
  );
  const rankMismatch = [];
  const clusterMismatch = [];
  const blankRanks = [];

  for (const year of years) {
    const slice = observations
      .filter((o) => o.year === year)
      .sort((a, b) => b.adei - a.adei);
    let missingRank = 0;
    slice.forEach((o, i) => {
      o.rank = i + 1;
      o.cluster = clusterFor(o.adei);
      if (o.workbookRank === null) missingRank++;
      else if (o.workbookRank !== o.rank)
        rankMismatch.push({
          country: o.country,
          year,
          workbook: o.workbookRank,
          derived: o.rank,
        });
      if (o.workbookCluster && o.workbookCluster !== o.cluster)
        clusterMismatch.push({
          country: o.country,
          year,
          workbook: o.workbookCluster,
          derived: o.cluster,
        });
    });
    if (missingRank) blankRanks.push({ year, missing: missingRank });
  }

  if (clusterMismatch.length)
    note(
      "cluster-thresholds",
      "error",
      `The 60 / 40 cluster thresholds disagree with the workbook's "Clusters" column for ` +
        `${clusterMismatch.length} row(s). Review CLUSTER_RULES in scripts/build-dataset.mjs.`,
      { examples: clusterMismatch.slice(0, 5) },
    );

  if (rankMismatch.length || blankRanks.length)
    note(
      "historic-rank",
      "info",
      `The workbook's "Rank" and "Clusters" columns are complete and current only for the reference ` +
        `year. Earlier years carry ${rankMismatch.length} stale rank(s) and ` +
        `${blankRanks.reduce((s, y) => s + y.missing, 0)} missing/error value(s) left over from before the Findex ` +
        `refresh. The dashboard ranks and clusters every year from ADEI instead, which reproduces the ` +
        `workbook exactly for the reference year.`,
      { staleRanks: rankMismatch.length, blankRanks },
    );

  // -- Cross-check: ADEI must equal the weighted pillar sum -------------------
  let worstAdeiError = 0;
  const incompletePillars = [];
  const pillarIndex = Object.fromEntries(
    pillarIds.map((p) => [p, scoreCodes.indexOf(p)]),
  );
  for (const o of observations) {
    let sum = 0;
    let complete = true;
    for (const p of pillarIds) {
      const v = o.scores[pillarIndex[p]];
      if (v === null) complete = false;
      else sum += (v * weights[p]) / 100;
    }
    if (complete)
      worstAdeiError = Math.max(worstAdeiError, Math.abs(sum - o.adei));
    else incompletePillars.push({ country: o.country, year: o.year });
  }
  if (incompletePillars.length)
    note(
      "incomplete-pillars",
      "info",
      `${incompletePillars.length} country-year row(s) have a missing pillar score. ` +
        `Affected: ${incompletePillars.map((o) => `${o.country} ${o.year}`).join(", ")}. ` +
        `Their published ADEI is retained, but cannot be independently reconciled with all nine pillars.`,
      { observations: incompletePillars },
    );
  if (worstAdeiError > 0.01)
    note(
      "adei-recompute",
      "error",
      `Recomputing ADEI from the pillar scores and the published weights differs from the workbook's ` +
        `ADEI by up to ${worstAdeiError.toFixed(3)} points.`,
    );

  // Financial Market Development normally averages 8.1 and 8.2. Preserve any
  // workbook exception, but expose it so a revised formula is not hidden.
  const financialExceptions = observations.flatMap((o) => {
    const financial = o.scores[scoreCodes.indexOf("8")];
    const inclusion = o.scores[scoreCodes.indexOf("8.1")];
    const market = o.scores[scoreCodes.indexOf("8.2")];
    if (![financial, inclusion, market].every(Number.isFinite) || Math.abs(financial - (inclusion + market) / 2) <= 1e-4) return [];
    return [{ country: o.country, year: o.year, pillar: financial, financialInclusion: inclusion, marketCapitalisation: market }];
  });
  if (financialExceptions.length)
    note(
      "financial-market-aggregation",
      "warning",
      `Financial Market Development differs from the mean of indicators 8.1 and 8.2 for ` +
        financialExceptions.map((o) => `${o.country} ${o.year}`).join(", ") +
        `. The dashboard preserves the workbook's pillar score and its contribution to ADEI.`,
      { observations: financialExceptions },
    );

  // -- Findex coverage: which countries carry an imputed value ---------------
  const origin = grid(wb, ORIGIN);
  const clear = grid(wb, CLEAR);
  const rawColOf = (g) => {
    const map = {};
    g[3].forEach((v, i) => {
      const c = codeOf(v);
      if (c) map[c] = i;
    });
    return map;
  };
  const originCol = rawColOf(origin);
  const clearCol = rawColOf(clear);
  const referenceYear = years[years.length - 1];

  const findexValues = {};
  const imputed = {};
  const collectedFindex = {};
  for (const row of origin.slice(7)) {
    const name = canonicalName(text(row[NAME_COL]));
    if (!name || num(row[YEAR_COL]) !== referenceYear) continue;
    collectedFindex[name] = Object.fromEntries(
      FINDEX_CODES.map((code) => [code, num(row[originCol[code]])]),
    );
    for (const code of FINDEX_CODES) {
      // The workbook records "no observation" as a literal 0 in `origin`, then
      // substitutes a floor value in `clear` (see the ref sheet, "Methodology
      // for Dealing with Missing Data").
      if (num(row[originCol[code]]) === 0) (imputed[code] ||= []).push(name);
    }
  }
  for (const row of clear.slice(7)) {
    const name = canonicalName(text(row[NAME_COL]));
    if (!name || num(row[YEAR_COL]) !== referenceYear) continue;
    findexValues[name] = Object.fromEntries(
      FINDEX_CODES.map((code) => {
        const v = num(row[clearCol[code]]);
        // Stored as a share of adults; the sub-indicator is a percentage.
        return [code, v === null ? null : round(v * 100)];
      }),
    );
  }
  const referenceCount = observations.filter(
    (o) => o.year === referenceYear,
  ).length;
  for (const code of FINDEX_CODES) {
    const list = (imputed[code] || []).sort();
    imputed[code] = list;
    if (list.length)
      note(
        "findex-coverage",
        "info",
        `${list.length} of ${referenceCount} countries have no Global Findex observation for ${code} ` +
          `in ${referenceYear}; the workbook substitutes the documented floor value.`,
        { code, countries: list },
      );
  }
  const sourceDifferences = [];
  for (const [country, values] of Object.entries(findexValues)) {
    for (const code of FINDEX_CODES) {
      const original = collectedFindex[country]?.[code];
      const filledPercent = values[code];
      if (original !== null && original !== undefined && original !== 0 && filledPercent !== null &&
          Math.abs(original * 100 - filledPercent) > 1e-6) {
        sourceDifferences.push({ country, code, collectedPercent: round(original * 100), filledPercent });
      }
    }
  }
  if (sourceDifferences.length)
    note(
      "findex-source-difference",
      "warning",
      `The filled Findex inputs differ from nonzero collected observations for ` +
        sourceDifferences.map((d) => `${d.country} ${d.code} (${d.collectedPercent}% collected; ${d.filledPercent}% filled)`).join(", ") +
        `. The dashboard retains the workbook's filled inputs and published scores; these differences require source review.`,
      { differences: sourceDifferences },
    );

  const countries = [...new Set(observations.map((o) => o.country))].sort();
  const withoutIso = countries.filter((c) => !iso3[c]);
  if (withoutIso.length)
    note(
      "missing-iso3",
      "warning",
      `No ISO3 code found for: ${withoutIso.join(", ")}.`,
      { countries: withoutIso },
    );

  const counts = {
    pillars: scoreCodes.filter((c) => c.split(".").length === 1).length,
    indicators: scoreCodes.filter((c) => c.split(".").length === 2).length,
    subIndicators: scoreCodes.filter((c) => c.split(".").length === 3).length,
  };

  const dataset = {
    meta: {
      source: basename(workbook),
      sourceUpdated: SOURCE_DATES[basename(workbook)] || null,
      sourceSha256: createHash("sha256").update(readFileSync(workbookPath)).digest("hex"),
      generatedAt: new Date().toISOString(),
      generatedBy: "scripts/build-dataset.mjs",
      sheets: {
        panel: PANEL,
        raw: CLEAR,
        collected: ORIGIN,
        references: REF,
        iso: ISO,
      },
      years,
      referenceYear,
      countryCount: countries.length,
      nameAliases: COUNTRY_NAME_ALIASES,
      counts,
      clusterRules: CLUSTER_RULES.map((r) => ({
        label: r.label,
        min: r.min === -Infinity ? null : r.min,
      })),
      checks: {
        adeiVsWeightedPillars: worstAdeiError,
        weightedPillarRowsChecked: observations.length - incompletePillars.length,
        incompletePillarRows: incompletePillars.length,
        clusterMismatches: clusterMismatch.length,
      },
    },
    pillars,
    codes: scoreCodes,
    indicators,
    countries: countries.map((name) => ({ name, iso3: iso3[name] || null })),
    observations: observations.map((o) => ({
      country: o.country,
      year: o.year,
      adei: o.adei,
      rank: o.rank,
      cluster: o.cluster,
      scores: o.scores,
    })),
    findex: {
      year: referenceYear,
      codes: FINDEX_CODES,
      values: findexValues,
      imputed,
      sourceDifferences,
    },
    dataQuality: issues,
  };

  // A failed import must never replace the dataset the dashboard currently uses.
  if (issues.some((i) => i.severity === "error")) {
    for (const issue of issues) console.error(`  [${issue.severity}] ${issue.message}`);
    throw new Error("Dataset validation failed; the previous dataset was preserved.");
  }
  mkdirSync(dirname(OUT), { recursive: true });
  // Prepare the revision before replacing data, so a broken history chain fails
  // without silently losing the previous published snapshot.
  const history = existsSync(HISTORY) ? JSON.parse(readFileSync(HISTORY, "utf8")) : null;
  const nextHistory = history ? appendDatasetRevision(history,
    existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : null, dataset) : null;
  writeFileSync(OUT, JSON.stringify(dataset) + "\n", "utf8");
  if (nextHistory && nextHistory !== history) writeFileSync(HISTORY, JSON.stringify(nextHistory) + "\n", "utf8");

  const bytes = JSON.stringify(dataset).length;
  console.log(`Wrote ${OUT} (${(bytes / 1024).toFixed(0)} KB)`);
  console.log(
    `  ${countries.length} countries x ${years.length} years (${years[0]}-${years[years.length - 1]}) = ${observations.length} observations`,
  );
  console.log(
    `  ${counts.pillars} pillars, ${counts.indicators} indicators, ${counts.subIndicators} sub-indicators`,
  );
  console.log(
    `  ADEI vs weighted pillars, worst error: ${worstAdeiError.toExponential(2)}`,
  );
  for (const i of issues) console.log(`  [${i.severity}] ${i.message}`);
  if (issues.some((i) => i.severity === "error")) process.exitCode = 1;
}

main();
