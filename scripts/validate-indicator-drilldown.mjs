/**
 * Validate the data shown by the interactive pillar drill-down.
 * Uses published dataset records directly; no source workbook or browser needed.
 * Run: node scripts/validate-indicator-drilldown.mjs
 */
import assert from "node:assert/strict";
import dataset from "../src/data/adei-dataset.json" with { type: "json" };
import {
  COUNTRIES, FINDEX, PANEL, PILLARS, REFERENCE_YEAR, YEARS, getCountryYear, labelFor,
} from "../src/data/index.js";
import { getPillarDrilldown } from "../src/lib/indicator-drilldown.js";

const finite = (value) => typeof value === "number" && Number.isFinite(value);
const sameMembers = (actual, expected, message) => {
  assert.deepEqual([...actual].sort(), [...expected].sort(), message);
};
const approximately = (actual, expected, message) => {
  if (expected === null) assert.equal(actual, null, message);
  else assert.ok(finite(actual) && Math.abs(actual - expected) < 1e-9, `${message}: expected ${expected}, got ${actual}`);
};
const rowsOf = (model) => model.groups.flatMap((group) => [group, ...group.subIndicators]);
const rowOf = (model, code) => rowsOf(model).find((row) => row.code === code);
const benchmark = (year, code) => {
  const values = PANEL[year].map((country) => country.scores[code]).filter(finite);
  return { count: values.length, average: values.length ? values.reduce((total, value) => total + value, 0) / values.length : null };
};
const sourceBefore = JSON.stringify({ dataset, COUNTRIES, PANEL, PILLARS, FINDEX });
const models = new Map();
let checks = 0;
function check(name, action) {
  action();
  checks++;
  console.log(`PASS ${name}`);
}
const modelKey = (country, pillar) => `${country.name}|${country.year}|${pillar.id}`;
const modelFor = (country, pillar) => models.get(modelKey(country, pillar));

check("all 57 countries expose all nine pillars and exactly the 53 detailed score codes", () => {
  assert.equal(COUNTRIES.length, 57);
  assert.equal(PILLARS.length, 9);
  const expectedCodes = dataset.indicators.filter(({ level }) => level !== "pillar").map(({ code }) => code);
  assert.equal(expectedCodes.length, 53);
  for (const country of COUNTRIES) {
    const actualCodes = [];
    for (const pillar of PILLARS) {
      const model = getPillarDrilldown(country, pillar.id);
      models.set(modelKey(country, pillar), model);
      assert.equal(model.country, country.name);
      assert.equal(model.year, REFERENCE_YEAR);
      assert.equal(model.pillar.id, pillar.id);
      assert.equal(model.pillar.name, pillar.name);
      actualCodes.push(...rowsOf(model).map(({ code }) => code));
    }
    assert.equal(new Set(actualCodes).size, actualCodes.length, country.name);
    sameMembers(actualCodes, expectedCodes, country.name);
  }
});

check("country scores, finite-only OIC means, deltas and sample counts match the published data", () => {
  for (const country of COUNTRIES) {
    for (const pillar of PILLARS) {
      const model = modelFor(country, pillar);
      const pillarBenchmark = benchmark(country.year, pillar.id);
      assert.equal(model.score, country.scores[pillar.id]);
      approximately(model.average, pillarBenchmark.average, `${country.name} pillar ${pillar.id} mean`);
      assert.equal(model.benchmarkCount, pillarBenchmark.count);
      approximately(model.delta, finite(model.score) && finite(model.average) ? model.score - model.average : null, `${country.name} pillar ${pillar.id} delta`);
      for (const row of rowsOf(model)) {
        const expected = benchmark(country.year, row.code);
        assert.equal(row.score, country.scores[row.code], `${country.name} ${row.code} score`);
        approximately(row.average, expected.average, `${country.name} ${row.code} mean`);
        assert.equal(row.benchmarkCount, expected.count, `${country.name} ${row.code} sample count`);
        approximately(row.delta, finite(row.score) && finite(row.average) ? row.score - row.average : null, `${country.name} ${row.code} delta`);
      }
    }
  }
});

check("every hierarchy preserves the workbook's parent relationships without duplicate or omitted rows", () => {
  for (const country of COUNTRIES) {
    for (const pillar of PILLARS) {
      const model = modelFor(country, pillar);
      const expectedGroups = dataset.indicators.filter((entry) => entry.pillar === pillar.id && entry.level === "indicator");
      const expectedSubs = dataset.indicators.filter((entry) => entry.pillar === pillar.id && entry.level === "subIndicator");
      assert.equal(model.indicatorCount, expectedGroups.length);
      assert.equal(model.subIndicatorCount, expectedSubs.length);
      sameMembers(model.groups.map(({ code }) => code), expectedGroups.map(({ code }) => code));
      for (const group of model.groups) {
        assert.equal(group.level, "indicator");
        const children = expectedSubs.filter(({ parent }) => parent === group.code);
        assert.equal(group.isAggregate, children.length > 0, group.code);
        sameMembers(group.subIndicators.map(({ code }) => code), children.map(({ code }) => code), group.code);
        for (const child of group.subIndicators) {
          assert.equal(child.level, "subIndicator");
          assert.equal(child.isAggregate, false);
          assert.deepEqual(child.subIndicators, []);
        }
      }
    }
  }
});

check("all indicator labels, source variables, provenance and coverage states are readable", () => {
  for (const model of models.values()) {
    assert.ok(Array.isArray(model.notes));
    assert.ok(model.notes.every((note) => typeof note === "string" && note.trim()));
    for (const row of rowsOf(model)) {
      const metadata = dataset.indicators.find(({ code }) => code === row.code);
      assert.equal(row.name, labelFor(row.code));
      assert.notEqual(row.name, row.code);
      assert.equal(row.sourceVariable, metadata.sourceVariable);
      assert.ok(typeof row.source?.label === "string" && row.source.label.trim(), row.code);
      assert.equal(typeof row.source.note, "string", row.code);
      assert.ok(typeof row.status?.label === "string" && row.status.label.trim(), row.code);
      assert.ok(typeof row.status.tone === "string" && row.status.tone.trim(), row.code);
      assert.ok(Array.isArray(row.notes) && row.notes.every((note) => typeof note === "string" && note.trim()), row.code);
    }
  }
});

check("raw Findex percentages use their own source field and appear only on Findex leaves", () => {
  let compared = 0;
  for (const model of models.values()) {
    for (const row of rowsOf(model)) {
      if (FINDEX.codes.includes(row.code)) {
        assert.equal(row.rawFindexPercent, FINDEX.values[model.country][row.code]);
        compared++;
      } else assert.equal(row.rawFindexPercent, null, row.code);
    }
  }
  assert.equal(compared, COUNTRIES.length * FINDEX.codes.length);
});

check("each 2025 imputation flag appears on the correct Findex leaf and its affected aggregate", () => {
  const pillar = PILLARS.find(({ id }) => id === "8");
  for (const country of COUNTRIES) {
    const model = modelFor(country, pillar);
    const imputedCodes = FINDEX.codes.filter((code) => FINDEX.imputed[code].includes(country.name));
    for (const code of FINDEX.codes) {
      const row = rowOf(model, code);
      assert.equal(/imput/i.test(row.status.label), imputedCodes.includes(code), `${country.name} ${code}`);
      if (imputedCodes.includes(code)) assert.match(row.notes.join(" "), /floor|imput/i, `${country.name} ${code}`);
    }
    assert.equal(/imput/i.test(rowOf(model, "8.1").status.label), imputedCodes.length > 0, `${country.name} 8.1 aggregate`);
    if (imputedCodes.length) assert.match(rowOf(model, "8.1").notes.join(" "), /floor|imput/i, country.name);
    assert.doesNotMatch(rowOf(model, "8.2").status.label, /imput/i);
  }
});

check("Türkiye's nonzero Findex source discrepancy is a source-review warning rather than an imputation", () => {
  const country = COUNTRIES.find(({ name }) => name === "Türkiye");
  const model = modelFor(country, PILLARS.find(({ id }) => id === "8"));
  const row = rowOf(model, "8.1.2");
  assert.doesNotMatch(row.status.label, /imput/i);
  assert.match(row.status.label, /source|review|differ/i);
  const notes = [...model.notes, ...row.notes].join(" ");
  assert.match(notes, /43\.7|43\.670713/);
  assert.match(notes, /0\.4|0\.444064/);
  assert.match(notes, /collect|origin/i);
  assert.match(notes, /fill|clear/i);
  assert.equal(row.score, country.scores["8.1.2"]);
  assert.equal(row.rawFindexPercent, FINDEX.values[country.name]["8.1.2"]);
});

check("the debit-or-credit label and credit-only source variable are disclosed together", () => {
  const model = modelFor(COUNTRIES[0], PILLARS.find(({ id }) => id === "8"));
  const row = rowOf(model, "8.1.2");
  assert.match(row.name, /debit or credit/i);
  assert.match(row.sourceVariable, /Owns a credit card/i);
  assert.match([...row.notes, row.source.note].join(" "), /debit/i);
  assert.match([...row.notes, row.source.note].join(" "), /credit/i);
});

check("published 2021-2024 records use their own scores and same-year finite-only benchmarks", () => {
  for (const year of YEARS.filter((value) => value !== REFERENCE_YEAR)) {
    for (const country of PANEL[year]) {
      for (const pillar of PILLARS) {
        const model = getPillarDrilldown(country, pillar.id);
        const expected = benchmark(year, pillar.id);
        assert.equal(model.country, country.name);
        assert.equal(model.year, year);
        assert.equal(model.score, country.scores[pillar.id]);
        approximately(model.average, expected.average, `${country.name} ${year} ${pillar.id}`);
        assert.equal(model.benchmarkCount, expected.count);
        for (const row of rowsOf(model)) {
          const expectedRow = benchmark(year, row.code);
          assert.equal(row.score, country.scores[row.code]);
          approximately(row.average, expectedRow.average, `${country.name} ${year} ${row.code}`);
          assert.equal(row.benchmarkCount, expectedRow.count);
          approximately(row.delta, finite(row.score) && finite(row.average) ? row.score - row.average : null, `${country.name} ${year} ${row.code} delta`);
          assert.equal(row.rawFindexPercent, null, `${country.name} ${year} ${row.code}: no 2025 raw data`);
          assert.doesNotMatch(row.status.label, /imput|source difference/i, `${country.name} ${year} ${row.code}: no 2025-only flag`);
        }
      }
    }
  }
});

check("Malaysia 2021 missing workforce values stay null and all-null indicators have no OIC mean", () => {
  const model = getPillarDrilldown(getCountryYear("Malaysia", 2021), "3");
  assert.equal(model.score, null);
  assert.equal(model.delta, null);
  assert.equal(model.benchmarkCount, 56);
  const education = rowOf(model, "3.1");
  assert.equal(education.score, null);
  assert.equal(education.delta, null);
  assert.equal(education.benchmarkCount, 56);
  assert.ok(finite(education.average));
  assert.match(education.status.label, /unavailable|missing|not available/i);
  assert.ok(education.notes.length > 0);
  for (const code of ["3.2", "3.3"]) {
    const row = rowOf(model, code);
    assert.equal(row.score, null);
    assert.equal(row.average, null);
    assert.equal(row.delta, null);
    assert.equal(row.benchmarkCount, 0);
    assert.match(row.status.label, /unavailable|missing|not available/i);
    assert.ok(row.notes.length > 0);
  }
});

check("published zero scores remain numeric zero with valid benchmark deltas", () => {
  let zeroCount = 0;
  for (const country of PANEL[2022]) {
    for (const pillar of PILLARS) {
      const zeroCodes = Object.keys(country.scores).filter((code) => code.startsWith(`${pillar.id}.`) && country.scores[code] === 0);
      if (!zeroCodes.length) continue;
      const model = getPillarDrilldown(country, pillar.id);
      for (const code of zeroCodes) {
        const row = rowOf(model, code);
        assert.equal(row.score, 0);
        assert.ok(finite(row.average));
        approximately(row.delta, -row.average, `${country.name} 2022 ${code} zero delta`);
        assert.doesNotMatch(row.status.label, /unavailable|missing|not available/i);
        zeroCount++;
      }
    }
  }
  assert.ok(zeroCount > 0, "published 2022 data must exercise zero scores");
});

check("invalid countries, missing records, unknown years and invalid pillar identifiers fail clearly", () => {
  for (const country of [undefined, null, {}, { ...COUNTRIES[0], name: "Unknown country" }, { ...COUNTRIES[0], year: 2099 }]) {
    assert.throws(() => getPillarDrilldown(country, "1"));
  }
  for (const pillar of [undefined, null, "", "0", "10", "1.1", "unknown"]) {
    assert.throws(() => getPillarDrilldown(COUNTRIES[0], pillar));
  }
  const country = COUNTRIES[0];
  assert.throws(() => getPillarDrilldown({ ...country, scores: { ...country.scores, "1.1.1": country.scores["1.1.1"] + 1 } }, "1"));
  assert.throws(() => getPillarDrilldown({ ...country, p1: country.p1 + 1 }, "1"));
});

check("drill-down calls leave the generated data, country panel and shared metadata unchanged", () => {
  assert.equal(JSON.stringify({ dataset, COUNTRIES, PANEL, PILLARS, FINDEX }), sourceBefore);
});

console.log(`\nAll ${checks} indicator drill-down checks passed (${COUNTRIES.length} countries, ${PILLARS.length} pillars, ${YEARS.length} years).`);
