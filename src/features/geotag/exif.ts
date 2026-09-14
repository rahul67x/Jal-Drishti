import exifr from 'exifr';

/**
 * Reads position and capture metadata out of a photo's EXIF.
 *
 * This is the whole point of the geotagged-image feature: a pin's position is
 * measured by the camera, not typed in afterwards. The previous build shipped
 * 18 hand-written "field observations", 17 of which plotted outside the study
 * area entirely.
 *
 * Not every photo carries GPS — it is stripped by many messaging apps and
 * disabled by default on some cameras — so `hasGps` is reported honestly and
 * the uploader asks the user to place the pin instead. That is recorded as
 * `gps_source: 'manual'` so the two cases stay distinguishable forever.
 */

export interface ExtractedExif {
  hasGps: boolean;
  lat: number | null;
  lng: number | null;
  altitudeM: number | null;
  headingDeg: number | null;
  gpsAccuracyM: number | null;
  capturedAt: string | null;
  cameraMake: string | null;
  cameraModel: string | null;
  widthPx: number | null;
  heightPx: number | null;
  /** The raw parsed tags, stored verbatim so a position can be re-verified. */
  raw: Record<string, unknown> | null;
}

const EMPTY: ExtractedExif = {
  hasGps: false,
  lat: null,
  lng: null,
  altitudeM: null,
  headingDeg: null,
  gpsAccuracyM: null,
  capturedAt: null,
  cameraMake: null,
  cameraModel: null,
  widthPx: null,
  heightPx: null,
  raw: null,
};

function finiteOrNull(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** A coordinate of exactly 0,0 is almost always a failed fix, not Null Island. */
function isPlausible(lat: number | null, lng: number | null): boolean {
  if (lat === null || lng === null) return false;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;
  if (lat === 0 && lng === 0) return false;
  return true;
}

function toIso(value: unknown): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function extractExif(file: File): Promise<ExtractedExif> {
  try {
    const parsed = (await exifr.parse(file, {
      gps: true,
      tiff: true,
      exif: true,
    })) as Record<string, unknown> | undefined;

    if (!parsed) return { ...EMPTY };

    const lat = finiteOrNull(parsed.latitude);
    const lng = finiteOrNull(parsed.longitude);
    const hasGps = isPlausible(lat, lng);

    return {
      hasGps,
      lat: hasGps ? lat : null,
      lng: hasGps ? lng : null,
      altitudeM: finiteOrNull(parsed.GPSAltitude),
      headingDeg: finiteOrNull(parsed.GPSImgDirection),
      // Horizontal dilution of precision is a unitless quality factor, not
      // metres. Multiplying by a nominal 5 m user-range error is the usual
      // rough conversion; it is an estimate and labelled as one in the UI.
      gpsAccuracyM: (() => {
        const hdop = finiteOrNull(parsed.GPSHPositioningError ?? parsed.GPSDOP);
        return hdop === null ? null : Math.round(hdop * 5 * 10) / 10;
      })(),
      capturedAt:
        toIso(parsed.DateTimeOriginal) ??
        toIso(parsed.CreateDate) ??
        toIso(parsed.ModifyDate),
      cameraMake: typeof parsed.Make === 'string' ? parsed.Make.trim() : null,
      cameraModel: typeof parsed.Model === 'string' ? parsed.Model.trim() : null,
      widthPx: finiteOrNull(parsed.ExifImageWidth ?? parsed.ImageWidth),
      heightPx: finiteOrNull(parsed.ExifImageHeight ?? parsed.ImageHeight),
      raw: parsed,
    };
  } catch (err) {
    // A photo with no EXIF block at all throws rather than returning empty.
    // That is a normal case, not an error worth surfacing.
    console.debug('[exif] no readable metadata:', err);
    return { ...EMPTY };
  }
}

/** Reads pixel dimensions from the image itself when EXIF does not carry them. */
export function readImageSize(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/** Whether a coordinate falls inside a site's bounding box. */
export function isInsideBbox(
  lat: number,
  lng: number,
  bbox: {
    bbox_min_lat: number | null;
    bbox_min_lng: number | null;
    bbox_max_lat: number | null;
    bbox_max_lng: number | null;
  }
): boolean | null {
  const { bbox_min_lat, bbox_min_lng, bbox_max_lat, bbox_max_lng } = bbox;
  if (
    bbox_min_lat === null ||
    bbox_min_lng === null ||
    bbox_max_lat === null ||
    bbox_max_lng === null
  ) {
    return null;
  }
  return lat >= bbox_min_lat && lat <= bbox_max_lat && lng >= bbox_min_lng && lng <= bbox_max_lng;
}
