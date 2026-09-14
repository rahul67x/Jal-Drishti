import { supabase } from '../../lib/supabase';
import type { SiteRow, SiteMetricsRow, SiteLulcRow } from '../../lib/database.types';

/**
 * Every read of the sites table and its two derived views.
 *
 * These replace src/data/studyAreas.ts, which held a single hardcoded entry
 * whose centre point sat outside its own boundary and whose stated area was
 * 142.6 km² against a real 37.21 km².
 */

/** All published sites, for the site directory. */
export async function listSites(): Promise<SiteRow[]> {
  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** One site by its URL slug. Returns null when there is no such site. */
export async function getSiteBySlug(slug: string): Promise<SiteRow | null> {
  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Headline metrics from site_metrics_view.
 *
 * Every value here is computed in Postgres from the raw QGIS pixel counts, so
 * it cannot drift from the source analysis the way the old hardcoded
 * realMetrics.ts did.
 */
export async function getSiteMetrics(slug: string): Promise<SiteMetricsRow | null> {
  const { data, error } = await supabase
    .from('site_metrics_view')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Land cover split. Vegetation and water are measured; "Other" is derived. */
export async function getSiteLulc(slug: string): Promise<SiteLulcRow[]> {
  const { data, error } = await supabase
    .from('site_lulc_view')
    .select('*')
    .eq('slug', slug)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Metrics for several sites at once, so the directory can show figures on
 * each card without firing one request per site.
 */
export async function listSiteMetrics(): Promise<SiteMetricsRow[]> {
  const { data, error } = await supabase.from('site_metrics_view').select('*');
  if (error) throw error;
  return data ?? [];
}

export interface CreateSiteInput {
  slug: string;
  name: string;
  district: string | null;
  state: string | null;
  country: string;
  centreLat: number;
  centreLng: number;
  defaultZoom: number;
  areaKm2: number | null;
  analysisCrs: string | null;
  boundaryGeojson: GeoJSON.FeatureCollection | null;
  bbox: { minLat: number; minLng: number; maxLat: number; maxLng: number } | null;
  description: string | null;
}

/**
 * Registers a new study area.
 *
 * The slug is checked first rather than relying on the unique-constraint error,
 * so a clash reads as "that ID is taken" instead of a raw Postgres message.
 */
export async function createSite(input: CreateSiteInput): Promise<SiteRow> {
  const { data: existing, error: lookupError } = await supabase
    .from('sites')
    .select('slug')
    .eq('slug', input.slug)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (existing) {
    throw new Error(`A site with the ID "${input.slug}" already exists. Choose a different name or ID.`);
  }

  const { data, error } = await supabase
    .from('sites')
    .insert({
      slug: input.slug,
      name: input.name,
      district: input.district,
      state: input.state,
      country: input.country,
      centre_lat: input.centreLat,
      centre_lng: input.centreLng,
      default_zoom: input.defaultZoom,
      area_km2: input.areaKm2,
      crs: 'EPSG:4326',
      analysis_crs: input.analysisCrs,
      boundary_geojson: input.boundaryGeojson,
      bbox_min_lat: input.bbox?.minLat ?? null,
      bbox_min_lng: input.bbox?.minLng ?? null,
      bbox_max_lat: input.bbox?.maxLat ?? null,
      bbox_max_lng: input.bbox?.maxLng ?? null,
      description: input.description,
      is_published: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Removes a site. Cascades to its rasters, images, insights and reports. */
export async function deleteSite(id: string): Promise<void> {
  const { error } = await supabase.from('sites').delete().eq('id', id);
  if (error) throw error;
}

export interface UpdateSiteInput {
  name?: string;
  district?: string | null;
  state?: string | null;
  country?: string;
  description?: string | null;
  analysisCrs?: string | null;
  isPublished?: boolean;
}

/**
 * Edits a site's descriptive fields.
 *
 * Deliberately excludes slug, geometry and area. The slug is in URLs and in
 * every storage path already written for this site, so changing it would orphan
 * files. Geometry and area come from the boundary and should be replaced by
 * re-uploading it, not typed over.
 */
export async function updateSite(id: string, input: UpdateSiteInput): Promise<SiteRow> {
  const patch: Partial<SiteRow> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.district !== undefined) patch.district = input.district;
  if (input.state !== undefined) patch.state = input.state;
  if (input.country !== undefined) patch.country = input.country;
  if (input.description !== undefined) patch.description = input.description;
  if (input.analysisCrs !== undefined) patch.analysis_crs = input.analysisCrs;
  if (input.isPublished !== undefined) patch.is_published = input.isPublished;

  const { data, error } = await supabase
    .from('sites')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
