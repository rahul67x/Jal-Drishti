# Database scripts

Tooling for building and checking the JalDrishti database. Everything here runs
on your own machine with plain Node — none of it ships to the browser.

## Quick reference

| Command | What it does |
|---|---|
| `npm run db:parse` | Reads `analysed-data/*.html` into `scripts/out/analysed-data.json` |
| `npm run db:seed-sql` | Turns that JSON plus the boundary GeoJSON into `supabase/seed/saswad.sql` |
| `npm run db:build` | Both of the above, in order |
| `npm run db:verify` | Applies every migration and the seed to a throwaway Postgres and asserts the results |
| `npm run db:push` | Pushes migrations to the linked Supabase project |
| `npm run db:types` | Regenerates `src/lib/database.types.ts` from the live schema |

After changing any migration or re-running QGIS, do:

```bash
npm run db:build && npm run db:verify
```

---

## The scripts

### `parse-analysed-data.mjs`

Reads the five QGIS "unique values report" files in `analysed-data/` and turns
them into structured JSON.

Those HTML files are the **original source of truth** for every Saswad number.
Rather than trusting values typed by hand, we parse the reports directly so the
database can never disagree with QGIS.

It refuses to write output unless every report passes three checks:

- class pixel counts plus NoData equal the stated total
- width times height equals the total pixel count
- every class area equals `pixel count x pixel size squared`

It also requires all five reports to describe the same grid, since layers on
different grids cannot be compared.

Adding a new raster report means adding an entry to `REPORT_MAP` at the top of
the file. The script fails loudly on an unmapped file rather than skipping it.

### `generate-seed-sql.mjs`

Produces `supabase/seed/saswad.sql` from three inputs:

- `scripts/out/analysed-data.json` — the statistics
- `public/gis/Purandar_Saswad_Study_Area.geojson` — the real boundary
- the raster files themselves — real dimensions and byte sizes

The generated SQL uses `ON CONFLICT` on every statement, so it is safe to run
repeatedly. Re-running after a fresh QGIS analysis updates the figures in place.

Two corrections it applies automatically, both bugs in the old hardcoded data:

- **Centre point.** `studyAreas.ts` used `[18.345, 74.035]`, which sits outside
  the study area. The script computes the true centre of the boundary,
  `[18.308204, 73.999206]`.
- **Area.** `studyAreas.ts` claimed 142.6 km². The boundary and the raster grid
  both say **37.21 km²**.

### `verify-schema.mjs`

Applies all migrations and the seed to a real Postgres engine and asserts the
results. Uses **PGlite** — Postgres 17 compiled to WebAssembly — so **no Docker
and no live Supabase project are needed**.

It checks:

1. every migration applies cleanly, in order
2. the seed applies cleanly
3. `site_metrics_view` reproduces the QGIS figures exactly
4. `site_lulc_view` sums to the analysed extent and to 100%
5. the seed is idempotent
6. every `CHECK` constraint actually rejects bad data
7. RLS is enabled on every table

Run it before every push. It has already caught one real bug: the extent
calculation was taking `max()` across all layers, so the 30 m streams grid
(3782.25 ha) beat the 10 m analysis grid (3720.99 ha).

---

## Expected numbers

`npm run db:verify` asserts these. They come straight from `analysed-data/`.

| Metric | Value |
|---|---|
| Vegetation 2023 | 3,705.66 ha |
| Vegetation 2026 | 3,651.68 ha |
| Vegetation change | −53.98 ha (−1.46%) |
| Water 2023 | 12.53 ha |
| Water 2026 | 3.03 ha |
| Water change | −9.50 ha (−75.82%) |
| Water loss (change raster) | 9.54 ha (954 px) |
| Water gain (change raster) | 0.04 ha (4 px) |
| Analysed extent | 3,720.99 ha = 37.21 km² |
| LULC 2026 | Vegetation 3,651.68 / Other 66.28 / Water 3.03 ha |

**The cross-check that matters.** The change raster gives `0.04 − 9.54 = −9.50 ha`.
Subtracting the two independent water masks gives `3.03 − 12.53 = −9.50 ha`.
Two separately produced rasters agreeing to the hectare is real evidence the
analysis is sound — worth stating in the PDF report. The view exposes this as
the `water_change_cross_check_ok` column, so a future data error surfaces as
`false` instead of hiding.

> Note: the old hardcoded `realMetrics.ts` gave the LULC split as
> `3651.65 / 66.31 / 3.03`. The correct computed values are
> `3651.68 / 66.28 / 3.03`. The difference is 0.03 ha — trivial in size, but it
> is proof the donut was typed by hand. Now that a SQL view does the arithmetic,
> that class of error cannot recur.

---

## Setting up Supabase (one time)

1. Go to [supabase.com](https://supabase.com) and **sign in with GitHub**.
2. **New project**. Name it `jaldrishti`. Choose region
   **South Asia (Mumbai) `ap-south-1`** — closest to users in India.
3. **Save the database password** it generates. It is shown once.
4. Wait about two minutes for provisioning.
5. Copy the credentials from **Project Settings > API**:

   ```bash
   cp .env.example .env.local
   ```

   Fill in `VITE_SUPABASE_URL` (Project URL) and `VITE_SUPABASE_ANON_KEY`
   (the `anon` `public` key — **not** `service_role`).

6. Link the CLI and push the schema:

   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npm run db:verify
   npm run db:push
   npm run db:types
   ```

7. Make yourself an admin. Sign in to the app once so a `profiles` row is
   created, then in the Supabase **SQL Editor**:

   ```sql
   update public.profiles set role = 'admin' where id = auth.uid();
   ```

   Roles are deliberately not self-editable through the app — a signup must
   never be able to grant itself write access.

---

## Security rules

- **The anon key is public.** It is compiled into the JavaScript bundle and
  anyone can read it. That is fine **only because RLS is enabled on every
  table**. `src/lib/supabase.ts` refuses to start if it detects a non-anon key.
- **The service_role key bypasses RLS entirely.** Treat it like a database root
  password. It belongs only in `.env.seed` (gitignored), read by local Node
  scripts. Never in a `VITE_` variable — anything with that prefix is shipped to
  the browser.
- Both `.env.local` and `.env.seed` are gitignored. Only the `.example` files
  are committed.

## Storage budget

The Supabase free tier allows **1 GB of storage** and **500 MB of database**.

- The 8 raster layers total roughly 9 MB — comfortable.
- Uncompressed phone photos run 3–5 MB each. The upload path compresses and
  generates thumbnails; the per-bucket `file_size_limit` in migration 0008 is
  the backstop for when it does not.
- **Do not upload `LULC_2026.tif`.** It is 482 MB, would consume half the free
  tier on its own, and nothing reads it.
