/** Validate hypothetical score/ranking changes without changing source records. */
import assert from "node:assert/strict";
import { COUNTRIES, PILLARS, REFERENCE_YEAR, getCluster } from "../src/data/index.js";
import { getWhatIfBaseline, simulatePillarImprovements, WHAT_IF_TIE_TOLERANCE } from "../src/lib/what-if.js";

const before = JSON.stringify({ COUNTRIES, PILLARS });
const close = (actual, expected, message, tolerance = 1e-10) => assert.ok(
  Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance,
  `${message}: expected ${expected}, got ${actual}`,
);
let checks = 0;
function check(name, action) {
  action();
  checks++;
  console.log(`PASS ${name}`);
}

check("all 57 unchanged scenarios reproduce exact published scores, ranks and classifications", () => {
  assert.equal(COUNTRIES.length, 57);
  for (const country of COUNTRIES) {
    const result = simulatePillarImprovements(country);
    assert.equal(result.country.year, REFERENCE_YEAR);
    assert.equal(result.baseline.score, country.adei);
    assert.equal(result.baseline.rank, country.rank);
    assert.equal(result.simulated.score, country.adei);
    assert.equal(result.simulated.rank, country.rank);
    assert.equal(result.simulated.cluster, country.cluster);
    assert.equal(result.scoreGain, 0);
    assert.equal(result.rankGain, 0);
    assert.equal(result.changedPillars, 0);
    assert.deepEqual(result.tiedCountries, []);
    assert.deepEqual(result.pillars.map(({ target }) => target), PILLARS.map(({ key }) => country[key]));
  }
});

check("each pillar's official weight controls its marginal score effect for every country", () => {
  for (const country of COUNTRIES) {
    for (const pillar of PILLARS) {
      const improvement = Math.min(1, 100 - country[pillar.key]);
      const result = simulatePillarImprovements(country.name, { [pillar.key]: country[pillar.key] + improvement });
      close(result.scoreGain, improvement * pillar.weight / 100, `${country.name} ${pillar.key} gain`);
      close(result.simulated.score, country.adei + improvement * pillar.weight / 100, `${country.name} ${pillar.key} score`);
      assert.equal(result.changedPillars, improvement > 0 ? 1 : 0);
      assert.ok(result.simulated.rank <= country.rank, `${country.name} cannot lose rank after improving`);
      assert.equal(result.simulated.rank, 1 + COUNTRIES.filter((entry) => entry.name !== country.name && entry.adei > result.simulated.score + WHAT_IF_TIE_TOLERANCE).length);
    }
  }
});

check("multiple pillar improvements add at full stored precision", () => {
  const country = COUNTRIES[20];
  const targets = Object.fromEntries(PILLARS.map((pillar, i) => [pillar.key, country[pillar.key] + (100 - country[pillar.key]) * ((i + 1) / 10)]));
  const result = simulatePillarImprovements(country, targets);
  const expectedGain = PILLARS.reduce((sum, { key, weight }) => sum + (targets[key] - country[key]) * weight / 100, 0);
  assert.equal(result.scoreGain, expectedGain);
  assert.equal(result.simulated.score, country.adei + expectedGain);
  assert.equal(result.changedPillars, 9);
  assert.equal(result.simulated.cluster, getCluster(result.simulated.score).label);
  assert.equal(result.pillars.reduce((sum, { weight }) => sum + weight, 0), 100);
});

check("all-100 targets reach first place while retaining only the published rounding residual", () => {
  const targets = Object.fromEntries(PILLARS.map(({ key }) => [key, 100]));
  for (const country of COUNTRIES) {
    const result = simulatePillarImprovements(country, targets);
    assert.equal(result.simulated.rank, 1);
    assert.equal(result.simulated.cluster, "Advanced Digital Economies");
    assert.ok(result.simulated.score >= 100 - 1e-6 && result.simulated.score <= 100 + 1e-6, country.name);
    close(result.simulated.score, 100 + result.roundingResidual, `${country.name} endpoint residual`);
    for (const pillar of result.pillars) assert.equal(pillar.target, 100);
  }
});

const country = COUNTRIES[1];
const leader = COUNTRIES[0];
const tiePillar = PILLARS.find(({ key, weight }) => country[key] + (leader.adei - country.adei) * 100 / weight <= 100);
assert.ok(tiePillar, "An attainable exact tie fixture must exist.");
const targetForScore = (score) => ({ [tiePillar.key]: country[tiePillar.key] + (score - country.adei) * 100 / tiePillar.weight });

check("equal scores share a competition rank without counting the selected country twice", () => {
  const result = simulatePillarImprovements(country, targetForScore(leader.adei));
  assert.equal(result.simulated.rank, 1);
  assert.deepEqual(result.tiedCountries, [leader.name]);
  assert.equal(result.ranking.length, COUNTRIES.length);
  assert.equal(new Set(result.ranking.map(({ name }) => name)).size, COUNTRIES.length);
  assert.equal(result.ranking.filter(({ simulated }) => simulated).length, 1);
  assert.deepEqual(result.ranking.slice(0, 3).map(({ rank }) => rank), [1, 1, 3]);
});

check("tie tolerance distinguishes numerical noise from a genuinely lower score", () => {
  const justInside = simulatePillarImprovements(country, targetForScore(leader.adei - WHAT_IF_TIE_TOLERANCE / 2));
  assert.equal(justInside.simulated.rank, 1);
  assert.deepEqual(justInside.tiedCountries, [leader.name]);
  const outside = simulatePillarImprovements(country, targetForScore(leader.adei - WHAT_IF_TIE_TOLERANCE * 4));
  assert.equal(outside.simulated.rank, 2);
  assert.deepEqual(outside.tiedCountries, []);
});

check("nearby ranks and all competitor scores reflect the same immutable scenario", () => {
  for (const country of [COUNTRIES[0], COUNTRIES[26], COUNTRIES.at(-1)]) {
    const result = simulatePillarImprovements(country, { p1: Math.min(100, country.p1 + 10) });
    assert.ok(result.neighbors.length >= 3 && result.neighbors.length <= 5);
    assert.ok(result.neighbors.some(({ simulated }) => simulated));
    for (const entry of result.ranking) {
      if (entry.simulated) assert.equal(entry.score, result.simulated.score);
      else {
        const published = COUNTRIES.find(({ name }) => name === entry.name);
        assert.equal(entry.score, published.adei);
        assert.equal(entry.publishedRank, published.rank);
      }
    }
  }
});

check("classification updates when a hypothetical score crosses an official threshold", () => {
  for (const threshold of [40, 60]) {
    const candidate = COUNTRIES.find((entry) => entry.adei < threshold && entry.adei > threshold - 5);
    const pillar = PILLARS.find(({ key, weight }) => candidate[key] + (threshold + 0.01 - candidate.adei) * 100 / weight <= 100);
    assert.ok(pillar);
    const result = simulatePillarImprovements(candidate, { [pillar.key]: candidate[pillar.key] + (threshold + 0.01 - candidate.adei) * 100 / pillar.weight });
    assert.notEqual(result.simulated.cluster, result.baseline.cluster);
    assert.equal(result.simulated.cluster, getCluster(threshold + 0.01).label);
  }
});

check("invalid, unavailable, decreasing and out-of-range targets are rejected", () => {
  const valid = COUNTRIES[0];
  for (const value of [null, undefined, NaN, Infinity, -Infinity, "80", 101, valid.p1 - 1e-6]) {
    assert.throws(() => simulatePillarImprovements(valid, { p1: value }), RangeError);
  }
  for (const targets of [null, [], "targets", 1]) assert.throws(() => simulatePillarImprovements(valid, targets), TypeError);
  assert.throws(() => simulatePillarImprovements(valid, { p10: 100 }), /Unknown pillar/);
  assert.throws(() => simulatePillarImprovements(valid, { "1": 100 }), /Unknown pillar/);
  assert.doesNotThrow(() => simulatePillarImprovements(valid, { p1: valid.p1 }));
  assert.doesNotThrow(() => simulatePillarImprovements(valid, { p1: 100 }));
});

check("only canonical reference-year baselines are accepted", () => {
  for (const input of [null, undefined, {}, "Singapore", { ...COUNTRIES[0], year: REFERENCE_YEAR - 1 }, { ...COUNTRIES[0], p1: 100 }, { ...COUNTRIES[0], adei: 100 }, { ...COUNTRIES[0], rank: 2 }]) {
    assert.throws(() => simulatePillarImprovements(input), TypeError);
  }
  assert.doesNotThrow(() => simulatePillarImprovements({ ...COUNTRIES[0] }));
});

check("baseline targets are fresh values and neither simulation nor caller edits change published data", () => {
  const first = getWhatIfBaseline(COUNTRIES[0]);
  const second = getWhatIfBaseline(COUNTRIES[0].name);
  assert.deepEqual(first, second);
  assert.notEqual(first, second);
  first.p1 = 100;
  assert.equal(second.p1, COUNTRIES[0].p1);
  const result = simulatePillarImprovements(COUNTRIES[0], first);
  result.pillars[0].target = 0;
  result.ranking[0].score = 0;
  assert.equal(JSON.stringify({ COUNTRIES, PILLARS }), before);
});

console.log(`Validated ${checks} what-if calculator checks.`);
