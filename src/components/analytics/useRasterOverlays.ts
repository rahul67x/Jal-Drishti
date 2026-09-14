import { useEffect, useState } from 'react';
import type { RasterLayerRow } from '../../lib/database.types';
import { rasterUrl, rasterFallbackUrl, rasterBounds, findLayer } from '../../features/rasters/api';
import {
  loadAndRenderGeoTiff,
  type RasterLayerData,
  type ColorMapType,
} from './geoTiffRenderer';

export interface OverlayState {
  /** Decoded overlays, keyed by layer_key. */
  overlays: Record<string, RasterLayerData>;
  /** layer_keys currently being decoded. */
  loading: string[];
  /** Decode failures, keyed by layer_key. */
  errors: Record<string, string>;
}

/**
 * Decodes exactly the raster layers that are currently switched on.
 *
 * Layers are decoded lazily and cached in geoTiffRenderer, so flicking a toggle
 * off and back on costs nothing. A PNG layer needs no decoding at all — Leaflet
 * can draw it directly — so it is skipped here.
 */
export function useRasterOverlays(
  rasters: RasterLayerRow[] | undefined,
  activeKeys: string[]
): OverlayState {
  const [overlays, setOverlays] = useState<Record<string, RasterLayerData>>({});
  const [loading, setLoading] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Join to a stable primitive so the effect does not re-run on every render
  // just because the caller built a new array with the same contents.
  const activeKey = [...activeKeys].sort().join(',');

  useEffect(() => {
    if (!rasters?.length) return;
    let cancelled = false;

    const wanted = activeKey ? activeKey.split(',') : [];

    for (const key of wanted) {
      if (overlays[key] || errors[key]) continue;

      const layer = findLayer(rasters, key);
      if (!layer) continue;

      // PNGs are handed straight to Leaflet, no decode needed.
      if (layer.format === 'png') continue;

      const bounds = rasterBounds(layer);
      if (!bounds) {
        setErrors((prev) => ({ ...prev, [key]: 'Layer has no geographic bounds recorded' }));
        continue;
      }

      setLoading((prev) => (prev.includes(key) ? prev : [...prev, key]));

      loadAndRenderGeoTiff(
        rasterUrl(layer),
        (layer.colormap_key ?? 'vegetation') as ColorMapType,
        bounds,
        rasterFallbackUrl(layer)
      )
        .then((data) => {
          if (cancelled) return;
          setOverlays((prev) => ({ ...prev, [key]: data }));
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          const message = err instanceof Error ? err.message : String(err);
          console.error(`[useRasterOverlays] ${key} failed:`, message);
          setErrors((prev) => ({ ...prev, [key]: message }));
        })
        .finally(() => {
          if (cancelled) return;
          setLoading((prev) => prev.filter((k) => k !== key));
        });
    }

    return () => {
      cancelled = true;
    };
    // `overlays` and `errors` are read to skip work already done, but including
    // them would re-run this on every successful decode. The activeKey/rasters
    // pair is what should actually drive it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rasters, activeKey]);

  return { overlays, loading, errors };
}
