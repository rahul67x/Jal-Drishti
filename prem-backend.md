# JalDrishti — Project Record (`prem-backend`)

Single source of truth for: what this project is, what every file does, how the
pieces connect, and a running log of every change made from here on.

- **Project:** JalDrishti — Geospatial Intelligence for Watershed Development
- **Repo root:** `C:\Projects\Jal-Drishti`
- **Branch:** `main`
- **Audited on:** 2026-09-13
- **Last commit at audit time:** `4cbb90b Update JalDrishti GIS analysis and dashboard`

---

# PART 1 — DOES THE BUILD WORK?

## Verdict: YES. The build works.

| Check | Command | Result |
|---|---|---|
| Dependency install | `npm install` | PASS (exit 0). `node_modules` was **missing** before this — a fresh clone will not run until you install. |
| TypeScript compile | `tsc -b` (inside `npm run build`) | PASS — zero type errors |
| Production bundle | `vite build` | PASS — built in ~1.9s, 2536 modules |
| Lint | `npx oxlint` | PASS — 0 errors, 2 warnings (both in `InteractiveMap.tsx`) |
| Dev server | `npm run dev` -> http://localhost:5173 | PASS — renders |
| Runtime browser check | loaded page, opened `#analytics` | PASS — **0 console errors**, Leaflet map draws, GeoTIFF rasters decode and overlay, charts render, tabs switch |

## Production bundle output

```
dist/index.html                    0.70 kB   gzip:   0.42 kB
dist/assets/index-*.css           73.83 kB   gzip:  16.97 kB
dist/assets/index-*.js           865.90 kB   gzip: 252.40 kB   <-- oversized
dist/assets/lerc-*.js             96.94 kB   (geotiff codec, lazy)
dist/assets/zstd-*.js             81.02 kB   (geotiff codec, lazy)
dist/assets/pako.esm-*.js         46.60 kB   (geotiff codec, lazy)
dist/assets/jpeg-*.js             10.80 kB   (geotiff codec, lazy)
+ 5 more small geotiff codec chunks
```

## Build warnings and issues found (nothing blocking)

1. **Main JS chunk is 866 kB** (252 kB gzipped) — over Vite's 500 kB warning
   limit. Cause: Leaflet + react-leaflet + Recharts + geotiff + lucide-react all
   land in one chunk. Fix later with `React.lazy()` on `AnalyticsDashboard`.
2. **Lint warning** `InteractiveMap.tsx:102` — `setState` called synchronously
   inside a `useEffect` (the water-layer sync effect). Causes an extra render pass.
3. **Lint warning** `InteractiveMap.tsx:101` — `useEffect` missing deps
   `water2023`, `water2026`. Deliberate (avoids a loop) but fragile.
4. **`public/gis/LULC_2026.tif` is MISSING from disk.** It is declared as a Git
   LFS file in `.gitattributes`, and HEAD holds only a 134-byte LFS pointer for a
   **482 MB** object. The real file was never pulled / is gone. No code
   references it, so the build and site are unaffected — but the LULC metrics
   shown in the UI are hardcoded numbers, not read from this raster.
5. ~~**Git index is in a strange state:** all 61 tracked files are staged as
   deleted (`D`) while the same files sit untracked (`??`). Looks like someone ran
   `git rm -r --cached .`.~~
   **RESOLVED in Entry 003 — and this diagnosis was wrong.** The real cause was
   that `.git/index` did not exist at all, with a stale 0-byte `.git/index.lock`
   blocking git from rebuilding it. Removing the stale lock and running
   `git reset` restored all 61 tracked files.
6. Very large payload for visitors: `public/gis/` ships **~11 MB** of GeoTIFFs
   that are fetched and decoded in the browser at runtime.

---

# PART 2 — FILE & ASSET MAP

## 2.1 Tech stack

| Layer | Choice |
|---|---|
| Framework | React 19.2 + TypeScript 6.0 |
| Bundler | Vite 8.2 (`@vitejs/plugin-react`) |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`) + custom CSS in `src/styles/theme.css` |
| Mapping | Leaflet 1.9 + react-leaflet 5.0 |
| Raster decoding | `geotiff` 3.0 (decodes `.tif` in-browser to a canvas data URL) |
| Charts | Recharts 3.10 |
| Icons | `lucide-react` 1.41 |
| Linter | oxlint 1.79 |

## 2.2 Application architecture (top-down)

```
index.html
  |-- src/main.tsx                       React root, StrictMode
        |-- src/App.tsx                  single-page scroll layout, 10 sections
              |
              |-- Hero.tsx               (top)           -> VideoBackground + Navbar
              |-- Challenge.tsx          #the-challenge   3 problem cards
              |-- WatershedDashboard.tsx #gis-analysis    decorative SVG "map" + 4 stat cards
              |-- analytics/AnalyticsDashboard.tsx  #analytics   *** THE REAL PRODUCT ***
              |-- Workflow.tsx                            5-step process timeline
              |-- AnalyticalOutputs.tsx                   6 capability cards
              |-- Impact.tsx                              dark stats band
              |-- Solution.tsx           #solution        4 benefit checklist
              |-- FinalCTA.tsx                            closing call-to-action
              |-- Footer.tsx                              footer
```

## 2.3 Root / config files

| File | Purpose |
|---|---|
| `index.html` | HTML shell. Sets `<title>`, meta description, favicon, mounts `#root`, loads `/src/main.tsx`. |
| `package.json` | Deps + scripts: `dev`, `build` (`tsc -b && vite build`), `lint`, `preview`. |
| `package-lock.json` | Locked dependency tree. |
| `vite.config.ts` | Vite config — only enables the React plugin and the Tailwind v4 plugin. No proxy, no env, no API config. |
| `tsconfig.json` | Root — references `tsconfig.app.json` and `tsconfig.node.json`. |
| `tsconfig.app.json` | App TS rules: ES2023, bundler resolution, `react-jsx`, `noUnusedLocals`/`noUnusedParameters` on. |
| `tsconfig.node.json` | TS rules for the Vite config file itself. |
| `.oxlintrc.json` | Lint config — react/typescript/oxc plugins, `rules-of-hooks` as error. |
| `.gitignore` | Ignores `node_modules`, `dist`, logs, editor dirs. |
| `.gitattributes` | One line: tracks `public/gis/LULC_2026.tif` via Git LFS. |
| `README.md` | WARNING: still the stock Vite+React template readme. Says nothing about JalDrishti. |
| `.claude/launch.json` | Dev-server launch config (added during this audit — see changelog). |

## 2.4 Entry & styling

| File | Purpose | Connects to |
|---|---|---|
| `src/main.tsx` | Creates the React root, imports `index.css`, renders `<App />`. | `index.css`, `App.tsx` |
| `src/App.tsx` | Composes all 10 page sections in order and assigns the scroll-anchor IDs the navbar links to. | every top-level component |
| `src/index.css` | 4 imports only: `fonts.css`, `tailwindcss`, `leaflet/dist/leaflet.css`, `theme.css`. | all styling |
| `src/styles/fonts.css` | Google Fonts imports: **Instrument Serif** (display) + **Inter** (body). Requires internet. | `theme.css` font classes |
| `src/styles/theme.css` | 359 lines. The design system: color tokens, `.font-serif-display`, `.glass`, `.card-hover`, `.btn-hover-scale`, `.reveal` scroll-reveal states, `.layer-toggle` switch, `.comparison-slider`, `.animate-flow`, `.animate-map-pulse`, `.stagger-*`, `.no-scrollbar`. | every component's className |

## 2.5 Landing-page components (`src/components/`)

| File | Lines | What it does | Data source |
|---|---|---|---|
| `Hero.tsx` | 50 | Full-screen hero. Headline, description, two buttons. Mounts `VideoBackground` and `Navbar`. | hardcoded |
| `VideoBackground.tsx` | 77 | Plays a **remote MP4 from a CloudFront URL** as the hero background. Custom `requestAnimationFrame` loop does a manual seamless loop with 0.5s fade in/out. Falls back to muted autoplay if blocked. | external CDN |
| `Navbar.tsx` | 85 | Fixed glass navbar. 5 anchor links + "Launch Platform". Mobile hamburger opens a full-screen drawer; locks `body` scroll while open. | hardcoded |
| `Challenge.tsx` | 72 | "Watersheds are changing faster..." + 3 problem cards (Fragmented Field Data / Limited Spatial Context / Delayed Decision-Making). | hardcoded |
| `WatershedDashboard.tsx` | 140 | **Decorative mock dashboard.** A hand-drawn `<svg>` pretending to be a map, plus 4 stat cards (NDVI 0.62, "12 Active Bodies", "Soil Moisture 42%", "1,248 observations"). None of these numbers come from the GIS data. | hardcoded placeholders |
| `Workflow.tsx` | 101 | 5-step pipeline (Geo-tagged Images -> Satellite -> GIS -> AI -> Insights). Separate desktop (horizontal) and mobile (vertical) layouts. | local `steps` array |
| `AnalyticalOutputs.tsx` | 157 | 6 capability cards, each with its own inline SVG/CSS illustration (LULC grid, NDVI gradient, drainage tree, water blobs, intervention dots, before/after split). | hardcoded |
| `Impact.tsx` | 60 | Dark green band. 4 stat tiles ("30 m", "360 degrees", "Scalable"). | hardcoded |
| `Solution.tsx` | 62 | Two-column: headline + 4-item benefit checklist. | local array |
| `FinalCTA.tsx` | 41 | Gradient closing section with an "Explore JalDrishti" button (**no handler — does nothing**). | hardcoded |
| `Footer.tsx` | 31 | Logo, tagline, "Smart India Hackathon 2026", 4 nav links (**no `href` — dead links**), copyright. | hardcoded |

> Note: the scroll-reveal hook `useReveal()` is **copy-pasted into 7 files**
> (`Challenge`, `WatershedDashboard`, `AnalyticalOutputs`, `Workflow`, `Impact`,
> `Solution`, `FinalCTA`). Should be extracted to `src/hooks/useReveal.ts`.

## 2.6 Analytics platform (`src/components/analytics/`) — the core

| File | Lines | What it does | Used by |
|---|---|---|---|
| `AnalyticsDashboard.tsx` | 276 | **Orchestrator.** Owns all state: `selectedArea`, `activeTab`, `baseLayer`, and the `layers` visibility object. Renders the study-area dropdown, the tab bar, 6 metric cards, then either the Change-Detection view or the Interactive Map, then charts + AI insights + data sources. Switching a tab auto-adjusts which map layers are on. | `App.tsx` |
| `AnalyticsTabs.tsx` | 44 | The 5-tab pill bar: Overview / Vegetation / Water / Change Detection / Field Data. Exports the `AnalyticsTabId` type. | `AnalyticsDashboard` |
| `MetricCard.tsx` | 86 | Reusable clickable KPI card — icon, label, value, subtext, badge, active ring, hover tooltip (`hint`). | `AnalyticsDashboard` x6 |
| `InteractiveMap.tsx` | 463 | **The Leaflet map.** Fetches the study-area GeoJSON, lazily decodes 5 GeoTIFFs on demand, fits the view to the real boundary, swaps base tiles (Esri satellite / Esri topo / OSM), renders 8 stacked overlays, and draws the floating info badge + dynamic legend. | `AnalyticsDashboard` |
| `MapLayerControls.tsx` | 346 | Floating "MAP LAYERS" panel — base-map switcher plus 7 overlay toggles, with Water Bodies as a parent holding Water 2023 / Water 2026 children. Exports `BaseLayerType` and the `LayerState` interface (the shape the whole dashboard passes around). | `InteractiveMap`, types used by `AnalyticsDashboard` |
| `FieldObservations.tsx` | 138 | Renders 18 Leaflet markers with custom `divIcon` circles colour-coded by category (vegetation/water/intervention/degradation) and a rich popup with a **simulated** thumbnail. | `InteractiveMap` |
| `geoTiffRenderer.ts` | 199 | **The GIS engine.** `loadAndRenderGeoTiff(url, colorMap, bounds?)` fetches a `.tif`, decodes it with the `geotiff` lib, paints pixels onto a `<canvas>` via a colour map, and returns a PNG data URL + lat/lng bounds for Leaflet's `ImageOverlay`. Caches results in a `Map` so toggling a layer never re-decodes. Also exports the three hardcoded bounding boxes. | `InteractiveMap` |
| `AnalyticsCharts.tsx` | 237 | 4 Recharts panels: Vegetation 2023 vs 2026 (bar), Water 2023 vs 2026 (bar), Water Change breakdown (bar), LULC 2026 (donut). Filtered by the `category` prop so each tab shows relevant charts. | `AnalyticsDashboard` |
| `BeforeAfterComparison.tsx` | 242 | Draggable before/after slider (mouse + touch). Both "satellite images" are **hand-drawn SVG illustrations**, not real imagery. Year dropdowns change only the label text. Plus 4 impact cards below. | `AnalyticsDashboard` |
| `ChangeDetection.tsx` | 120 | Exports two things: `ChangeDetection` (Leaflet polygons for change zones — **currently unused**) and `ChangeDetectionBanner` (the 4-tile stat strip — this one IS used). | `AnalyticsDashboard` (banner only) |
| `AIInsights.tsx` | 85 | "JalDrishti Insights" panel. **No AI is involved** — the "Generate Insights" button waits 1200 ms, shuffles a static array of 10 sentences, and shows 3. Footer claims "Model: HydroVision-v3.2 - confidence 94.2%". "Export Report" link does nothing. | `AnalyticsDashboard` |
| `DataSources.tsx` | 42 | Static 5-card strip describing the claimed data infrastructure (Sentinel-2, Landsat-8/9, SRTM DEM, ISO 19115, SRISHTI-DRISHTI). Purely informational. | `AnalyticsDashboard` |
| `VegetationLayers.tsx` | 121 | **DEAD FILE — imported by nothing.** Older Leaflet polygon renderer for vegetation/NDVI zones from `sampleData`. Superseded by the real GeoTIFF rasters. | — |
| `WaterLayers.tsx` | 162 | **DEAD FILE — imported by nothing.** Older Leaflet renderer for water-body markers from `sampleData`. Superseded by the real water-mask rasters. | — |

## 2.7 Data files (`src/data/`)

| File | Lines | Contents | Real or mock? |
|---|---|---|---|
| `realMetrics.ts` | 126 | `realGisMetrics` object + 4 chart-ready arrays. Vegetation 3705.66 -> 3651.68 ha, Water 12.53 -> 3.03 ha, water loss 954 px / gain 4 px, LULC 3721 ha across 3 classes. Includes CRS (EPSG:32643), 10 m resolution, 372,099 total pixels. | **REAL** — derived from QGIS raster analysis |
| `studyAreas.ts` | 21 | `StudyArea` interface + a one-entry array: Saswad, Pune, center `[18.345, 74.035]`, zoom 13, area `142.6 km²`. | **Inconsistent** — see Part 4 |
| `sampleData.ts` | 235 | 13 exports: `ndviTimeSeries`, `treeCoverYearly`, `waterAvailability`, `landUseDistribution`, `fieldObservations` (18), `waterBodies` (12), `watershedBoundary`, `vegetationZones`, `ndviZones`, `drainageNetwork`, `changeDetectionZones`, `aiInsightsPool` (10 sentences), `changeStats`. Header comment admits: *"All data is representative for the Saswad watershed demo"*. | **MOCK / FABRICATED** |

**Who consumes what:**
- `realMetrics.ts` -> `AnalyticsDashboard` (6 metric cards), `AnalyticsCharts` (all 4 charts)
- `studyAreas.ts` -> `AnalyticsDashboard` (dropdown, map center/zoom)
- `sampleData.ts` -> `FieldObservations` (markers), `AIInsights` (the sentence pool), `ChangeDetection` (banner stats + zones), `BeforeAfterComparison` (the 4 impact cards), and the two dead layer files

## 2.8 GIS assets (`public/gis/`) — ~11 MB total

| Asset | Size | Loaded by | Purpose | Status |
|---|---|---|---|---|
| `Purandar_Saswad_Study_Area.geojson` | 635 B | `InteractiveMap` (plain `fetch`) | The real analysis boundary. UTM 43N bbox 391180–397290 E, 2021530–2027620 N = **6.11 x 6.09 km, 37.21 km²**. Drives the map's `fitBounds` and the clickable boundary popup. | USED |
| `NDVI_2023_float.tif` | 1.49 MB | `geoTiffRenderer` -> `'ndvi'` | Float32 NDVI raster, 2023. Rendered as a QGIS-style greyscale with a two-pass linear min–max stretch; NoData -> transparent. | USED |
| `water_mask_2023.tif` | 1.49 MB | `geoTiffRenderer` -> `'water_2023'` | Binary surface-water mask, 2023. Painted sky blue `#0EA5E9`. | USED |
| `water_mask.tif` | 1.49 MB | `geoTiffRenderer` -> `'water_2026'` | Binary surface-water mask, 2026. Painted deeper blue `#0284C7`. Note the filename has no year — asymmetric with the 2023 file. | USED |
| `Water_Change_2023_2026.tif` | 1.49 MB | `geoTiffRenderer` -> `'water_change'` | Ternary raster: `+1` gain (cyan), `-1` loss (red), `0` stable (transparent). | USED |
| `purandar_streams_raster.tif` | 170 KB | `geoTiffRenderer` -> `'streams'` | SRTM 30 m drainage/stream network, 205x205 px. Painted royal blue. Uses its own `STREAMS_RASTER_BOUNDS`. | USED |
| `NDVI_Change_2023_2026.png` | 714 KB | `InteractiveMap` `<ImageOverlay>` direct | Pre-rendered NDVI change overlay — used **instead of** decoding the TIFF, for speed. Code comment: "DO NOT MODIFY". | USED |
| `NDVI_Change_2023_2026.pgw` | 90 B | not read at runtime | World file for the PNG. Its numbers were manually transcribed into `NDVI_CHANGE_PNG_BOUNDS` in `geoTiffRenderer.ts`. Kept as provenance only. | REFERENCE ONLY |
| `NDVI_Change_2023_2026.tif` | 1.49 MB | nothing | Source TIFF for the PNG above. Ships to the browser but is never fetched. | UNUSED — 1.49 MB dead weight |
| `veg_positive_2023.tif` | 1.49 MB | nothing | Positive-NDVI vegetation mask 2023. The **numbers** derived from it are hardcoded in `realMetrics.ts`; the raster itself is never displayed. | UNUSED — 1.49 MB dead weight |
| `veg_positive_2026.tif` | 1.49 MB | nothing | Same, for 2026. | UNUSED — 1.49 MB dead weight |
| `LULC_2026.tif` | **MISSING** | nothing | Declared Git LFS (482 MB). Not on disk; HEAD has only the pointer. LULC numbers in the UI are hardcoded. | MISSING |

**Three hardcoded bounding boxes** live in `geoTiffRenderer.ts` (all WGS84):
- `STUDY_AREA_RASTER_BOUNDS` — `[[18.2805351, 73.9701432], [18.3358732, 74.0282681]]` (609x611 @ 10 m)
- `STREAMS_RASTER_BOUNDS` — `[[18.2805182, 73.9699510], [18.3358316, 74.0285009]]` (205x205 @ 30 m)
- `NDVI_CHANGE_PNG_BOUNDS` — `[[18.2804925, 73.9701841], [18.3358340, 74.0283418]]` (from the `.pgw`)

## 2.9 Other assets

| Asset | Status |
|---|---|
| `public/favicon.svg` | USED — referenced by `index.html` |
| `public/icons.svg` | UNUSED — nothing references it |
| `src/assets/hero.png` | UNUSED — the hero uses the remote CloudFront video instead |
| `src/assets/react.svg` | UNUSED — Vite template leftover |
| `src/assets/vite.svg` | UNUSED — Vite template leftover |

## 2.10 Feature inventory — what actually works today

**Fully working (real data):**
- Leaflet map with 3 switchable base maps (Esri World Imagery / Esri Topo / OpenStreetMap)
- Real study-area boundary from GeoJSON, with auto `fitBounds` and a click popup
- In-browser GeoTIFF decoding -> canvas -> Leaflet `ImageOverlay`, with a decode cache
- 5 real raster overlays: NDVI 2023, Water 2023, Water 2026, Water Change, Drainage
- Pre-rendered NDVI-change PNG overlay
- Layer control panel with nested parent/child water toggles and a live "N ACTIVE" count
- Dynamic legend that shows only the currently-visible layers
- 6 clickable metric cards wired to real QGIS numbers, each cross-toggling a map layer and switching tabs
- 4 Recharts visualisations fed by the real metrics
- 5-tab navigation that auto-configures which layers are visible
- 18 field-observation markers with categorised icons and detailed popups
- Draggable before/after comparison slider (mouse + touch)
- Scroll-reveal animations, glass navbar, mobile drawer, full responsive layout

**Cosmetic / simulated (looks real, isn't):**
- `AIInsights` — no model call; shuffles 10 canned sentences behind a fake 1.2s spinner
- `BeforeAfterComparison` — both panes are hand-drawn SVG, not satellite imagery; the year dropdowns only change label text
- `WatershedDashboard` — the "map" is a decorative SVG; all 4 stat values are placeholders
- Field-observation popup thumbnails — an emoji in a grey gradient box, labelled "Geo-tagged Imagery"
- `changeStats` (+4.8%, -1.2%, +12.6%, 34.2 ha) — invented, and they contradict the real metrics

**Not implemented at all:**
- "Watch the Analysis" button (Hero) — no handler
- "Explore JalDrishti" button (FinalCTA) — no handler
- "Export Report" link (AIInsights) — no handler
- All 4 footer links — no `href`
- Study-area dropdown has only one option (Saswad), so it cannot switch anything
- No image upload, no field-data entry, no user accounts, no persistence, no export

---

# PART 3 — IS THERE A BACKEND?

## Verdict: NO. There is no backend. None whatsoever.

This is a **100% static, client-side single-page application.** Evidence:

| Checked for | Found |
|---|---|
| Server directory (`server/`, `api/`, `backend/`) | none |
| Server framework (Express, Fastify, Nest, Django, Flask, FastAPI) | none in `package.json` — the only deps are React, Leaflet, Recharts, geotiff, lucide |
| Serverless functions (`/api` routes, Vercel/Netlify functions) | none |
| Database or ORM (Prisma, Mongoose, Drizzle, SQL driver) | none |
| Auth (JWT, OAuth, session, Firebase, Supabase, Clerk) | none |
| Environment config (`.env`, `import.meta.env`, `process.env`) | **zero occurrences anywhere in `src/`** |
| Vite dev proxy / rewrite rules | none — `vite.config.ts` has only the two plugins |
| HTTP client (axios, tRPC, react-query, SWR) | none |
| WebSocket / SSE | none |

**Every `fetch()` in the codebase** (there are exactly 2 call sites):
1. `InteractiveMap.tsx:84` -> `fetch('/gis/Purandar_Saswad_Study_Area.geojson')` — a static file from `public/`
2. `geoTiffRenderer.ts:117` -> `fetch(url)` where `url` is always a `/gis/*.tif` static file

**External network dependencies** (third-party services, not a backend of yours):

| Service | Used for | Where | Failure mode |
|---|---|---|---|
| `server.arcgisonline.com` | Esri satellite + topo base tiles | `InteractiveMap.tsx:213,215` | map has no basemap |
| `*.tile.openstreetmap.org` | OSM base tiles | `InteractiveMap.tsx:218` | map has no basemap |
| `unpkg.com` | Leaflet default marker icon PNGs | `InteractiveMap.tsx:18-20` | none — custom `divIcon`s are used instead, so this is vestigial |
| `d8j0ntlcm91z4.cloudfront.net` | The hero background MP4 | `VideoBackground.tsx:3` | **hero goes blank** — hardcoded, no local fallback, and `src/assets/hero.png` sits unused right there |
| `fonts.googleapis.com` / `fonts.gstatic.com` | Instrument Serif + Inter | `styles/fonts.css` | falls back to system fonts |

**All GIS analysis runs in the user's browser** — `geotiff` decodes the `.tif`
files client-side onto a `<canvas>`. QGIS was used offline to produce the rasters
and the numbers in `realMetrics.ts`; nothing recomputes at runtime.

**Deployment implication:** this can be hosted on any static host (GitHub Pages,
Netlify, Vercel, S3, Cloudflare Pages) with zero server infrastructure. Just
`npm run build` and serve `dist/`.

**If a backend is ever needed**, it would be for: real field-image upload from a
mobile app, persisting user-submitted observations, on-demand raster processing
(so the browser stops downloading 11 MB), genuine LLM-generated insights, PDF
report export, and user accounts/roles.

---

# PART 4 — PROBLEMS FOUND (ranked)

## Critical — data credibility

**4.1 — 17 of 18 field observations plot OUTSIDE the real study area.**

The real boundary (from the QGIS GeoJSON) is:
`lat 18.280535 -> 18.335873`, `lon 73.970143 -> 74.028268`

The `fieldObservations` in `sampleData.ts` span `lat 18.335 -> 18.362`,
`lon 74.020 -> 74.060`. Verified count: **only observation #107 falls inside; the
other 17 are outside.** All **12** `waterBodies` entries are outside too. This is
visible on screen — the markers sit up and to the right of the raster footprint.

**4.2 — The default map center is outside its own study area.**
`studyAreas.ts` sets center `[18.345, 74.035]`. Both values exceed the boundary
maximums. It only looks correct because `MapViewController` overrides it with
`fitBounds(studyAreaBounds)` once the GeoJSON loads.

**4.3 — Study-area size stated two different ways.**
`studyAreas.ts` says `142.6 km²`. The real GeoJSON says `37.21 km²` (`AREA:
37209900` m²), and `realMetrics.ts` agrees at 37.21 km². The dropdown caption
shows the wrong 142.6 figure while the map badge shows 37.2.

**4.4 — Real and fabricated numbers sit side by side and contradict.**
On the same screen: metric cards report **vegetation -1.46%** and **water -75.82%**
(real), while `ChangeDetectionBanner` and `BeforeAfterComparison` report
**+4.8% vegetation gain** and **+12.6% water coverage** (invented). A reviewer
comparing the two will conclude the numbers are made up.

**4.5 — Resolution claimed inconsistently.** "30 m" in `WatershedDashboard`,
`Impact`, and the field-observation popups; "10 m Sentinel-2 / EPSG:32643" in the
analytics header and `realMetrics`. The rasters are genuinely 10 m (streams are 30 m).

**4.6 — `AIInsights` overclaims.** No model is called, yet the UI states
"Model: HydroVision-v3.2 - Multi-temporal change confidence: 94.2%". If this is
demoed as AI, that is a factual misrepresentation.

## High — repo hygiene

**4.7 — Git index is fully staged-deleted.** ~~All 61 tracked files show `D`
while the same paths appear untracked.~~
**RESOLVED in Entry 003.** The cause was not a `git rm --cached` as guessed
above: `.git/index` was absent entirely and a stale 0-byte `.git/index.lock`
(dated to repo creation, with no git process running) prevented it being
rebuilt. Deleting the lock and running `git reset` restored all 61 files.

**4.8 — `LULC_2026.tif` missing (482 MB LFS object).** Either `git lfs pull` it,
or drop the file from `.gitattributes` and HEAD. A 482 MB asset does not belong
in a web repo regardless.

**4.9 — `README.md` is still the Vite template.** Zero project documentation.

## Medium — code & performance

**4.10 — Two dead files:** `VegetationLayers.tsx` (121 lines) and
`WaterLayers.tsx` (162 lines) are imported by nothing. The `ChangeDetection`
default export (the polygon layer) is also unused — only the banner is imported.

**4.11 — 4.5 MB of unused GeoTIFFs ship to production:**
`NDVI_Change_2023_2026.tif`, `veg_positive_2023.tif`, `veg_positive_2026.tif`.

**4.12 — 866 kB main bundle.** Code-split the analytics dashboard.

**4.13 — `useReveal()` duplicated verbatim in 7 components.** Extract to a hook.

**4.14 — Hero video is a hardcoded CloudFront URL** with no fallback, while
`src/assets/hero.png` sits unused. If that CDN link expires the hero goes blank.

**4.15 — `node_modules` was absent.** A fresh clone needs `npm install` first —
worth stating in the README.

---

# PART 5 — CHANGE LOG

> Every change from here on gets an entry: what changed, which files, why, and
> what it affects. Newest at the bottom.

---

### 2026-09-13 — Entry 001 — Initial audit

**Type:** Investigation (no application code modified)

**Actions taken:**
- Ran `npm install` — `node_modules` was missing from the working tree
- Ran `npm run build` — passed, exit 0
- Ran `npx oxlint` — 0 errors, 2 warnings
- Started the dev server and loaded the site in a browser; confirmed the map,
  GeoTIFF overlays, charts, and tabs all work with no console errors
- Read all 34 source files and mapped the import graph
- Cross-checked every asset in `public/` and `src/assets/` against code references
- Verified field-observation coordinates against the real GeoJSON bbox with a script

**Files created:**

| File | Purpose |
|---|---|
| `prem-backend.md` | This record — build status, file/asset map, backend finding, and the running change log |
| `.claude/launch.json` | Dev-server launch config so the app can be started and previewed in-browser (`npm run dev`, port 5173). Not required by the build; safe to delete. |

**Files modified:** none

**Files deleted:** none

**Findings:** build works; no backend exists; 5 unused source assets, 3 unused
GeoTIFFs, 1 missing LFS raster, 2 dead components, and a set of data
inconsistencies documented in Part 4.

---

# PART 6 — BACKEND & DATABASE ROADMAP (Prem's scope)

> Written 2026-09-13. This is a **plan only** — no code has been written yet.
> Read this before starting Phase 1.

## 6.0 Who is doing what

| Item | Detail |
|---|---|
| Owner of this work | Prem Sonawane — `github.com/premsonawane1407-dev` |
| Upstream repo | `github.com/rahul67x/Jal-Drishti` (Prem is a contributor) |
| Scope assigned | Backend + database + geotagged images + satellite images + PDF site report |
| Database | **Supabase** (Postgres + Storage + Auth), signed in with GitHub |
| Context | Smart India Hackathon prototype |
| Not in scope | The landing page sections (Hero, Challenge, Workflow, Impact, Solution, Footer) — leave those alone |

**Repo etiquette:** work on a branch (e.g. `feat/backend-supabase`) and open a PR.
Do **not** commit straight to `main`. Before the first commit, fix the broken git
index described in Part 4.7 (`git reset`), otherwise the PR will look like the
whole project was deleted and re-added.

**To avoid merge conflicts with the frontend teammate**, all new backend work
lives in folders nobody else touches: `supabase/`, `scripts/`, `src/lib/`,
`src/features/`. Only a handful of existing files get edited (listed in 6.7).

---

## 6.1 What we are building, in plain words

Right now the website is a **brochure with one hardcoded site baked into it**.
Every number for Saswad is typed by hand into `src/data/realMetrics.ts`. There is
no database, no login, no uploads, and no way to add a second site without editing
code and redeploying.

We are turning it into a **real application**:

1. A **Site Directory** page — a dashboard listing every site. Click one, you go
   into that site's own analysis workspace.
2. Each site has its **own ID, its own rasters, its own numbers, its own photos,
   its own insights**. Nothing hardcoded.
3. Users can **upload geotagged field photos**. The app reads the GPS out of the
   photo automatically and drops a pin on the map at the right place.
4. Users can **upload satellite images** for that site.
5. A **"Generate Report" button** that produces a proper statistical PDF for that
   one site — tables, charts, the satellite maps, and the field photos.
6. Everything is stored in **Supabase**, so it survives refreshes, works across
   devices, and multiple people see the same data.

**For now only Saswad exists.** No dummy sites, no fake second location. But the
database and the screens are built so that adding site #2 later is just a form
submission, not a code change.

---

## 6.2 Why each change is needed (the reasoning)

| Problem today | Why it blocks us | What fixes it |
|---|---|---|
| Numbers are hardcoded in `realMetrics.ts` | Can't have two sites. Can't update a number without a redeploy. | Move all numbers into Postgres tables, keyed by `site_id` |
| No router — the whole app is one scroll page | "Select a site and enter its analysis section" is literally impossible without URLs | Add `react-router-dom`, give every site its own URL `/sites/saswad` |
| Field markers come from `sampleData.ts` and **17 of 18 sit outside the real boundary** (Part 4.1) | Looks broken to a judge who zooms in | Real photos carry real GPS from EXIF, so the pins land correctly by construction |
| Real numbers and fake numbers appear side by side and contradict (Part 4.4) | Destroys credibility during evaluation | One source of truth: raw QGIS counts in the DB, headline figures computed by a SQL view |
| Rasters are 11 MB sitting in `public/` | Every visitor downloads all of it. Doesn't scale to 10 sites. | Move to Supabase Storage, fetch per site, on demand |
| "AI Insights" is 10 canned sentences with a fake spinner (Part 4.6) | Misrepresentation | Insights become a real per-site DB table an analyst writes into |
| No way to produce a deliverable | The whole point of the project is evidence for planners | PDF report generator |

---

## 6.3 The source data we already have — `analysed-data/`

This folder holds **5 QGIS "unique values report" HTML files**. These are the
**ground truth** for Saswad. Every number currently hardcoded in `realMetrics.ts`
was hand-copied from here.

| File | Describes | Source raster |
|---|---|---|
| `veg_info_big23.html` | Vegetation mask 2023 | `veg_positive_2023.tif` |
| `veg_info_big26.html` | Vegetation mask 2026 | `veg_positive_2026.tif` |
| `water_info_big23.html` | Water mask 2023 | `water_mask_2023.tif` |
| `water_info_big26.html` | Water mask 2026 | `water_mask.tif` |
| `waterchange_info_big26-23.html` | Water change 2023→2026 | `Water_Change_2023_2026.tif` |

Every file has the same shape, which is why it parses cleanly:
- Analyzed file path (provenance)
- Extent in native CRS
- Projection: **EPSG:32643 — WGS 84 / UTM zone 43N**
- Width 611 px, Height 609 px, 10 m per pixel
- Total pixel count **372,099**, NoData **0**
- A table of `value | pixel count | area (m²)`

**Extracted values (verified 2026-09-13):**

| Raster | Class | Pixels | Area (ha) |
|---|---|---|---|
| Vegetation 2023 | 0 = non-veg | 1,533 | 15.33 |
| Vegetation 2023 | 1 = vegetation | 370,566 | **3,705.66** |
| Vegetation 2026 | 0 = non-veg | 6,931 | 69.31 |
| Vegetation 2026 | 1 = vegetation | 365,168 | **3,651.68** |
| Water 2023 | 0 = dry | 370,846 | 3,708.46 |
| Water 2023 | 1 = water | 1,253 | **12.53** |
| Water 2026 | 0 = dry | 371,796 | 3,717.96 |
| Water 2026 | 1 = water | 303 | **3.03** |
| Water Change | −1 = loss | 954 | **9.54** |
| Water Change | 0 = stable | 371,141 | 3,711.41 |
| Water Change | +1 = gain | 4 | **0.04** |

**Derived headline figures (these become a SQL view, not hardcoded):**
- Vegetation net change: **−53.98 ha (−1.46 %)**
- Water net change: **−9.50 ha (−75.82 %)**
- Total analysed extent: **3,720.99 ha = 37.21 km²** (matches the boundary GeoJSON exactly)

**Important cross-check:** the change raster gives `0.04 − 9.54 = −9.50 ha`, which
is identical to subtracting the two independent water masks (`3.03 − 12.53`). Two
separate rasters agreeing is a strong credibility point — **put this in the report**.

**One small discrepancy to fix:** `realMetrics.ts` states the LULC donut as
`Vegetation 3651.65 / Other 66.31 / Water 3.03`. The analysed-data implies
`3651.68 / 66.28 / 3.03`. A 0.03 ha difference — trivial in size, but it proves
the donut was typed by hand rather than computed. Once the SQL view does the
arithmetic this class of error disappears permanently.

**How we use this folder:** a one-time script parses these 5 HTML files into seed
SQL. We do **not** parse HTML at runtime — that would be slow and fragile. Parse
once, store in Postgres, done. Keep the folder in the repo as provenance.

---

## 6.4 Database design (Supabase / Postgres)

Nine tables. Plain-English purpose for each.

### Core

**1. `sites`** — the master list. One row per location.
Holds: `id`, `slug` (`saswad`), `name`, `district`, `state`, `centre_lat/lng`,
`default_zoom`, `area_km2`, `crs`, `boundary_geojson`, bounding box, `description`,
`created_at`. *This is what the Site Directory dashboard reads.*

**2. `raster_layers`** — one row per `.tif` / `.png` map layer belonging to a site.
Holds: `site_id`, `layer_key` (`ndvi_2023`, `water_mask_2026`, …), `kind`, `year`
or `year_from`/`year_to`, `storage_path`, `format`, `width_px`, `height_px`,
`pixel_size_m`, `crs`, native extent, **WGS84 bounds for Leaflet**, `total_pixels`,
`nodata_pixels`, `source_file`, `display_order`.
*This kills the three hardcoded bounding boxes in `geoTiffRenderer.ts` — bounds now
come from the database, so a new site works with zero code changes.*

**3. `raster_class_stats`** — the pixel-count table from each QGIS report.
Holds: `raster_layer_id`, `class_value` (−1/0/1), `class_label` ("Water loss"),
`pixel_count`, `area_m2`, and `area_ha` as a generated column.
*This is a direct 1:1 copy of the `analysed-data` tables. Raw, untouched, auditable.*

**4. `site_metrics_view`** — a **SQL VIEW, not a table**.
Computes the headline card numbers from `raster_class_stats` on the fly:
vegetation area, water area, water loss, water gain, net change, % change.
*Why a view: the numbers can never drift from the source data, because they are
recalculated every time they are read. This is the permanent fix for Part 4.4.*

### Media

**5. `geotagged_images`** — field photos.
Holds: `site_id`, `storage_path`, `thumbnail_path`, `lat`, `lng`, `altitude_m`,
`gps_accuracy_m`, `captured_at`, `heading_deg`, `category`
(vegetation/water/intervention/degradation), `status`, `title`, `description`,
`observer_name`, `uploaded_by`, `exif` (raw JSON), file size, mime type, dimensions.
*Replaces the 18 fake `fieldObservations`. GPS is read from the photo's EXIF
automatically, so pins land in the right place.*

**6. `satellite_images`** — presentation-grade imagery for the report.
Holds: `site_id`, `storage_path`, `title`, `sensor` (Sentinel-2 / Landsat-8),
`acquisition_date`, `product` (True Colour / NDVI / FCC), `year`, `resolution_m`,
`cloud_cover_pct`, `caption`, optional overlay bounds, optional link to a
`raster_layers` row.

> **Why two image tables instead of one?** `raster_layers` = analysis data the map
> decodes and colour-maps. `satellite_images` = finished pictures a human looks at
> in a report. Different columns, different uses. Merging them would leave half the
> columns null on every row.

### Content & output

**7. `site_insights`** — real written findings per site.
Holds: `site_id`, `body`, `category`, `severity`, `is_auto_generated`,
`display_order`, `author`, `created_at`.
*Replaces the fake `aiInsightsPool`. Honest labelling: analyst-written vs generated.*

**8. `reports`** — a record of every PDF produced.
Holds: `site_id`, `generated_by`, `generated_at`, `file_path` (PDF in Storage),
`params` (which sections were included), `page_count`, `status`.
*Gives a downloadable report history instead of a throwaway file.*

**9. `profiles`** — one row per logged-in user.
Holds: `id` (= `auth.uid`), `full_name`, `avatar_url`, `role`
(`viewer` / `editor` / `admin`).

### Storage buckets (4)

| Bucket | Contents | Access |
|---|---|---|
| `site-rasters` | `.tif` and `.png` map layers | public read |
| `geotagged-images` | field photos + thumbnails | public read |
| `satellite-images` | satellite plates | public read |
| `reports` | generated PDFs | private, signed URLs |

### Security (RLS) — non-negotiable

Row Level Security **ON for every table**:
- **Anyone** (not logged in) can `SELECT` — judges must be able to browse the demo
- Only logged-in users with role `editor` or `admin` can `INSERT` / `UPDATE` / `DELETE`
- Storage: public read on the three media buckets, authenticated write only

> **Critical safety note.** The Supabase **anon key is public** — it gets compiled
> into the JavaScript bundle and anyone can read it. That is normal and fine
> **only because RLS is enabled**. The **`service_role` key must never** appear in
> `src/`, in `.env` files that Vite reads, or in any commit. It goes in a local-only
> `.env.seed` (gitignored) used by the seeding script on your machine.

---

## 6.5 How the site selection flow works

Today: one scroll page, and a `<select>` dropdown with a single option that
changes nothing meaningful.

After the change:

```
/                      Landing page (unchanged marketing sections)
/sites                 SITE DIRECTORY — dashboard of all sites  <-- requirement #1
/sites/saswad          Site workspace, Overview tab
/sites/saswad/map      Map + raster layers
/sites/saswad/images   Geotagged photo gallery + upload  <-- requirement #2
/sites/saswad/satellite  Satellite image manager         <-- requirement #3
/sites/saswad/report   Report builder + download         <-- requirement #4
/login                 GitHub / email sign-in
```

The `:slug` in the URL is the site. Every screen under `/sites/:slug` reads that
slug, loads that one site from Supabase, and shows only that site's data. Adding
a second site later needs **zero** new code.

---

## 6.6 The PDF report

**Recommended approach: generate it in the browser** using
`@react-pdf/renderer`. No server needed, works offline during a demo, produces
real selectable text and vector tables rather than a screenshot.

*(Alternative considered and rejected for now: a Supabase Edge Function running
headless Chrome. More faithful to HTML, but far heavier to set up and it would
need to stay warm during judging. Overkill for a prototype.)*

**Proposed report structure — 10 sections:**

1. **Cover** — site name, ID, district, area, CRS, generation date
2. **Site overview** — location map with boundary, centre coordinates, extent
3. **Data & methods** — sensors, 10 m resolution, EPSG:32643, analysis dates, and
   the original source file paths (straight from the `analysed-data` provenance)
4. **Statistical tables** — the full class / pixel-count / area table for every
   raster. This is the `analysed-data` content reproduced exactly, and it is what
   makes the report genuinely "statistical"
5. **Derived metrics** — vegetation change, water change, net change, % change,
   including the two-raster cross-check
6. **Charts** — vegetation bar, water bar, change breakdown, LULC donut
7. **Satellite image plates** — NDVI, water masks, change map, each with a legend
8. **Field evidence** — geotagged photo grid with lat/lng, date, category, notes
9. **Findings** — from `site_insights`
10. **Appendix** — full provenance, file list, checksums

**Nice shortcut for the map images:** `geoTiffRenderer.ts` already produces a PNG
data URL for every raster it decodes. Those can be dropped straight into the PDF —
no screenshot library needed for the overlays. Only the basemap needs a separate
static tile fetch.

---

## 6.7 Complete file list

### A. New folders and files to be created (~40 files)

**Supabase — database definition**

| File | What it does |
|---|---|
| `supabase/config.toml` | Local Supabase CLI project config |
| `supabase/migrations/0001_sites.sql` | `sites` table |
| `supabase/migrations/0002_rasters.sql` | `raster_layers` + `raster_class_stats` |
| `supabase/migrations/0003_images.sql` | `geotagged_images` + `satellite_images` |
| `supabase/migrations/0004_insights_reports.sql` | `site_insights` + `reports` |
| `supabase/migrations/0005_profiles.sql` | `profiles` + signup trigger |
| `supabase/migrations/0006_metrics_view.sql` | The `site_metrics_view` that computes headline numbers |
| `supabase/migrations/0007_rls.sql` | Row Level Security policies for every table |
| `supabase/migrations/0008_storage.sql` | The 4 buckets + their access policies |
| `supabase/seed/saswad.sql` | Generated seed data for Saswad (output of the parser) |

**Scripts — one-time / maintenance tooling (run locally, never in the browser)**

| File | What it does |
|---|---|
| `scripts/parse-analysed-data.mjs` | Reads the 5 HTML files in `analysed-data/`, pulls out extent, CRS, pixel size, and every class row, writes clean JSON |
| `scripts/generate-seed-sql.mjs` | Turns that JSON into `supabase/seed/saswad.sql` |
| `scripts/upload-rasters.mjs` | Uploads the 7 used files from `public/gis/` into the `site-rasters` bucket and records their paths |
| `scripts/import-geotagged-photos.mjs` | Optional bulk import — reads EXIF GPS from a folder of photos and inserts rows |
| `scripts/README.md` | How and when to run each script |

**Frontend — shared plumbing**

| File | What it does |
|---|---|
| `src/lib/supabase.ts` | The single Supabase client instance used everywhere |
| `src/lib/database.types.ts` | TypeScript types auto-generated from the schema by the Supabase CLI |
| `src/lib/queryClient.ts` | React Query setup (caching, retries, loading states) |
| `src/lib/format.ts` | Shared number/area/date formatting so ha and % look identical everywhere |

**Frontend — sites feature**

| File | What it does |
|---|---|
| `src/features/sites/api.ts` | Database calls: list sites, get one by slug, create, update |
| `src/features/sites/useSites.ts` | React hooks wrapping those calls |
| `src/features/sites/SiteContext.tsx` | Makes "the currently open site" available to every child screen |
| `src/features/sites/SiteDirectoryPage.tsx` | **Requirement #1** — the dashboard listing all sites |
| `src/features/sites/SiteCard.tsx` | One card in that list (name, area, thumbnail, key metrics) |
| `src/features/sites/AddSiteDialog.tsx` | Form to register a new site (boundary upload, name, district) |
| `src/features/sites/SiteWorkspaceLayout.tsx` | The shell for `/sites/:slug` — header + tab bar + outlet |

**Frontend — rasters & metrics**

| File | What it does |
|---|---|
| `src/features/rasters/api.ts` | Fetch a site's raster layers and their public URLs |
| `src/features/rasters/useSiteRasters.ts` | Hook for the map to consume |
| `src/features/metrics/api.ts` | Read `site_metrics_view` |
| `src/features/metrics/useSiteMetrics.ts` | Hook feeding the 6 metric cards and the 4 charts |
| `src/features/metrics/useRasterStats.ts` | Read the raw class tables (used by the report) |

**Frontend — geotagged images (requirement #2)**

| File | What it does |
|---|---|
| `src/features/geotag/api.ts` | Upload, list, update, delete photos |
| `src/features/geotag/exif.ts` | Pulls GPS, timestamp, altitude, heading out of a photo using `exifr` |
| `src/features/geotag/useGeotaggedImages.ts` | Hooks |
| `src/features/geotag/GeotagUploader.tsx` | Drag-and-drop upload, shows the detected GPS, lets you correct the pin if EXIF is missing |
| `src/features/geotag/GeotagGallery.tsx` | Filterable photo grid |
| `src/features/geotag/GeotagMapLayer.tsx` | Draws the real photo pins on the Leaflet map — **replaces `FieldObservations.tsx`** |
| `src/features/geotag/GeotagDetailModal.tsx` | Full-size photo + all its metadata |

**Frontend — satellite images (requirement #3)**

| File | What it does |
|---|---|
| `src/features/satellite/api.ts` | Upload / list / delete |
| `src/features/satellite/useSatelliteImages.ts` | Hooks |
| `src/features/satellite/SatelliteUploader.tsx` | Upload with sensor, date, product, cloud-cover fields |
| `src/features/satellite/SatelliteGallery.tsx` | Grid grouped by year and product |

**Frontend — PDF report (requirement #4)**

| File | What it does |
|---|---|
| `src/features/reports/reportData.ts` | Gathers everything for one site into a single object the PDF can render |
| `src/features/reports/ReportDocument.tsx` | The actual PDF layout — all 10 sections |
| `src/features/reports/ReportCover.tsx` | Cover page |
| `src/features/reports/ReportStatsTables.tsx` | The statistical tables |
| `src/features/reports/ReportImagePlates.tsx` | Satellite + geotagged photo pages |
| `src/features/reports/chartImages.ts` | Turns the Recharts SVGs into PNGs the PDF can embed |
| `src/features/reports/useGenerateReport.ts` | Render → upload to the `reports` bucket → insert a `reports` row |
| `src/features/reports/ReportBuilderPage.tsx` | Pick which sections to include, preview, download |
| `src/features/reports/ReportHistory.tsx` | List of previously generated PDFs |

**Frontend — auth**

| File | What it does |
|---|---|
| `src/features/auth/AuthProvider.tsx` | Tracks who is logged in |
| `src/features/auth/useAuth.ts` | Hook |
| `src/features/auth/LoginPage.tsx` | GitHub OAuth + email sign-in |
| `src/features/auth/ProtectedRoute.tsx` | Blocks upload/edit screens for anonymous visitors |

**Frontend — routing and shared UI**

| File | What it does |
|---|---|
| `src/routes/AppRouter.tsx` | All routes in one place |
| `src/pages/LandingPage.tsx` | The current `App.tsx` content, moved here unchanged |
| `src/components/ui/Spinner.tsx` | Loading indicator |
| `src/components/ui/EmptyState.tsx` | "No photos yet" style placeholder |
| `src/components/ui/ErrorState.tsx` | Friendly error display |
| `src/components/ui/ConfirmDialog.tsx` | Delete confirmations |

**Config**

| File | What it does |
|---|---|
| `.env.example` | Template showing which variables are needed (committed) |
| `.env.local` | Your real Supabase URL + anon key (**gitignored**) |
| `.env.seed` | `service_role` key for the seed scripts only (**gitignored**) |

### B. Existing files that get modified (12)

| File | Change | Risk |
|---|---|---|
| `src/main.tsx` | Wrap the app in Router + AuthProvider + QueryClientProvider | low |
| `src/App.tsx` | Becomes just the router host; its current content moves to `LandingPage.tsx` | low |
| `src/components/analytics/AnalyticsDashboard.tsx` | Takes a `siteId`; reads metrics from hooks instead of `realMetrics.ts` | **high — biggest refactor** |
| `src/components/analytics/InteractiveMap.tsx` | Raster URLs and bounds come from the DB, not hardcoded paths | **high** |
| `src/components/analytics/geoTiffRenderer.ts` | Accepts bounds as an argument; the 3 hardcoded constants are deleted | medium |
| `src/components/analytics/AnalyticsCharts.tsx` | Reads chart data from hooks | medium |
| `src/components/analytics/AIInsights.tsx` | Reads `site_insights`; drop the fake "HydroVision-v3.2 / 94.2%" line | low |
| `src/components/analytics/MetricCard.tsx` | Add loading and empty states | low |
| `src/components/Navbar.tsx` | Add "Sites" and login/logout links | low |
| `src/components/analytics/FieldObservations.tsx` | **Deleted** — replaced by `GeotagMapLayer.tsx` | low |
| `package.json` | New dependencies | low |
| `.gitignore` | Add `.env.local`, `.env.seed` | low |

### C. Files to delete during cleanup

| File | Why |
|---|---|
| `src/components/analytics/VegetationLayers.tsx` | Dead code (Part 4.10) |
| `src/components/analytics/WaterLayers.tsx` | Dead code (Part 4.10) |
| `src/data/sampleData.ts` | Fabricated data, replaced by real DB tables |
| `src/data/studyAreas.ts` | Replaced by the `sites` table |
| `src/data/realMetrics.ts` | Replaced by `site_metrics_view` — **keep until Phase 3 is proven working**, then remove |
| `src/assets/react.svg`, `src/assets/vite.svg` | Vite template leftovers |
| `public/gis/*.tif` | After they are uploaded to Supabase Storage |

### D. New dependencies

| Package | Why |
|---|---|
| `@supabase/supabase-js` | Database, storage, and auth client |
| `react-router-dom` | Per-site URLs. Without it, requirement #1 is impossible |
| `@tanstack/react-query` | Caching, loading and error states, avoids refetching rasters on every tab switch |
| `exifr` | Reads GPS out of uploaded photos |
| `@react-pdf/renderer` | Generates the PDF in the browser |
| `browser-image-compression` | Shrinks photos before upload so we stay inside the free storage tier |
| `supabase` (dev) | CLI for migrations and TypeScript type generation |

---

## 6.8 Build order (7 phases)

Each phase leaves the app in a working state. Do not start a phase before the one
before it is verified.

| Phase | Goal | Done when |
|---|---|---|
| **0. Setup** | Create the Supabase project via GitHub. Install the CLI. Add `.env.local`. Fix the broken git index. Create the branch. | `supabase status` works and the app still builds |
| **1. Schema** | Write migrations 0001–0008. Push to Supabase. Generate TypeScript types. | Tables and buckets visible in the Supabase dashboard |
| **2. Seed Saswad** | Write the parser, convert `analysed-data/` into seed SQL, upload the 7 rasters to Storage. | `site_metrics_view` returns −53.98 ha and −1.46 % straight from the database |
| **3. Read-only wiring** | Add the router, Site Directory, and site workspace. Make the existing dashboard read from Supabase. | The Saswad page looks identical to today, but every number arrives over the network |
| **4. Geotagged images** | Upload, EXIF extraction, gallery, real map pins. Delete `FieldObservations.tsx`. | A photo uploaded from a phone appears at its true GPS location |
| **5. Satellite images** | Upload and gallery. | Images stored per site and listed |
| **6. PDF report** | Report builder and generator. | A downloadable PDF containing the tables, charts, satellite plates, and photos |
| **7. Auth + cleanup** | GitHub login, RLS hardening, delete dead files, rewrite `README.md`. | Anonymous users can view but not edit; no fabricated data remains |

**Rough sizing:** Phases 0–2 are the foundation and are mostly SQL and scripting.
Phase 3 is the riskiest because it rewires two large existing components. Phases
4–6 are new, self-contained features and are lower risk.

---

## 6.9 Things to watch out for

1. **Never commit the `service_role` key.** Anon key in the bundle is fine
   *because RLS is on*; service_role bypasses RLS entirely and would hand anyone
   full database access.
2. **Supabase free tier limits:** 500 MB database, 1 GB storage, 5 GB bandwidth
   per month. The 7 rasters are ~8 MB, so fine — but uncompressed phone photos
   are 3–5 MB each. Compress and generate thumbnails on upload.
3. **Do not upload `LULC_2026.tif`.** It is 482 MB (Part 4.8). It would consume
   half the free storage tier on its own and nothing reads it.
4. **Keep the raw QGIS counts, always.** Store pixel counts and areas exactly as
   the reports state them, and derive everything else. Never store a rounded
   percentage as source data.
5. **Turn on RLS before inserting anything.** It is much harder to retrofit.
6. **Coordinate order trips people up constantly.** GeoJSON is `[lng, lat]`.
   Leaflet is `[lat, lng]`. Get this wrong and pins land in the wrong hemisphere.
7. **Everything is EPSG:32643 (UTM 43N) natively but the map needs WGS84.** Store
   both in `raster_layers` so no code has to reproject at runtime.
8. **Label generated content honestly.** If an insight was not written by an
   analyst, say so. A judge who spots a fake confidence score discounts everything else.
9. **Coordinate with the frontend teammate** before touching `AnalyticsDashboard.tsx`
   and `InteractiveMap.tsx` — those are the two shared files most likely to conflict.

---

## 6.10 Decisions needed before Phase 1

| # | Question | Recommendation |
|---|---|---|
| 1 | Is login required to view, or only to upload? | **View publicly, login only to edit.** Judges should not need an account. |
| 2 | Client-side PDF or server-side? | **Client-side** (`@react-pdf/renderer`). Simpler, no server, works offline. |
| 3 | Move rasters to Supabase Storage, or leave in `public/`? | **Move them.** Keeping them in `public/` means every new site needs a redeploy. |
| 4 | PostGIS for the boundary, or plain JSONB? | **Plain JSONB** for the prototype. PostGIS is worth it only once we need spatial queries. |
| 5 | Does the Site Directory need an "Add site" form now? | **Build the form, keep Saswad as the only row.** Proves the pathway without inventing dummy data. |

---

### 2026-09-13 — Entry 002 — Backend roadmap planned

**Type:** Planning (no application code modified)

**Actions taken:**
- Inspected the new `analysed-data/` folder (5 QGIS HTML reports)
- Extracted and verified every pixel count and area figure
- Confirmed `analysed-data/` is the true source of the numbers hardcoded in `realMetrics.ts`
- Found the change raster cross-validates the water masks (both give −9.50 ha)
- Found a 0.03 ha discrepancy in the hardcoded LULC donut split
- Designed the Supabase schema, storage layout, routing, and PDF approach
- Wrote this Part 6 roadmap

**Files created:** none (Part 6 appended to `prem-backend.md`)
**Files modified:** `prem-backend.md` — added Part 6
**Files deleted:** none

**Status:** Awaiting sign-off on the five decisions in 6.10 before starting Phase 0.

---

### 2026-09-13 — Entry 003 — Phases 0-2 built (schema + seed pipeline)

**Type:** Implementation. Decisions from 6.10 confirmed as recommended:
public read / client-side PDF / rasters moved to Storage / JSONB boundaries /
Add-Site form built with Saswad as the only row.

**Branch:** `feat/backend-supabase` (off `main`)

#### The git mystery from Part 4.7 — solved, and the diagnosis was wrong

The audit guessed someone had run `git rm -r --cached .`. That was incorrect.
The real cause: **`.git/index` did not exist at all**, and a stale 0-byte
`.git/index.lock` from repo creation was blocking git from rebuilding it. Every
`git` command silently failed to write the index, which is why all 61 files
looked staged-deleted.

Fixed by removing the stale lock (no git process was running) and re-running
`git reset`. The repo is now clean: 61 tracked files, index rebuilt, and the
only real change is `LULC_2026.tif`, which genuinely is missing from disk.

#### Files created (20)

**Database schema — `supabase/migrations/`**

| File | Contents |
|---|---|
| `0001_sites.sql` | `sites` table, the `set_updated_at()` helper trigger |
| `0002_rasters.sql` | `raster_layers` + `raster_class_stats`, `raster_kind` and `raster_format` enums |
| `0003_images.sql` | `geotagged_images` + `satellite_images`, `observation_category` and `gps_source` enums |
| `0004_insights_reports.sql` | `site_insights` + `reports`, severity/source/status enums |
| `0005_profiles.sql` | `profiles`, signup trigger, `is_editor()` / `is_admin()` helpers |
| `0006_metrics_view.sql` | `site_metrics_view` + `site_lulc_view` — all derived numbers |
| `0007_rls.sql` | Row Level Security on all 8 tables, 39 policies total |
| `0008_storage.sql` | The 4 buckets and their access policies |

**Scripts — `scripts/`**

| File | Purpose |
|---|---|
| `parse-analysed-data.mjs` | Parses the 5 QGIS HTML reports into JSON, with three validation checks per report |
| `generate-seed-sql.mjs` | Builds `supabase/seed/saswad.sql` from that JSON + boundary GeoJSON + real raster headers |
| `verify-schema.mjs` | Applies everything to PGlite (Postgres 17 in WASM) and asserts the results — no Docker needed |
| `README.md` | How and when to run each script, plus the Supabase setup steps |

**Other**

| File | Purpose |
|---|---|
| `supabase/config.toml` | CLI project config (`seed.sql_paths` pointed at `./seed/*.sql`) |
| `supabase/seed/saswad.sql` | **Generated.** 526 lines: 1 site, 8 raster layers, 11 class-stat rows |
| `scripts/out/analysed-data.json` | **Generated**, gitignored |
| `src/lib/supabase.ts` | The Supabase client, plus `publicUrl()` / `signedUrl()` helpers |
| `.env.example` | Template for `VITE_SUPABASE_URL` and the anon key |
| `.env.seed.example` | Template for the local-only service_role key |

#### Files modified (3)

| File | Change |
|---|---|
| `package.json` | Added `@supabase/supabase-js`; dev: `supabase` CLI, `@electric-sql/pglite`. Six new `db:*` scripts. |
| `.gitignore` | Added `.env*` variants and `scripts/out` |
| `supabase/config.toml` | Seed path changed to `./seed/*.sql` |

#### Key design decisions

**Store raw, compute derived.** `raster_class_stats` holds the QGIS pixel counts
verbatim. Every headline figure is calculated by `site_metrics_view` at read
time. Nothing is stored twice, so nothing can drift — the permanent fix for
Part 4.4, where real numbers and invented ones contradicted each other on the
same screen.

**The views are site-agnostic.** Baseline and current years are found with
`min()`/`max()` per site rather than hardcoded to 2023 and 2026, so a second
site with different years needs no changes to the SQL.

**`raster_layers` carries its own WGS84 bounds.** This is what retires the three
hardcoded bounding-box constants in `geoTiffRenderer.ts`. A new site supplies its
own bounds as data.

**`veg_positive_2023/2026.tif` are now registered layers.** The audit listed them
as unused dead weight (Part 4.11). They are the source of the vegetation change
figures, so they are seeded as `vegetation_mask` layers even though the map does
not draw them by default. Two of the three "unused" rasters are now earning
their place.

**Generated content is labelled.** `site_insights.source` is one of
`analyst` / `computed` / `model`, and a CHECK constraint requires a model name
when the source is `model`. This is the structural answer to Part 4.6, where the
UI claimed "HydroVision-v3.2, 94.2% confidence" over a shuffled static array.

**Reports are private; everything else is public.** Judges can browse without an
account, but a report bundles a whole site into one file, so it sits behind a
login and is served via short-lived signed URLs.

#### Verification — all passing

`npm run db:verify` applies all 8 migrations plus the seed to PGlite and asserts
36 separate conditions. Results:

- 8 migrations and the seed apply cleanly
- all 13 metric values reproduce the QGIS figures exactly
- `water_change_cross_check_ok` returns **true** — the change raster agrees with
  the two independent water masks at −9.50 ha
- LULC classes sum to 3720.99 ha and 100.00%
- re-running the seed changes nothing (idempotent)
- all 9 deliberately-invalid inserts are rejected
- RLS enabled on all 8 tables, 39 policies defined

`npm run build` still passes. `npx oxlint` shows the same 2 pre-existing warnings
and no new ones.

#### One real bug caught by the verifier

The first version of `site_metrics_view` computed the analysed extent as
`max(total_pixels x pixel_size²)` across all layers. The streams raster is a
30 m grid over a slightly larger footprint — 205 x 205 px at 900 m² each =
**3782.25 ha** — which beat the true 10 m analysis grid of **3720.99 ha**, and
inflated the extent by 61 ha.

Fixed by summing the QGIS class areas and considering only layers that actually
carry statistics. This is also more traceable, since the extent now derives from
the same reports as everything else.

Worth noting: this bug would have shipped silently without a way to run the SQL.
PGlite made that possible with no Docker and no live project.

#### Corrections to earlier hardcoded data

| Value | Was | Now | Source |
|---|---|---|---|
| Site centre | `18.345, 74.035` (outside the boundary) | `18.308204, 73.999206` | computed from the boundary |
| Site area | `142.6 km²` | `37.21 km²` | boundary GeoJSON + raster grid |
| LULC "Other" | `66.31 ha` | `66.28 ha` | computed by `site_lulc_view` |
| Part 4.7 diagnosis | "someone ran `git rm -r --cached`" | missing `.git/index` + stale lock | direct inspection |

#### Not done yet — needs a live Supabase project

Everything above is verified offline. These steps need credentials:

1. Create the Supabase project (GitHub sign-in) — **the user's step**
2. `.env.local` from `.env.example`
3. `npx supabase link` then `npm run db:push`
4. `npm run db:types` to generate `src/lib/database.types.ts`
5. `scripts/upload-rasters.mjs` — not yet written; needs the project to exist
6. Promote the first user to `admin`

**Status:** Phases 0-2 complete and verified offline. Blocked on the Supabase
project before Phase 3 (frontend wiring) can begin.

---

### 2026-09-13 — Entry 004 — Supabase project connected

**Type:** Configuration + one new script

#### Project

| Field | Value |
|---|---|
| Project ref | `rshnlpwdbyolftwgnyff` |
| URL | `https://rshnlpwdbyolftwgnyff.supabase.co` |
| Key in use | publishable (`sb_publishable_...`), does not expire |
| Legacy anon JWT | available as a commented fallback in `.env.local`, expires 2036-09-12 |

Both keys supplied were checked before use. The JWT decodes to `role: anon`,
and `sb_publishable_` is the new-style public key. **Neither was a
`service_role` or `sb_secret_` key**, so nothing sensitive was exposed.

Connectivity confirmed: `GET /rest/v1/sites` returned HTTP 404 `PGRST205`
("table not in schema cache"), which proves the key authenticates and PostgREST
is responding — the schema simply is not pushed yet.

#### Files created (1)

| File | Purpose |
|---|---|
| `scripts/bundle-sql.mjs` | Concatenates all 8 migrations plus the seed into one paste-ready file, and writes the CLI's `supabase_migrations.schema_migrations` bookkeeping rows so a later `db push` does not try to re-apply everything |

Output goes to `scripts/out/apply-all.sql` — 1,842 lines, gitignored.

#### Files created, not committed (1)

| File | Purpose |
|---|---|
| `.env.local` | Real project URL and publishable key. Gitignored — verified with `git check-ignore`. |

#### Files modified (2)

| File | Change |
|---|---|
| `src/lib/supabase.ts` | Key guard extended (see below) |
| `package.json` | Added `db:bundle` script |

#### Security fix to the key guard

The original guard only decoded JWTs to check for `role: service_role`. That
missed the new key format entirely: an `sb_secret_...` key is not a JWT, so it
would have sailed straight through and been shipped to the browser with full
RLS bypass.

The guard now rejects both shapes:

| Format | Public (allowed) | Secret (rejected at startup) |
|---|---|---|
| New-style | `sb_publishable_...` | `sb_secret_...` |
| Legacy JWT | `role: anon` | `role: service_role` |

#### Correction to a claim in the bundle header

The first version of `bundle-sql.mjs` stated the bundle was "safe to run more
than once". Testing it against PGlite proved that false — the migrations use
`CREATE TYPE` and `CREATE TABLE` without `IF NOT EXISTS`, so a second run fails
on "type already exists".

The header now says plainly: run once on an empty database. It also explains
that the seed portion alone *is* re-runnable, and gives the drop-and-recreate
commands for starting over. This is normal migration behaviour, but the header
was asserting otherwise, which would have wasted someone's time.

#### Verification

Bundle tested end to end against PGlite:

- applies cleanly to an empty database
- `site_metrics_view` returns `-53.98 / -9.50 / cross-check true / 3720.99`
- all 8 migrations recorded in `supabase_migrations.schema_migrations`
- `npm run db:verify` — all checks pass
- `npm run build` — passes
- `npx oxlint` — same 2 pre-existing warnings, none new

#### Still blocked: pushing the schema

Two credentials are needed and neither should travel through chat:

1. **Personal access token** — `supabase login` opens a browser sign-in
2. **Database password** — `supabase link` prompts for it

Both are interactive and belong on the user's own machine. Two routes forward:

**Route A — CLI (preferred, keeps migration history in sync):**
```
npx supabase login
npx supabase link --project-ref rshnlpwdbyolftwgnyff
npm run db:push
npm run db:types
```

**Route B — dashboard (no credentials needed):**
Paste `scripts/out/apply-all.sql` into SQL Editor > New query > Run. The bundle
writes the migration bookkeeping itself, so switching to the CLI later still
works.

**Status:** Project connected and verified. Schema ready to push. Phase 3
(frontend wiring) starts once either route completes.

---

### 2026-09-13 — Entry 005 — Blast-radius check, bundle made transactional

**Type:** Safety hardening, prompted by the question "will pushing the schema
affect my other Supabase projects?"

#### Answer: no

Supabase projects are separate Postgres databases on separate instances. There
is no shared schema, no shared storage, no cross-project queries. `db push`
applies migrations to exactly one linked project.

Verified on this machine:

| Check | Result |
|---|---|
| `supabase/.temp/` contents | only `cli-latest` — **no `project-ref`, nothing is linked yet** |
| Other Supabase folders under `C:/Projects` | none — this is the only one |
| Stored CLI access token | none (`~/.supabase` holds only telemetry) |

The one account-wide action is `supabase login`: the token it stores grants CLI
access to every project in the account. That is authentication only and changes
nothing. The practical risk it creates is running `db push` from a directory
linked to the wrong project — guard against it by checking
`supabase/.temp/project-ref` before pushing.

#### Could not verify: whether the new project is empty

Listing a project's tables needs the `service_role` key, which should never be
pasted into a chat. Attempted with both supplied keys and got
`401 — "Only the service_role API key can be used for this endpoint."`
So this is unknown, and is stated as unknown rather than assumed.

That made the question worth answering structurally instead.

#### Change: the bundle is now a single transaction

`scripts/out/apply-all.sql` previously ran as loose statements. A failure
part-way through would leave a half-built schema needing manual cleanup.

Now `begin;` wraps everything and `commit;` closes it. Postgres runs DDL inside
transactions, so the whole bundle either applies or does not.

Implementation detail: the seed carries its own `begin;`/`commit;` for standalone
use. Nested inside the outer transaction, the inner `commit` would have closed
it early — so `stripTransactionControl()` removes whole-line `begin;`/`commit;`
statements from every included file. It matches complete lines only, leaving
plpgsql `begin ... end` blocks alone.

#### Proven, not assumed

Three scenarios run against PGlite:

| Scenario | Result |
|---|---|
| Empty database | Applies cleanly. Metrics: `-53.98 / -9.50 / cross-check true / 3720.99` |
| Database with an unrelated pre-existing table | Pre-existing data untouched; the Saswad site is added alongside |
| Database already containing a `sites` table | Errors with `relation "sites" already exists`, rolls back with **0 tables and 0 enum types leaked** — the original table survives intact |

Also audited: `grep -Ei "^\s*(drop|delete|truncate)"` over the bundle returns
**nothing**. The only `drop` statements in the file are inside `--` comments in
the header, offered as the deliberate way to start over. The bundle can create
and insert; it cannot remove.

#### Correction to the previous entry's header text

Entry 004 noted the header wrongly claimed the bundle was re-runnable. The
header now also states plainly that the file contains no destructive statements
and rolls back cleanly on any error — both now verified rather than asserted.

#### Also fixed

`bundle-sql.mjs` reported its own line count from the output array length,
which counts multi-line strings as one entry. It said "130 lines" for an
1,853-line file. Now counts actual newlines.

**Status:** unchanged — schema still ready to push, still blocked on
`supabase login` (interactive) or a paste of `scripts/out/apply-all.sql`.

---

### 2026-09-13 — Entry 006 — Phase 3 complete: frontend reads from Supabase

**Type:** Implementation

Schema confirmed live before starting. `site_metrics_view` over the public anon
key returns `-53.98 / -1.46 / -9.50 / -75.82 / 9.54 / 0.04 / -9.50 / true /
3720.99` — matching QGIS exactly, with RLS public read working.

#### What changed, in one line

The app had no router and every number was hardcoded. It now has per-site URLs
and every figure arrives from Postgres.

#### Files created (16)

**Shared plumbing**

| File | Purpose |
|---|---|
| `src/lib/database.types.ts` | Hand-written types matching the migrations. `npm run db:types` replaces this once the CLI is linked. |
| `src/lib/queryClient.ts` | React Query setup plus centralised query keys |
| `src/lib/format.ts` | All number formatting in one place — ha, km², signed %, coordinates |

**Sites**

| File | Purpose |
|---|---|
| `src/features/sites/api.ts` | Reads for sites and the two computed views |
| `src/features/sites/useSites.ts` | Hooks |
| `src/features/sites/SiteCard.tsx` | One card in the directory |
| `src/features/sites/SiteDirectoryPage.tsx` | **Requirement #1** — the site dashboard |
| `src/features/sites/SiteWorkspacePage.tsx` | `/sites/:slug` — one site's workspace |

**Rasters and insights**

| File | Purpose |
|---|---|
| `src/features/rasters/api.ts` | Layer reads, URL resolution, bounds conversion |
| `src/features/rasters/useSiteRasters.ts` | Hooks |
| `src/features/insights/api.ts` | Reads `site_insights` |
| `src/components/analytics/useRasterOverlays.ts` | Decodes only the layers currently switched on |

**Routing and UI**

| File | Purpose |
|---|---|
| `src/routes/AppRouter.tsx` | `/`, `/sites`, `/sites/:slug`, 404 |
| `src/pages/LandingPage.tsx` | The old `App.tsx`, moved |
| `src/components/ui/States.tsx` | Spinner, ErrorState, EmptyState |
| `scripts/upload-rasters.mjs` | Pushes `public/gis` to Supabase Storage (needs a service_role key) |

#### Files rewritten (7)

| File | Change |
|---|---|
| `AnalyticsDashboard.tsx` | Site-driven. Takes `siteSlug`, reads from hooks, real site selector that navigates |
| `InteractiveMap.tsx` | Takes `site` + `rasters`; URLs, bounds, opacity and colour ramps all from the database |
| `geoTiffRenderer.ts` | Bounds are now a parameter. The three hardcoded constants are gone |
| `AnalyticsCharts.tsx` | Reads the views; axis domains computed instead of hardcoded |
| `ChangeDetection.tsx` | Real measured figures instead of `changeStats` |
| `BeforeAfterComparison.tsx` | Real metrics; the SVG panels are now labelled as illustrations, not satellite imagery |
| `AIInsights.tsx` | Reads `site_insights`. Renamed to "Site Findings" |
| `main.tsx` | Wrapped in Router + QueryClientProvider |

#### Files deleted (6)

`src/data/realMetrics.ts`, `src/data/studyAreas.ts`,
`src/components/analytics/VegetationLayers.tsx`,
`src/components/analytics/WaterLayers.tsx`, `src/assets/react.svg`,
`src/assets/vite.svg` — all verified unreferenced first.

`src/data/sampleData.ts` **stays** for now: `FieldObservations.tsx` still needs
it. Phase 4 removes both.

#### Three bugs the browser caught that the build did not

1. **`15.035999999999998 ha` on the water axis.** My own regression: I replaced
   the hardcoded `[0, 15]` domain with `Math.max(...) * 1.2`, and float
   arithmetic leaked straight into a visible axis label. Replaced with a
   nice-number domain that rounds to 1/2/5 × a power of ten. Ticks now read
   `0 / 5 / 10 / 15 / 20 ha` and `3,600 / 3,640 / 3,680 / 3,720 ha`.

2. **Inconsistent tick spacing** — `3466ha` beside `3616 ha`. Caused by mixing
   Recharts' `unit` prop with a `tickFormatter`. Now formatted in one place.

3. **Two sources of truth for the water toggles.** The map held `water2023` and
   `water2026` in local state and mirrored the parent with an effect. oxlint
   flagged the `setState`-in-effect; the deeper problem was that one fact was
   stored twice. All layer state moved to the dashboard, and `waterBodies` is
   now derived from the two years rather than tracked separately.

Verified in the browser across six transitions: turning off one child keeps the
parent on; turning off both switches the parent off; clicking the parent sets
both; clicking again clears both; turning one child back on re-enables the
parent. No desync.

#### Raster migration fallback

`raster_layers.storage_path` points at Supabase Storage, but nothing is uploaded
yet, so every raster returns HTTP 400. Rather than a broken map, the renderer
falls back to the copy in `public/gis` and logs a warning naming the fix. The
map renders correctly today; running `scripts/upload-rasters.mjs` makes the
fallback unreachable and the local copies deletable.

#### Corrections now visible in the UI

| | Was | Now |
|---|---|---|
| Site centre | `18.345, 74.035` — outside its own boundary | `18.3082° N, 73.9992° E` |
| Site area | `142.6 km²` | `37.21 km²` |
| LULC "Other" | `66.31 ha` | `66.28 ha` |
| Vegetation change | `+4.8%` beside a real `-1.46%` | `-53.98 ha (-1.46%)` only |
| Water coverage | `+12.6%` beside a real `-75.82%` | `-9.50 ha (-75.82%)` only |
| "AI Insights" | 10 canned sentences, "HydroVision-v3.2, 94.2% confidence" | Real `site_insights`, each labelled analyst / computed / model |

The cross-check is now surfaced in the UI, not just the database: the workspace
header shows "Cross-check passed — the change raster (-9.50 ha) agrees with the
two independently derived water masks (-9.50 ha)." If that ever stops being
true, it turns amber rather than hiding.

#### Verification

| Check | Result |
|---|---|
| `npx tsc -b` | passes |
| `npm run build` | passes |
| `npx oxlint` | **0 warnings** — down from the 2 that pre-existed this work |
| `npm run db:verify` | all checks pass |
| Browser — `/sites` | Saswad card with live figures |
| Browser — `/sites/saswad` | header, 6 cards, map, 4 charts, all live |
| Browser — `/` | landing page still works, falls back to the first site |
| Browser console | no errors except the expected Storage 400s |

#### Next

Phase 4 (geotagged images) needs `scripts/upload-rasters.mjs` run first, which
needs a service_role key in `.env.seed` — the user's own step, since that key
must not travel through chat.

---

### 2026-09-13 — Entry 007 — Map fullscreen, Dashboard nav, and Phase 4 (geotagged images)

**Type:** Implementation

#### Two requested additions

**Fullscreen map button.** Sits below the zoom controls on every site map.

The native Fullscreen API is refused more often than expected — inside an
iframe without `allow="fullscreen"`, in embedded webviews, under some
enterprise policies, and on iOS Safari for non-video elements. In those cases
`document.fullscreenEnabled` still reports `true` while the request rejects. The
Claude Browser pane used for testing does exactly this, which is how the gap was
found.

So `useFullscreen` expands with CSS **first** so the button always responds
visibly, then tries to upgrade to native fullscreen and drops the CSS pin if
that succeeds. Both modes exit on Escape, lock body scroll, and report through
one `isFullscreen` flag.

Verified: expanded gives `position: fixed`, `z-index 2000`, 1440×900 filling the
viewport, body scroll locked, "Press Esc to exit" hint, button label flipped to
"Exit fullscreen map". Escape restores `relative` at 1280×620 with scroll back.

`InvalidateSizeOnFullscreen` calls Leaflet's `invalidateSize()` after the
resize, otherwise tiles keep drawing at the old dimensions.

**Dashboard button.** Added to the navbar (desktop and mobile drawer), routing
to `/sites`. It uses `Link` rather than an `<a href="#...">` because it is a
route, not a scroll anchor.

#### Phase 4 — geotagged images (requirement #2)

**Auth had to come forward from Phase 7.** RLS requires an editor to insert into
`geotagged_images`, so upload could not be demonstrated at all without a login.
This was a dependency, not a scope change.

**Files created (10)**

| File | Purpose |
|---|---|
| `src/features/auth/AuthContext.ts` | Context + `useAuth`, split out so the provider file exports only a component |
| `src/features/auth/AuthProvider.tsx` | Session tracking; role read from `profiles` via React Query |
| `src/features/auth/AuthButton.tsx` | Sign in / out, and shows the current role |
| `src/features/geotag/exif.ts` | GPS, altitude, heading, capture time out of photo EXIF |
| `src/features/geotag/api.ts` | Prepare, compress, upload, list, update, delete |
| `src/features/geotag/useGeotaggedImages.ts` | Query and mutation hooks |
| `src/features/geotag/GeotagUploader.tsx` | Drag-and-drop upload with per-photo metadata |
| `src/features/geotag/GeotagGallery.tsx` | Filterable grid with a full-size preview |
| `src/features/geotag/GeotagMapLayer.tsx` | Real photo pins, replacing `FieldObservations` |
| `src/components/analytics/useFullscreen.ts` | Fullscreen with CSS fallback |

**Files deleted (2)**

- `src/components/analytics/FieldObservations.tsx`
- `src/data/sampleData.ts` — **the last fabricated data in the project is gone**

#### Design decisions worth recording

**Provenance is structural, not cosmetic.** `gps_source` is one of `exif`,
`manual`, or `unknown`, and a CHECK constraint refuses a row claiming `exif`
without coordinates. The UI shows a dashed marker ring and a "Manual pin" chip
for hand-placed positions. Nobody later has to guess whether a coordinate was
measured or estimated.

**Photos without GPS are not guessed at.** Messaging apps routinely strip EXIF.
Rather than dropping a pin somewhere plausible, the uploader says so and
requires coordinates, recording them as `manual`.

**The old defect is now a warning.** The uploader and gallery both flag photos
whose coordinates fall outside the site bounding box — precisely the fault in
the old sample data, where 17 of 18 markers sat outside the study area.

**Compression before upload.** 1600 px long edge at ~1.2 MB plus a 400 px
thumbnail. The free tier allows 1 GB total and a phone photo is 3–5 MB, so a few
hundred raw uploads would exhaust it.

**Orphan cleanup.** Storage and the database are written separately. If the
insert fails after the file lands, the uploaded objects are removed rather than
left consuming quota.

**A coordinate of exactly 0,0 is rejected** as a failed GPS fix rather than
treated as a real position in the Gulf of Guinea.

**HDOP is labelled as an estimate.** EXIF carries a unitless dilution-of-
precision figure, not metres. The usual ×5 m conversion is applied and the UI
says "±N m" only where the value exists.

#### Three lint warnings fixed rather than suppressed

1. `AuthProvider` exported both a component and a hook, breaking Fast Refresh —
   the hook moved to `AuthContext.ts`.
2. The profile loader was a `setState`-in-effect; it is now a React Query query,
   which also removes a second piece of state to keep in step.
3. `GeotagGallery` used `query.data ?? []`, creating a new array every render
   and invalidating a `useMemo`. Now a module-level constant.

#### Two build errors worth noting

**`Partial<Interface>` is not assignable to `Record<string, unknown>`.**
TypeScript interfaces have no implicit index signature, so every row type in
`database.types.ts` failed Supabase's `GenericTable` constraint. Converting the
ten row types from `interface` to `type` fixed it. Worth remembering when
`npm run db:types` eventually regenerates that file — the generated version uses
type aliases for the same reason.

**`lucide-react` v1 dropped brand icons**, so `Github` does not exist. Replaced
with the generic `LogIn`.

#### Verification

| Check | Result |
|---|---|
| `npx tsc -b` | passes |
| `npm run build` | passes |
| `npx oxlint` | **0 warnings** |
| Browser — Field Data tab | uploader and gallery render; correct signed-out message |
| Browser — map markers | **0** — all 18 fabricated pins gone |
| Browser — map overlays | 3 rasters + 1 boundary, all real |
| Browser — fullscreen | expands to 1440×900 fixed, Escape restores |

#### Still outstanding

- `scripts/upload-rasters.mjs` has not been run, so rasters still fall back to
  `public/gis`. Needs a service_role key in `.env.seed`.
- GitHub OAuth must be enabled in the Supabase dashboard
  (Authentication > Providers) before sign-in will work.
- The first account signs up as `viewer`. Promote it in the SQL editor:
  `update public.profiles set role = 'admin' where id = auth.uid();`
- "Add site" is wired to `canEdit` but the form itself is not built yet.

**Next:** Phase 5 (satellite images), then Phase 6 (PDF report).

---

### 2026-09-13 — Entry 008 — Phase 5: satellite imagery

**Type:** Implementation

GitHub OAuth confirmed live before starting — `/auth/v1/settings` reports
`github` and `email` as enabled providers, signups open.

#### Files created (4)

| File | Purpose |
|---|---|
| `src/features/satellite/api.ts` | Upload, list, update, delete satellite scenes |
| `src/features/satellite/useSatelliteImages.ts` | Query and mutation hooks |
| `src/features/satellite/SatelliteUploader.tsx` | Single-scene upload with acquisition metadata |
| `src/features/satellite/SatelliteGallery.tsx` | Gallery grouped by year, with a full-size viewer |

#### Files modified (3)

| File | Change |
|---|---|
| `AnalyticsTabs.tsx` | Added a sixth tab, **Satellite** |
| `AnalyticsDashboard.tsx` | Satellite panel; passes scenes to the comparison |
| `BeforeAfterComparison.tsx` | Uses real imagery when two dated scenes exist |

#### The before/after comparison is now honest in both states

Entry 006 labelled the hand-drawn SVG panels as illustrations. That was the
correct short-term fix but still left the component unable to ever show real
imagery.

It now picks the earliest and latest **dated** scenes and compares those
directly. The header switches from "Schematic Comparison" to "Multitemporal
Satellite Comparison" and cites each scene's title, sensor and acquisition date.

With fewer than two scenes, or several from one year, it falls back to the
schematic and says exactly what to do: *"Upload two scenes from different years
on the Satellite tab and this becomes a real comparison. The measured figures
below are real either way."*

One scene is not a comparison, and neither are two from the same year — the
`pair` check requires two distinct years before claiming to compare anything.

#### Why satellite_images is separate from raster_layers

Worth restating since both hold imagery:

- **`raster_layers`** — analysis data the map fetches, decodes with the geotiff
  library, and colour-maps. Carries pixel grids, CRS, bounds, class statistics.
- **`satellite_images`** — finished pictures a person looks at. Carries sensor,
  acquisition date, cloud cover, caption, and whether to include it in the
  report.

Merging them would leave half the columns null on every row.

#### Details worth recording

**Acquisition metadata is required-ish, not decorative.** Sensor, date and
resolution are collected because a satellite image without them is a picture,
not evidence. The PDF report will cite all three under every plate.

**Year is derived from the acquisition date** when not typed separately, so the
gallery can group chronologically without asking twice.

**Larger compression budget than field photos** — 2400 px at ~3 MB versus
1600 px at ~1.2 MB. These get printed near full width in the report, so detail
matters more than it does in a map popup.

**`include_in_report` is toggleable from the gallery**, so the report can be
curated without deleting anything.

**Same orphan cleanup as the geotag path**: if the database insert fails after
the files upload, the objects are removed rather than left consuming quota.

#### Verification

| Check | Result |
|---|---|
| `npx tsc -b` | passes |
| `npm run build` | passes |
| `npx oxlint` | **0 warnings** |
| Browser — tab bar | six tabs, Satellite present |
| Browser — Satellite panel | uploader and gallery render, correct signed-out states |
| Browser — Change Detection | falls back to schematic with the "upload two scenes" notice; years still derive from metrics (2023 vs 2026) |
| Browser — cross-check banner | still passing |

#### Requirements status

| # | Requirement | State |
|---|---|---|
| 1 | Dashboard to select and store each site | **Done** — `/sites` and `/sites/:slug` |
| 2 | Geotagged images per site | **Done** — EXIF GPS, upload, gallery, real map pins |
| 3 | Satellite images per site | **Done** — this entry |
| 4 | Statistical PDF report per site | Phase 6, next |
| 5 | Use `analysed-data/` for Saswad | **Done** — parsed, seeded, computed by SQL views |

**Next:** Phase 6 — the PDF report, which draws on all four of the above.

---

### 2026-09-13 — Entry 009 — Phase 6: PDF site report, plus legend repositioning

**Type:** Implementation

Requirement #4 complete. All five requirements are now built.

#### Files created (5)

| File | Purpose |
|---|---|
| `src/features/reports/reportData.ts` | Gathers site, metrics, LULC, rasters, insights, photos and plates in one pass |
| `src/features/reports/ReportDocument.tsx` | The PDF itself — six sections |
| `src/features/reports/api.ts` | Report history: save, list, signed download, delete |
| `src/features/reports/ReportPanel.tsx` | Section picker, download, save-to-history, history list |
| `scripts/render-report.mjs` | Headless CLI rendering — `npm run report:render` |

#### The report

Client-side with `@react-pdf/renderer`. No server, works offline during a demo,
and the text is real and selectable rather than a screenshot.

Six sections, each toggleable: cover, data and methods, derived metrics with
charts, raster class statistics, satellite plates, field evidence, findings, and
a provenance appendix.

**Charts are drawn with plain Views**, not converted from Recharts. A bar is a
rectangle of a known width — exact, vector, and incapable of failing the way an
SVG-to-canvas conversion can.

**The cross-check is on the cover.** Not buried: the first page states that the
change raster and the two independently derived water masks both give −9.50 ha,
and explains why two separately produced rasters agreeing is evidence.

**Vegetation and water get separate chart scales**, with a note saying why —
they differ by three orders of magnitude, so a shared axis would render water
as a flat line.

**A metrics snapshot is frozen into every saved report.** A report records what
was true when generated; a later re-analysis must not silently change an old
document's meaning.

**Image caps**: 24 field photos, 12 satellite plates. Beyond that the report
says how many were omitted rather than truncating silently. Each embedded image
inflates the file and the render's memory use.

**Downloading is public, saving is not.** Anyone can generate and download.
Saving to the shared history requires an editor, because the reports bucket is
private. A viewer can still take a report away without being able to write to
shared storage.

#### Bundle size — caught and fixed

Adding `@react-pdf/renderer` took the main chunk from **1,166 kB to 2,569 kB**.
That library would have loaded for every visitor to the landing page, for a tab
most never open.

`ReportPanel` is now `React.lazy`-loaded behind a Suspense boundary. The PDF
library moved into its own 1,200 kB chunk fetched only when the Report tab is
opened, and the main bundle came back to 1,304 kB.

#### Verifying the PDF

The Browser pane blocks downloads and cannot navigate to blob URLs, so the
generated file could not be inspected there. Rather than hand over an unverified
document, `scripts/render-report.mjs` renders it headlessly in Node — bundling
the TSX with esbuild on the fly, so there is no separate build step. That is
useful beyond testing: reports can now be generated from CI or a cron job.

Verification of the rendered file:

| Check | Result |
|---|---|
| Header / EOF | `%PDF-1.3`, ends `%%EOF` |
| Pages | 6 |
| Size | 19.9 KB (no images uploaded yet) |
| Content probes | **19/20** |

The single miss is "Field evidence", correctly absent because no photos exist —
that section is conditional.

Text extraction: inflate every content stream with zlib, then decode the
hex operands of each `[...] TJ` show-text array. Worth recording that react-pdf
writes **two** hex digits per character, not four — an initial UTF-16 assumption
extracted 1,837 characters of nothing.

#### Digit grouping changed to international

Two probes initially failed: `370,566` and `365,168`. The figures were present,
but as `3,70,566` and `3,65,168` — `formatCount` used `en-IN`, which groups in
lakhs.

Switched to `en-US` grouping. These are scientific measurements meant to be
checked line by line against the QGIS source reports, which print `370566`
ungrouped. A reviewer comparing `3,70,566` against `370566` has to stop and
think; `370,566` maps at a glance.

`formatDate` stays `en-IN` — DD MMM YYYY is right for the audience.

#### Map legend repositioned

The Active GIS Legend moved from bottom-right to bottom-left, directly above the
study-region badge.

Implemented as a single flex column rather than two independently positioned
boxes, so the badge can never be overlapped by a legend that has grown as more
layers are switched on. The column ignores pointer events; each panel takes them
back, so the map stays draggable in the gaps.

Verified by measurement: legend and badge both at `left: 17px`, legend bottom
edge above the badge top edge.

#### Verification

| Check | Result |
|---|---|
| `npx tsc -b` | passes |
| `npm run build` | passes, main chunk 1,304 kB |
| `npx oxlint` | **0 warnings** |
| `npm run report:render` | 6-page PDF, 19/20 content probes |
| Browser — Report tab | six section toggles, download produces a valid 21 KB PDF |
| Browser — legend | left-aligned above the badge |

#### All five requirements

| # | Requirement | State |
|---|---|---|
| 1 | Dashboard to select and store each site | Done |
| 2 | Geotagged images per site | Done |
| 3 | Satellite images per site | Done |
| 4 | Statistical PDF report per site | **Done** |
| 5 | Use `analysed-data/` for Saswad | Done |

#### Remaining loose ends

- `scripts/upload-rasters.mjs` not yet run — rasters still fall back to
  `public/gis`. Needs a service_role key in `.env.seed`.
- "Add site" button is gated on `canEdit` but the form is not built.
- `public/gis/*.tif` can be deleted once the upload has run.
- `README.md` is still the Vite template.
- Nothing has been committed yet; the branch `feat/backend-supabase` holds
  everything.

---

### 2026-09-13 — Entry 010 — Click-to-place location picker

**Type:** Implementation, on request

#### The change

Field photos are now positioned by clicking the map instead of typing
coordinates into two number boxes.

| File | Purpose |
|---|---|
| `src/features/geotag/LocationPicker.tsx` | **New.** Modal map picker |
| `src/features/geotag/GeotagUploader.tsx` | Coordinate inputs replaced by a "Set on map" / "Move on map" button |

#### Why this matters beyond convenience

A transposed digit looks entirely reasonable in a coordinate text box. On a map
it is obviously wrong. This is precisely how the original sample data ended up
with 17 of 18 observations plotted outside the study area — nobody typing
`74.052` instead of `74.002` would notice, and nobody reading it back would
either.

The picker also states outright when a chosen point falls outside the site
boundary, so the failure mode is now caught at entry rather than discovered on
the map afterwards.

#### Behaviour

- Opens on the site boundary, satellite basemap, boundary drawn as a dashed outline
- Click anywhere to drop a pin; drag it to fine-tune
- Photos that already carry EXIF GPS open at their recorded position, so the
  picker doubles as a correction tool for a bad fix
- "Site centre" as a one-click starting point
- Confirm is disabled until a position exists
- The pin takes the colour of the chosen observation category

**A position chosen on the map is always recorded as `manual`, even when the
photo had EXIF.** Once a human has moved the pin it is no longer what the camera
measured, and `gps_source` must not claim otherwise. The picker says so before
confirming: *"Moving this pin overrides the position recorded by the camera."*

Markers already appear on the main map whenever Field Observations is toggled
on — that came in with `GeotagMapLayer` in Entry 007 and needed no change.

#### Verification

The uploader sits behind the editor gate, so the picker could not be reached in
the test browser. Rather than assume, a temporary route mounted the component in
isolation; it was removed immediately afterwards.

| Check | Result |
|---|---|
| Renders | satellite base, dashed boundary, confirm disabled |
| Click to place | pin dropped at `18.320454° N, 73.999271° E`, confirm enabled |
| Provenance note | "This will be recorded as placed by hand, not measured." |
| Outside boundary | clicking at `18.338990° N` (past the `18.335873` limit) raised "Outside the Saswad boundary" |
| Confirm callback | returned `18.338990,73.999271` to the parent, modal closed |
| Harness removed | `__PickerProbe.tsx` deleted, route removed, build clean |

`npx tsc -b`, `npm run build` and `npx oxlint` all pass with **0 warnings**.

---

### 2026-09-13 — Entry 011 — Open editing for the demo (no account required)

**Type:** Deliberate security relaxation, on request

#### Why

Judges will not have credentials. Editing is now open to everyone, signed in or
not, so the prototype can be handed over and used immediately.

#### Files

| File | Purpose |
|---|---|
| `supabase/migrations/0009_open_editing.sql` | **New.** Opens write access to the anonymous role |
| `supabase/manual/revert-open-editing.sql` | **New.** Restores the editor-only rules exactly |
| `src/features/auth/AuthProvider.tsx` | `canEdit` is now always true |
| `src/features/geotag/*`, `src/features/satellite/*`, `src/features/reports/*` | Accept a null uploader; no sign-in checks |

#### How it works

Every policy condition in 0007 and 0008 was written in terms of `is_editor()`
and `is_admin()`, so those two functions now return `true` and the whole schema
relaxes from one place.

That alone was not enough. The write policies were declared `TO authenticated`,
which excludes `anon` regardless of what the condition says, so each one is
recreated for both roles. The ownership checks (`uploaded_by = auth.uid()`) also
had to go: for an anonymous visitor `auth.uid()` is null, so no row could ever
match. The client now sends null for those columns.

#### What did NOT change

**Every CHECK constraint still holds.** Open access means anyone can write, not
that anything can be written. Confirmed by `npm run db:verify`: all nine
deliberately-invalid inserts are still rejected — a photo claiming EXIF GPS with
no coordinates, a bbox with reversed corners, an insight attributed to a model
without naming it, a report marked ready with no file. Data integrity is
independent of who is allowed to write.

RLS also stays **enabled** on all eight tables. The policies are permissive
rather than absent, which keeps the structure in place for tightening later.

#### The risk, stated plainly

The anon key is compiled into the JavaScript bundle and anyone can read it out
of devtools. Until now that was harmless because the key could only read. It can
now write and delete, so **anyone who finds the deployed URL can wipe every
site, photo and report.**

That is a reasonable trade for a prototype whose data rebuilds from
`npm run db:build` in seconds. It would not be reasonable for anything holding
data that matters. Revert before this becomes real.

#### A mistake caught while writing it

The revert script was first placed at
`supabase/migrations/0009_revert_open_editing.sql`, with a comment claiming the
migration runner would skip it. That was wrong — the runner applies every file
in `migrations/` in sorted order, so `0009_o…` then `0009_r…` would have applied
the change and immediately undone it, on every push and on every
`npm run db:verify`.

Moved to `supabase/manual/`, which the runner does not read.

#### Verification

| Check | Result |
|---|---|
| `npm run db:verify` | ALL CHECKS PASSED — 25 policies, RLS on all 8 tables, all 9 invalid inserts still rejected |
| `npx tsc -b` | passes |
| `npm run build` | passes |
| `npx oxlint` | 0 warnings |
| Browser, signed out | uploader visible, "Sign in to add field photos" gate gone |

#### To restore editor-only access later

1. Run `supabase/manual/revert-open-editing.sql` in the SQL editor
2. Set `canEdit` in `AuthProvider.tsx` back to `role === 'editor' || role === 'admin'`
3. Promote at least one account, or nobody can edit anything:
   `update public.profiles set role = 'admin' where id = '<user-id>';`

Doing step 2 without step 1 only hides the buttons — the database would still
be open.

---

### 2026-09-13 — Entry 012 — Add Site actually works now

**Type:** Bug fix — a feature that looked built but was not

#### What was wrong

The "Add site" button rendered, was enabled for editors, and did nothing. It had
no `onClick`. Entry 009 listed the form as an outstanding item rather than
building it, which is not the same as the button being obviously unfinished —
it looked functional and was not.

#### Files

| File | Purpose |
|---|---|
| `src/features/sites/geo.ts` | **New.** Parses a GeoJSON boundary and derives centre, bbox, area and zoom |
| `src/features/sites/AddSiteDialog.tsx` | **New.** The form |
| `src/features/sites/api.ts` | Added `createSite`, `deleteSite` |
| `src/features/sites/useSites.ts` | Added `useCreateSite`, `useDeleteSite` |
| `src/features/sites/SiteDirectoryPage.tsx` | Button now opens the dialog |

#### Derive, do not ask

Upload a boundary and the centre, bounding box, area and default zoom are all
computed from it. Those four values describe the same polygon, so asking for
them separately is asking for them to disagree — which is exactly what produced
the original Saswad entry, whose centre lay outside its own boundary and whose
stated area was nearly four times the truth.

A boundary is optional. A site can be registered from a centre point alone and
given its polygon later.

#### Two real bugs found by testing the maths against Saswad

**1. Area was 0.6% wrong.** The spherical-excess calculation used the equatorial
radius, 6,378,137 m. Area calculations need the authalic (equal-area) radius,
6,371,007.181 m. That alone was 0.22%.

The rest was more interesting: the geodesic area of the Saswad polygon is
**37.35 km²**, while QGIS reports **37.21 km²**. Neither is wrong — QGIS measured
it in the projected CRS the analysis ran in, and projections distort area. But
the app should agree with the analysis it reports on, so a boundary file that
carries its own `AREA` property now wins, and the computed figure is the
fallback. Saswad now reads exactly 37.2099 km².

A declared area more than 10% from the measured one is rejected as probably
meaning something else, with a warning saying which value was used.

**2. Swapped coordinates were not caught.** The check only fired above ±90°
latitude. Swapping Saswad's 18.3 N / 74.0 E gives 74.0 N / 18.3 E — the Arctic
Ocean, but perfectly in range. Now a centre beyond ±60° latitude with a
longitude inside ±60° raises a **warning**, not an error, because a genuine
polar site would look identical. The claim in the code comment that this is
detectable with certainty was removed.

#### Verification

Boundary maths tested against the known Saswad values:

| Check | Result |
|---|---|
| Area from file | 37.2099 km² — matches QGIS exactly |
| Area computed (AREA property stripped) | 37.3472 km² — correct geodesic value |
| Centre | 18.3082042, 73.9992056 — matches the seeded row |
| Not JSON / not GeoJSON / a Point | all rejected with readable messages |
| Swapped coordinates | warned |
| Slugify | "Saswad" → saswad, "New Delhi Ridge" → new-delhi-ridge |

Browser: button opens the dialog, 11 fields render, Create is disabled until a
boundary or centre exists.

`npx tsc -b`, `npm run build`, `npx oxlint` — all pass, 0 warnings.

---

### 2026-09-13 — Entry 013 — Removed the last fabricated data, plus robustness work

**Type:** Correctness and hardening

Covers items 1 and 5 from the improvement list. Item 3 (uploading rasters to
Storage) still needs a service_role key and remains the user's step.

#### 1. The last fabricated numbers are gone

**`WatershedDashboard.tsx`** sat directly above the real analytics dashboard
showing `NDVI: 0.62`, `12 Active Bodies`, `+18% Seasonal Coverage`, `Soil
Moisture 42%`, and `1,248` observations `Across 36 locations`. Every one
invented.

The damage was not the fake numbers alone but their position: a reader took
"1,248 observations" at face value, scrolled a screen, and found 0 field photos
and −75.82% water. Fake figures adjacent to real ones discredit the real ones.

Now reads live: vegetation area with its change, surface water with its change,
analysis extent with pixel count, and the actual geo-tagged photo count. The
decorative SVG stays but is labelled *"Illustration — open the real map"* and
links to the map, rather than implying it is one.

**`Impact.tsx`** claimed "**30 m** Satellite Data Resolution", contradicting the
10 m stated two sections below. Resolution is now read from the finest raster
grid in the database, and the other tiles show real analysed area and site
count instead of "360°" and "Scalable".

**`Workflow.tsx`** said "30 m spatial datasets". Corrected to "Sentinel-2 imagery
at 10 m, with 30 m SRTM elevation for terrain" — both figures true, and the
distinction is the point.

**`DataSources.tsx`** claimed a "Mobile app synced, ±2.4m GPS accuracy" (no
mobile app exists), an "ISO 19115 GIS Standard" badge, and "SRISHTI-DRISHTI
Compatible Framework · Compliant with national watershed standards" with no
compliance work behind it. All replaced with what the database actually
contains: layer count and grid sizes, analysis period, scene count and sensors,
photo count and how many carry camera GPS, and the CRS.

An unverifiable claim is worse than no claim — it is the one thing a reviewer
asks about, and there is no good answer.

Verified by grep and in the browser: no occurrence of `0.62`, `1,248`,
`36 locations`, `SRISHTI`, `ISO 19115`, `2.4m` or `HydroVision` remains. The one
surviving "30m" is `SRTM 30m Stream Channels`, which is correct — that raster
genuinely is 30 m.

#### 5. Robustness

| Change | Detail |
|---|---|
| **Site editing** | New `EditSiteDialog`, reachable from a Settings button in the workspace header. Name, district, state, country, CRS, description and published state. Deletion sits behind typing the slug to confirm. |
| **Slug and geometry are not editable** | Shown, but locked. The slug is in URLs and in the storage path of every file already uploaded, so changing it would orphan them. Extent and centre come from the boundary and should be corrected by replacing it — typing over them is how the original entry ended up describing a different place from its own polygon. |
| **Error boundary** | Wraps each route. One thrown error used to blank the entire page, which during a demo is indistinguishable from the site being down. |
| **Comparison aspect ratio** | The viewport now derives its shape from the site bounding box, corrected for latitude. Saswad is 6110 × 6090 m — near square — and the old fixed 8:3 with `object-cover` was cutting roughly a third off top and bottom. |
| **Mobile layer panel** | Was a fixed 288 px, covering most of a 375 px screen. Now `min(18rem, 100vw - 3rem)`. |
| **README** | Replaced the Vite template with real documentation. |

#### Bundle: 1,335 kB to 648 kB

Lazy-loading `AnalyticsDashboard` inside `LandingPage` changed **nothing** —
measured, not assumed. `SiteWorkspacePage` still imported it eagerly and the
router imported that, so it stayed in the main chunk regardless.

Splitting at the route boundary worked:

| Chunk | Size | When it loads |
|---|---|---|
| `index` | **648 kB** (was 1,335) | Always |
| `AnalyticsDashboard` | 653 kB | Opening a site, or scrolling the landing page |
| `ReportPanel` | 1,200 kB | Opening the Report tab |

The landing page now paints without waiting for Leaflet, geotiff and Recharts.

#### Verification

| Check | Result |
|---|---|
| `npx tsc -b` | passes |
| `npm run build` | passes |
| `npx oxlint` | 0 warnings |
| `npm run db:verify` | ALL CHECKS PASSED |
| Browser — landing page | real figures render; no fabricated strings present |
| Browser — Settings dialog | opens, slug locked, extent shown, delete behind confirmation |
| Browser — Data sources | reads from the database, no unverifiable claims |

#### Note on testing

Several browser assertions came back false and looked like failures. They were
case-sensitive checks against text that CSS renders uppercase. Worth remembering:
assert against `innerText` case-insensitively, since `text-transform` changes
what is read back.

#### Still outstanding

- **Nothing is committed.** All of this is on an uncommitted branch.
- Rasters not yet in Storage — `npm run db:upload-rasters` needs a service_role key.
- No UI to write `site_insights`, so the Findings panel stays empty.
- No map image in the PDF report.

---

### 2026-09-14 — Entry 014 — Findings editor and seed, plus the guided tour

**Type:** Implementation

#### Findings (item 2)

`site_insights` had a reader but nothing that wrote to it, so the panel and the
report's Findings section were structurally empty forever.

| File | Purpose |
|---|---|
| `src/features/insights/api.ts` | Added `createInsight`, `updateInsight`, `deleteInsight` |
| `src/features/insights/useSiteInsights.ts` | **New.** Query and mutation hooks |
| `src/components/analytics/AIInsights.tsx` | Add-finding form, provenance picker, delete |
| `supabase/seed/saswad-insights.sql` | **New.** 10 seeded findings |

##### On the seeded content

The request was for dummy data that "looks realistic and genuine", immediately
after an entire phase spent removing fabricated data. Those two things can be
reconciled, but only by being careful about what kind of statement each finding is.

**Six are `computed`** — statements that are literally true of the seeded data.
Every figure in them was read back from `site_metrics_view` and
`raster_class_stats` before being written, and verified:

- water 12.53 → 3.03 ha, −75.82%
- 954 loss pixels against 4 gain pixels, net −9.50 ha, matching the mask subtraction
- water share 0.34% → 0.08% of extent
- vegetation −53.98 ha, −1.46%
- non-vegetated 15.33 → 69.31 ha, a 4.5-fold increase
- residual class 66.28 ha

A reviewer who checks any of these against the tables will find they reconcile.
They are not invented; they are the real numbers written as sentences.

**Four are `analyst`** — genuine interpretation, labelled as interpretation:
that the water loss is disproportionate to the vegetation change and so points
at a hydrological driver; that a 1.46% vegetation decline sits within rainfall
variability and should not be called degradation; that single-date acquisitions
confound seasonality; that the residual class needs a real classification.

**None is labelled `model`,** because no model produced any of it.

The distinction is enforced, not just conventional: a CHECK constraint refuses a
row claiming `model` without naming the model, and the UI and PDF both show the
provenance chip on every finding.

#### Guided tour

Built the way described when the maintenance question came up.

| File | Purpose |
|---|---|
| `src/features/tour/steps.ts` | **New.** 8 steps as data |
| `src/features/tour/TourOverlay.tsx` | **New.** Spotlight, caption, playback controls |
| `scripts/check-tour-anchors.mjs` | **New.** Fails when a step's anchor is gone |

**Each step separates two concerns.** `apply` says what the app should be
showing — a tab, a set of layers — and is handed to the dashboard's own state
setters, so the tour drives the application exactly as a click would. `anchor`
says what to spotlight and is cosmetic; a missing anchor still runs the step,
just without a highlight.

That split is what makes it survive UI churn. Restyle a card, move it, rewrite
its component — the tour is unaffected, because it never touched the DOM. Delete
a tab id and TypeScript fails the build.

**`npm run tour:check` closes the remaining gap.** Anchors are the one part that
can rot silently. The checker statically scans `src/` for `data-tour` attributes
and compares them against what the steps ask for.

Proven, not assumed: deleting `data-tour="metric-cards"` produced
`GONE metric-cards` and **exit code 1**; restoring it returned exit 0. It will
fail CI.

The Hero's "Watch the Analysis" button — dead since the audit — now starts it,
navigating to the first site with the request in router state rather than a
query string, since a UI mode is not something to bookmark.

#### Two lint warnings fixed properly

1. `onApplyRef.current = onApply` during render. Moved into an effect — refs must
   not be touched while rendering.
2. `setRect(null)` in an effect purely to clear prior state. The spotlight is now
   stored with the step it was measured for, and `rect` is derived by comparing
   them, so a step change clears it with no effect and no flash of the old position.

#### Verification

| Check | Result |
|---|---|
| `npx tsc -b`, `npm run build` | pass |
| `npx oxlint` | 0 warnings |
| `npm run tour:check` | 8 of 8 anchors present; exits 1 when one is removed |
| Browser — Hero button | navigates to `/sites/saswad` and opens the tour at step 1 |
| Browser — full run | drives Overview → Water → Vegetation → Change Detection → Field Data → Report, spotlight resizing per anchor, ends with Finish |

#### Blocked on the user

- **Item 3, rasters to Storage.** Needs a service_role key in `.env.seed`; the
  key must not pass through this conversation. `npm run db:upload-rasters`.
- **Migration 0009 has not been applied.** Verified by probing: an anonymous
  insert into `site_insights` still returns `42501 row-level security policy`.
  Until it runs, editing stays editor-only and the findings seed cannot be
  applied. Both were bundled into
  `scripts/out/apply-open-editing-and-insights.sql`.

---

### 2026-09-14 — Entry 015 — Rasters uploaded to Supabase Storage

**Type:** Deployment step (item 3)

#### What happened

All 8 raster layers uploaded to the `site-rasters` bucket, 9.38 MB total. The
map now loads them from Storage rather than falling back to `public/gis`.

`scripts/upload-rasters.mjs` reads `raster_layers` for the path each file
belongs at, so the upload cannot drift from what the app will request.

#### Verification

A misleading result was chased down rather than accepted. After a successful
upload the browser console still showed eight `unavailable (400); falling back
to /gis/…` warnings, which looked like the upload had not worked.

It had. Three checks established that:

| Check | Result |
|---|---|
| `HEAD` and `GET` on the public URL, from Node | 200, `image/tiff`, 1,492,027 bytes |
| Same `fetch` from inside the page | 200, 1,492,027 bytes |
| Fresh decode — toggling NDVI, which is off by default, with `console.warn` intercepted | **0 fallback warnings** |

The warnings were stale entries in the console buffer, which persists across
navigations in the testing browser. The last check is the one that settles it:
it captures only warnings emitted from that moment on, and forces a raster that
was not already cached.

Worth recording as a testing lesson alongside the case-sensitivity one from
Entry 013: a console buffer that survives navigation will happily show you
yesterday's errors on today's page.

#### Credential handling

The service_role key was pasted into the chat. It was written to `.env.seed`
(gitignored — verified with `git check-ignore`) and the key was confirmed to
decode to `role: service_role` for project `rshnlpwdbyolftwgnyff` before use.

**It must now be rotated.** A key that has passed through a conversation
transcript should be treated as disclosed, and this one bypasses every RLS
policy on the project.

#### public/gis left in place

The local copies are deliberately not deleted yet. The fallback path in
`geoTiffRenderer` is cheap insurance while Storage is newly in use, and removing
them is a one-line change whenever wanted. They no longer cost visitors
anything: nothing fetches them unless Storage fails.

---

### 2026-09-14 — Entry 016 — Narration drives the tour, and three bugs found doing it

**Type:** Bug fix

The tour advanced on a fixed dwell timer while the voice read at its own pace,
so steps changed mid-sentence. Fixing it properly surfaced two further defects
that would each have shown up as "the tour froze" in front of an audience.

#### 1. The reported bug: steps outran the voice

How long a passage takes to read depends on the voice, the rate and the
platform, so no fixed timer can match it. With narration on, the step now ends
when the sentence ends: `speak()` takes an `onDone` callback and the tour
advances from there.

A generation counter in `useNarration` makes that safe. `speechSynthesis.cancel()`
fires `onend` on the utterance it just killed, which is indistinguishable from
finishing — without the counter every manual skip would advance twice.

The progress bar changes with the mode. With narration off it fills over the
dwell time. With narration on there is no known duration, so a filling bar would
be a lie; it shows an indeterminate shimmer instead.

#### 2. Found while testing: the tour froze in a hidden tab

`waitForStableRect` waited on `requestAnimationFrame`, which does not fire in a
background tab. The `settling` flag then stayed true forever, and because
`settling` gates *both* narration and auto-advance, the tour sat on one step
with no error and no way to tell why.

Caught because the test browser pane happened to be hidden:
`visibilityState: "hidden"`, `rafFiresWithin600ms: false`, settling spinner
still rendered after 24 seconds.

The first fix was incomplete. A wall-clock deadline was added *inside*
`waitForStableRect`, but the caller still did `await new Promise(requestAnimationFrame)`
before reaching it, so the stall simply moved one line earlier. Both now use
timeouts; rAF remains only as an optimisation for when it is available.

Switching browser tabs mid-demo was enough to trigger this.

#### 3. Found while testing: every step was spoken twice

The timeline showed two `speak` calls about 50 ms apart per step, the first
cancelled mid-sentence by the second, and steps running away without waiting.

`settling` was a boolean. On a step change the step effect and the narration
effect run in the same commit, so the narration effect saw the *previous*
render's `settling === false` alongside the *new* step — and spoke immediately,
before the layout had moved. It then spoke again once the flag had actually
cycled.

Replaced with `settledStepId`, compared against `step.id`. A new step's id is
simply not the settled one yet, so there is no stale value to read.

#### Also: a backstop so silence cannot strand the tour

With narration on, advancement depends on speech reporting completion. If it
never does — a blocked autoplay policy, a missing voice, an engine that goes
quiet — the tour would wait forever. A generous timer (dwell + 20 s) now runs
alongside as a backstop. `onDone` also fires on `onerror` for the same reason.

#### Verification

Speech was stubbed with a known 5-second duration and the run instrumented.

Before the fix:

```
8017 speak #2 · 8068 cancel · 8068 speak #3 · 8106 STEP 2
9532 cancel · 9532 speak #4 · 9612 STEP 3      <- running away, no 'end'
```

After:

```
3012 speak #1 · 8017 end #1 · 8090 speak #2 · 8110 STEP 2
13097 end #2 · 13104 STEP 3 · 13374 speak #3 · 18376 end #3 · 18536 STEP 4
```

| Measure | Result |
|---|---|
| Utterances / ends / cancels | 7 / 6 / **0** — one per step, none cut off |
| Every advance preceded by a speech end | **true**, by 7–175 ms |
| `npx tsc -b`, `npm run build`, `npx oxlint` | pass, 0 warnings |
| `npm run tour:check` | 8 of 8 anchors present |

#### Testing lesson, repeated

Two assertions in this session came back false against text that CSS renders
uppercase — `/Step \d of 8/` never matches "STEP 1 OF 8". This was already
written down in Entry 013 and still caught me out, costing several wasted
checks. Match `innerText` case-insensitively, always.

---
