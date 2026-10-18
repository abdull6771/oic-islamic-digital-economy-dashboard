# OIC Digital Economy Index (DEI) Dashboard

An interactive dashboard presenting the **OIC Digital Economy Index (ADEI)** — a composite index that scores the **57 member states of the Organisation of Islamic Cooperation (OIC)** on their digital-economy readiness (2025 assessment).

It is an academic and policy project from **INCEIF University**, based on the *Digital Economy Index: OIC Countries 2025 — Policy Report* (Salim, Abdul Hamid, Disli, Lutfi & Cahyono, 2026).

## What it shows

Each country is scored 0–100 across **9 weighted pillars** (Institutions, Infrastructure, Workforce, E-Government, Innovation, Future Technologies, Market Development, Financial Market Development, and SDGs) and ranked by a composite ADEI score.

The dashboard presents this through interactive tabs, including:

- **Global Overview** — world map, rankings, and headline statistics
- **Country Profiles** — per-country pillar breakdowns
- **Compare Countries** — side-by-side comparison
- **Pillar & Geographic Analysis** — performance by pillar and by region
- **Trends & Progress** — 2021–2025 trajectories
- **Custom Index Builder** — re-weight the pillars to build your own index
- **Statistical Analysis** and **Methodology** — data, sources, and how the index is built

## Tech stack

- **React 18** + **Vite 5**
- **Recharts** (charts) and **react-simple-maps** + **d3-scale** (world map)

The app has no backend. The index is generated from the master Excel workbook into a JSON dataset that is bundled at build time, so the app runs and deploys as static files.

## Download country reports

Open **Country Profiles**, then use **Download all 57 reports (ZIP)** in the
**Download country reports** section. One ZIP contains a separate, searchable
two-page PDF for each country, including its scores, rankings, pillar comparison,
regional peers, recommendations, and relevant source coverage notes.

The export shows progress and can be cancelled or retried. The existing
**Download PDF** action exports just the selected country using the same report
format. PDF and ZIP generation run in the browser; source workbooks stay local.
The country count follows the dataset automatically.

Run `npm run validate:reports` to check the real PDF/ZIP output, country coverage,
progress, and cancellation. PDF and ZIP libraries load only when a report
download is requested.

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
