/**
 * generate-seed-sql.mjs
 * ---------------------------------------------------------------------------
 * Turns the parsed QGIS reports plus the study-area GeoJSON into an idempotent
 * SQL seed file for the Saswad site.
 *
 * Inputs:
 *   scripts/out/analysed-data.json                     (parse-analysed-data.mjs)
 *   public/gis/Purandar_Saswad_Study_Area.geojson      (the real QGIS boundary)
 *   public/gis/*.tif|*.png                             (read for real dimensions)
 *
 * Output:
 *   supabase/seed/saswad.sql
 *
 * The generated SQL uses ON CONFLICT everywhere, so it is safe to run more than
 * once. Re-running after re-analysing rasters updates the numbers in place.
 *
 * Usage: node scripts/generate-seed-sql.mjs
 */

import { readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fromArrayBuffer } from 'geotiff';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ANALYSED = join(ROOT, 'scripts', 'out', 'analysed-data.json');
const GEOJSON = join(ROOT, 'public', 'gis', 'Purandar_Saswad_Study_Area.geojson');
const GIS_DIR = join(ROOT, 'public', 'gis');
const OUT_FILE = join(ROOT, 'supabase', 'seed', 'saswad.sql');

const SITE_SLUG = 'saswad';

/**
 * WGS84 bounds for the raster grids.
 *
 * These are lifted verbatim from src/components/analytics/geoTiffRenderer.ts,
 * where they are hardcoded constants verified against QGIS. Moving them into
 * the database is the whole point: once seeded, those constants get deleted and
 * a new site simply supplies its own bounds.
 */
const BOUNDS = {
  // 10 m analysis grid, 611 x 609
  study: { swLat: 18.2805351, swLng: 73.9701432, neLat: 18.3358732, neLng: 74.0282681 },
  // 30 m SRTM streams grid, 205 x 205
  streams: { swLat: 18.2805182, swLng: 73.9699510, neLat: 18.3358316, neLng: 74.0285009 },
  // Derived from NDVI_Change_2023_2026.pgw
  ndviChangePng: { swLat: 18.2804925, swLng: 73.9701841, neLat: 18.3358340, neLng: 74.0283418 },
};

/**
 * Every raster layer the site should have.
 *
 * `statsFrom` links a layer to its QGIS report. Layers without one (NDVI,
 * streams, the change PNG) are display-only and carry no class statistics.
 *
 * Note that veg_positive_2023 / 2026 are registered even though the map does
 * not currently draw them: site_metrics_view reads their statistics to compute
 * the vegetation change figures.
 */
const LAYERS = [
  {
    layerKey: 'ndvi_2023',
    kind: 'ndvi',
    title: 'NDVI 2023',
    description: 'Float32 NDVI raster rendered as a greyscale linear min-max stretch, matching QGIS.',
    file: 'NDVI_2023_float.tif',
    format: 'geotiff',
    yearFrom: 2023,
    yearTo: null,
    bounds: BOUNDS.study,
    colormapKey: 'ndvi',
    defaultOpacity: 0.85,
    visibleByDefault: false,
    displayOrder: 10,
    statsFrom: null,
  },
  {
    layerKey: 'veg_positive_2023',
    kind: 'vegetation_mask',
    title: 'Vegetation Mask 2023',
    description: 'Binary positive-NDVI vegetation mask. Source of the 2023 vegetation area figure.',
    file: 'veg_positive_2023.tif',
    format: 'geotiff',
    yearFrom: 2023,
    yearTo: null,
    bounds: BOUNDS.study,
    colormapKey: 'vegetation',
    defaultOpacity: 0.7,
    visibleByDefault: false,
    displayOrder: 20,
    statsFrom: 'veg_positive_2023',
  },
  {
    layerKey: 'veg_positive_2026',
    kind: 'vegetation_mask',
    title: 'Vegetation Mask 2026',
    description: 'Binary positive-NDVI vegetation mask. Source of the 2026 vegetation area figure.',
    file: 'veg_positive_2026.tif',
    format: 'geotiff',
    yearFrom: 2026,
    yearTo: null,
    bounds: BOUNDS.study,
    colormapKey: 'vegetation',
    defaultOpacity: 0.7,
    visibleByDefault: false,
    displayOrder: 21,
    statsFrom: 'veg_positive_2026',
  },
  {
    layerKey: 'water_mask_2023',
    kind: 'water_mask',
    title: 'Surface Water 2023',
    description: 'Binary surface water mask for 2023.',
    file: 'water_mask_2023.tif',
    format: 'geotiff',
    yearFrom: 2023,
    yearTo: null,
    bounds: BOUNDS.study,
    colormapKey: 'water_2023',
    defaultOpacity: 0.9,
    visibleByDefault: true,
    displayOrder: 30,
    statsFrom: 'water_mask_2023',
  },
  {
    layerKey: 'water_mask_2026',
    kind: 'water_mask',
    title: 'Surface Water 2026',
    description: 'Binary surface water mask for 2026.',
    file: 'water_mask.tif',
    format: 'geotiff',
    yearFrom: 2026,
    yearTo: null,
    bounds: BOUNDS.study,
    colormapKey: 'water_2026',
    defaultOpacity: 0.9,
    visibleByDefault: true,
    displayOrder: 31,
    statsFrom: 'water_mask_2026',
  },
  {
    layerKey: 'water_change_2023_2026',
    kind: 'change',
    title: 'Water Change 2023 to 2026',
    description: 'Ternary change raster: -1 water loss, 0 stable, +1 water gain.',
    file: 'Water_Change_2023_2026.tif',
    format: 'geotiff',
    yearFrom: 2023,
    yearTo: 2026,
    bounds: BOUNDS.study,
    colormapKey: 'water_change',
    defaultOpacity: 0.95,
    visibleByDefault: false,
    displayOrder: 40,
    statsFrom: 'water_change_2023_2026',
  },
  {
    layerKey: 'ndvi_change_2023_2026',
    kind: 'ndvi_change',
    title: 'NDVI Change 2023 to 2026',
    description: 'Pre-rendered vegetation change overlay. Green is gain, red is loss.',
    file: 'NDVI_Change_2023_2026.png',
    format: 'png',
    yearFrom: 2023,
    yearTo: 2026,
    bounds: BOUNDS.ndviChangePng,
    colormapKey: null,
    defaultOpacity: 0.8,
    visibleByDefault: false,
    displayOrder: 41,
    statsFrom: null,
  },
  {
    layerKey: 'streams',
    kind: 'streams',
    title: 'Drainage Network',
    description: 'Stream channels derived from the SRTM 30 m digital elevation model.',
    file: 'purandar_streams_raster.tif',
    format: 'geotiff',
    yearFrom: null,
    yearTo: null,
    bounds: BOUNDS.streams,
    colormapKey: 'streams',
    defaultOpacity: 0.95,
    visibleByDefault: true,
    displayOrder: 50,
    statsFrom: null,
  },
];

// --- SQL literal helpers ----------------------------------------------------

const sqlStr = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const sqlNum = (v) => (v === null || v === undefined || Number.isNaN(v) ? 'null' : String(v));
const sqlBool = (v) => (v ? 'true' : 'false');

/** Reads real width/height out of a GeoTIFF rather than assuming. */
async function readTiffSize(path) {
  const buf = readFileSync(path);
  const tiff = await fromArrayBuffer(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  const image = await tiff.getImage();
  return { width: image.getWidth(), height: image.getHeight() };
}

function bboxOfGeoJson(geojson) {
  let minLat = Infinity, minLng = Infinity, maxLat = -Infinity, maxLng = -Infinity;
  const visit = (coords) => {
    if (typeof coords[0] === 'number') {
      const [lng, lat] = coords;          // GeoJSON is [lng, lat], not [lat, lng]
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      return;
    }
    coords.forEach(visit);
  };
  for (const feature of geojson.features ?? []) visit(feature.geometry.coordinates);
  return { minLat, minLng, maxLat, maxLng };
}

async function main() {
  if (!existsSync(ANALYSED)) {
    console.error(`Missing ${ANALYSED}. Run: node scripts/parse-analysed-data.mjs`);
    process.exit(1);
  }

  const analysed = JSON.parse(readFileSync(ANALYSED, 'utf8'));
  const geojson = JSON.parse(readFileSync(GEOJSON, 'utf8'));
  const reportsByLayer = new Map(analysed.reports.map((r) => [r.layerKey, r]));

  const bbox = bboxOfGeoJson(geojson);
  const props = geojson.features?.[0]?.properties ?? {};
  const areaKm2 = props.AREA ? props.AREA / 1_000_000 : analysed.grid.totalAreaKm2;

  // The centre of the real boundary. The current studyAreas.ts uses
  // [18.345, 74.035], which sits outside this box entirely.
  const centreLat = (bbox.minLat + bbox.maxLat) / 2;
  const centreLng = (bbox.minLng + bbox.maxLng) / 2;

  const out = [];
  const w = (line = '') => out.push(line);

  w('-- ===========================================================================');
  w('-- saswad.sql — seed data for the Saswad study area');
  w('-- ---------------------------------------------------------------------------');
  w('-- GENERATED FILE. Do not edit by hand.');
  w('--   node scripts/parse-analysed-data.mjs');
  w('--   node scripts/generate-seed-sql.mjs');
  w('--');
  w(`-- Generated:     ${new Date().toISOString()}`);
  w('-- Statistics:    analysed-data/*.html (QGIS unique values reports)');
  w('-- Boundary:      public/gis/Purandar_Saswad_Study_Area.geojson');
  w(`-- Grid:          ${analysed.grid.widthPx} x ${analysed.grid.heightPx} @ ${analysed.grid.pixelSizeM} m, ${analysed.grid.crs}`);
  w(`-- Extent:        ${analysed.grid.totalAreaHa} ha (${analysed.grid.totalAreaKm2} km2)`);
  w('--');
  w('-- Safe to re-run: every statement uses ON CONFLICT.');
  w('-- ===========================================================================');
  w();
  w('begin;');
  w();

  // --- site ---------------------------------------------------------------
  w('-- ---------------------------------------------------------------------------');
  w('-- The site itself');
  w('-- ---------------------------------------------------------------------------');
  w('insert into public.sites (');
  w('  slug, name, district, state, country,');
  w('  centre_lat, centre_lng, default_zoom, area_km2,');
  w('  crs, analysis_crs, boundary_geojson,');
  w('  bbox_min_lat, bbox_min_lng, bbox_max_lat, bbox_max_lng,');
  w('  description, is_published');
  w(') values (');
  w(`  ${sqlStr(SITE_SLUG)}, ${sqlStr('Saswad')}, ${sqlStr('Pune')}, ${sqlStr('Maharashtra')}, ${sqlStr('India')},`);
  w(`  ${centreLat.toFixed(7)}, ${centreLng.toFixed(7)}, 13, ${areaKm2.toFixed(4)},`);
  w(`  ${sqlStr('EPSG:4326')}, ${sqlStr(analysed.grid.crs)},`);
  w(`  $geojson$${JSON.stringify(geojson)}$geojson$::jsonb,`);
  w(`  ${bbox.minLat.toFixed(7)}, ${bbox.minLng.toFixed(7)}, ${bbox.maxLat.toFixed(7)}, ${bbox.maxLng.toFixed(7)},`);
  w(`  ${sqlStr('Purandar-Saswad watershed study area. Sentinel-2 derived analysis at 10 m resolution, ' + analysed.grid.crs + '.')}, true`);
  w(')');
  w('on conflict (slug) do update set');
  w('  name = excluded.name, district = excluded.district, state = excluded.state,');
  w('  centre_lat = excluded.centre_lat, centre_lng = excluded.centre_lng,');
  w('  area_km2 = excluded.area_km2, analysis_crs = excluded.analysis_crs,');
  w('  boundary_geojson = excluded.boundary_geojson,');
  w('  bbox_min_lat = excluded.bbox_min_lat, bbox_min_lng = excluded.bbox_min_lng,');
  w('  bbox_max_lat = excluded.bbox_max_lat, bbox_max_lng = excluded.bbox_max_lng,');
  w('  description = excluded.description;');
  w();

  // --- raster layers ------------------------------------------------------
  for (const layer of LAYERS) {
    const filePath = join(GIS_DIR, layer.file);
    const present = existsSync(filePath);
    const report = layer.statsFrom ? reportsByLayer.get(layer.statsFrom) : null;

    if (layer.statsFrom && !report) {
      console.error(`No parsed report for layer ${layer.layerKey} (expected ${layer.statsFrom})`);
      process.exit(1);
    }
    if (!present) {
      console.warn(`  !!  ${layer.file} not found in public/gis — seeding metadata only`);
    }

    let widthPx = report?.widthPx ?? null;
    let heightPx = report?.heightPx ?? null;
    if (present && layer.format === 'geotiff' && (!widthPx || !heightPx)) {
      const size = await readTiffSize(filePath);
      widthPx = size.width;
      heightPx = size.height;
    }

    const pixelSizeM = report?.pixelSizeM ?? (layer.layerKey === 'streams' ? 30 : 10);
    const totalPixels = report?.totalPixels ?? (widthPx && heightPx ? widthPx * heightPx : null);
    const fileSize = present ? statSync(filePath).size : null;

    w('-- ---------------------------------------------------------------------------');
    w(`-- ${layer.title}  (${layer.file})`);
    w('-- ---------------------------------------------------------------------------');
    w('insert into public.raster_layers (');
    w('  site_id, layer_key, kind, title, description, year_from, year_to,');
    w('  storage_bucket, storage_path, format, file_size_bytes,');
    w('  width_px, height_px, pixel_size_m, crs,');
    w('  extent_min_x, extent_min_y, extent_max_x, extent_max_y,');
    w('  bounds_sw_lat, bounds_sw_lng, bounds_ne_lat, bounds_ne_lng,');
    w('  total_pixels, nodata_pixels, source_file, source_path,');
    w('  colormap_key, default_opacity, display_order, is_visible_by_default');
    w(') values (');
    w(`  (select id from public.sites where slug = ${sqlStr(SITE_SLUG)}),`);
    w(`  ${sqlStr(layer.layerKey)}, ${sqlStr(layer.kind)}, ${sqlStr(layer.title)},`);
    w(`  ${sqlStr(layer.description)}, ${sqlNum(layer.yearFrom)}, ${sqlNum(layer.yearTo)},`);
    w(`  ${sqlStr('site-rasters')}, ${sqlStr(`${SITE_SLUG}/${layer.file}`)}, ${sqlStr(layer.format)}, ${sqlNum(fileSize)},`);
    w(`  ${sqlNum(widthPx)}, ${sqlNum(heightPx)}, ${sqlNum(pixelSizeM)}, ${sqlStr(report?.crs ?? analysed.grid.crs)},`);
    w(`  ${sqlNum(report?.extent?.minX ?? analysed.grid.extent.minX)}, ${sqlNum(report?.extent?.minY ?? analysed.grid.extent.minY)},`);
    w(`  ${sqlNum(report?.extent?.maxX ?? analysed.grid.extent.maxX)}, ${sqlNum(report?.extent?.maxY ?? analysed.grid.extent.maxY)},`);
    w(`  ${layer.bounds.swLat}, ${layer.bounds.swLng}, ${layer.bounds.neLat}, ${layer.bounds.neLng},`);
    w(`  ${sqlNum(totalPixels)}, ${sqlNum(report?.noDataPixels ?? null)},`);
    w(`  ${sqlStr(report?.sourceFile ?? layer.file)}, ${sqlStr(report?.sourcePath ?? null)},`);
    w(`  ${sqlStr(layer.colormapKey)}, ${layer.defaultOpacity}, ${layer.displayOrder}, ${sqlBool(layer.visibleByDefault)}`);
    w(')');
    w('on conflict (site_id, layer_key) do update set');
    w('  kind = excluded.kind, title = excluded.title, description = excluded.description,');
    w('  year_from = excluded.year_from, year_to = excluded.year_to,');
    w('  storage_path = excluded.storage_path, format = excluded.format,');
    w('  file_size_bytes = excluded.file_size_bytes,');
    w('  width_px = excluded.width_px, height_px = excluded.height_px,');
    w('  pixel_size_m = excluded.pixel_size_m, crs = excluded.crs,');
    w('  extent_min_x = excluded.extent_min_x, extent_min_y = excluded.extent_min_y,');
    w('  extent_max_x = excluded.extent_max_x, extent_max_y = excluded.extent_max_y,');
    w('  bounds_sw_lat = excluded.bounds_sw_lat, bounds_sw_lng = excluded.bounds_sw_lng,');
    w('  bounds_ne_lat = excluded.bounds_ne_lat, bounds_ne_lng = excluded.bounds_ne_lng,');
    w('  total_pixels = excluded.total_pixels, nodata_pixels = excluded.nodata_pixels,');
    w('  source_file = excluded.source_file, source_path = excluded.source_path,');
    w('  colormap_key = excluded.colormap_key, default_opacity = excluded.default_opacity,');
    w('  display_order = excluded.display_order,');
    w('  is_visible_by_default = excluded.is_visible_by_default;');
    w();

    if (report) {
      w(`-- Class statistics from ${report.reportFile}`);
      for (const [i, cls] of report.classes.entries()) {
        const isPrimary = report.primaryClass !== null && cls.classValue === report.primaryClass;
        w('insert into public.raster_class_stats (');
        w('  raster_layer_id, class_value, class_label, pixel_count, area_m2, is_primary, display_order');
        w(') values (');
        w('  (select rl.id from public.raster_layers rl');
        w('     join public.sites s on s.id = rl.site_id');
        w(`    where s.slug = ${sqlStr(SITE_SLUG)} and rl.layer_key = ${sqlStr(layer.layerKey)}),`);
        w(`  ${cls.classValue}, ${sqlStr(cls.classLabel)}, ${cls.pixelCount}, ${cls.areaM2}, ${sqlBool(isPrimary)}, ${i + 1}`);
        w(')');
        w('on conflict (raster_layer_id, class_value) do update set');
        w('  class_label = excluded.class_label, pixel_count = excluded.pixel_count,');
        w('  area_m2 = excluded.area_m2, is_primary = excluded.is_primary,');
        w('  display_order = excluded.display_order;');
      }
      w();
    }
  }

  w('commit;');
  w();
  w('-- ---------------------------------------------------------------------------');
  w('-- Verify: these should match the QGIS reports exactly.');
  w('-- ---------------------------------------------------------------------------');
  w('--   select vegetation_change_ha, vegetation_change_pct,');
  w('--          water_change_ha, water_change_pct,');
  w('--          water_loss_ha, water_gain_ha, water_net_change_ha,');
  w('--          water_change_cross_check_ok, total_area_ha');
  w("--     from public.site_metrics_view where slug = 'saswad';");
  w('--');
  w('-- Expected: -53.98 / -1.46 / -9.50 / -75.82 / 9.54 / 0.04 / -9.50 / true / 3720.99');

  writeFileSync(OUT_FILE, out.join('\n') + '\n', 'utf8');

  console.log(`Site:    ${SITE_SLUG}`);
  console.log(`Centre:  ${centreLat.toFixed(6)}, ${centreLng.toFixed(6)}  (studyAreas.ts had 18.345, 74.035 — outside the boundary)`);
  console.log(`Area:    ${areaKm2.toFixed(4)} km2  (studyAreas.ts had 142.6)`);
  console.log(`Layers:  ${LAYERS.length}  (${LAYERS.filter((l) => l.statsFrom).length} with class statistics)`);
  console.log(`Wrote    ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
