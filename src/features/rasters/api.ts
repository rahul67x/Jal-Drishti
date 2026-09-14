import { supabase, publicUrl } from '../../lib/supabase';
import type { RasterLayerRow, RasterClassStatRow } from '../../lib/database.types';

/** A raster layer with its class statistics attached. */
export interface RasterLayerWithStats extends RasterLayerRow {
  stats: RasterClassStatRow[];
}

/** All raster layers for a site, in display order. */
export async function listRasterLayers(siteId: string): Promise<RasterLayerRow[]> {
  const { data, error } = await supabase
    .from('raster_layers')
    .select('*')
    .eq('site_id', siteId)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Raster layers with their QGIS class statistics, in one round trip.
 *
 * This is the raw material for the report's statistical tables — the same
 * value / pixel-count / area rows that appear in analysed-data/*.html.
 */
export async function listRasterLayersWithStats(
  siteId: string
): Promise<RasterLayerWithStats[]> {
  const { data, error } = await supabase
    .from('raster_layers')
    .select('*, stats:raster_class_stats(*)')
    .eq('site_id', siteId)
    .order('display_order', { ascending: true })
    .returns<RasterLayerWithStats[]>();

  if (error) throw error;

  return (data ?? []).map((layer) => ({
    ...layer,
    stats: [...(layer.stats ?? [])].sort((a, b) => a.display_order - b.display_order),
  }));
}

/**
 * Where to fetch a raster from.
 *
 * Primary is Supabase Storage. The fallback is the copy still sitting in
 * public/gis, which keeps the map working before `scripts/upload-rasters.mjs`
 * has been run. Once the upload is done and the local copies are deleted, the
 * fallback simply stops being reachable — nothing else needs changing.
 */
export function rasterUrl(layer: RasterLayerRow): string {
  return publicUrl(layer.storage_bucket, layer.storage_path);
}

/** Local copy under public/gis, derived from the storage path's filename. */
export function rasterFallbackUrl(layer: RasterLayerRow): string {
  const fileName = layer.storage_path.split('/').pop() ?? '';
  return `/gis/${fileName}`;
}

/**
 * WGS84 bounds in the [[swLat, swLng], [neLat, neLng]] shape Leaflet wants.
 *
 * Returns null when a layer has no bounds recorded, so the caller can skip it
 * rather than drawing an overlay in the Atlantic. These values used to be three
 * hardcoded constants in geoTiffRenderer.ts.
 */
export function rasterBounds(
  layer: RasterLayerRow
): [[number, number], [number, number]] | null {
  const { bounds_sw_lat, bounds_sw_lng, bounds_ne_lat, bounds_ne_lng } = layer;
  if (
    bounds_sw_lat === null ||
    bounds_sw_lng === null ||
    bounds_ne_lat === null ||
    bounds_ne_lng === null
  ) {
    return null;
  }
  return [
    [bounds_sw_lat, bounds_sw_lng],
    [bounds_ne_lat, bounds_ne_lng],
  ];
}

/** Finds a layer by its stable machine name, e.g. 'water_mask_2023'. */
export function findLayer<T extends RasterLayerRow>(
  layers: T[] | undefined,
  layerKey: string
): T | undefined {
  return layers?.find((l) => l.layer_key === layerKey);
}
