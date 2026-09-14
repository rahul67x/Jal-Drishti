import { supabase } from '../../lib/supabase';
import type {
  SiteRow,
  SiteMetricsRow,
  SiteLulcRow,
  SiteInsightRow,
  GeotaggedImageRow,
  SatelliteImageRow,
} from '../../lib/database.types';
import { listRasterLayersWithStats, type RasterLayerWithStats } from '../rasters/api';
import { listSiteInsights } from '../insights/api';
import { listGeotaggedImages, geotagImageUrl } from '../geotag/api';
import { listSatelliteImages, satelliteImageUrl } from '../satellite/api';

/** Which sections to include. Every one defaults on. */
export interface ReportOptions {
  statisticalTables: boolean;
  charts: boolean;
  satellitePlates: boolean;
  fieldPhotos: boolean;
  findings: boolean;
  provenance: boolean;
}

export const DEFAULT_OPTIONS: ReportOptions = {
  statisticalTables: true,
  charts: true,
  satellitePlates: true,
  fieldPhotos: true,
  findings: true,
  provenance: true,
};

export interface ReportData {
  site: SiteRow;
  metrics: SiteMetricsRow | null;
  lulc: SiteLulcRow[];
  rasters: RasterLayerWithStats[];
  insights: SiteInsightRow[];
  geotagged: (GeotaggedImageRow & { url: string })[];
  satellite: (SatelliteImageRow & { url: string })[];
  generatedAt: string;
  options: ReportOptions;
}

/**
 * How many images to embed.
 *
 * Each one is fetched and encoded into the PDF, so an unbounded set turns a
 * report into a 200 MB download that the browser runs out of memory rendering.
 * Beyond these limits the report says how many were omitted rather than
 * silently truncating.
 */
export const MAX_FIELD_PHOTOS = 24;
export const MAX_SATELLITE_PLATES = 12;

/** Gathers everything the report needs in one pass. */
export async function collectReportData(
  site: SiteRow,
  options: ReportOptions = DEFAULT_OPTIONS
): Promise<ReportData> {
  const [metricsRes, lulcRes, rasters, insights, geotagged, satellite] = await Promise.all([
    supabase.from('site_metrics_view').select('*').eq('slug', site.slug).maybeSingle(),
    supabase
      .from('site_lulc_view')
      .select('*')
      .eq('slug', site.slug)
      .order('display_order', { ascending: true }),
    listRasterLayersWithStats(site.id),
    options.findings ? listSiteInsights(site.id) : Promise.resolve([]),
    options.fieldPhotos ? listGeotaggedImages(site.id) : Promise.resolve([]),
    options.satellitePlates ? listSatelliteImages(site.id) : Promise.resolve([]),
  ]);

  if (metricsRes.error) throw metricsRes.error;
  if (lulcRes.error) throw lulcRes.error;

  return {
    site,
    metrics: metricsRes.data,
    lulc: lulcRes.data ?? [],
    rasters,
    insights,
    geotagged: geotagged
      .slice(0, MAX_FIELD_PHOTOS)
      .map((g) => ({ ...g, url: geotagImageUrl(g) })),
    satellite: satellite
      .filter((s) => s.include_in_report)
      .slice(0, MAX_SATELLITE_PLATES)
      .map((s) => ({ ...s, url: satelliteImageUrl(s) })),
    generatedAt: new Date().toISOString(),
    options,
  };
}

/** Counts omitted by the caps above, so the report can say so. */
export async function countOmitted(
  site: SiteRow,
  data: ReportData
): Promise<{ photos: number; plates: number }> {
  const [allPhotos, allPlates] = await Promise.all([
    listGeotaggedImages(site.id),
    listSatelliteImages(site.id),
  ]);
  return {
    photos: Math.max(0, allPhotos.length - data.geotagged.length),
    plates: Math.max(
      0,
      allPlates.filter((s) => s.include_in_report).length - data.satellite.length
    ),
  };
}

/**
 * The headline figures frozen into the reports row.
 *
 * A report is a record of what was true when it was generated. Storing the
 * snapshot means an old PDF can be reconciled against the data later, even
 * after a re-analysis changes the live numbers.
 */
export function metricsSnapshot(data: ReportData): Record<string, unknown> {
  const m = data.metrics;
  return {
    generated_at: data.generatedAt,
    site_slug: data.site.slug,
    vegetation_baseline_ha: m?.vegetation_baseline_ha ?? null,
    vegetation_current_ha: m?.vegetation_current_ha ?? null,
    vegetation_change_ha: m?.vegetation_change_ha ?? null,
    vegetation_change_pct: m?.vegetation_change_pct ?? null,
    water_baseline_ha: m?.water_baseline_ha ?? null,
    water_current_ha: m?.water_current_ha ?? null,
    water_change_ha: m?.water_change_ha ?? null,
    water_change_pct: m?.water_change_pct ?? null,
    water_loss_ha: m?.water_loss_ha ?? null,
    water_gain_ha: m?.water_gain_ha ?? null,
    water_net_change_ha: m?.water_net_change_ha ?? null,
    water_change_cross_check_ok: m?.water_change_cross_check_ok ?? null,
    total_area_ha: m?.total_area_ha ?? null,
    raster_layers: data.rasters.length,
    field_photos: data.geotagged.length,
    satellite_plates: data.satellite.length,
  };
}
