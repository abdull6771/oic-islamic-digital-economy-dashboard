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
├── New findex_Master_Data collection.xlsx   # master workbook — the source of truth
├── scripts/
│   ├── build-dataset.mjs             # workbook → src/data/adei-dataset.json
│   └── validate-dataset.mjs          # cross-checks the app against the workbook
├── src/
│   ├── main.jsx                      # React bootstrap; mounts the app
│   └── data/
│       ├── adei-dataset.json         # generated — do not hand-edit
│       └── index.js                  # data layer the views import
├── oic_dashboard.jsx                 # all views
├── DATA.md                           # data pipeline, provenance, known caveats
├── vite.config.js
└── package.json
```

## Updating the data

The Excel workbook is the source of truth. No score, rank or weight is written
into `oic_dashboard.jsx` — the views read everything through `src/data/index.js`.

```bash
npm run build:data       # regenerate src/data/adei-dataset.json from the workbook
npm run validate:data    # 36 checks: the app's values vs the workbook
npm run build            # bundle
```

`build:data` defaults to the workbook filename above; pass another path to use a
different one:

```bash
node scripts/build-dataset.mjs "some other workbook.xlsx"
```

Both scripts print the data-quality findings they detect and exit non-zero on a
real problem, so they work as a CI or pre-commit gate. See **[DATA.md](DATA.md)**
for which sheets are authoritative, how the index is reconstructed, and the
caveats that ship with the current workbook (notably Global Findex coverage gaps
affecting pillar 8).

---

© 2026 INCEIF University — The Global University of Islamic Finance.
