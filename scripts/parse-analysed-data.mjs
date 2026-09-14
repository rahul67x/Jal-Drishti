/**
 * parse-analysed-data.mjs
 * ---------------------------------------------------------------------------
 * Reads the QGIS "unique values report" HTML files in ./analysed-data and turns
 * them into structured JSON.
 *
 * These HTML files are the ORIGINAL SOURCE OF TRUTH for every Saswad number in
 * the app. Rather than trusting the hand-typed values in src/data/realMetrics.ts,
 * we parse the reports directly so the database can never disagree with QGIS.
 *
 * Each report always has the same shape:
 *   <p>Analyzed file: C:/SIH Satellite data/veg_positive_2023.tif (band 1)</p>
 *   <p>Extent: minx,miny : maxx,maxy</p>
 *   <p>Projection: EPSG:32643 - WGS 84 / UTM zone 43N</p>
 *   <p>Width in pixels: 611 (units per pixel 10)</p>
 *   <p>Height in pixels: 609 (units per pixel 10)</p>
 *   <p>Total pixel count: 372099</p>
 *   <p>NoData pixel count: 0</p>
 *   <table> value | pixel count | area (m2) </table>
 *
 * Usage:  node scripts/parse-analysed-data.mjs
 * Output: scripts/out/analysed-data.json
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = join(ROOT, 'analysed-data');
const OUT_DIR = join(ROOT, 'scripts', 'out');
const OUT_FILE = join(OUT_DIR, 'analysed-data.json');

/**
 * Maps each report filename onto the layer it describes.
 * `layerKey` is what the database will use as raster_layers.layer_key.
 * `classLabels` turn raw raster values (-1/0/1) into human-readable names.
 */
const REPORT_MAP = {
  'veg_info_big23.html': {
    layerKey: 'veg_positive_2023',
    kind: 'vegetation_mask',
    title: 'Positive NDVI Vegetation Mask 2023',
    yearFrom: 2023,
    yearTo: null,
    classLabels: { 0: 'Non-vegetation', 1: 'Vegetation' },
    primaryClass: 1,
  },
  'veg_info_big26.html': {
    layerKey: 'veg_positive_2026',
    kind: 'vegetation_mask',
    title: 'Positive NDVI Vegetation Mask 2026',
    yearFrom: 2026,
    yearTo: null,
    classLabels: { 0: 'Non-vegetation', 1: 'Vegetation' },
    primaryClass: 1,
  },
  'water_info_big23.html': {
    layerKey: 'water_mask_2023',
    kind: 'water_mask',
    title: 'Surface Water Mask 2023',
    yearFrom: 2023,
    yearTo: null,
    classLabels: { 0: 'Dry', 1: 'Water' },
    primaryClass: 1,
  },
  'water_info_big26.html': {
    layerKey: 'water_mask_2026',
    kind: 'water_mask',
    title: 'Surface Water Mask 2026',
    yearFrom: 2026,
    yearTo: null,
    classLabels: { 0: 'Dry', 1: 'Water' },
    primaryClass: 1,
  },
  'waterchange_info_big26-23.html': {
    layerKey: 'water_change_2023_2026',
    kind: 'change',
    title: 'Surface Water Change 2023 to 2026',
    yearFrom: 2023,
    yearTo: 2026,
    classLabels: { '-1': 'Water loss', 0: 'Stable', 1: 'Water gain' },
    primaryClass: null,
  },
};

/** Pulls the text out of the first <p> matching a label, e.g. "Total pixel count:". */
function readParagraph(html, label) {
  const re = new RegExp(`<p>\\s*${label}\\s*:?\\s*([^<]*)</p>`, 'i');
  const match = html.match(re);
  return match ? match[1].trim() : null;
}

/** "391180.0000,2021530.0000 : 397290.0000,2027620.0000" -> {minX,minY,maxX,maxY} */
function parseExtent(text) {
  if (!text) return null;
  const nums = text.match(/-?\d+(?:\.\d+)?/g);
  if (!nums || nums.length < 4) return null;
  const [minX, minY, maxX, maxY] = nums.slice(0, 4).map(Number);
  return { minX, minY, maxX, maxY };
}

/** "611 (units per pixel 10)" -> { pixels: 611, unitsPerPixel: 10 } */
function parseDimension(text) {
  if (!text) return null;
  const pixels = Number((text.match(/^\s*(\d+)/) || [])[1]);
  const unitsPerPixel = Number((text.match(/units per pixel\s+([\d.]+)/i) || [])[1]);
  return { pixels, unitsPerPixel };
}

/** "EPSG:32643 - WGS 84 / UTM zone 43N" -> { code: 'EPSG:32643', name: 'WGS 84 / ...' } */
function parseProjection(text) {
  if (!text) return null;
  const code = (text.match(/EPSG:\d+/i) || [])[0] ?? null;
  const name = text.replace(/^.*?EPSG:\d+\s*-\s*/i, '').trim() || null;
  return { code, name };
}

/** Reads the value / pixel count / area table into rows. */
function parseClassTable(html, classLabels) {
  const rows = [];
  const rowRe = /<tr>\s*<td>\s*(-?\d+)\s*<\/td>\s*<td>\s*(\d+)\s*<\/td>\s*<td>\s*(\d+(?:\.\d+)?)\s*<\/td>\s*<\/tr>/gi;
  let m;
  while ((m = rowRe.exec(html)) !== null) {
    const classValue = Number(m[1]);
    const pixelCount = Number(m[2]);
    const areaM2 = Number(m[3]);
    rows.push({
      classValue,
      classLabel: classLabels?.[String(classValue)] ?? `Class ${classValue}`,
      pixelCount,
      areaM2,
      areaHa: Number((areaM2 / 10_000).toFixed(4)),
    });
  }
  return rows;
}

function parseReport(fileName, html) {
  const meta = REPORT_MAP[fileName];
  if (!meta) {
    throw new Error(
      `No mapping for "${fileName}". Add an entry to REPORT_MAP in scripts/parse-analysed-data.mjs.`
    );
  }

  const analyzedFileRaw = readParagraph(html, 'Analyzed file');
  const width = parseDimension(readParagraph(html, 'Width in pixels'));
  const height = parseDimension(readParagraph(html, 'Height in pixels'));
  const extent = parseExtent(readParagraph(html, 'Extent'));
  const projection = parseProjection(readParagraph(html, 'Projection'));
  const totalPixels = Number(readParagraph(html, 'Total pixel count'));
  const noDataPixels = Number(readParagraph(html, 'NoData pixel count'));
  const classes = parseClassTable(html, meta.classLabels);

  // "C:/SIH Satellite data/veg_positive_2023.tif (band 1)" -> the bare filename
  const sourceFile = analyzedFileRaw
    ? basename(analyzedFileRaw.replace(/\s*\(band\s*\d+\)\s*$/i, '').trim())
    : null;

  return {
    reportFile: fileName,
    layerKey: meta.layerKey,
    kind: meta.kind,
    title: meta.title,
    yearFrom: meta.yearFrom,
    yearTo: meta.yearTo,
    primaryClass: meta.primaryClass,
    sourceFile,
    sourcePath: analyzedFileRaw,
    crs: projection?.code ?? null,
    crsName: projection?.name ?? null,
    widthPx: width?.pixels ?? null,
    heightPx: height?.pixels ?? null,
    pixelSizeM: width?.unitsPerPixel ?? null,
    extent,
    totalPixels,
    noDataPixels,
    classes,
  };
}

/**
 * Each report must be internally consistent: the class pixel counts plus the
 * NoData count must equal the stated total. If QGIS and our parser disagree,
 * we want to know immediately rather than seed bad data.
 */
function validate(report) {
  const problems = [];
  const summed = report.classes.reduce((acc, c) => acc + c.pixelCount, 0);
  if (summed + report.noDataPixels !== report.totalPixels) {
    problems.push(
      `pixel counts sum to ${summed} + ${report.noDataPixels} NoData, but total is ${report.totalPixels}`
    );
  }
  if (report.widthPx && report.heightPx) {
    const expected = report.widthPx * report.heightPx;
    if (expected !== report.totalPixels) {
      problems.push(`${report.widthPx} x ${report.heightPx} = ${expected}, but total is ${report.totalPixels}`);
    }
  }
  for (const c of report.classes) {
    const expectedArea = c.pixelCount * report.pixelSizeM ** 2;
    if (Math.abs(expectedArea - c.areaM2) > 0.5) {
      problems.push(
        `class ${c.classValue}: ${c.pixelCount} px at ${report.pixelSizeM}m should be ${expectedArea} m2, report says ${c.areaM2}`
      );
    }
  }
  return problems;
}

function main() {
  const files = readdirSync(SRC_DIR).filter((f) => f.endsWith('.html')).sort();
  if (files.length === 0) {
    console.error(`No .html reports found in ${SRC_DIR}`);
    process.exit(1);
  }

  const reports = [];
  let failed = false;

  for (const file of files) {
    const html = readFileSync(join(SRC_DIR, file), 'utf8');
    const report = parseReport(file, html);
    const problems = validate(report);

    if (problems.length > 0) {
      failed = true;
      console.error(`FAIL ${file}`);
      problems.forEach((p) => console.error(`      ${p}`));
    } else {
      const summary = report.classes
        .map((c) => `${c.classLabel}=${c.areaHa.toFixed(2)}ha`)
        .join('  ');
      console.log(`  ok  ${file.padEnd(32)} ${report.layerKey.padEnd(24)} ${summary}`);
    }
    reports.push(report);
  }

  if (failed) {
    console.error('\nValidation failed. Not writing output.');
    process.exit(1);
  }

  // Every report must describe the same grid, otherwise they cannot be compared.
  const grids = new Set(
    reports.map((r) => `${r.widthPx}x${r.heightPx}@${r.pixelSizeM}m/${r.crs}`)
  );
  if (grids.size !== 1) {
    console.error(`\nReports do not share one grid: ${[...grids].join(' | ')}`);
    process.exit(1);
  }

  const [first] = reports;
  const output = {
    generatedAt: new Date().toISOString(),
    generatedBy: 'scripts/parse-analysed-data.mjs',
    sourceDir: 'analysed-data',
    grid: {
      crs: first.crs,
      crsName: first.crsName,
      widthPx: first.widthPx,
      heightPx: first.heightPx,
      pixelSizeM: first.pixelSizeM,
      totalPixels: first.totalPixels,
      extent: first.extent,
      totalAreaM2: first.totalPixels * first.pixelSizeM ** 2,
      totalAreaHa: Number(((first.totalPixels * first.pixelSizeM ** 2) / 10_000).toFixed(4)),
      totalAreaKm2: Number(((first.totalPixels * first.pixelSizeM ** 2) / 1_000_000).toFixed(4)),
    },
    reports,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(output, null, 2) + '\n', 'utf8');

  console.log(`\nGrid: ${first.widthPx} x ${first.heightPx} @ ${first.pixelSizeM} m, ${first.crs}`);
  console.log(`Extent: ${output.grid.totalAreaHa} ha (${output.grid.totalAreaKm2} km2)`);
  console.log(`Wrote ${reports.length} reports -> ${OUT_FILE}`);
}

main();
