import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryClient';
import { listRasterLayers, listRasterLayersWithStats } from './api';

/** Raster layers for a site, without statistics. Enough to draw the map. */
export function useSiteRasters(siteId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.siteRasters(siteId ?? ''),
    queryFn: () => listRasterLayers(siteId!),
    enabled: Boolean(siteId),
  });
}

/**
 * Raster layers with their QGIS class statistics.
 *
 * Used by the statistics tables and the PDF report, where the raw pixel counts
 * matter rather than just the derived headline figures.
 */
export function useSiteRasterStats(siteId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.rasterStats(siteId ?? ''),
    queryFn: () => listRasterLayersWithStats(siteId!),
    enabled: Boolean(siteId),
  });
}
