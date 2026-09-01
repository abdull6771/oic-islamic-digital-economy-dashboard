# Data pipeline

The dashboard shows nothing but what the master Excel workbook contains. This
document records where each number comes from, how it gets into the app, and
which quirks of the workbook the pipeline deliberately works around.

```
New findex_Master_Data collection.xlsx
        │
        │  npm run build:data      (scripts/build-dataset.mjs)
        ▼
src/data/adei-dataset.json         generated — never hand-edit
        │
        │  src/data/index.js       adds presentation metadata, derives series
        ▼
oic_dashboard.jsx                  views only; no index value is written here
```

Re-run `npm run build:data` whenever a new workbook arrives, then
`npm run validate:data` to confirm the app still agrees with the source.

## Which sheets are authoritative

The workbook has 30 sheets. Most are untouched source extracts (`NRI 2020-2024`,
`GII 2020-2024`, `UN EGDI`, `Governance`, `SDR2025 Data`, `Backdated SDG Index`,
`AI`, `Findex`, `Findex 25`) kept for provenance. Four sheets carry the computed
index, and only some of them are current.

| Sheet | Role | Used by the build |
| --- | --- | --- |
| `OIC_2024 origin` | Panel as collected. `0` marks "not observed". | Findex coverage only |
| `OIC_2024 clear` | Same panel, raw units, gaps filled | Findex source percentages |
| `OIC_2024 norm` | **Master normalised panel** — 57 countries × 5 years (2021–2025), 65 indicator/pillar columns plus ADEI, Rank, Clusters | **yes — every score** |
| `2025 ranked` | The 2025 slice of `OIC_2024 norm` | validation cross-check |
| `ref` | Source citations and the official pillar weights | weights, provenance |
| `indicator` | Indicator hierarchy, without codes | not used — see below |
| `01_raw_data_2025` | Staging, plus a country → ISO3 table | ISO3 codes only |
| `02_data_filled_2025`, `04_normalised_2025`, `05_index_results_2025` | Staging | **no — stale** |

`OIC_2024 norm` carries the indicator hierarchy in its own header rows (row 1
dimension, row 2 pillar, row 3 indicator, row 4 code, row 5 sub-indicator, row 6
source variable), each aligned to the column it describes. The build reads the
structure from there rather than from the `indicator` sheet, which lists the same
hierarchy without codes and so could only be matched to columns by guessing.

## Data-quality findings

These are properties of the workbook. The pipeline handles each one explicitly
and reports it; none of them is repaired by editing the source.

**1. The `01`–`05` staging sheets were not recomputed after the Findex refresh.**
Those sheets carry their own checker columns, and in this workbook they read
`DIFF` for pillar 8 and for ADEI on every country — `05_index_results_2025` still
holds the pre-refresh scores (UAE 77.73 where the master panel now says 75.23).
The build ignores them and reads `OIC_2024 norm`.

**2. Global Findex does not cover every member state.** Sub-indicators 8.1.1–8.1.3
come from the Global Findex database. In `OIC_2024 origin`, 14–17 of the 57
countries have `0` — no observation — and `OIC_2024 clear` substitutes the
documented floor value (minimum observed less 5%, per the `ref` sheet) instead of
leaving a gap. Those countries therefore score near-zero on the FinTech
indicators regardless of their actual financial inclusion, which pulls down
pillar 8 and, through it, ADEI. The affected set includes several high-income
economies — the UAE, Bahrain, Kuwait and Qatar among them. The dashboard states
this on the Methodology → Data Sources tab and lists every affected country.

**3. `Rank` and `Clusters` are only current for the reference year.** In the
master panel those two columns are correct and complete for 2025, but for
2021–2024 they hold 55 stale ranks and 20 blanks, left over from before the
Findex refresh; the cluster column is empty for every earlier year. The build
therefore derives rank and cluster for *every* year from ADEI, using the index's
own published rule (≥60 Advanced, ≥40 Emerging, otherwise Foundational). That
rule reproduces the workbook's 2025 values exactly for all 57 countries, which is
asserted on every build — if a future workbook changes the thresholds, the build
fails rather than silently relabelling countries.

**4. Indicators 3.2 and 3.3 are unavailable for 2021.** Both are the literal
string `dna` for all 57 countries in 2021 (and `0` in 2022). They are carried
through as `null`, not zero. The workbook computes the 2021 pillar-3 aggregate
from indicator 3.1 alone, and the build leaves that aggregate as it found it.

**5. The panel's `Region` column is unusable.** It is filled for 9 of 57 rows and
several of those are wrong — Pakistan, Senegal and the Kyrgyz Republic are all
tagged `GCC`. Geographic Analysis uses the curated `REGIONS` map in
`src/data/index.js` instead.

**6. One country is spelled differently from the rest of the app.** The workbook
says `Gambia, The`; the dashboard and the world-map topology say `Gambia`.
`COUNTRY_NAME_ALIASES` in the build script maps it, so region and map-coordinate
lookups resolve. Any future spelling drift surfaces as a failed
`npm run validate:data` check rather than a country silently losing its region.

**7. 8.1.2 has two different descriptions in the workbook.** The sub-indicator
label reads "the percentage of those who own a debit or credit card" while the
source-variable row for the same column reads "Owns a credit card (% age 15+)".
The dashboard uses the sub-indicator wording, matching the published index. The
underlying values are unchanged either way.

## What changed in this workbook

Compared with the previous master (`check_updated yemen palestine_225 Jun_…`),
the workbook adds one sheet — `Findex 25`, the Global Findex 2025 release (2024
survey wave) — and a matching citation in `ref`. A cell-by-cell diff of every
shared sheet shows the effect is confined to the Findex-derived chain:

| Changed | Not changed |
| --- | --- |
| 8.1.1, 8.1.2, 8.1.3 (all five years) | every indicator in pillars 1–7 and 9 |
| 8.1 and pillar 8, as a consequence | 8.2 (market capitalisation) |
| ADEI and Rank, as a consequence | the 9 pillars, their weights, the 32/21 indicator structure |
| — | the 57 countries and the 2021–2025 year range |

27 of 57 countries change rank in 2025. Because the refresh reaches back through
all five years, the historical ADEI trajectory changed for every country too, so
the trend charts are rebuilt from the panel rather than from the previously
hard-coded series.

## Generated dataset

`src/data/adei-dataset.json` (~200 KB) holds:

- `meta` — source file, build timestamp, years, reference year, pillar/indicator
  counts, cluster rules, name aliases, and the numeric self-checks the build ran
- `pillars` — id, weight (from `ref`), and the workbook's own naming
- `codes` — the indicator codes, in workbook column order; `observations[].scores`
  is aligned to this array
- `indicators` — one entry per code with its level, parent, workbook label and
  source variable
- `countries` — name and ISO3
- `observations` — one row per country-year: ADEI, derived rank and cluster, and
  the score array
- `findex` — the raw Global Findex percentages behind 8.1.1–8.1.3 and the list of
  countries whose values are imputed
- `dataQuality` — the findings above, as structured records the UI renders

`src/data/index.js` turns that into the shapes the views use (`COUNTRIES`,
`PANEL`, `TREND_DATA`, `PILLARS`, `PILLAR_INDICATORS`, `getCluster`, …) and is the
only module that mixes measured values with presentation choices such as colour,
short labels and regional grouping.

## Validation

`npm run validate:data` re-reads the workbook independently of the build — it
walks `2025 ranked` where the build reads `OIC_2024 norm` — and asserts 36 checks
against the data layer the views import: country coverage, every indicator value,
ADEI, rank and cluster agreement, weights summing to 100, ADEI equalling the
weighted pillar sum, trend-series shape, region/ISO3/map-coordinate coverage,
indicator-tree structure, that every gap is one the build declared, and that no
value is `NaN`. It exits non-zero on failure, so it can gate a commit or a CI run.
