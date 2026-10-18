import { COUNTRIES, PILLARS, REFERENCE_YEAR, getCluster } from "../data/index.js";

/** Scores this close share a competition rank; no score is rounded to rank it. */
export const WHAT_IF_TIE_TOLERANCE = 1e-9;

const finite = (value) => typeof value === "number" && Number.isFinite(value);
const pillarKeys = new Set(PILLARS.map(({ key }) => key));

function publishedCountry(input) {
  const name = typeof input === "string" ? input : input?.name;
  const country = COUNTRIES.find((entry) => entry.name === name);
  if (!country) throw new TypeError("Choose a country in the published reference-year dataset.");
  if (typeof input !== "string" && (
    input.year !== REFERENCE_YEAR || input.iso3 !== country.iso3 ||
    input.adei !== country.adei || input.rank !== country.rank ||
    PILLARS.some(({ key }) => input[key] !== country[key])
  )) throw new TypeError("The scenario baseline must match the published reference-year country.");
  if (!finite(country.adei) || !Number.isInteger(country.rank) ||
    PILLARS.some(({ key, weight }) => !finite(country[key]) || country[key] < 0 || country[key] > 100 || !finite(weight) || weight < 0)) {
    throw new RangeError("The published country must have valid scores within 0–100 and valid pillar weights.");
  }
  if (Math.abs(PILLARS.reduce((sum, { weight }) => sum + weight, 0) - 100) > WHAT_IF_TIE_TOLERANCE) {
    throw new RangeError("Official pillar weights must sum to 100%.");
  }
  return country;
}

/** Fresh targets keep the source records out of editable React state. */
export function getWhatIfBaseline(countryInput) {
  const country = publishedCountry(countryInput);
  return Object.fromEntries(PILLARS.map(({ key }) => [key, country[key]]));
}

/**
 * Improve one country's pillar scores while every other country stays fixed.
 * Retaining published ADEI, rather than recomputing it from rounded pillar
 * inputs, makes an unchanged scenario exactly reproduce the published score.
 * The small published rounding residual is retained at all target values.
 */
export function simulatePillarImprovements(countryInput, targets = {}) {
  const country = publishedCountry(countryInput);
  if (!targets || typeof targets !== "object" || Array.isArray(targets)) {
    throw new TypeError("Pillar targets must be an object keyed by p1–p9.");
  }
  for (const key of Object.keys(targets)) {
    if (!pillarKeys.has(key)) throw new TypeError(`Unknown pillar target: ${key}.`);
  }
  const pillars = PILLARS.map((pillar) => {
    const baseline = country[pillar.key];
    const target = Object.hasOwn(targets, pillar.key) ? targets[pillar.key] : baseline;
    if (!finite(target) || target < baseline || target > 100) {
      throw new RangeError(`${pillar.name} must be a finite target between its published score (${baseline}) and 100.`);
    }
    const improvement = target - baseline;
    return { ...pillar, baseline, target, improvement, contribution: improvement * pillar.weight / 100 };
  });
  const scoreGain = pillars.reduce((sum, { contribution }) => sum + contribution, 0);
  const score = country.adei + scoreGain;
  const competitors = COUNTRIES.filter(({ name }) => name !== country.name);
  const rankFor = (value, others) => 1 + others.filter((entry) => entry.score > value + WHAT_IF_TIE_TOLERANCE).length;
  const peers = competitors.map((entry) => ({
    name: entry.name, iso3: entry.iso3, score: entry.adei, publishedRank: entry.rank, simulated: false,
  }));
  const rank = rankFor(score, peers);
  const tiedCountries = peers.filter((entry) => Math.abs(entry.score - score) <= WHAT_IF_TIE_TOLERANCE).map(({ name }) => name);
  const entries = [...peers, { name: country.name, iso3: country.iso3, score, publishedRank: country.rank, simulated: true }];
  const ranking = entries.map((entry) => ({
    ...entry,
    rank: rankFor(entry.score, entries.filter(({ name }) => name !== entry.name)),
  })).sort((a, b) => a.rank - b.rank || a.publishedRank - b.publishedRank);
  const position = ranking.findIndex(({ simulated }) => simulated);
  const weightedBaseline = pillars.reduce((sum, { baseline, weight }) => sum + baseline * weight / 100, 0);

  return {
    country: { name: country.name, iso3: country.iso3, year: REFERENCE_YEAR },
    countryCount: COUNTRIES.length,
    baseline: { score: country.adei, rank: country.rank, cluster: country.cluster },
    simulated: { score, rank, cluster: getCluster(score).label },
    scoreGain,
    rankGain: country.rank - rank,
    changedPillars: pillars.filter(({ improvement }) => improvement > 0).length,
    pillars,
    tiedCountries,
    roundingResidual: country.adei - weightedBaseline,
    ranking,
    neighbors: ranking.slice(Math.max(0, position - 2), Math.min(ranking.length, position + 3)),
  };
}
