/** Compare published snapshots. Ranks are derived within each assessment year. */
export function snapshotFromDataset(dataset) {
  return {
    source: dataset.meta.source,
    sourceUpdated: dataset.meta.sourceUpdated || null,
    id: dataset.meta.sourceSha256,
    referenceYear: dataset.meta.referenceYear,
    years: [...dataset.meta.years],
    scoreCodes: [...dataset.codes],
    countryCount: dataset.meta.countryCount,
    observations: dataset.observations.map((row) => ({
      country: row.country, year: row.year, adei: row.adei, rank: row.rank,
      scores: Object.fromEntries(dataset.codes.map((code, index) => [code, row.scores[index]])),
    })),
  };
}

const keyOf = (row) => `${row.country}|${row.year}`;
const headline = (row) => row ? { adei: row.adei, rank: row.rank } : null;
const codeOrder = (a, b) => a.localeCompare(b, "en", { numeric: true });

export function compareRevisionSnapshots(before, after) {
  const oldRows = new Map(before.observations.map((row) => [keyOf(row), row]));
  const newRows = new Map(after.observations.map((row) => [keyOf(row), row]));
  const changes = [];
  for (const key of new Set([...oldRows.keys(), ...newRows.keys()])) {
    const oldRow = oldRows.get(key), newRow = newRows.get(key);
    const codes = [...new Set([...Object.keys(oldRow?.scores || {}), ...Object.keys(newRow?.scores || {})])].sort(codeOrder);
    const scores = codes.flatMap((code) => {
      const oldValue = oldRow?.scores[code] ?? null;
      const newValue = newRow?.scores[code] ?? null;
      return oldValue === newValue ? [] : [{ code, before: oldValue, after: newValue }];
    });
    if (!oldRow || !newRow || scores.length || oldRow.adei !== newRow.adei || oldRow.rank !== newRow.rank) {
      const row = newRow || oldRow;
      changes.push({ country: row.country, year: row.year, before: headline(oldRow), after: headline(newRow), scores });
    }
  }
  changes.sort((a, b) => b.year - a.year || a.country.localeCompare(b.country));
  return changes;
}

export function revisionEntry(snapshot, previous = null) {
  if (!snapshot.id || !snapshot.source || !snapshot.observations.length) throw new Error("A revision requires a source fingerprint and observations.");
  const changes = previous ? compareRevisionSnapshots(previous, snapshot) : [];
  const comparable = changes.filter((row) => row.before && row.after);
  return {
    id: snapshot.id, source: snapshot.source, sourceUpdated: snapshot.sourceUpdated,
    referenceYear: snapshot.referenceYear, years: snapshot.years,
    scoreCodes: snapshot.scoreCodes || [...new Set(snapshot.observations.flatMap((row) => Object.keys(row.scores)))].sort(codeOrder),
    countryCount: snapshot.countryCount, observationCount: snapshot.observations.length,
    previousId: previous?.id || null, baseline: !previous,
    summary: {
      changedCountryYears: changes.length,
      adeiChanges: comparable.filter((row) => row.before.adei !== row.after.adei).length,
      rankChanges: comparable.filter((row) => row.before.rank !== row.after.rank).length,
      pillarChanges: changes.reduce((sum, row) => sum + row.scores.filter((score) => !score.code.includes(".")).length, 0),
      indicatorChanges: changes.reduce((sum, row) => sum + row.scores.filter((score) => score.code.includes(".")).length, 0),
      addedObservations: changes.filter((row) => !row.before).length,
      removedObservations: changes.filter((row) => !row.after).length,
    },
    changes,
  };
}

/** Preserve the chain when build:data ingests a new local workbook. */
export function appendDatasetRevision(history, previousDataset, nextDataset) {
  if (history.schemaVersion !== 1 || !history.revisions?.length) throw new Error("Revision history has an unsupported or empty format.");
  const latest = history.revisions.at(-1);
  const next = snapshotFromDataset(nextDataset);
  if (latest.id === next.id) return history;
  if (history.revisions.some((revision) => revision.id === next.id)) throw new Error("This workbook is already an earlier revision. History cannot be rewound.");
  if (!previousDataset || latest.id !== previousDataset.meta.sourceSha256) throw new Error("Revision history does not match the previous dataset. Rebuild the history from the local workbook revisions before importing.");
  return { ...history, revisions: [...history.revisions, revisionEntry(next, snapshotFromDataset(previousDataset))] };
}

export function filterRevisionChanges(revision, { year = "all", search = "", type = "all" } = {}) {
  const query = search.trim().toLocaleLowerCase();
  return revision.changes.filter((row) => {
    if (year !== "all" && row.year !== Number(year)) return false;
    if (query && !`${row.country} ${row.scores.map((score) => score.code).join(" ")}`.toLocaleLowerCase().includes(query)) return false;
    if (type === "adei") return row.before?.adei !== row.after?.adei;
    if (type === "rank") return row.before?.rank !== row.after?.rank;
    if (type === "pillar") return row.scores.some((score) => !score.code.includes("."));
    if (type === "indicator") return row.scores.some((score) => score.code.includes("."));
    return true;
  });
}

/** Removed assessment years must remain selectable alongside the new snapshot. */
export function revisionFilterYears(revision) {
  return [...new Set([...revision.years, ...revision.changes.map(({ year }) => year)])].sort((a, b) => a - b);
}
