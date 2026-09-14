import { QueryClient } from '@tanstack/react-query';

/**
 * Shared React Query client.
 *
 * The tuning here is deliberate: this app reads GIS data that changes when an
 * analyst re-runs QGIS, not second by second. Aggressive refetching would mean
 * re-downloading and re-decoding multi-megabyte GeoTIFFs every time the window
 * regains focus, which is exactly what we do not want.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Site metadata and raster statistics are effectively static during a session.
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * Query keys in one place so an invalidation after a write cannot miss a
 * cache entry through a typo.
 */
export const queryKeys = {
  sites: ['sites'] as const,
  site: (slug: string) => ['sites', slug] as const,
  siteMetrics: (slug: string) => ['sites', slug, 'metrics'] as const,
  siteLulc: (slug: string) => ['sites', slug, 'lulc'] as const,
  siteRasters: (siteId: string) => ['sites', siteId, 'rasters'] as const,
  rasterStats: (siteId: string) => ['sites', siteId, 'raster-stats'] as const,
  siteInsights: (siteId: string) => ['sites', siteId, 'insights'] as const,
  geotagged: (siteId: string) => ['sites', siteId, 'geotagged'] as const,
  satellite: (siteId: string) => ['sites', siteId, 'satellite'] as const,
};
