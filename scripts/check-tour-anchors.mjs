/**
 * check-tour-anchors.mjs
 * ---------------------------------------------------------------------------
 * Fails when a guided-tour step points at an element that no longer exists.
 *
 * This is the answer to "what happens when the UI changes". The tour drives
 * application state rather than the DOM, so a rearranged layout cannot stop it
 * working — but each step also spotlights an element by `data-tour`, and those
 * attributes rot silently when components are rewritten. Without this check,
 * the first person to notice is whoever is presenting.
 *
 * A static scan, not a browser: it looks for every `data-tour="…"` in src/ and
 * compares that set against the anchors the tour asks for. Fast enough to run
 * on every commit, and needs no dev server.
 *
 * Usage:  npm run tour:check
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const STEPS_FILE = join(SRC, 'features', 'tour', 'steps.ts');

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (['.tsx', '.ts'].includes(extname(entry))) out.push(full);
  }
  return out;
}

// Anchors the tour asks for.
const stepsSource = readFileSync(STEPS_FILE, 'utf8');
const wanted = [...stepsSource.matchAll(/anchor:\s*'([^']+)'/g)].map((m) => m[1]);

// Anchors the app actually renders.
// The tour's own files are skipped: TourOverlay builds selectors like
// `[data-tour="${anchor}"]`, which would otherwise be scraped as if they were
// anchors and report literal `${anchor}` as placed.
const TOUR_DIR = join(SRC, 'features', 'tour');

const files = walk(SRC).filter((f) => !f.startsWith(TOUR_DIR));
const placed = new Map();
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/data-tour="([a-z0-9-]+)"/g)) {
    placed.set(m[1], file.replace(ROOT + '\\', '').replace(ROOT + '/', ''));
  }
}

const stepCount = (stepsSource.match(/^\s{2}\{\s*$/gm) ?? []).length;
console.log(`${wanted.length} anchored steps, ${placed.size} anchors in the source\n`);

let missing = 0;
for (const anchor of wanted) {
  const where = placed.get(anchor);
  if (where) {
    console.log(`  ok    ${anchor.padEnd(16)} ${where}`);
  } else {
    missing++;
    console.error(`  GONE  ${anchor.padEnd(16)} no data-tour="${anchor}" anywhere in src/`);
  }
}

// Not a failure, but worth knowing — an anchor nobody spotlights is dead weight.
const unused = [...placed.keys()].filter((a) => !wanted.includes(a));
if (unused.length) {
  console.log(`\nAnchors placed but not used by any step: ${unused.join(', ')}`);
}

if (missing > 0) {
  console.error(
    `\n${missing} tour step${missing === 1 ? '' : 's'} ${missing === 1 ? 'points' : 'point'} ` +
      'at an element that no longer exists.\n' +
      'Either restore the data-tour attribute, or update src/features/tour/steps.ts.'
  );
  process.exit(1);
}

console.log(`\nAll ${wanted.length} anchors present. Tour has ${stepCount} steps.`);
