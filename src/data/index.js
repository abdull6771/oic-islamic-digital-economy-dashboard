/**
 * Data layer for the OIC Digital Economy Index dashboard.
 *
 * `adei-dataset.json` is generated from the master Excel workbook by
 * `scripts/build-dataset.mjs` (`npm run build:data`) and is the only place index
 * values enter the app. This module turns that wire format into the shapes the
 * views consume, and is the only place that mixes measured data with
 * presentation choices (colours, short labels, regional grouping).
 *
 * Nothing below invents or adjusts a measured value. Where the workbook is
 * silent - a missing sub-indicator, a rank that was never recomputed - the value
 * stays null or is rebuilt from ADEI using the index's own published rule.
 */
import dataset from "./adei-dataset.json" with { type: "json" };

export const META = dataset.meta;
export const DATA_QUALITY = dataset.dataQuality;
export const YEARS = dataset.meta.years;
export const REFERENCE_YEAR = dataset.meta.referenceYear;
/** "2021–2025" — for chart titles and copy, so labels track the data. */
export const YEAR_RANGE = `${YEARS[0]}–${YEARS[YEARS.length - 1]}`;
export const INDICATOR_COUNTS = dataset.meta.counts;

// ─── PRESENTATION METADATA ──────────────────────────────────────────────────
// Names, short labels, palette and dimension groupings used by the views. The
// weight of each pillar is *not* here: it is read from the workbook's `ref`
// sheet so that a re-weighted index flows through automatically.
const PILLAR_PRESENTATION = {
  1: { name: "Institutions", short: "Institutions", color: "#1B4332", dim: "Digital Foundation" },
  2: { name: "Infrastructure", short: "Infrastructure", color: "#2D6A4F", dim: "Digital Foundation" },
  3: { name: "Workforce", short: "Workforce", color: "#40916C", dim: "Digital Works" },
  4: { name: "E-Government", short: "E-Gov", color: "#52B788", dim: "E-Government" },
  5: { name: "Innovation", short: "Innovation", color: "#74C69D", dim: "Innovation" },
  6: { name: "Future Technologies", short: "Future Tech", color: "#95D5B2", dim: "Readiness in Digital for the Citizen" },
  7: { name: "Market Development & Sophistication", short: "Market Dev", color: "#2D6A4F", dim: "Readiness in Digital for the Citizen" },
  8: { name: "Financial Market Development", short: "Fin. Markets", color: "#388E7F", dim: "Readiness in Digital for the Citizen" },
  9: { name: "Sustainable Development Goals", short: "SDGs", color: "#1F4E38", dim: "Readiness in Digital for the Citizen" },
};

/**
 * Editorial English labels for indicators and sub-indicators. The workbook's own
 * labels are working translations ("Combating corruption", "Quality of
 * organization"); these are the published wording. Any code without an entry
 * falls back to the workbook label, so a new indicator still renders.
 */
const INDICATOR_LABELS = {
  "1.1": "Political Environment",
  "1.1.1": "Political Stability and Security",
  "1.1.2": "Government Effectiveness",
  "1.1.3": "Voice and Accountability",
  "1.2": "Regulatory Environment",
  "1.2.1": "Regulatory Quality",
  "1.2.2": "Rule of Law",
  "1.2.3": "Control of Corruption",
  "1.3": "Technology Governance",
  "1.3.1": "Secure Internet Servers",
  "1.3.2": "E-Security",
  "1.3.3": "Online Shopping",
  "1.3.4": "ICT Regulatory Environment",
  "1.3.5": "Regulation of Emerging Technologies",
  "1.3.6": "E-commerce Legislation",
  "1.3.7": "Protection of content privacy under the law",
  "2.1": "Access to ICT",
  "2.2": "Use of ICT",
  "2.3": "Technological Inclusion",
  "2.3.1": "E-Participation",
  "2.3.2": "Socioeconomic gap in the use of digital payments",
  "2.3.3": "Availability of local content online",
  "2.3.4": "Gender gap in internet use",
  "2.3.5": "Rural gap in the use of digital payments",
  "2.4": "Logistical Performance",
  "3.1": "Expenditure on education as a % of GDP",
  "3.2": "Knowledge-intensive employment %",
  "3.3": "ICT skills in the education system",
  "4.1": "Government services online",
  "4.2": "Telecommunication Infrastructure",
  "4.3": "Human Capital Component",
  "5.1": "R&D expenditure financed by business sector (%)",
  "5.2": "University-industry collaboration in R&D",
  "5.3": "Knowledge impact",
  "5.4": "Knowledge absorption",
  "6.1": "Adoption of emerging technologies",
  "6.2": "Investment in emerging technologies",
  "6.3": "Artificial Intelligence (AI) strategy",
  "7.1": "Financing of start-ups and ease of access",
  "7.2": "Domestic credit to private sector, % of GDP",
  "7.3": "Diversification of local industry",
  "8.1": "FinTech and Financial Inclusion",
  "8.1.1": "Population (age 15+) with bank accounts (%)",
  "8.1.2": "Population (age 15+) with debit or credit card (%)",
  "8.1.3": "Population (age 15+) made or received digital payment (%)",
  "8.2": "Market capitalization as a % of GDP",
  "9.1": "Goal 1: No Poverty",
  "9.2": "Goal 2: Zero Hunger",
  "9.3": "Goal 3: Good Health and Well-being",
  "9.4": "Goal 4: Quality Education",
  "9.5": "Goal 8: Decent Work and Economic Growth",
  "9.6": "Goal 9: Industry, Innovation and Infrastructure",
  "9.7": "Goal 17: Partnerships for the Goals",
};

const CLUSTER_STYLE = {
  "Advanced Digital Economies": { color: "#1B4332", bg: "#D8F3DC" },
  "Emerging Digital Economies": { color: "#52B788", bg: "#E8F5E9" },
  "Foundational Digital Economies": { color: "#95D5B2", bg: "#F1F8F6" },
};

/**
 * Regional grouping used by the Geographic Analysis view. The workbook carries a
 * "Region" column but it is filled for only 9 of 57 rows and mislabels several
 * (Pakistan, Senegal and the Kyrgyz Republic are all tagged "GCC"), so the
 * dashboard keeps this curated map instead. See DATA.md.
 */
export const REGIONS = {
  "United Arab Emirates": "GCC",
  "Saudi Arabia": "GCC",
  Qatar: "GCC",
  Bahrain: "GCC",
  Kuwait: "GCC",
  Oman: "GCC",
  Malaysia: "Southeast Asia",
  Indonesia: "Southeast Asia",
  "Brunei Darussalam": "Southeast Asia",
  Maldives: "South Asia",
  Kazakhstan: "Central Asia",
  Uzbekistan: "Central Asia",
  "Kyrgyz Republic": "Central Asia",
  Tajikistan: "Central Asia",
  Turkmenistan: "Central Asia",
  Azerbaijan: "Central Asia",
  Pakistan: "South Asia",
  Bangladesh: "South Asia",
  Jordan: "Middle East",
  Lebanon: "Middle East",
  Iraq: "Middle East",
  "Syrian Arab Republic": "Middle East",
  Yemen: "Middle East",
  Palestine: "Middle East",
  "Iran, Islamic Rep.": "Middle East",
  Türkiye: "Middle East",
  Egypt: "North Africa",
  Morocco: "North Africa",
  Tunisia: "North Africa",
  Algeria: "North Africa",
  Libya: "North Africa",
  Sudan: "North Africa",
  Senegal: "West Africa",
  Nigeria: "West Africa",
  Benin: "West Africa",
  "Cote d'Ivoire": "West Africa",
  Guinea: "West Africa",
  "Guinea-Bissau": "West Africa",
  Mali: "West Africa",
  "Burkina Faso": "West Africa",
  Niger: "West Africa",
  Gambia: "West Africa",
  Togo: "West Africa",
  Mauritania: "West Africa",
  "Sierra Leone": "West Africa",
  Cameroon: "Central Africa",
  Gabon: "Central Africa",
  Uganda: "East Africa",
  Somalia: "East Africa",
  Djibouti: "East Africa",
  Comoros: "East Africa",
  Mozambique: "Southeastern Africa",
  Albania: "Europe",
  Guyana: "South America",
  Suriname: "South America",
  Afghanistan: "Central Asia",
  Chad: "Central Africa",
};

/** Names used by the world-map topology that differ from the workbook's. */
export const GEO_NAME_MAP = {
  Turkey: "Türkiye",
  Syria: "Syrian Arab Republic",
  Iran: "Iran, Islamic Rep.",
  "Iran (Islamic Republic of)": "Iran, Islamic Rep.",
  "West Bank": "Palestine",
  Palestine: "Palestine",
  "Ivory Coast": "Cote d'Ivoire",
  "Côte d'Ivoire": "Cote d'Ivoire",
  Kyrgyzstan: "Kyrgyz Republic",
  Brunei: "Brunei Darussalam",
  "The Gambia": "Gambia",
  "Yemen, Rep.": "Yemen",
};

// ─── DERIVED STRUCTURES ─────────────────────────────────────────────────────
const CODE_INDEX = Object.fromEntries(dataset.codes.map((c, i) => [c, i]));

/** Display label for any indicator code, falling back to the workbook's own. */
export const labelFor = (code) =>
  INDICATOR_LABELS[code] ||
  dataset.indicators.find((i) => i.code === code)?.workbookLabel ||
  code;

/** `p1`…`p9` keys are the historical shape the views index country records by. */
const keyOf = (pillarId) => `p${pillarId}`;

export const PILLARS = dataset.pillars.map((p) => ({
  id: p.id,
  key: keyOf(p.id),
  weight: p.weight,
  ...(PILLAR_PRESENTATION[p.id] || {
    name: p.refName || p.workbookName,
    short: p.refName || p.workbookName,
    color: "#40916C",
    dim: p.dimension,
  }),
}));

/** Full indicator tree per pillar: `{ p1: { name, indicators: [{ code, name, subIndicators }] } }`. */
export const PILLAR_INDICATORS = Object.fromEntries(
  PILLARS.map((pillar) => {
    const indicators = dataset.indicators
      .filter((i) => i.level === "indicator" && i.pillar === pillar.id)
      .map((i) => {
        const subIndicators = dataset.indicators
          .filter((s) => s.level === "subIndicator" && s.parent === i.code)
          .map((s) => ({ code: s.code, name: labelFor(s.code) }));
        return {
          code: i.code,
          name: labelFor(i.code),
          ...(subIndicators.length ? { subIndicators } : {}),
        };
      });
    return [pillar.key, { name: pillar.name, indicators }];
  }),
);

const ISO3 = Object.fromEntries(
  dataset.countries.map((c) => [c.name, c.iso3]),
);

/**
 * One country-year record in the shape the views expect: pillar scores flattened
 * onto `p1`…`p9`, every indicator reachable through `scores`.
 */
function toRecord(observation) {
  const record = {
    name: observation.country,
    iso3: ISO3[observation.country] || null,
    year: observation.year,
    rank: observation.rank,
    adei: observation.adei,
    cluster: observation.cluster,
    region: REGIONS[observation.country] || "Other",
    // Indicator values keyed by code; null where the workbook has no value.
    scores: Object.fromEntries(
      dataset.codes.map((code) => [code, observation.scores[CODE_INDEX[code]]]),
    ),
  };
  for (const pillar of PILLARS) {
    record[pillar.key] = observation.scores[CODE_INDEX[pillar.id]];
  }
  return record;
}

/** Every country-year record, grouped by year: `PANEL[2025]` → array of records. */
export const PANEL = dataset.observations.reduce((acc, o) => {
  (acc[o.year] ||= []).push(toRecord(o));
  return acc;
}, {});
for (const year of Object.keys(PANEL)) {
  PANEL[year].sort((a, b) => a.rank - b.rank);
}

/** The reference-year snapshot every ranking, chart and profile is built from. */
export const COUNTRIES = PANEL[REFERENCE_YEAR];

const BY_NAME = Object.fromEntries(COUNTRIES.map((c) => [c.name, c]));

export const getCountry = (name) => BY_NAME[name];

/** Look up a record for any year, e.g. for year-over-year comparisons. */
export const getCountryYear = (name, year) =>
  (PANEL[year] || []).find((c) => c.name === name);

export const OIC_AVERAGE =
  COUNTRIES.reduce((s, c) => s + c.adei, 0) / COUNTRIES.length;

/** Mean ADEI across all member states for a given year. */
export const oicAverageFor = (year) => {
  const rows = PANEL[year] || [];
  return rows.length ? rows.reduce((s, c) => s + c.adei, 0) / rows.length : null;
};

export const OIC_AVERAGE_LABEL = "OIC Average";

/**
 * ADEI trajectory per country across `YEARS`, plus the OIC average series.
 * Values are `null` for a year a country has no observation, which Recharts
 * renders as a gap rather than a drop to zero.
 */
export const TREND_DATA = (() => {
  const series = {};
  for (const country of COUNTRIES) {
    series[country.name] = YEARS.map(
      (year) => getCountryYear(country.name, year)?.adei ?? null,
    );
  }
  series[OIC_AVERAGE_LABEL] = YEARS.map((year) => {
    const avg = oicAverageFor(year);
    return avg === null ? null : parseFloat(avg.toFixed(2));
  });
  return series;
})();

/** Cluster thresholds as published with the index and verified against the workbook. */
const CLUSTER_RULES = META.clusterRules.map((r) => ({
  label: r.label,
  min: r.min === null ? -Infinity : r.min,
  ...(CLUSTER_STYLE[r.label] || { color: "#40916C", bg: "#F1F8F6" }),
}));

export const CLUSTERS = CLUSTER_RULES.map(({ label, color, bg }) => ({
  label,
  color,
  bg,
}));

export const getCluster = (adei) =>
  CLUSTER_RULES.find((r) => adei >= r.min) ||
  CLUSTER_RULES[CLUSTER_RULES.length - 1];

export function findCountryByGeoName(countryName) {
  if (!countryName) return undefined;
  const mapped = GEO_NAME_MAP[countryName] || countryName;
  const mappedLower = mapped.toLowerCase();
  const rawLower = countryName.toLowerCase();
  return COUNTRIES.find((c) => {
    const n = c.name.toLowerCase();
    return n === mappedLower || n === rawLower;
  });
}

// ─── FINDEX ─────────────────────────────────────────────────────────────────
/**
 * Global Findex source values behind sub-indicators 8.1.1–8.1.3, as percentages
 * of adults, together with the countries the survey does not cover (those carry
 * the workbook's documented floor value rather than an observation).
 */
export const FINDEX = {
  ...dataset.findex,
  labels: Object.fromEntries(
    dataset.findex.codes.map((code) => [code, labelFor(code)]),
  ),
};

/** Countries whose pillar-8 FinTech inputs are imputed rather than observed. */
export const FINDEX_IMPUTED_COUNTRIES = [
  ...new Set(Object.values(dataset.findex.imputed).flat()),
].sort();

// ─── DATA-QUALITY HELPERS ───────────────────────────────────────────────────
export const dataQualityBy = (id) => DATA_QUALITY.filter((i) => i.id === id);
