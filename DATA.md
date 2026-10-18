# Data pipeline and source review

The current source is **18 Oct_New findex_Master_Data collection.xlsx**, supplied
on 18 October 2026. This is a source revision of the **2025 assessment**, not a new
2026 assessment. The dashboard covers 57 countries in 2021–2025: 285 country-year
observations, with 9 pillars, 32 indicators, and 21 sub-indicators (62 score fields).

```text
18 Oct_New findex_Master_Data collection.xlsx
  -> npm run build:data
  -> src/data/adei-dataset.json
  -> src/data/index.js
  -> src/views/ and src/App.jsx
```

The workbooks are read without editing or recalculating them. Cached published
scores are retained. Missing values stay `null`; a stored numeric zero stays
zero. Historical ranks and clusters are derived from each year's published ADEI.
The generated dataset records the source filename, source revision date, SHA-256
fingerprint, build timestamp, sheet provenance, and data-quality findings.

Source workbooks are kept locally and excluded from Git. The committed generated
dataset is sufficient to run or build the dashboard; rebuilding or validating
the dataset requires a local copy of the source workbook.

## What the 18 October revision changes

A value-and-formula comparison of all 30 shared sheets with the preceding
`New findex_Master_Data collection.xlsx` found **13 changed cached cell values**,
**6 changed or removed formulas**, and no formula-only differences. Changes are
confined to `OIC_2024 origin`, `OIC_2024 clear`, and `OIC_2024 norm`; the other 27
shared sheets are unchanged. The new workbook has 31 sheets because it adds a
linked `Malaysia` profile. That profile reads the master panel and is not a
replacement data source.

All six changed score fields concern **Malaysia in 2021**:

| Measure | Previous | Updated | `OIC_2024 norm` cell |
| --- | ---: | ---: | --- |
| 3.1 Education expenditure | 4.5 | unavailable | AF265 |
| 3 Workforce | 4.5 | unavailable | AI265 |
| 5.2 University–industry collaboration | 25.08 | 68.3 | AO265 |
| 5 Innovation | 41.12 | 51.925 | AR265 |
| 8.2 Market capitalisation | 124.4 | 0 | BE265 |
| 8 Financial Market Development | 91.713029 | 59.026059 | BF265 |
| ADEI | 71.408479 | 68.230032 | BO265 |
| Rank | 1 | 2 | BP265 |

The UAE's 2021 rank consequently changes from 2 to 1 (`BP290`). The 2021 OIC
average changes from 31.030460 to 30.974697. Malaysia's published trajectory is
now 68.230032, 68.531934, 69.166909, 71.087586, 71.566676 for 2021–2025.
Trend charts, progress calculations, and historical averages use this revision.

**Every 2022–2025 score is unchanged.** In 2025 the leading countries remain the
UAE (75.233937), Malaysia (71.566676), and Saudi Arabia (69.201872). The OIC mean
remains 34.707373, with 6 Advanced, 15 Emerging, and 36 Foundational economies.

### Traced source and calculation changes

- The university–industry collaboration lookup in `OIC_2024 origin!AJ274` now
  uses the label `University/industry research collaboration`, matching
  `GII 2020!B286:C286`. It returns 68.3 instead of zero. The corresponding filled
  cell `OIC_2024 clear!AJ274` now links that observation instead of using the
  25.08 floor. The missing-data diagnostics `origin!AJ303:AJ304` update from
  123 to 122 missing values and from 42.560554% to 42.214533%.
- The education and Workforce cells `norm!AF265` and `AI265` have been removed,
  although the collected and filled education source still contains 4.5
  (`origin!AA274`, `clear!AA274`). Their intended removal is not explained in
  the workbook. The dashboard preserves these gaps and identifies Malaysia
  2021 in its historical coverage notes.
- `norm!BE265` replaces the link to `clear!AW274` (124.4) with a literal zero.
  `BF265` changes from `AVERAGE(BD265:BE265)` to `AVERAGE(BD265)`, excluding 8.2
  from that year's pillar aggregate. The published pillar score is retained and
  this exception to the usual mean of 8.1 and 8.2 is disclosed.
- `norm!BO265` keeps the same weighted ADEI formula. Excel treats the blank
  Workforce input as a zero contribution to this formula. This explains the
  cached 68.230032 ADEI; it does not establish an observed zero Workforce score.
  All 284 complete country-year rows reconcile to the weighted nine-pillar sum
  within 0.000001 points. The remaining row is separately identified as having
  an incomplete pillar set.

## Authoritative sheets

| Sheet | Role in the dashboard |
| --- | --- |
| `OIC_2024 norm` | Published master scores for every country-year. Its six header rows define aligned codes and the indicator hierarchy. |
| `2025 ranked` | Independent cross-check of every reference-year score, ADEI, rank, and cluster. |
| `OIC_2024 origin` | Collected Findex inputs and missing-observation flags. |
| `OIC_2024 clear` | Filled Findex percentages used by the scoring workbook. |
| `ref` | Official pillar weights and source/methodology references. |
| `01_raw_data_2025` | Country-to-ISO3 lookup only. |
| `Malaysia` | New linked country profile; no independent source values. |
| `02_data_filled_2025`, `04_normalised_2025`, `05_index_results_2025` | Older staging calculations, excluded from scores. |

Source extracts such as NRI, GII, UN EGDI, governance, SDGs, AI, and the Findex
releases remain available in the workbook for provenance. The `01`–`05` staging
calculation chain was not refreshed after the earlier Findex update: its own
checkers identify pillar-8 and ADEI differences. For example, the staging result
for the UAE is 77.73, while the authoritative current result is 75.23.

## Other source limitations retained and disclosed

### Findex coverage and a collected/filled discrepancy

For 2025, the origin sheet records no observation as zero for 14 countries on
8.1.1, 17 on 8.1.2, and 17 on 8.1.3. The filled sheet substitutes the documented
floor (minimum observed less 5%). The dataset stores the exact affected-country
list separately for each code, along with the filled inputs as adult percentages.
Those values contribute to pillar 8 and ADEI but are not survey observations.
Methodology lists the countries, while profiles, exports, and policy views show
country-specific coverage notes.

An additional **pre-existing** inconsistency affects Türkiye's 2025 8.1.2:
the collected card-ownership input in `OIC_2024 origin!AU60` is **43.670713%**,
while `OIC_2024 clear!AU60` contains **0.444064%**, despite a nonzero collected
observation. This is reported separately from missing-data imputation in
`findex.sourceDifferences` and the dashboard. The source inputs and published
scores are preserved. Policy advice based on affected low financial-market
scores first calls for source validation.

The workbook also labels 8.1.2 as debit-or-credit-card ownership while its
source-variable row says credit-card ownership. The dashboard retains the
sub-indicator wording; it does not relabel the underlying measure by assumption.

### Historical ranks and unavailable indicators

The reference-year ranks and clusters match the dashboard. Earlier years contain
55 stale ranks and 20 missing/error rank values, including pre-existing Excel
`#N/A` errors caused by incorrect ranking ranges. Earlier-year cluster cells are
empty. Every year is therefore ranked from its own ADEI and clustered using the
published thresholds: Advanced ≥60, Emerging ≥40, Foundational <40.

Indicators 3.2 and 3.3 contain `dna` for all 57 countries in 2021, contributing
114 unavailable score fields. Together with Malaysia's two newly absent cells,
the panel has 116 null score fields. The workbook stores numeric zeros for 3.2
and 3.3 in 2022; those zeros are retained. Every null is declared with its exact
code, year, country, and original marker or blank status.

### Geography and country names

The workbook's region column is only partially populated and misclassifies
several countries. Geographic views use the existing curated `REGIONS` map in
`src/data/index.js`. `Gambia, The` is canonicalised to `Gambia` to match dashboard
lookups and the map. Validation checks region, ISO3, coordinate, and name-alias
coverage so missing lookups fail visibly.

## Rebuild and verification

```bash
npm run build:data
npm run validate:data
npm run build
```

`build:data` defaults to the 18 October workbook. An explicit workbook path can
be supplied to `node scripts/build-dataset.mjs`. If a build detects an ingestion
error, it exits unsuccessfully without replacing the previous dataset.

`validate:data` independently reads `2025 ranked`, the full master panel, raw and
filled Findex inputs, and published weights. It checks the source identity and
fingerprint, all 17,670 country-year score fields, ADEI, derived historical ranks
and clusters, complete-row aggregation, exact missing-value declarations, Findex
values and flags, trends, and all lookups used by the views. It exits nonzero on
failure. Source warnings remain visible even when faithful ingestion passes.

For a read-only comparison of every sheet, including cached values and formulas:

```bash
node scripts/review-workbook.mjs
```

Use `--panel-only` for a quicker comparison of the dashboard and supporting
sheets. The script prints its JSON review and never modifies either workbook.
The optional comparison requires the preceding workbook locally; it is not
included in the repository. Alternative source paths can be supplied as the
updated workbook followed by the previous workbook.
