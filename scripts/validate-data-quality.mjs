/** Validate provenance, missingness, filters and exports without a source workbook. */
import assert from "node:assert/strict";
import {
  COUNTRIES, FINDEX, INDICATOR_METADATA, PANEL, PILLARS, REFERENCE_YEAR, YEARS,
} from "../src/data/index.js";
import {
  QUALITY_STATUSES, dataQualityCsv, filterDataQualityRows, getDataQualityRows, summarizeDataQuality,
} from "../src/lib/data-quality.js";

const before = JSON.stringify({ PANEL, FINDEX, INDICATOR_METADATA });
const codes = Object.values(INDICATOR_METADATA).filter((indicator) => indicator.level !== "pillar").map((indicator) => indicator.code);
let checks = 0;
function check(name, action) {
  action();
  console.log(`PASS ${name}`);
  checks++;
}
const latest = getDataQualityRows(REFERENCE_YEAR);

check("every year exposes all 53 detailed values for all 57 countries without duplicates", () => {
  assert.equal(codes.length, 53);
  assert.equal(COUNTRIES.length, 57);
  for (const year of YEARS) {
    const rows = getDataQualityRows(year);
    assert.equal(rows.length, PANEL[year].length * codes.length);
    assert.equal(new Set(rows.map((row) => row.id)).size, rows.length);
    for (const country of PANEL[year]) {
      const countryRows = rows.filter((row) => row.country === country.name);
      assert.deepEqual(countryRows.map((row) => row.code).sort(), [...codes].sort());
      for (const row of countryRows) {
        assert.equal(row.score, Number.isFinite(country.scores[row.code]) ? country.scores[row.code] : null);
        assert.equal(row.year, year);
        assert.equal(row.iso3, country.iso3);
        assert.equal(row.region, country.region);
        assert.equal(row.pillarId, INDICATOR_METADATA[row.code].pillar);
      }
    }
  }
});

check("all missing detailed values remain unavailable and numeric zeros are retained", () => {
  let missing = 0;
  let zeros = 0;
  for (const year of YEARS) {
    for (const row of getDataQualityRows(year)) {
      if (row.score === null) {
        missing++;
        assert.equal(row.statusKey, "unavailable");
      } else {
        assert.notEqual(row.statusKey, "unavailable");
        if (row.score === 0) zeros++;
      }
    }
  }
  assert.equal(missing, 115);
  assert.ok(zeros > 100);
  const workforce2022 = getDataQualityRows(2022).filter((row) => ["3.2", "3.3"].includes(row.code));
  assert.equal(workforce2022.length, 114);
  assert.ok(workforce2022.every((row) => row.score === 0 && row.statusKey === "unclassified"));
  assert.ok(workforce2022.every((row) => /not verified observed zeros/.test(row.source.note)));
});

check("only verified reference-year Findex inputs receive observed or imputed classifications", () => {
  for (const year of YEARS) {
    for (const row of getDataQualityRows(year)) {
      if (["observed", "imputed", "discrepancy"].includes(row.statusKey)) {
        assert.equal(year, FINDEX.year);
        assert.ok(FINDEX.codes.includes(row.code));
        assert.equal(row.isAggregate, false);
      }
      if (year !== FINDEX.year && row.score !== null) assert.equal(row.statusKey, "unclassified");
      if (year === FINDEX.year && !FINDEX.codes.includes(row.code) && row.score !== null) assert.equal(row.statusKey, "unclassified");
    }
  }
});

check("each documented imputation is attached to the correct country and Findex leaf", () => {
  let imputations = 0;
  for (const country of COUNTRIES) {
    for (const code of FINDEX.codes) {
      const row = latest.find((item) => item.country === country.name && item.code === code);
      const imputed = FINDEX.imputed[code].includes(country.name);
      assert.equal(row.statusKey === "imputed", imputed, `${country.name} ${code}`);
      if (imputed) {
        imputations++;
        assert.equal(row.collectedPercent, null);
        assert.match(row.notes.join(" "), /floor value/);
      }
    }
  }
  assert.equal(imputations, 48);
});

check("Türkiye's collected-versus-filled discrepancy remains separate from imputation", () => {
  for (const difference of FINDEX.sourceDifferences) {
    const row = latest.find((item) => item.country === difference.country && item.code === difference.code);
    assert.equal(row.statusKey, "discrepancy");
    assert.equal(row.collectedPercent, difference.collectedPercent);
    assert.equal(row.inputPercent, difference.filledPercent);
    assert.notEqual(row.collectedPercent, row.inputPercent);
    assert.match(row.notes.join(" "), /retains the published score/);
  }
  assert.equal(latest.filter((row) => row.statusKey === "discrepancy").length, FINDEX.sourceDifferences.length);
});

check("Findex source percentages occupy a separate field and never leak into historical years", () => {
  for (const year of YEARS) {
    for (const row of getDataQualityRows(year)) {
      if (year === FINDEX.year && FINDEX.codes.includes(row.code)) {
        assert.equal(row.inputPercent, FINDEX.values[row.country][row.code]);
        if (row.statusKey === "observed") assert.equal(row.collectedPercent, row.inputPercent);
      } else {
        assert.equal(row.inputPercent, null);
        assert.equal(row.collectedPercent, null);
      }
    }
  }
});

check("aggregates, source families, wording discrepancies and historical caveats are disclosed", () => {
  for (const row of latest) {
    assert.ok(row.source.label && row.source.note && row.name);
    assert.ok(row.notes.length);
    const hasChildren = Object.values(INDICATOR_METADATA).some((indicator) => indicator.parent === row.code);
    assert.equal(row.isAggregate, hasChildren);
    if (hasChildren) assert.match(row.notes.join(" "), /not an additional independent/);
  }
  assert.match(latest.find((row) => row.code === "8.1.2").source.note, /Owns a credit card/);
  assert.ok(getDataQualityRows(2024).filter((row) => FINDEX.codes.includes(row.code)).every((row) => /not applied to this historical year/.test(row.notes.join(" "))));
});

check("search supports country, diacritics, indicator codes, multiple words and source families", () => {
  assert.equal(filterDataQualityRows(latest, { search: "turkiye 8.1.2" }).length, 1);
  assert.equal(filterDataQualityRows(latest, { search: "MYS 5.2" }).length, 1);
  assert.equal(filterDataQualityRows(latest, { search: "made digital payment" }).length, COUNTRIES.length);
  assert.ok(filterDataQualityRows(latest, { search: "OECD" }).every((row) => row.code === "6.3"));
  assert.equal(filterDataQualityRows(latest, { search: "not-an-indicator-country" }).length, 0);
});

check("country, region, pillar and status filters compose and summaries reconcile", () => {
  const sample = COUNTRIES[0];
  assert.equal(filterDataQualityRows(latest, { country: sample.name }).length, codes.length);
  assert.ok(filterDataQualityRows(latest, { region: sample.region }).every((row) => row.region === sample.region));
  for (const pillar of PILLARS) {
    const rows = filterDataQualityRows(latest, { pillar: pillar.key });
    assert.ok(rows.length > 0);
    assert.ok(rows.every((row) => row.pillarId === pillar.id));
  }
  for (const { key } of QUALITY_STATUSES) assert.ok(filterDataQualityRows(latest, { status: key }).every((row) => row.statusKey === key));
  const filtered = filterDataQualityRows(latest, { country: sample.name, region: sample.region, pillar: "8", search: "Findex", status: "observed" });
  assert.ok(filtered.length > 0 && filtered.length <= 3);
  const summary = summarizeDataQuality(latest);
  assert.equal(summary.total, latest.length);
  assert.equal(Object.values(summary.counts).reduce((total, count) => total + count, 0), latest.length);
  assert.equal(summary.available, latest.filter((row) => row.score !== null).length);
  assert.equal(summary.counts.observed, 122);
  assert.equal(summary.counts.imputed, 48);
  assert.equal(summary.counts.discrepancy, 1);
});

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"' && quoted && text[i + 1] === '"') { cell += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(cell); cell = ""; }
    else if (char === "\r" && text[i + 1] === "\n" && !quoted) { row.push(cell); rows.push(row); row = []; cell = ""; i++; }
    else cell += char;
  }
  row.push(cell);
  rows.push(row);
  return rows;
}

check("CSV exports precisely the filtered rows with independent score, status, source input and notes", () => {
  const selected = filterDataQualityRows(latest, { search: "turkiye 8.1.2" });
  const parsed = parseCsv(dataQualityCsv(selected));
  assert.equal(parsed.length, selected.length + 1);
  const [header, values] = parsed;
  assert.equal(header.length, 15);
  assert.equal(values.length, header.length);
  assert.equal(values[1], selected[0].country);
  assert.equal(values[8], String(selected[0].score));
  assert.equal(values[9], "Source discrepancy");
  assert.equal(values[10], String(selected[0].inputPercent));
  assert.equal(values[11], String(selected[0].collectedPercent));
  assert.ok(values[14].includes(selected[0].source.note));
  const missing = getDataQualityRows(2021).find((row) => row.score === null);
  assert.equal(parseCsv(dataQualityCsv([missing]))[1][8], "");
  const zero = getDataQualityRows(2022).find((row) => row.score === 0);
  assert.equal(parseCsv(dataQualityCsv([zero]))[1][8], "0");
  assert.equal(parseCsv(dataQualityCsv([])).length, 1);
  const escaped = { ...selected[0], country: '=WEBSERVICE("https://example.test")', name: 'a "quoted",\r\nindicator' };
  const escapedValues = parseCsv(dataQualityCsv([escaped]))[1];
  assert.equal(escapedValues[1], `'${escaped.country}`);
  assert.equal(escapedValues[6], escaped.name);
});

check("unknown years are rejected, cached rows are immutable, and published data stays unchanged", () => {
  assert.throws(() => getDataQualityRows(1900), /available assessment year/);
  assert.throws(() => getDataQualityRows("invalid"), /available assessment year/);
  assert.equal(getDataQualityRows(String(REFERENCE_YEAR)), latest);
  assert.ok(Object.isFrozen(latest) && Object.isFrozen(latest[0]));
  assert.equal(JSON.stringify({ PANEL, FINDEX, INDICATOR_METADATA }), before);
});

console.log(`Validated data-quality explorer: ${checks} checks across ${YEARS.length} years.`);
