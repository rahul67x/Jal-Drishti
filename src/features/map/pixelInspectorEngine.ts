import type { SiteRow, SiteMetricsRow, RasterLayerRow } from '../../lib/database.types';

export interface PixelInspectionResult {
  lat: number;
  lng: number;
  elevationMeters: number;
  ndvi2023: number;
  ndvi2026: number;
  ndviDelta: number;
  waterMask2023: 'Water Present' | 'Non-water';
  waterMask2026: 'Water Present' | 'Non-water';
  waterChangeClass: 'Water Retention' | 'Water Loss (-1)' | 'Water Gain (+1)';
  streamOrder: '1st Order Stream' | '2nd Order Stream' | '3rd Order Main Channel' | 'Overland Flow Area';
  landcoverClass: string;
}

/**
 * Simulates real-time multi-raster pixel stack query at exact coordinate (Lat, Lng).
 */
export function queryPixelStackAtCoordinate(
  lat: number,
  lng: number,
  site: SiteRow,
  _metrics?: SiteMetricsRow | null,
  _rasters: RasterLayerRow[] = []
): PixelInspectionResult {
  // Deterministic calculation based on relative position within site bounding box
  const minLat = site.bbox_min_lat ?? site.centre_lat - 0.05;
  const maxLat = site.bbox_max_lat ?? site.centre_lat + 0.05;
  const minLng = site.bbox_min_lng ?? site.centre_lng - 0.05;
  const maxLng = site.bbox_max_lng ?? site.centre_lng + 0.05;

  const normY = Math.min(1, Math.max(0, (lat - minLat) / (maxLat - minLat || 0.1)));
  const normX = Math.min(1, Math.max(0, (lng - minLng) / (maxLng - minLng || 0.1)));

  // Synthetic DEM terrain model
  const elevationMeters = Math.round(540 + Math.sin(normX * Math.PI) * 120 + Math.cos(normY * Math.PI) * 80);

  // Spectral NDVI values
  const baseGreen = 0.35 + Math.sin(normX * 10 + normY * 10) * 0.25;
  const ndvi2023 = Number(Math.min(0.85, Math.max(0.08, baseGreen)).toFixed(3));
  const ndvi2026 = Number(Math.min(0.85, Math.max(0.08, baseGreen - 0.04 * (normX > 0.5 ? 1 : -1))).toFixed(3));
  const ndviDelta = Number((((ndvi2026 - ndvi2023) / ndvi2023) * 100).toFixed(1));

  // Water & Stream network proximity
  let waterMask2023: 'Water Present' | 'Non-water' = 'Non-water';
  let waterMask2026: 'Water Present' | 'Non-water' = 'Non-water';
  let waterChangeClass: 'Water Retention' | 'Water Loss (-1)' | 'Water Gain (+1)' = 'Water Retention';

  if (normX > 0.45 && normX < 0.52 && normY > 0.45 && normY < 0.55) {
    waterMask2023 = 'Water Present';
    waterMask2026 = 'Non-water';
    waterChangeClass = 'Water Loss (-1)';
  }

  let streamOrder: '1st Order Stream' | '2nd Order Stream' | '3rd Order Main Channel' | 'Overland Flow Area' = 'Overland Flow Area';
  const streamDist = Math.abs(normX - 0.5) + Math.abs(normY - 0.5);
  if (streamDist < 0.08) streamOrder = '3rd Order Main Channel';
  else if (streamDist < 0.15) streamOrder = '2nd Order Stream';
  else if (streamDist < 0.25) streamOrder = '1st Order Stream';

  let landcoverClass = 'Cropland / Agriculture';
  if (ndvi2026 > 0.55) landcoverClass = 'Trees / Dense Vegetation';
  else if (waterMask2023 === 'Water Present') landcoverClass = 'Open Water Body';
  else if (ndvi2026 < 0.20) landcoverClass = 'Bare Soil / Built-up';

  return {
    lat: Number(lat.toFixed(4)),
    lng: Number(lng.toFixed(4)),
    elevationMeters,
    ndvi2023,
    ndvi2026,
    ndviDelta,
    waterMask2023,
    waterMask2026,
    waterChangeClass,
    streamOrder,
    landcoverClass,
  };
}
