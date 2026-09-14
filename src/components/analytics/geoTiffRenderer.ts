import { fromArrayBuffer } from 'geotiff';

export interface RasterLayerData {
  dataUrl: string;
  bounds: [[number, number], [number, number]];
  width: number;
  height: number;
}

// Memory cache so toggling a layer never re-decodes a multi-megabyte GeoTIFF.
const rasterCache = new Map<string, RasterLayerData>();

/**
 * Colour ramps, keyed by raster_layers.colormap_key in the database.
 *
 * Bounds used to live here too, as three hardcoded constants. They now come
 * from the raster_layers row, so adding a site needs no code change.
 */
export type ColorMapType =
  | 'ndvi'
  | 'water'
  | 'water_2023'
  | 'water_2026'
  | 'water_change'
  | 'streams'
  | 'vegetation'
  | 'ndvi_change';

/**
 * Colormap for non-NDVI binary/categorical raster layers.
 * NDVI has its own two-pass grayscale renderer below.
 */
function applyColorMap(
  value: number,
  type: ColorMapType
): [number, number, number, number] {
  // Transparent for NoData, extreme values, or NaN
  if (isNaN(value) || value < -1e10) {
    return [0, 0, 0, 0];
  }

  switch (type) {
    case 'water_2023': {
      if (value > 0.5) return [14, 165, 233, 230]; // #0EA5E9 Sky Blue
      return [0, 0, 0, 0];
    }
    case 'water':
    case 'water_2026': {
      if (value > 0.5) return [2, 132, 199, 230]; // #0284C7 Water Blue
      return [0, 0, 0, 0];
    }
    case 'water_change': {
      // In Water_Change_2023_2026.tif:
      // +1 = Water Gain (dry in 2023, water in 2026)
      // -1 = Water Loss (water in 2023, dry in 2026)
      //  0 = Stable / no change
      // NoData is -3.4028234663852886e+38 or NaN
      if (value > 0.5) return [6, 182, 212, 235]; // Gain: #06B6D4 Cyan
      if (value < -0.5 && value > -1e10) return [239, 68, 68, 235]; // Loss: #EF4444 Red
      return [0, 0, 0, 0]; // 0 or stable: transparent
    }
    case 'streams': {
      if (value > 0.5) return [37, 99, 235, 245]; // #2563EB royal blue
      return [0, 0, 0, 0];
    }
    case 'vegetation': {
      if (value > 0.5) return [24, 58, 42, 160]; // #183A2A forest green
      return [0, 0, 0, 0];
    }
    case 'ndvi_change': {
      if (value < -0.08) return [239, 68, 68, 190];  // loss: red
      if (value > 0.08)  return [34, 197, 94, 190];  // gain: green
      return [0, 0, 0, 0]; // stable: transparent
    }
    default:
      return [0, 0, 0, 0];
  }
}

/**
 * Fetches a raster, preferring Supabase Storage and falling back to the copy
 * still in public/gis.
 *
 * The fallback exists only for the migration window: rasters are registered in
 * the database before scripts/upload-rasters.mjs has necessarily been run. Once
 * the upload is done and the local copies are deleted, the fallback stops being
 * reachable and nothing else changes. It warns loudly so a missing upload is
 * noticed rather than silently masked.
 */
async function fetchRaster(url: string, fallbackUrl?: string): Promise<ArrayBuffer> {
  const response = await fetch(url).catch(() => null);

  if (response?.ok) return response.arrayBuffer();

  if (fallbackUrl && fallbackUrl !== url) {
    console.warn(
      `[geoTiffRenderer] ${url} unavailable (${response?.status ?? 'network error'}); ` +
        `falling back to ${fallbackUrl}. Run "node scripts/upload-rasters.mjs" to ` +
        `push rasters to Supabase Storage.`
    );
    const fallback = await fetch(fallbackUrl);
    if (!fallback.ok) {
      throw new Error(
        `Raster unavailable from both Storage (${url}) and local fallback (${fallbackUrl}: ${fallback.status})`
      );
    }
    return fallback.arrayBuffer();
  }

  throw new Error(
    `Failed to fetch raster at ${url}: ${response ? `${response.status} ${response.statusText}` : 'network error'}`
  );
}

/**
 * Decodes a real GeoTIFF in browser memory and generates a data URL
 * for use as a Leaflet ImageOverlay.
 *
 * NDVI rasters are rendered as a QGIS-matching grayscale singleband
 * (linear min–max stretch). All other rasters use binary colormaps.
 *
 * `bounds` is required and comes from the raster_layers row — the renderer no
 * longer guesses geography from a filename.
 */
export async function loadAndRenderGeoTiff(
  url: string,
  colorMap: ColorMapType,
  bounds: [[number, number], [number, number]],
  fallbackUrl?: string
): Promise<RasterLayerData> {
  const cacheKey = `${url}_${colorMap}`;
  if (rasterCache.has(cacheKey)) {
    return rasterCache.get(cacheKey)!;
  }

  const arrayBuffer = await fetchRaster(url, fallbackUrl);
  const tiff = await fromArrayBuffer(arrayBuffer);
  const image = await tiff.getImage();
  const width = image.getWidth();
  const height = image.getHeight();

  const rasters = await image.readRasters();
  const rawData = rasters[0] as Float32Array | Uint8Array | number[];

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not supported');

  const imageData = ctx.createImageData(width, height);
  const pixelBytes = imageData.data;

  if (colorMap === 'ndvi') {
    // ------------------------------------------------------------------
    // QGIS Singleband Grayscale renderer — linear min–max stretch.
    //
    // QGIS default: maps the raster's actual data range [min, max] to
    // [black=0, white=255]. NoData pixels (value < -1e10, i.e. the
    // float32-minimum sentinel) become fully transparent. All other
    // values — including negatives — are rendered as valid gray tones.
    // ------------------------------------------------------------------

    // Pass 1: find actual min & max of valid pixels
    let minVal = Infinity;
    let maxVal = -Infinity;
    for (let i = 0; i < rawData.length; i++) {
      const v = rawData[i];
      if (!isNaN(v) && v > -1e10) {
        if (v < minVal) minVal = v;
        if (v > maxVal) maxVal = v;
      }
    }
    // Guard against degenerate rasters
    const range = maxVal > minVal ? maxVal - minVal : 1;

    // Pass 2: linear grayscale mapping
    for (let i = 0; i < rawData.length; i++) {
      const val = rawData[i];
      const px = i * 4;
      if (isNaN(val) || val < -1e10) {
        // NoData → fully transparent
        pixelBytes[px] = pixelBytes[px + 1] = pixelBytes[px + 2] = pixelBytes[px + 3] = 0;
      } else {
        const gray = Math.min(255, Math.max(0, Math.round(((val - minVal) / range) * 255)));
        pixelBytes[px] = gray;         // R
        pixelBytes[px + 1] = gray;     // G
        pixelBytes[px + 2] = gray;     // B
        pixelBytes[px + 3] = 255;      // A — fully opaque; transparency set via ImageOverlay
      }
    }
  } else {
    // All other raster layers: standard categorical colormap
    for (let i = 0; i < rawData.length; i++) {
      const val = rawData[i];
      const [r, g, b, a] = applyColorMap(val, colorMap);
      const px = i * 4;
      pixelBytes[px] = r;
      pixelBytes[px + 1] = g;
      pixelBytes[px + 2] = b;
      pixelBytes[px + 3] = a;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const dataUrl = canvas.toDataURL('image/png');

  const result: RasterLayerData = { dataUrl, bounds, width, height };
  rasterCache.set(cacheKey, result);
  return result;
}
