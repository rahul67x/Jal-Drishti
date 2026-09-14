/**
 * upload-rasters.mjs
 * ---------------------------------------------------------------------------
 * Uploads the raster files in public/gis to the Supabase `site-rasters` bucket,
 * at the exact storage_path each raster_layers row already declares.
 *
 * Until this runs, the app falls back to the local copies in public/gis and
 * logs a warning per layer. After it runs, the map loads everything from
 * Storage and the local copies can be deleted.
 *
 * REQUIRES a service_role key, because the bucket's write policy demands an
 * editor and this script runs as no logged-in user. Put it in .env.seed:
 *
 *   cp .env.seed.example .env.seed
 *   # then fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *
 * .env.seed is gitignored. The service_role key bypasses every Row Level
 * Security policy — treat it like a database root password, keep it on your
 * machine, and never put it in a VITE_ variable.
 *
 * Usage:
 *   node --env-file=.env.seed scripts/upload-rasters.mjs
 *   node --env-file=.env.seed scripts/upload-rasters.mjs --dry-run
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GIS_DIR = join(ROOT, 'public', 'gis');

const DRY_RUN = process.argv.includes('--dry-run');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n\n' +
      '  cp .env.seed.example .env.seed\n' +
      '  # fill in both values from Project Settings > API\n' +
      '  node --env-file=.env.seed scripts/upload-rasters.mjs\n'
  );
  process.exit(1);
}

// A service_role key must never reach the browser. Catch the reverse mistake
// too: an anon key here would fail every upload with a confusing 403.
if (SERVICE_ROLE_KEY.startsWith('sb_publishable_')) {
  console.error('SUPABASE_SERVICE_ROLE_KEY holds a publishable key. Uploads need the secret key.');
  process.exit(1);
}

const MIME_BY_EXT = {
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  // The database already knows where every raster belongs. Reading the rows
  // rather than hardcoding a file list means the upload can never drift from
  // what the app will actually ask for.
  const { data: layers, error } = await supabase
    .from('raster_layers')
    .select('layer_key, title, storage_bucket, storage_path, format')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Could not read raster_layers:', error.message);
    process.exit(1);
  }

  if (!layers?.length) {
    console.error('No raster_layers rows found. Apply the schema and seed first.');
    process.exit(1);
  }

  console.log(`${layers.length} raster layers registered${DRY_RUN ? '  (DRY RUN)' : ''}\n`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;
  let bytes = 0;

  for (const layer of layers) {
    const fileName = layer.storage_path.split('/').pop();
    const localPath = join(GIS_DIR, fileName);
    const label = layer.layer_key.padEnd(24);

    if (!existsSync(localPath)) {
      console.warn(`  skip  ${label} ${fileName} not found in public/gis`);
      skipped++;
      continue;
    }

    const size = statSync(localPath).size;
    const contentType = MIME_BY_EXT[extname(fileName).toLowerCase()] ?? 'application/octet-stream';

    if (DRY_RUN) {
      console.log(
        `  would upload  ${label} ${fileName} -> ${layer.storage_bucket}/${layer.storage_path} (${(size / 1024 / 1024).toFixed(2)} MB)`
      );
      uploaded++;
      bytes += size;
      continue;
    }

    const body = readFileSync(localPath);
    const { error: uploadError } = await supabase.storage
      .from(layer.storage_bucket)
      .upload(layer.storage_path, body, { contentType, upsert: true });

    if (uploadError) {
      console.error(`  FAIL  ${label} ${uploadError.message}`);
      failed++;
      continue;
    }

    console.log(`  ok    ${label} ${fileName} (${(size / 1024 / 1024).toFixed(2)} MB)`);
    uploaded++;
    bytes += size;
  }

  console.log(
    `\n${DRY_RUN ? 'Would upload' : 'Uploaded'} ${uploaded}` +
      `${skipped ? `, skipped ${skipped}` : ''}` +
      `${failed ? `, FAILED ${failed}` : ''}` +
      `  (${(bytes / 1024 / 1024).toFixed(2)} MB total)`
  );

  if (!DRY_RUN && uploaded > 0) {
    // Confirm the files are actually readable through the public URL the app
    // will use, rather than trusting that the upload call returning ok is enough.
    const sample = layers.find((l) => existsSync(join(GIS_DIR, l.storage_path.split('/').pop())));
    if (sample) {
      const { data } = supabase.storage.from(sample.storage_bucket).getPublicUrl(sample.storage_path);
      const res = await fetch(data.publicUrl, { method: 'HEAD' });
      console.log(
        res.ok
          ? `\nVerified: ${sample.layer_key} is publicly readable (HTTP ${res.status}).`
          : `\nWARNING: ${sample.layer_key} uploaded but is not publicly readable (HTTP ${res.status}). Check the bucket policies in migration 0008.`
      );
    }
    console.log('\nThe map will now load rasters from Storage. The copies in public/gis');
    console.log('are no longer needed and can be deleted to slim the repo.');
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
