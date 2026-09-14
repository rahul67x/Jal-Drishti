# JalDrishti

Geospatial intelligence for watershed development planning and monitoring.

A web platform that turns satellite raster analysis and geo-tagged field
photography into evidence a planner can act on. Built for Smart India Hackathon
2026.

Currently monitoring one site: **Saswad, Purandar taluka, Pune, Maharashtra** —
37.21 km² analysed at 10 m resolution in EPSG:32643.

---

## What it does

- **Site registry.** Every study area has its own ID, boundary, rasters,
  imagery and findings. Adding a site is a form, not a code change.
- **Interactive GIS map.** Sentinel-2 derived NDVI, surface water masks for two
  epochs, a water-change raster, and an SRTM drainage network — decoded from
  GeoTIFF in the browser and draped on Leaflet.
- **Measured metrics.** Vegetation and water extent, change between epochs, and
  land cover composition, computed in Postgres from raw pixel counts.
- **Geo-tagged field photos.** GPS read from EXIF, or placed on a map. Each
  becomes a pin.
- **Satellite imagery.** Scenes with sensor, date, resolution and cloud cover.
  Two from different years turn the before/after slider into a real comparison.
- **PDF site reports.** Statistics, charts, satellite plates and field evidence
  in one document, generated in the browser.

## Findings for Saswad, 2023 to 2026

| Measure | 2023 | 2026 | Change |
|---|---|---|---|
| Vegetation | 3,705.66 ha | 3,651.68 ha | −53.98 ha (−1.46%) |
| Surface water | 12.53 ha | 3.03 ha | −9.50 ha (−75.82%) |

The change raster independently reports 9.54 ha of water loss against 0.04 ha of
gain — a net −9.50 ha, matching the figure obtained by subtracting the two water
masks. Two separately produced rasters agreeing to the hectare is the strongest
internal check the analysis has, and the app surfaces it as a pass/fail rather
than burying it.

---

## Running it

```bash
npm install
cp .env.example .env.local     # add your Supabase URL and anon key
npm run dev
```

Open http://localhost:5173

## Architecture

```
React 19 + TypeScript + Vite
  ├── Leaflet + react-leaflet        the map
  ├── geotiff                        decodes .tif in the browser
  ├── Recharts                       charts
  ├── @react-pdf/renderer            report generation (lazy-loaded)
  └── Supabase                       Postgres + Storage + Auth
```

Everything the UI displays comes from Postgres. There are no hardcoded figures:
`site_metrics_view` computes each one from the raw pixel counts in
`raster_class_stats`, so a number on screen cannot drift from the analysis it
came from.

```
src/
  features/        sites, rasters, geotag, satellite, reports, insights, auth
  components/      landing page sections and the analytics dashboard
  lib/             supabase client, query client, formatting
supabase/
  migrations/      schema, RLS, storage buckets
  seed/            generated seed data
scripts/           parsing, seeding, verification, headless reports
analysed-data/     the source QGIS reports — the origin of every figure
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Type-check and build |
| `npm run lint` | oxlint |
| `npm run db:build` | Parse `analysed-data/` and regenerate the seed SQL |
| `npm run db:verify` | Apply every migration and the seed to an in-memory Postgres and assert the results |
| `npm run db:bundle` | Concatenate schema + seed into one paste-ready file |
| `npm run db:push` | Push migrations to the linked Supabase project |
| `npm run db:types` | Regenerate `src/lib/database.types.ts` from the live schema |
| `npm run db:upload-rasters` | Upload `public/gis` to Supabase Storage (needs a service_role key) |
| `npm run report:render` | Render a site's PDF headlessly |

### `npm run db:verify` is worth knowing about

It applies the whole schema and seed to PGlite — real Postgres compiled to
WebAssembly — with no Docker and no live project, then asserts that the computed
metrics match the QGIS reports exactly, that the seed is idempotent, that every
CHECK constraint rejects bad data, and that RLS is enabled everywhere.

It has already caught a bug that would otherwise have shipped: the extent
calculation was taking `max()` across all layers, so the coarse 30 m streams
grid (3782.25 ha) beat the true 10 m analysis grid (3720.99 ha).

## Where the numbers come from

`analysed-data/` holds five QGIS "unique values" reports. They are the origin of
every figure in the app.

`npm run db:build` parses them, validates each one internally (class counts sum
to the stated total, width × height matches the pixel count, every area equals
pixels × pixel size), and generates the seed. Nothing is transcribed by hand.

## Current state

Editing is **open to everyone, with no account**, so the prototype can be
demonstrated without credentials. See
`supabase/migrations/0009_open_editing.sql` for what that means and
`supabase/manual/revert-open-editing.sql` to restore editor-only access.

The anon key is public and can now write. Do not point this at data that
matters until that migration is reverted.

## Project record

`prem-backend.md` is a running log of every change: what was built, why, what
broke, and what was verified. Start there.
