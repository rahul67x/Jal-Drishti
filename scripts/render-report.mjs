/**
 * render-report.mjs
 * ---------------------------------------------------------------------------
 * Renders a site's PDF report headlessly, without a browser.
 *
 * Useful for two things: checking the report actually builds after a change to
 * the document, and generating reports from a script or CI rather than by hand.
 *
 * The document itself is TSX, so it is bundled with esbuild first. That happens
 * automatically — no build step to remember.
 *
 * Usage:
 *   node --env-file=.env.local scripts/render-report.mjs [site-slug] [out.pdf]
 *
 * Default slug is "saswad"; default output is scripts/out/<slug>-report.pdf
 */

import { createClient } from '@supabase/supabase-js';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import React from 'react';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'scripts', 'out');

const slug = process.argv[2] ?? 'saswad';
const outPath = process.argv[3] ?? join(OUT_DIR, `${slug}-report.pdf`);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase config. Run with: node --env-file=.env.local scripts/render-report.mjs');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

/** Bundles the TSX document into something Node can import. */
async function loadDocument() {
  mkdirSync(OUT_DIR, { recursive: true });
  const bundlePath = join(OUT_DIR, '.report-document.mjs');

  await build({
    entryPoints: [join(ROOT, 'src', 'features', 'reports', 'ReportDocument.tsx')],
    outfile: bundlePath,
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node20',
    jsx: 'automatic',
    logLevel: 'error',
    // Keep these external so Node resolves the real installed packages rather
    // than bundling two copies of React into the same process.
    external: ['react', 'react/jsx-runtime', '@react-pdf/renderer'],
  });

  const mod = await import(pathToFileURL(bundlePath).href);
  return { Doc: mod.default ?? mod.ReportDocument, bundlePath };
}

async function collect() {
  const { data: site, error: siteError } = await supabase
    .from('sites')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (siteError) throw siteError;
  if (!site) throw new Error(`No site with slug "${slug}"`);

  const [metrics, lulc, rasters, insights, geotagged, satellite] = await Promise.all([
    supabase.from('site_metrics_view').select('*').eq('slug', slug).maybeSingle(),
    supabase.from('site_lulc_view').select('*').eq('slug', slug).order('display_order'),
    supabase
      .from('raster_layers')
      .select('*, stats:raster_class_stats(*)')
      .eq('site_id', site.id)
      .order('display_order'),
    supabase
      .from('site_insights')
      .select('*')
      .eq('site_id', site.id)
      .eq('is_published', true)
      .order('display_order'),
    supabase.from('geotagged_images').select('*').eq('site_id', site.id),
    supabase
      .from('satellite_images')
      .select('*')
      .eq('site_id', site.id)
      .eq('include_in_report', true),
  ]);

  const pub = (bucket, path) => supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;

  return {
    site,
    metrics: metrics.data,
    lulc: lulc.data ?? [],
    rasters: (rasters.data ?? []).map((r) => ({
      ...r,
      stats: [...(r.stats ?? [])].sort((a, b) => a.display_order - b.display_order),
    })),
    insights: insights.data ?? [],
    geotagged: (geotagged.data ?? []).map((g) => ({ ...g, url: pub(g.storage_bucket, g.storage_path) })),
    satellite: (satellite.data ?? []).map((s) => ({ ...s, url: pub(s.storage_bucket, s.storage_path) })),
    generatedAt: new Date().toISOString(),
    options: {
      statisticalTables: true,
      charts: true,
      satellitePlates: true,
      fieldPhotos: true,
      findings: true,
      provenance: true,
    },
  };
}

async function main() {
  console.log(`Rendering report for "${slug}"`);

  const [{ Doc, bundlePath }, data] = await Promise.all([loadDocument(), collect()]);

  console.log(`  site        ${data.site.name}`);
  console.log(`  rasters     ${data.rasters.length} (${data.rasters.filter((r) => r.stats.length).length} with statistics)`);
  console.log(`  insights    ${data.insights.length}`);
  console.log(`  photos      ${data.geotagged.length}`);
  console.log(`  plates      ${data.satellite.length}`);

  const { renderToBuffer } = await import('@react-pdf/renderer');
  const buffer = await renderToBuffer(
    React.createElement(Doc, { data, omitted: { photos: 0, plates: 0 } })
  );

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, buffer);
  rmSync(bundlePath, { force: true });

  console.log(`\nWrote ${(buffer.length / 1024).toFixed(1)} KB -> ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
