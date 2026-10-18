import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { appendDatasetRevision, compareRevisionSnapshots, filterRevisionChanges, revisionEntry, revisionFilterYears, snapshotFromDataset } from "../src/lib/revision-history.js";

const data = JSON.parse(readFileSync(new URL("../src/data/adei-dataset.json", import.meta.url), "utf8"));
const history = JSON.parse(readFileSync(new URL("../src/data/revision-history.json", import.meta.url), "utf8"));
let count = 0;
function check(name, fn) { fn(); count++; console.log(`PASS ${name}`); }

function verifyReconstruction(archive, dataset) {
  let current = snapshotFromDataset(dataset);
  for (let index = archive.revisions.length - 1; index > 0; index--) {
    const revision = archive.revisions[index];
    const prior = archive.revisions[index - 1];
    const previous = { ...structuredClone(current), ...prior };
    const rows = new Map(previous.observations.map((row) => [`${row.country}|${row.year}`, row]));
    const codes = prior.scoreCodes || [...new Set([...dataset.codes, ...revision.changes.flatMap((change) => change.scores.map(({ code }) => code))])];
    for (const change of revision.changes) {
      const key = `${change.country}|${change.year}`;
      const row = rows.get(key);
      if (!change.after) {
        assert.equal(row, undefined, "Removed records must be absent from the newer snapshot");
        rows.set(key, { country: change.country, year: change.year, ...change.before,
          scores: Object.fromEntries(codes.map((code) => [code, change.scores.find((score) => score.code === code)?.before ?? null])),
        });
      } else {
        assert.ok(row, "Changed and added records must exist in the newer snapshot");
        assert.equal(row.adei, change.after.adei);
        assert.equal(row.rank, change.after.rank);
        for (const score of change.scores) assert.equal(row.scores[score.code] ?? null, score.after);
        if (!change.before) rows.delete(key);
        else {
          row.adei = change.before.adei; row.rank = change.before.rank;
          for (const score of change.scores) row.scores[score.code] = score.before;
        }
      }
    }
    previous.observations = [...rows.values()].map((row) => ({ ...row,
      scores: Object.fromEntries(codes.map((code) => [code, row.scores[code] ?? null])),
    }));
    assert.equal(previous.observations.length, prior.observationCount);
    assert.equal(new Set(previous.observations.map(({ country }) => country)).size, prior.countryCount);
    assert.deepEqual(revisionEntry(current, previous).changes, revision.changes);
    assert.deepEqual(revisionEntry(current, previous).summary, revision.summary);
    for (const year of previous.years) {
      const ranked = previous.observations.filter((row) => row.year === year).sort((a, b) => a.rank - b.rank);
      ranked.forEach((row, position) => {
        assert.equal(row.rank, position + 1);
        if (position > 0) assert.ok(ranked[position - 1].adei >= row.adei, "Higher published ranks must not have lower scores");
      });
    }
    current = previous;
  }
  return current;
}
check("fingerprints, revision order and current dataset agree", () => {
  assert.equal(history.schemaVersion, 1);
  assert.ok(history.revisions.length >= 3);
  assert.equal(new Set(history.revisions.map((revision) => revision.id)).size, history.revisions.length);
  assert.equal(history.revisions.at(-1).id, data.meta.sourceSha256);
  history.revisions.forEach((revision, index) => {
    assert.match(revision.id, /^[a-f0-9]{64}$/);
    assert.equal(revision.previousId, history.revisions[index - 1]?.id || null);
    assert.equal(revision.baseline, index === 0);
    assert.ok(Number.isInteger(revision.countryCount) && revision.countryCount > 0);
    assert.ok(Number.isInteger(revision.observationCount) && revision.observationCount >= revision.countryCount);
    assert.ok(revision.observationCount <= revision.countryCount * revision.years.length);
  });
  assert.equal(history.revisions.at(-1).countryCount, data.meta.countryCount);
  assert.equal(history.revisions.at(-1).observationCount, data.observations.length);
});
check("every historical change can reconstruct its prior snapshot", () => {
  verifyReconstruction(history, data);
});
check("18 October revision preserves historical nulls, zeros and rank-only changes", () => {
  const revision = history.revisions.find((entry) => entry.sourceUpdated === "2026-10-18");
  assert.deepEqual(revision.summary, { changedCountryYears: 2, adeiChanges: 1, rankChanges: 2, pillarChanges: 3, indicatorChanges: 3, addedObservations: 0, removedObservations: 0 });
  const malaysia = revision.changes.find((row) => row.country === "Malaysia");
  assert.equal(malaysia.year, 2021);
  assert.deepEqual(malaysia.before, { adei: 71.408479, rank: 1 });
  assert.deepEqual(malaysia.after, { adei: 68.230032, rank: 2 });
  assert.equal(malaysia.scores.find((score) => score.code === "3").after, null);
  assert.equal(malaysia.scores.find((score) => score.code === "8.2").after, 0);
  const uae = revision.changes.find((row) => row.country === "United Arab Emirates");
  assert.equal(uae.scores.length, 0);
  assert.equal(uae.before.rank, 2); assert.equal(uae.after.rank, 1);
  assert.equal(filterRevisionChanges(revision, { year: 2025 }).length, 0);
});
check("history filters combine country/code, year and change type", () => {
  const revision = history.revisions.at(-1);
  assert.equal(filterRevisionChanges(revision, { search: "MALAYSIA", year: "2021", type: "adei" }).length, 1);
  assert.equal(filterRevisionChanges(revision, { search: "8.2", type: "indicator" }).length, 1);
  assert.equal(filterRevisionChanges(revision, { search: "United Arab Emirates", type: "pillar" }).length, 0);
  assert.equal(filterRevisionChanges(history.revisions[0]).length, 0);
});
check("new imports append once; unchanged reimports retain history", () => {
  assert.equal(appendDatasetRevision(history, data, data), history);
  const next = structuredClone(data);
  next.meta.sourceSha256 = "a".repeat(64); next.meta.source = "next-local-revision.xlsx";
  next.observations[0].scores[0] = null;
  const updated = appendDatasetRevision(history, data, next);
  assert.equal(updated.revisions.length, history.revisions.length + 1);
  assert.equal(updated.revisions.at(-1).changes[0].scores[0].after, null);
  assert.equal(appendDatasetRevision(updated, data, next), updated);
  assert.equal(history.revisions.at(-1).id, data.meta.sourceSha256);
});
check("out-of-sequence history and rewound revisions fail visibly", () => {
  const next = structuredClone(data); next.meta.sourceSha256 = "b".repeat(64);
  const wrong = structuredClone(data); wrong.meta.sourceSha256 = "c".repeat(64);
  assert.throws(() => appendDatasetRevision(history, wrong, next), /does not match/);
  next.meta.sourceSha256 = history.revisions[0].id;
  assert.throws(() => appendDatasetRevision(history, data, next), /cannot be rewound/);
});
check("additions, removals and unavailable-to-zero are distinguished", () => {
  const old = { observations: [{ country: "A", year: 2025, adei: 20, rank: 1, scores: { "1": null } }, { country: "B", year: 2025, adei: 10, rank: 2, scores: { "1": 10 } }] };
  const next = { observations: [{ country: "A", year: 2025, adei: 20, rank: 1, scores: { "1": 0 } }, { country: "C", year: 2025, adei: 15, rank: 2, scores: { "1": 15 } }] };
  const changes = compareRevisionSnapshots(old, next);
  assert.equal(changes.length, 3);
  assert.deepEqual(changes[0].scores[0], { code: "1", before: null, after: 0 });
  assert.equal(changes[1].after, null); assert.equal(changes[2].before, null);
});
check("removed assessment years remain available to the history filters", () => {
  const revision = { years: [2026], changes: [
    { country: "A", year: 2025, before: { adei: 10, rank: 1 }, after: null, scores: [] },
    { country: "A", year: 2026, before: null, after: { adei: 11, rank: 1 }, scores: [] },
  ] };
  assert.deepEqual(revisionFilterYears(revision), [2025, 2026]);
  assert.equal(filterRevisionChanges(revision, { year: "2025" }).length, 1);
  assert.equal(filterRevisionChanges(revision, { year: "2026" }).length, 1);
  assert.deepEqual(revisionFilterYears(history.revisions[0]), history.revisions[0].years);
});
check("future assessment-year additions and removals preserve the whole history chain", () => {
  const expanded = structuredClone(data);
  const nextYear = Math.max(...data.meta.years) + 1;
  expanded.meta.sourceSha256 = "d".repeat(64); expanded.meta.source = "future-year.xlsx";
  expanded.meta.years.push(nextYear); expanded.meta.referenceYear = nextYear;
  expanded.observations.push(...data.observations.filter(({ year }) => year === data.meta.referenceYear).map((row) => ({ ...structuredClone(row), year: nextYear })));
  const appended = appendDatasetRevision(history, data, expanded);
  assert.equal(appended.revisions.at(-1).summary.addedObservations, data.meta.countryCount);
  assert.deepEqual(verifyReconstruction(appended, expanded), verifyReconstruction(history, data));
  const reduced = structuredClone(expanded);
  const removedYear = Math.min(...data.meta.years);
  reduced.meta.sourceSha256 = "e".repeat(64); reduced.meta.source = "shorter-panel.xlsx";
  reduced.meta.years = reduced.meta.years.filter((year) => year !== removedYear);
  reduced.observations = reduced.observations.filter(({ year }) => year !== removedYear);
  const removed = appendDatasetRevision(appended, expanded, reduced);
  assert.equal(removed.revisions.at(-1).summary.removedObservations, data.meta.countryCount);
  assert.ok(revisionFilterYears(removed.revisions.at(-1)).includes(removedYear));
  assert.deepEqual(verifyReconstruction(removed, reduced), verifyReconstruction(history, data));
});
console.log(`${count} revision history checks passed.`);
