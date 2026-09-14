/**
 * verify-schema.mjs
 * ---------------------------------------------------------------------------
 * Applies every migration and the Saswad seed to a throwaway Postgres instance
 * and asserts the results, WITHOUT needing Docker or a live Supabase project.
 *
 * It uses PGlite — real Postgres 17 compiled to WebAssembly — so constraints,
 * generated columns, window functions and view semantics all behave exactly as
 * they will in production.
 *
 * What it checks:
 *   1. every migration applies cleanly, in order
 *   2. the seed applies cleanly
 *   3. site_metrics_view reproduces the QGIS figures to the penny
 *   4. site_lulc_view sums to the analysed extent and to 100%
 *   5. the seed is idempotent (running it twice changes nothing)
 *   6. every CHECK constraint actually rejects bad data
 *   7. RLS is enabled on every table
 *
 * Run:  npm run db:verify
 *
 * Supabase supplies the auth and storage schemas at runtime; they are stubbed
 * below so the migrations can run unmodified.
 */

import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIG_DIR = join(ROOT, 'supabase', 'migrations');
const SEED_DIR = join(ROOT, 'supabase', 'seed');

/** Expected values, taken straight from analysed-data/*.html. */
const EXPECTED = {
  vegetation_baseline_ha: 3705.66,
  vegetation_current_ha: 3651.68,
  vegetation_change_ha: -53.98,
  vegetation_change_pct: -1.46,
  water_baseline_ha: 12.53,
  water_current_ha: 3.03,
  water_change_ha: -9.5,
  water_change_pct: -75.82,
  water_loss_ha: 9.54,
  water_gain_ha: 0.04,
  water_net_change_ha: -9.5,
  total_area_ha: 3720.99,
  total_area_km2: 37.2099,
};

const SUPABASE_STUBS = `
create schema if not exists auth;
create schema if not exists storage;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb default '{}'::jsonb
);

create or replace function auth.uid() returns uuid
  language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;

create table storage.buckets (
  id text primary key,
  name text not null,
  public boolean default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);

create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name text,
  owner uuid
);
alter table storage.objects enable row level security;

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
end $$;
`;

/** Statements that MUST be rejected. If any is accepted, a guard rail is missing. */
const MUST_REJECT = [
  ['bounding box with corners reversed', `
    insert into public.sites (slug,name,centre_lat,centre_lng,bbox_min_lat,bbox_min_lng,bbox_max_lat,bbox_max_lng)
    values ('bad-bbox','Bad',18,74, 19,75, 18,74)`],
  ['change layer whose year_to precedes year_from', `
    insert into public.raster_layers (site_id,layer_key,kind,title,storage_path,year_from,year_to)
    values ((select id from public.sites where slug='saswad'),'bad_years','change','Bad','x.tif',2026,2023)`],
  ['a second primary class on one layer', `
    insert into public.raster_class_stats (raster_layer_id,class_value,class_label,pixel_count,area_m2,is_primary)
    values ((select rl.id from public.raster_layers rl join public.sites s on s.id=rl.site_id
             where s.slug='saswad' and rl.layer_key='water_mask_2023'), 7,'Bogus',1,100,true)`],
  ['photo claiming EXIF GPS but carrying no coordinates', `
    insert into public.geotagged_images (site_id,storage_path,title,gps_source)
    values ((select id from public.sites where slug='saswad'),'a.jpg','No GPS','exif')`],
  ['latitude supplied without longitude', `
    insert into public.geotagged_images (site_id,storage_path,title,lat)
    values ((select id from public.sites where slug='saswad'),'b.jpg','Half a fix',18.3)`],
  ['insight attributed to a model without naming it', `
    insert into public.site_insights (site_id,body,source)
    values ((select id from public.sites where slug='saswad'),'Generated text','model')`],
  ['report marked ready with no file behind it', `
    insert into public.reports (site_id,title,status)
    values ((select id from public.sites where slug='saswad'),'Empty','ready')`],
  ['satellite overlay with no bounds to place it', `
    insert into public.satellite_images (site_id,storage_path,title,is_overlay)
    values ((select id from public.sites where slug='saswad'),'c.png','Floating',true)`],
  ['slug containing spaces and capitals', `
    insert into public.sites (slug,name,centre_lat,centre_lng) values ('Not A Slug','X',18,74)`],
];

const db = new PGlite();
let failures = 0;

const pass = (msg) => console.log(`  ok    ${msg}`);
const fail = (msg, detail) => {
  failures++;
  console.error(`  FAIL  ${msg}`);
  if (detail) console.error(`        ${detail}`);
};

async function apply(label, sql) {
  try {
    await db.exec(sql);
    pass(label);
    return true;
  } catch (err) {
    fail(label, err.message);
    return false;
  }
}

async function main() {
  console.log('Supabase stubs');
  if (!(await apply('auth + storage schemas, anon/authenticated roles', SUPABASE_STUBS))) {
    process.exit(1);
  }

  console.log('\nMigrations');
  const migrations = readdirSync(MIG_DIR).filter((f) => f.endsWith('.sql')).sort();
  if (migrations.length === 0) fail('no migrations found');
  for (const file of migrations) {
    await apply(file, readFileSync(join(MIG_DIR, file), 'utf8'));
  }

  console.log('\nSeed');
  const seeds = readdirSync(SEED_DIR).filter((f) => f.endsWith('.sql')).sort();
  for (const file of seeds) {
    await apply(file, readFileSync(join(SEED_DIR, file), 'utf8'));
  }

  if (failures > 0) {
    console.error('\nSchema did not apply cleanly — stopping before assertions.');
    process.exit(1);
  }

  // --- derived metrics ----------------------------------------------------
  console.log('\nsite_metrics_view reproduces the QGIS figures');
  const metrics = (
    await db.query(`select * from public.site_metrics_view where slug = 'saswad'`)
  ).rows[0];

  if (!metrics) {
    fail('no row returned for slug "saswad"');
  } else {
    for (const [column, want] of Object.entries(EXPECTED)) {
      const raw = metrics[column];
      const got = raw === null || raw === undefined ? null : Number(raw);
      if (got !== null && Math.abs(got - want) < 0.005) {
        pass(`${column.padEnd(26)} ${want}`);
      } else {
        fail(`${column.padEnd(26)} expected ${want}, got ${got}`);
      }
    }

    // The change raster is measured independently of the two water masks, so
    // their agreement is a genuine cross-check rather than a restatement.
    if (metrics.water_change_cross_check_ok === true) {
      pass('water_change_cross_check_ok       change raster agrees with the water masks');
    } else {
      fail(`water_change_cross_check_ok       expected true, got ${metrics.water_change_cross_check_ok}`);
    }
  }

  // --- land cover ---------------------------------------------------------
  console.log('\nsite_lulc_view is internally consistent');
  const lulc = (
    await db.query(
      `select class_name, area_ha, share_pct from public.site_lulc_view
        where slug = 'saswad' order by display_order`
    )
  ).rows;

  let areaSum = 0;
  let shareSum = 0;
  for (const row of lulc) {
    areaSum += Number(row.area_ha);
    shareSum += Number(row.share_pct);
    console.log(`        ${row.class_name.padEnd(12)} ${String(row.area_ha).padStart(9)} ha  ${String(row.share_pct).padStart(6)} %`);
  }
  if (Math.abs(areaSum - EXPECTED.total_area_ha) < 0.02 && Math.abs(shareSum - 100) < 0.02) {
    pass(`classes sum to ${areaSum.toFixed(2)} ha and ${shareSum.toFixed(2)} %`);
  } else {
    fail(`classes sum to ${areaSum.toFixed(2)} ha / ${shareSum.toFixed(2)} %, expected ${EXPECTED.total_area_ha} / 100`);
  }

  // --- idempotency --------------------------------------------------------
  console.log('\nSeed is idempotent');
  const before = (await db.query(`select count(*)::int as n from public.raster_class_stats`)).rows[0].n;
  try {
    for (const file of seeds) {
      await db.exec(readFileSync(join(SEED_DIR, file), 'utf8'));
    }
    const after = (await db.query(`select count(*)::int as n from public.raster_class_stats`)).rows[0].n;
    const recheck = (
      await db.query(`select vegetation_change_ha from public.site_metrics_view where slug='saswad'`)
    ).rows[0];
    if (before === after && Math.abs(Number(recheck.vegetation_change_ha) - EXPECTED.vegetation_change_ha) < 0.005) {
      pass(`re-running left ${after} stat rows and the same metrics`);
    } else {
      fail(`re-running changed the data: ${before} -> ${after} rows`);
    }
  } catch (err) {
    fail('re-running the seed threw', err.message);
  }

  // --- constraints --------------------------------------------------------
  console.log('\nConstraints reject bad data');
  for (const [label, sql] of MUST_REJECT) {
    try {
      await db.exec(sql);
      fail(`${label} — was ACCEPTED but should have been rejected`);
    } catch {
      pass(label);
    }
  }

  // --- row security -------------------------------------------------------
  console.log('\nRow Level Security');
  const tables = (
    await db.query(`
      select c.relname, c.relrowsecurity
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r'
       order by c.relname`)
  ).rows;
  for (const t of tables) {
    if (t.relrowsecurity) pass(`${t.relname} has RLS enabled`);
    else fail(`${t.relname} has RLS DISABLED`);
  }
  const policies = (
    await db.query(`select count(*)::int as n from pg_policies where schemaname in ('public','storage')`)
  ).rows[0].n;
  pass(`${policies} policies defined`);

  console.log(
    failures === 0
      ? '\nALL CHECKS PASSED'
      : `\n${failures} CHECK${failures === 1 ? '' : 'S'} FAILED`
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
