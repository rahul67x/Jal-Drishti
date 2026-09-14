/**
 * bundle-sql.mjs
 * ---------------------------------------------------------------------------
 * Concatenates every migration and the seed into ONE file that can be pasted
 * straight into the Supabase SQL Editor.
 *
 * This is the fallback for when the CLI is not linked. `npm run db:push` is the
 * better route because it records what it applied — but `supabase login` needs
 * an interactive browser sign-in and `supabase link` asks for the database
 * password, so this path exists for when neither is convenient.
 *
 * Crucially, the bundle also writes rows into supabase_migrations.schema_migrations,
 * the same table the CLI uses to track applied migrations. Without that, a later
 * `supabase db push` would try to re-apply everything and fail.
 *
 * Output: scripts/out/apply-all.sql
 *
 * Usage: npm run db:bundle
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIG_DIR = join(ROOT, 'supabase', 'migrations');
const SEED_DIR = join(ROOT, 'supabase', 'seed');
const OUT_DIR = join(ROOT, 'scripts', 'out');
const OUT_FILE = join(OUT_DIR, 'apply-all.sql');

const out = [];
const w = (line = '') => out.push(line);

/**
 * Removes standalone `begin;` / `commit;` lines so an included file can be
 * nested inside the bundle's own transaction. Only whole-line matches are
 * touched, so a `begin` inside a plpgsql body is left alone.
 */
function stripTransactionControl(sql) {
  return sql
    .split('\n')
    .filter((line) => !/^\s*(begin|commit)\s*;\s*$/i.test(line))
    .join('\n');
}

const migrations = readdirSync(MIG_DIR).filter((f) => f.endsWith('.sql')).sort();
const seeds = readdirSync(SEED_DIR).filter((f) => f.endsWith('.sql')).sort();

w('-- ===========================================================================');
w('-- JalDrishti — complete schema and seed, in one file');
w('-- ---------------------------------------------------------------------------');
w('-- GENERATED. Do not edit. Rebuild with: npm run db:bundle');
w(`-- Generated: ${new Date().toISOString()}`);
w('--');
w('-- HOW TO USE');
w('--   1. Supabase dashboard > SQL Editor > New query');
w('--   2. Paste this entire file');
w('--   3. Run');
w('--');
w('-- RUN THIS ONCE, on an empty database.');
w('--');
w('-- It runs as a SINGLE TRANSACTION. If anything fails — a name collision on a');
w('-- database that is not empty, say — the whole thing rolls back and your');
w('-- database is left exactly as it was. Nothing is half-applied.');
w('--');
w('-- It only ever CREATES and INSERTS. There is not a single DROP or DELETE in');
w('-- this file, so it cannot remove anything you already have.');
w('--');
w('-- Running it a second time fails on "type already exists" and rolls back.');
w('-- That is expected: migrations apply once. To refresh only the data, paste');
w('-- supabase/seed/saswad.sql instead — that part IS safe to re-run.');
w('--');
w('-- To start over completely, run this first (THIS one is destructive):');
w('--   drop schema public cascade; create schema public;');
w('--   drop schema supabase_migrations cascade;');
w('--');
w(`-- Contains ${migrations.length} migrations and ${seeds.length} seed file(s).`);
w('-- ===========================================================================');
w();

// The CLI keeps its record of applied migrations here. Creating and populating
// it means a later `supabase db push` sees this work as already done rather
// than trying to apply it a second time.
// Postgres runs DDL inside transactions, so wrapping the whole bundle makes it
// all-or-nothing. If any statement fails — a name collision on a project that
// is not empty, for instance — everything rolls back and the database is left
// exactly as it was. Without this, a partial failure leaves a half-built schema
// that has to be cleaned up by hand.
w('-- ---------------------------------------------------------------------------');
w('-- Everything below runs as ONE transaction: it either all applies, or none');
w('-- of it does. A failure part-way through leaves the database untouched.');
w('-- ---------------------------------------------------------------------------');
w('begin;');
w();

w('-- ---------------------------------------------------------------------------');
w('-- Migration bookkeeping table (normally created by the Supabase CLI)');
w('-- ---------------------------------------------------------------------------');
w('create schema if not exists supabase_migrations;');
w('create table if not exists supabase_migrations.schema_migrations (');
w('  version text primary key,');
w('  statements text[],');
w('  name text');
w(');');
w();

for (const file of migrations) {
  const version = file.split('_')[0];
  const name = file.replace(/^\d+_/, '').replace(/\.sql$/, '');

  w('-- ###########################################################################');
  w(`-- MIGRATION ${file}`);
  w('-- ###########################################################################');
  w();
  w(stripTransactionControl(readFileSync(join(MIG_DIR, file), 'utf8')).trimEnd());
  w();
  w(`-- Record ${file} as applied`);
  w('insert into supabase_migrations.schema_migrations (version, name)');
  w(`values ('${version}', '${name}')`);
  w('on conflict (version) do nothing;');
  w();
}

for (const file of seeds) {
  w('-- ###########################################################################');
  w(`-- SEED ${file}`);
  w('-- ###########################################################################');
  w();
  // The seed manages its own transaction when run standalone. Inside the outer
  // transaction above, a nested begin warns and the inner commit would close
  // the outer one early, so strip them here.
  w(stripTransactionControl(readFileSync(join(SEED_DIR, file), 'utf8')).trimEnd());
  w();
}

w('commit;');
w();
w('-- ---------------------------------------------------------------------------');
w('-- Check it worked. Expected:');
w('--   -53.98 | -1.46 | -9.50 | -75.82 | 9.54 | 0.04 | -9.50 | t | 3720.99');
w('-- ---------------------------------------------------------------------------');
w('select vegetation_change_ha, vegetation_change_pct,');
w('       water_change_ha, water_change_pct,');
w('       water_loss_ha, water_gain_ha, water_net_change_ha,');
w('       water_change_cross_check_ok, total_area_ha');
w("  from public.site_metrics_view where slug = 'saswad';");

mkdirSync(OUT_DIR, { recursive: true });
const sql = out.join('\n') + '\n';
writeFileSync(OUT_FILE, sql, 'utf8');

console.log(`Bundled ${migrations.length} migrations + ${seeds.length} seed file(s)`);
console.log(`${sql.split('\n').length - 1} lines -> ${OUT_FILE}`);
console.log('\nPaste it into: Supabase dashboard > SQL Editor > New query > Run');
