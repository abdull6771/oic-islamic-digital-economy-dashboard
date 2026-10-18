/**
 * Source families traced to the master workbook's `ref` sheet and the formulas
 * in `OIC_2024 origin`. These describe provenance, not a fresh verification of
 * the publishers' data or a claim that every numeric workbook value is observed.
 * Source editions and observation years can differ from the index year.
 */
const SOURCES = {
  wgi: "World Bank Worldwide Governance Indicators (WGI)",
  nri: "Portulans Institute / Saïd Business School, Network Readiness Index (NRI)",
  gii: "WIPO Global Innovation Index (GII)",
  egdi: "UN E-Government Development Index (EGDI), via World Bank Data360",
  ai: "OECD.AI Global AI Initiatives Navigator",
  findex: "World Bank Global Findex Database",
  sdg: "SDSN / Bertelsmann Stiftung, Sustainable Development Report",
};

const SOURCE_CODES = {
  wgi: ["1.1", "1.1.1", "1.1.2", "1.1.3", "1.2", "1.2.1", "1.2.2", "1.2.3"],
  nri: [
    "1.3", "1.3.1", "1.3.2", "1.3.3", "1.3.4", "1.3.5", "1.3.6", "1.3.7",
    "2.3", "2.3.1", "2.3.2", "2.3.3", "2.3.4", "2.3.5",
    "3.2", "3.3", "6.1", "6.2",
  ],
  gii: ["2.1", "2.2", "2.4", "3.1", "5.1", "5.2", "5.3", "5.4", "7.1", "7.2", "7.3", "8.2"],
  egdi: ["4.1", "4.2", "4.3"],
  ai: ["6.3"],
  findex: ["8.1", "8.1.1", "8.1.2", "8.1.3"],
  sdg: ["9.1", "9.2", "9.3", "9.4", "9.5", "9.6", "9.7"],
};

const FAMILIES_BY_CODE = Object.fromEntries(
  Object.entries(SOURCE_CODES).flatMap(([family, codes]) =>
    codes.map((code) => [code, [family]]),
  ),
);

// Pillars combine their constituent source families; they are published
// workbook aggregates, rather than separate source observations.
Object.assign(FAMILIES_BY_CODE, {
  1: ["wgi", "nri"],
  2: ["gii", "nri"],
  3: ["gii", "nri"],
  4: ["egdi"],
  5: ["gii"],
  6: ["nri", "ai"],
  7: ["gii"],
  8: ["findex", "gii"],
  9: ["sdg"],
});

/** Source label and interpretation notes for a pillar/indicator code. */
export function indicatorSourceFor(code, year) {
  const normalizedCode = String(code ?? "").replace(/^p/, "");
  const families = FAMILIES_BY_CODE[normalizedCode];
  if (!families) {
    return {
      label: "Master workbook",
      note: "No indicator-specific source family is mapped for this code. The dashboard retains the published workbook value.",
    };
  }

  const numericYear = Number(year);
  const notes = [
    "Source families follow the workbook's references and linked source sheets. The index year can differ from the source publication or observation year.",
  ];

  if (!normalizedCode.includes(".")) {
    notes.push("This is a published workbook pillar aggregate, not a separate source observation.");
  } else if (["1.1", "1.2", "1.3", "2.3", "8.1"].includes(normalizedCode)) {
    notes.push("This is a published workbook aggregate of the sub-indicators shown below it.");
  }

  if (families.includes("egdi")) {
    notes.push("The linked worksheet is named UN EGDI; the workbook reference cites the UN_EGDI dataset distributed through World Bank Data360.");
  }

  if (families.includes("findex")) {
    if (numericYear === 2025) {
      notes.push("The 2025 index uses Global Findex 2025 data from the 2024 survey wave. Documented coverage and filled-input flags are available for this index year.");
    } else {
      notes.push("Historical index years use the workbook's earlier Findex inputs. The dashboard's detailed Findex coverage flags describe 2025 only.");
    }
  }

  if (normalizedCode === "8.1.2") {
    notes.push('The workbook label says "debit or credit card", but its source-variable row says "Owns a credit card". The dashboard preserves that wording discrepancy rather than assuming the measures are equivalent.');
  }

  if (normalizedCode === "3.1") {
    notes.push("The education-expenditure label names the underlying measure. Displayed values are the published master-panel values, not a separately verified percentage of GDP; source editions use different representations, so changes across years require care.");
  }

  if (["3.2", "3.3"].includes(normalizedCode)) {
    if (numericYear === 2021) {
      notes.push('The workbook marks this indicator "dna" for every country in 2021; the dashboard preserves these values as unavailable.');
    } else if (numericYear === 2022) {
      notes.push('The published panel stores numeric zeros in 2022, while the collected-input sheet marks "dna". Those zeros are retained as workbook values and are not verified observed zeros.');
    }
  }

  return {
    label: families.map((family) => SOURCES[family]).join("; "),
    note: notes.join(" "),
  };
}
