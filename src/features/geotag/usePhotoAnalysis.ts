import { useMemo } from 'react';
import type { GeotaggedImageRow, RasterLayerRow, SiteMetricsRow } from '../../lib/database.types';
import { evaluateSiteGeotagValidation, type SiteValidationSummary } from './photoAnalysisEngine';

/**
 * React hook that runs site-wide automated Geo-Photo analysis
 * and spatial cross-validation against satellite rasters.
 */
export function usePhotoAnalysis(
  geotagged: GeotaggedImageRow[] = [],
  metrics?: SiteMetricsRow | null,
  rasters: RasterLayerRow[] = []
): SiteValidationSummary {
  return useMemo(
    () => evaluateSiteGeotagValidation(geotagged, metrics, rasters),
    [geotagged, metrics, rasters]
  );
}
