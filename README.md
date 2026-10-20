# OIC Digital Economy Index (DEI) Dashboard

An interactive dashboard presenting the **OIC Digital Economy Index (ADEI)** — a composite index that scores the **57 member states of the Organisation of Islamic Cooperation (OIC)** on their digital-economy readiness (2025 assessment).

It is an academic and policy project from **INCEIF University**, based on the *Digital Economy Index: OIC Countries 2025 — Policy Report* (Salim, Abdul Hamid, Disli, Lutfi & Cahyono, 2026).

## What it shows

Each country is scored 0–100 across **9 weighted pillars** (Institutions, Infrastructure, Workforce, E-Government, Innovation, Future Technologies, Market Development, Financial Market Development, and SDGs) and ranked by a composite ADEI score.

The dashboard presents this through interactive tabs, including:

- **Global Overview** — world map, rankings, and headline statistics
- **Country Profiles** — per-country pillar breakdowns and indicator drill-down
- **Compare Countries** — side-by-side comparison
- **Pillar & Geographic Analysis** — performance by pillar and by region
- **Trends & Progress** — 2021–2025 trajectories
- **Custom Index Builder** — re-weight the pillars to build your own index
- **Report Downloads** — choose countries or regions, then download PDFs in a ZIP or one combined PDF with linked contents
- **What-if Calculator** — simulate pillar improvements and their effect on score and rank
- **Data-quality Explorer** — search country-by-indicator scores, coverage states, and source notes
- **Update History** — review score and ranking changes across workbook revisions
- **Statistical Analysis** and **Methodology** — data, sources, and how the index is built

## Tech stack

- **React 18** + **Vite 5**
- **Recharts** (charts) and **react-simple-maps** + **d3-scale** (world map)

The app has no backend. The index is generated from the master Excel workbook into a JSON dataset that is bundled at build time, so the app runs and deploys as static files.

## Explore indicators

In **Country Profiles**, choose a country and click **View indicators** on any
pillar in **Pillar score breakdown**. The expanded panel shows its indicators
and sub-indicators, the country's published scores, same-year OIC means, and
differences in score points. Switching country keeps the chosen pillar open.

Expand **Source and notes** for an indicator to see its source family, workbook
variable, and interpretation notes. Findex inputs distinguish collected values,
imputed floors, and source differences. Other numeric values are labelled
**Workbook value**; they are not automatically classified as observations.
Unavailable values stay as dashes, and means exclude them while retaining
published numeric zeros and filled inputs.

Run `npm run validate:indicators` to verify the drill-down scores, hierarchy,
benchmarks, and coverage notes against all five years of the generated dataset.

## Download country reports

Open **Country Profiles**, then use **Download all 57 reports (ZIP)** in the
profile toolbar. One ZIP contains a separate, searchable
two-page PDF for each country, including its scores, rankings, pillar comparison,
regional peers, recommendations, and relevant source coverage notes.

The export shows progress and can be cancelled or retried. The existing
**Download PDF** action exports just the selected country using the same report
format. PDF and ZIP generation run in the browser; source workbooks stay local.
The country count follows the dataset automatically; the current dataset
contains 57 countries.

**Report Downloads** also starts with direct **Download all 57 reports (ZIP)**
and **Download all 57 reports (combined PDF)** actions. Both include every country
regardless of any search or custom selection, and show progress, cancel, and
retry controls beside the action.

Run `npm run validate:reports` to check the real PDF/ZIP output, country coverage,
progress, and cancellation. PDF and ZIP libraries load only when a report
download is requested.

For a custom collection, open **Report Downloads** from Tools or follow
**Choose countries, regions or combined PDF** in Country Profiles. Select whole
regions, individual countries, or all 57. Choose separate PDFs in a single ZIP
or a combined PDF with clickable contents and continuous page numbers. Both
formats follow the published OIC ranking and support progress, cancellation,
and retry.

## Simulate improvements and inspect data

**What-if Calculator** starts from the selected country's published 2025 scores.
Raise one or more pillars to see the weighted score contribution, hypothetical
rank, and classification. Official weights apply and other countries remain
fixed. Ties share a competition rank. Reset restores the published baseline;
the scenario never changes the dashboard dataset.

**Data-quality Explorer** provides country, region, year, pillar, status and text
filters, pagination, source notes and filtered CSV export. Verified 2025 Findex
leaves distinguish observed inputs, imputed inputs and a source discrepancy.
Other numeric scores are **Not classified** where provenance has not established
observation or imputation. Unavailable scores stay distinct from numeric zero.

**Update History** compares the three available local workbook revisions, with
country-year score and rank differences, detailed pillar/indicator changes,
filters and CSV export. Dates are shown only where established. The first
workbook is the baseline; earlier unarchived revisions are not reconstructed.
`build:data` automatically appends future revisions when the workbook fingerprint
changes. Reimporting the same workbook does not duplicate history.

Run `npm run validate:what-if`, `npm run validate:quality` and
`npm run validate:history` for the corresponding model and archive checks.

## How to run

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer (includes npm)

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server

```bash
npm run dev
```

Then open the URL Vite prints in the terminal (default: `http://localhost:5173`).

### 3. Build for production

```bash
npm run build
```

The static build is generated in the `dist/` folder. To preview that build locally:

```bash
npm run preview
```

## Project structure

```
.
├── index.html                        # HTML entry point
├── 18 Oct_New findex_Master_Data collection.xlsx # local source; not committed
├── scripts/
│   ├── build-dataset.mjs             # workbook → src/data/adei-dataset.json
│   ├── validate-dataset.mjs          # checks every country-year against the workbook
│   └── review-workbook.mjs           # compares revisions across all source sheets
├── src/
│   ├── main.jsx                      # React bootstrap; mounts the app
│   └── data/
│       ├── adei-dataset.json         # generated — do not hand-edit
│       └── index.js                  # data layer the views import
├── oic_dashboard.jsx                 # entry shim and map coordinates
├── DATA.md                           # data pipeline, provenance, known caveats
├── vite.config.js
└── package.json
```

## Updating the data

The Excel workbook is the source of truth. No score, rank or weight is written
into `oic_dashboard.jsx` — the views read everything through `src/data/index.js`.

Source workbooks stay local and are excluded from Git. The dashboard runs and
builds from the committed JSON dataset without needing the workbook. To rebuild
or validate that dataset, place the source workbook in the project folder or
supply its path explicitly.

```bash
npm run build:data       # regenerate src/data/adei-dataset.json from the workbook
npm run validate:data    # source identity, all panel values, rankings, and coverage
npm run build            # bundle
```

`build:data` defaults to the workbook filename above; pass another path to use a
different one:

```bash
node scripts/build-dataset.mjs "some other workbook.xlsx"
```

Both scripts print their findings and exit non-zero on an ingestion or validation
failure. The build preserves the previous dataset if its checks fail. See
**[DATA.md](DATA.md)** for the 18 October revision, authoritative sheets, missing
historical Workforce values, and Global Findex source limitations.

To compare the current workbook with the preceding revision, including source
values and formulas on every sheet:

```bash
node scripts/review-workbook.mjs
```

This optional comparison also needs the preceding workbook available locally.
To use different files, pass the updated workbook path followed by the previous
workbook path. The previous workbook is not included in the repository.

The 18 October revision changes Malaysia's 2021 results and the corresponding
historical comparison. The 2022–2025 scores, including the current 2025 rankings,
are unchanged. The assessment year remains 2025; the source refresh date is
18 October 2026.

---

© 2026 INCEIF University — The Global University of Islamic Finance.
