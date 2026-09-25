import imageCompression from 'browser-image-compression';
import { supabase, publicUrl } from '../../lib/supabase';
import type { SatelliteImageRow } from '../../lib/database.types';

const BUCKET = 'satellite-images';

/**
 * Satellite imagery for a site.
 *
 * Distinct from `raster_layers`, which holds analysis data the map decodes and
 * colour-maps. This table holds finished pictures a person looks at: true-colour
 * scenes, NDVI renders, before/after plates for the report. Different columns,
 * different purpose — one table would leave half the fields null on every row.
 */

export async function listSatelliteImages(siteId: string): Promise<SatelliteImageRow[]> {
  const { data, error } = await supabase
    .from('satellite_images')
    .select('*')
    .eq('site_id', siteId)
    .order('year', { ascending: true, nullsFirst: false })
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export function satelliteImageUrl(
  row: Pick<SatelliteImageRow, 'storage_bucket' | 'storage_path'>
): string {
  if (row.storage_path.startsWith('/') || row.storage_path.startsWith('http')) {
    return row.storage_path;
  }
  return publicUrl(row.storage_bucket, row.storage_path);
}

export function satelliteThumbUrl(
  row: Pick<SatelliteImageRow, 'storage_bucket' | 'storage_path' | 'thumbnail_path'>
): string {
  const path = row.thumbnail_path ?? row.storage_path;
  if (path.startsWith('/') || path.startsWith('http')) {
    return path;
  }
  return publicUrl(row.storage_bucket, path);
}

export interface SatelliteUploadInput {
  file: File;
  title: string;
  caption: string;
  sensor: string;
  product: string;
  acquisitionDate: string;
  year: number | null;
  resolutionM: number | null;
  cloudCoverPct: number | null;
  includeInReport: boolean;
}

/**
 * Satellite plates are kept larger than field photos — they are the visual
 * evidence in the report and get printed near full width, so detail matters
 * more here than it does for a thumbnail in a map popup.
 */
const FULL_SIZE = { maxSizeMB: 3, maxWidthOrHeight: 2400, useWebWorker: true };
const THUMB_SIZE = { maxSizeMB: 0.12, maxWidthOrHeight: 600, useWebWorker: true };

function safeFileName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'scene'
  );
}

export async function uploadSatelliteImage(
  siteSlug: string,
  siteId: string,
  input: SatelliteUploadInput,
  userId: string | null
): Promise<SatelliteImageRow> {
  const [full, thumb] = await Promise.all([
    imageCompression(input.file, FULL_SIZE),
    imageCompression(input.file, THUMB_SIZE),
  ]);

  const stamp = Date.now();
  const base = `${siteSlug}/${stamp}-${safeFileName(input.file.name)}`;
  const fullPath = `${base}.jpg`;
  const thumbPath = `${base}-thumb.jpg`;

  const put = async (path: string, body: Blob) => {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, body, { contentType: 'image/jpeg', upsert: false });
    if (error) throw new Error(`Upload failed for ${path}: ${error.message}`);
  };

  await put(fullPath, full);
  await put(thumbPath, thumb);

  const { data, error } = await supabase
    .from('satellite_images')
    .insert({
      site_id: siteId,
      storage_bucket: BUCKET,
      storage_path: fullPath,
      thumbnail_path: thumbPath,
      title: input.title || input.file.name,
      caption: input.caption || null,
      sensor: input.sensor || null,
      product: input.product || null,
      acquisition_date: input.acquisitionDate || null,
      year: input.year,
      resolution_m: input.resolutionM,
      cloud_cover_pct: input.cloudCoverPct,
      is_overlay: false,
      mime_type: 'image/jpeg',
      file_size_bytes: full.size,
      include_in_report: input.includeInReport,
      uploaded_by: userId,
    })
    .select()
    .single();

  if (error) {
    // Same orphan cleanup as the geotag path: never leave files behind that no
    // row points at, since nothing would ever reclaim that quota.
    await supabase.storage.from(BUCKET).remove([fullPath, thumbPath]);
    throw new Error(`Saved the file but could not record it: ${error.message}`);
  }

  return data;
}

export async function deleteSatelliteImage(row: SatelliteImageRow): Promise<void> {
  const { error } = await supabase.from('satellite_images').delete().eq('id', row.id);
  if (error) throw error;

  const paths = [row.storage_path, row.thumbnail_path].filter(Boolean) as string[];
  if (paths.length) {
    const { error: storageError } = await supabase.storage.from(row.storage_bucket).remove(paths);
    if (storageError) console.warn('[satellite] file left in storage:', storageError.message);
  }
}

export async function updateSatelliteImage(
  id: string,
  patch: Partial<
    Pick<
      SatelliteImageRow,
      'title' | 'caption' | 'sensor' | 'product' | 'year' | 'include_in_report' | 'display_order'
    >
  >
): Promise<SatelliteImageRow> {
  const { data, error } = await supabase
    .from('satellite_images')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
