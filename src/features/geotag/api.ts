import imageCompression from 'browser-image-compression';
import { supabase, publicUrl } from '../../lib/supabase';
import type { GeotaggedImageRow, ObservationCategory, GpsSource } from '../../lib/database.types';
import { extractExif, readImageSize } from './exif';

const BUCKET = 'geotagged-images';

/** All geotagged photos for a site, newest capture first. */
export async function listGeotaggedImages(siteId: string): Promise<GeotaggedImageRow[]> {
  const { data, error } = await supabase
    .from('geotagged_images')
    .select('*')
    .eq('site_id', siteId)
    .order('captured_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export function geotagImageUrl(row: Pick<GeotaggedImageRow, 'storage_bucket' | 'storage_path'>): string {
  return publicUrl(row.storage_bucket, row.storage_path);
}

export function geotagThumbUrl(
  row: Pick<GeotaggedImageRow, 'storage_bucket' | 'storage_path' | 'thumbnail_path'>
): string {
  return publicUrl(row.storage_bucket, row.thumbnail_path ?? row.storage_path);
}

/** What the uploader collects for one file before it is sent. */
export interface PendingUpload {
  file: File;
  title: string;
  description: string;
  category: ObservationCategory;
  status: string;
  observerName: string;
  lat: number | null;
  lng: number | null;
  gpsSource: GpsSource;
  altitudeM: number | null;
  headingDeg: number | null;
  gpsAccuracyM: number | null;
  capturedAt: string | null;
  exif: Record<string, unknown> | null;
  widthPx: number | null;
  heightPx: number | null;
}

/**
 * Builds a PendingUpload from a raw file by reading its EXIF.
 *
 * Nothing is invented here: if the photo has no GPS, `lat`/`lng` stay null and
 * `gpsSource` is 'unknown' until the user places a pin, at which point it
 * becomes 'manual'. The database enforces the same rule — a row claiming
 * `gps_source = 'exif'` must actually carry coordinates.
 */
export async function prepareUpload(file: File): Promise<PendingUpload> {
  const exif = await extractExif(file);
  const size = exif.widthPx && exif.heightPx ? null : await readImageSize(file);

  return {
    file,
    title: file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').slice(0, 120),
    description: '',
    category: 'other',
    status: '',
    observerName: '',
    lat: exif.lat,
    lng: exif.lng,
    gpsSource: exif.hasGps ? 'exif' : 'unknown',
    altitudeM: exif.altitudeM,
    headingDeg: exif.headingDeg,
    gpsAccuracyM: exif.gpsAccuracyM,
    capturedAt: exif.capturedAt,
    exif: exif.raw,
    widthPx: exif.widthPx ?? size?.width ?? null,
    heightPx: exif.heightPx ?? size?.height ?? null,
  };
}

/**
 * Compression settings.
 *
 * The Supabase free tier allows 1 GB of storage in total and a phone photo is
 * routinely 3-5 MB, so a few hundred uploads would exhaust it. A 1600 px long
 * edge is ample for both the map popup and a PDF plate.
 */
const FULL_SIZE = { maxSizeMB: 1.2, maxWidthOrHeight: 1600, useWebWorker: true };
const THUMB_SIZE = { maxSizeMB: 0.08, maxWidthOrHeight: 400, useWebWorker: true };

function safeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'photo';
}

export interface UploadResult {
  row: GeotaggedImageRow;
  originalBytes: number;
  storedBytes: number;
}

/**
 * Compresses, uploads, and records one geotagged photo.
 *
 * Storage and the database are written separately, so a failure after the file
 * lands would leave an orphan. If the insert fails, the uploaded objects are
 * removed again rather than left behind consuming quota.
 */
export async function uploadGeotaggedImage(
  siteSlug: string,
  siteId: string,
  pending: PendingUpload,
  userId: string | null
): Promise<UploadResult> {
  const [full, thumb] = await Promise.all([
    imageCompression(pending.file, FULL_SIZE),
    imageCompression(pending.file, THUMB_SIZE),
  ]);

  const stamp = Date.now();
  const base = `${siteSlug}/${stamp}-${safeFileName(pending.file.name)}`;
  const fullPath = `${base}.jpg`;
  const thumbPath = `${base}-thumb.jpg`;

  const uploadOne = async (path: string, body: Blob) => {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, body, { contentType: 'image/jpeg', upsert: false });
    if (error) throw new Error(`Upload failed for ${path}: ${error.message}`);
  };

  await uploadOne(fullPath, full);
  await uploadOne(thumbPath, thumb);

  const { data, error } = await supabase
    .from('geotagged_images')
    .insert({
      site_id: siteId,
      storage_bucket: BUCKET,
      storage_path: fullPath,
      thumbnail_path: thumbPath,
      lat: pending.lat,
      lng: pending.lng,
      altitude_m: pending.altitudeM,
      gps_accuracy_m: pending.gpsAccuracyM,
      heading_deg: pending.headingDeg,
      gps_source: pending.gpsSource,
      captured_at: pending.capturedAt,
      category: pending.category,
      status: pending.status || null,
      title: pending.title || pending.file.name,
      description: pending.description || null,
      observer_name: pending.observerName || null,
      exif: pending.exif,
      mime_type: 'image/jpeg',
      file_size_bytes: full.size,
      width_px: pending.widthPx,
      height_px: pending.heightPx,
      uploaded_by: userId,
    })
    .select()
    .single();

  if (error) {
    // Do not leave orphaned objects behind if the row could not be written.
    await supabase.storage.from(BUCKET).remove([fullPath, thumbPath]);
    throw new Error(`Saved the file but could not record it: ${error.message}`);
  }

  return { row: data, originalBytes: pending.file.size, storedBytes: full.size + thumb.size };
}

/** Removes a photo and its stored files. */
export async function deleteGeotaggedImage(row: GeotaggedImageRow): Promise<void> {
  const { error } = await supabase.from('geotagged_images').delete().eq('id', row.id);
  if (error) throw error;

  const paths = [row.storage_path, row.thumbnail_path].filter(Boolean) as string[];
  if (paths.length) {
    // A storage failure here is not worth failing the operation: the row is
    // already gone, so the file is unreachable through the app either way.
    const { error: storageError } = await supabase.storage.from(row.storage_bucket).remove(paths);
    if (storageError) console.warn('[geotag] file left in storage:', storageError.message);
  }
}

/** Updates the editable fields of a photo. */
export async function updateGeotaggedImage(
  id: string,
  patch: Partial<
    Pick<
      GeotaggedImageRow,
      'title' | 'description' | 'category' | 'status' | 'observer_name' | 'lat' | 'lng' | 'gps_source'
    >
  >
): Promise<GeotaggedImageRow> {
  const { data, error } = await supabase
    .from('geotagged_images')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
