import {
  COUNTRIES,
  FINDEX,
  META,
  OIC_AVERAGE,
  PILLARS,
  REFERENCE_YEAR,
  REGIONS,
  getCluster,
} from "../data/index.js";

export const HEADLINE_RECOMMENDATIONS = Object.freeze({
  "Advanced Digital Economies":
    "Transition from digital follower to global standard-setter. Lead OIC in AI governance, digital export frameworks, and Islamic Fintech international standards.",
  "Emerging Digital Economies":
    "Bridge the gap to Advanced Digital Economies status by targeting private-sector digital adoption, R&D investment, and advanced skills development.",
  "Foundational Digital Economies":
    "Establish core digital infrastructure and implement nationwide digital literacy programs as the immediate national priority.",
});

const oneDecimal = (value) => value.toFixed(1);
const regionOf = (country) => REGIONS[country.name] || "Other";

/**
 * Build the complete report from one published reference-year country record.
 * This model is shared by individual and bulk PDF exports. It contains no DOM
 * state, and never sorts or changes the source data supplied by the dashboard.
 */
export function buildCountryReport(country, { generatedAt = new Date() } = {}) {
  const published = COUNTRIES.find((candidate) => candidate.name === country?.name);
  const measuredKeys = ["rank", "adei", "iso3", ...PILLARS.map((pillar) => pillar.key)];
  if (
    !published ||
    country.year !== REFERENCE_YEAR ||
    measuredKeys.some((key) => country[key] !== published[key])
  ) {
    throw new Error(`Country reports require a published ${REFERENCE_YEAR} country record.`);
  }

  const timestamp = new Date(generatedAt);
  if (!Number.isFinite(timestamp.getTime())) {
    throw new Error("Country reports require a valid generation date.");
  }

  const region = regionOf(country);
  const regionPeers = COUNTRIES.filter((candidate) => regionOf(candidate) === region)
    .sort((a, b) => a.rank - b.rank);
  const regionRank = regionPeers.findIndex((candidate) => candidate.name === country.name) + 1;
  const regionalLeader = regionPeers[0];
  const globalLeader = COUNTRIES.reduce((leader, candidate) =>
    candidate.adei > leader.adei ? candidate : leader,
  );
  const cluster = getCluster(country.adei).label;
  const pillars = PILLARS.map((pillar) => {
    const average = COUNTRIES.reduce((total, candidate) => total + candidate[pillar.key], 0) /
      COUNTRIES.length;
    return {
      id: pillar.id,
      key: pillar.key,
      name: pillar.name,
      score: country[pillar.key],
      average,
      delta: country[pillar.key] - average,
      weight: pillar.weight,
    };
  });
  const byDelta = [...pillars].sort((a, b) => b.delta - a.delta);
  const strongest = byDelta[0];
  const weakest = byDelta[byDelta.length - 1];
  const gapToGlobalLeader = globalLeader.adei - country.adei;
  const gapToRegionalLeader = regionalLeader.adei - country.adei;
  const imputedCodes = FINDEX.codes.filter((code) => FINDEX.imputed[code]?.includes(country.name));
  const coverageNotes = [];

  if (imputedCodes.length) {
    coverageNotes.push(
      `Financial inclusion coverage: In ${FINDEX.year}, ${country.name} uses the workbook's imputed floor for ${imputedCodes.map((code) => `${code} (${FINDEX.labels[code]})`).join("; ")}. These values are not survey observations. Financial Market Development (pillar 8) and the overall score incorporate these floor values.`,
    );
  }
  for (const difference of FINDEX.sourceDifferences || []) {
    if (difference.country !== country.name) continue;
    coverageNotes.push(
      `Financial inclusion source difference: ${difference.code} (${FINDEX.labels[difference.code]}) has a collected input of ${oneDecimal(difference.collectedPercent)}% and a filled input of ${oneDecimal(difference.filledPercent)}%. This is a difference between raw source inputs, not a missing observation. Validate the difference when interpreting pillar 8; the published pillar and overall scores are preserved.`,
    );
  }

  const strengthText = strongest.delta > 0
    ? `Focus on enhancing ${strongest.name}, where the score is ${oneDecimal(strongest.delta)} points above the OIC average. This is the country's strongest relative pillar and a key differentiator.`
    : strongest.delta < 0
      ? `Build on ${strongest.name}, the country's strongest pillar relative to the OIC average. It remains ${oneDecimal(Math.abs(strongest.delta))} points below that benchmark, so further investment can strengthen the country's position.`
      : `Build on ${strongest.name}, the country's strongest pillar relative to the OIC average. It currently matches that benchmark; further investment can create a competitive advantage.`;
  const improvementText = weakest.delta < 0
    ? `Prioritize ${weakest.name} to reduce the ${oneDecimal(Math.abs(weakest.delta))} point gap from the OIC average. This is critical for overall advancement.`
    : weakest.delta > 0
      ? `All ${pillars.length} pillars are above the OIC average. Continue strengthening ${weakest.name}, which has the smallest advantage at ${oneDecimal(weakest.delta)} points above that benchmark, while sustaining progress across the other pillars.`
      : `Strengthen ${weakest.name}, which currently matches the OIC average, while sustaining the advantages in the country's other pillars.`;
  const benchmarkText = regionPeers.length === 1
    ? `${country.name} is the only country in this dashboard's ${region} region, so regional peer comparison is limited. Study successful implementations from other OIC economies to accelerate progress.`
    : regionalLeader.name === country.name
      ? `${country.name} leads ${region}. Share successful implementations with regional peers and compare practices with other leading OIC economies to sustain progress.`
      : `Study successful implementations from ${regionalLeader.name} and other regional leaders to accelerate progress toward advanced digital economy status.`;
  const globalText = globalLeader.name === country.name
    ? `${country.name} leads the ${COUNTRIES.length} countries covered by this index. Sustain that position through continued investment in digital infrastructure, innovation, and workforce development, while sharing effective practices across the OIC.`
    : `To reach ${globalLeader.name}'s level, close the ${oneDecimal(gapToGlobalLeader)} point gap through investments in digital infrastructure, innovation, and workforce development aligned with the country's classification tier.`;

  return {
    country: {
      name: country.name,
      rank: country.rank,
      adei: country.adei,
      iso3: country.iso3,
    },
    assessmentYear: REFERENCE_YEAR,
    sourceUpdated: META.sourceUpdated,
    generatedAt: timestamp.toISOString(),
    countryCount: COUNTRIES.length,
    cluster,
    region,
    regionRank,
    regionCount: regionPeers.length,
    oicAverage: OIC_AVERAGE,
    deltaFromOic: country.adei - OIC_AVERAGE,
    pillars,
    strongest,
    weakest,
    globalLeader: { name: globalLeader.name, adei: globalLeader.adei },
    gapToGlobalLeader,
    regionalLeader: { name: regionalLeader.name, adei: regionalLeader.adei },
    gapToRegionalLeader,
    topRegional: regionPeers.slice(0, 3).map((peer, index) => ({
      name: peer.name,
      adei: peer.adei,
      rank: peer.rank,
      regionRank: index + 1,
    })),
    headlineRecommendation: HEADLINE_RECOMMENDATIONS[cluster],
    recommendations: [
      { title: "Strengthen Your Position", text: strengthText },
      { title: weakest.delta < 0 ? "Bridge the Gap" : "Sustain Broad Progress", text: improvementText },
      { title: "Benchmark Learning", text: benchmarkText },
      { title: gapToGlobalLeader === 0 ? "Sustain Index Leadership" : "Close Global Gap", text: globalText },
    ],
    coverageNotes,
  };
}
