import React from 'react';
import { Database, Satellite, Compass, Layers, Camera } from 'lucide-react';
import type { SiteRow } from '../../lib/database.types';
import { useSiteRasters } from '../../features/rasters/useSiteRasters';
import { useGeotaggedImages } from '../../features/geotag/useGeotaggedImages';
import { useSatelliteImages } from '../../features/satellite/useSatelliteImages';
import { formatCount } from '../../lib/format';

/**
 * What this site's analysis is actually built from.
 *
 * Every line is derived from the database. The previous version made claims the
 * project could not support — a "Mobile app synced, ±2.4m GPS accuracy" when
 * there is no mobile app, an "ISO 19115 GIS Standard" badge, and
 * "SRISHTI-DRISHTI Compatible Framework · Compliant with national watershed
 * standards" with no compliance work behind it.
 *
 * An unverifiable claim is worse than no claim: it is the one thing a reviewer
 * will ask about, and there is no good answer.
 */
export const DataSources: React.FC<{ site: SiteRow }> = ({ site }) => {
  const rastersQuery = useSiteRasters(site.id);
  const photosQuery = useGeotaggedImages(site.id);
  const scenesQuery = useSatelliteImages(site.id);

  const rasters = rastersQuery.data ?? [];
  const photos = photosQuery.data ?? [];
  const scenes = scenesQuery.data ?? [];

  const grids = [...new Set(rasters.filter((r) => r.pixel_size_m).map((r) => Number(r.pixel_size_m)))]
    .sort((a, b) => a - b);

  const years = [...new Set(rasters.flatMap((r) => [r.year_from, r.year_to]).filter(Boolean))]
    .sort() as number[];

  const sensors = [...new Set(scenes.map((s) => s.sensor).filter(Boolean))] as string[];
  const exifCount = photos.filter((p) => p.gps_source === 'exif').length;
  const statLayers = rasters.length;

  const sources = [
    {
      label: 'Raster layers',
      icon: Layers,
      detail:
        statLayers > 0
          ? `${statLayers} layers${grids.length ? ` at ${grids.join(' and ')} m` : ''}${
              site.analysis_crs ? ` · ${site.analysis_crs}` : ''
            }`
          : 'None registered',
    },
    {
      label: 'Analysis period',
      icon: Compass,
      detail: years.length >= 2 ? `${years[0]} to ${years[years.length - 1]}` : years[0] ? String(years[0]) : 'Not recorded',
    },
    {
      label: 'Satellite imagery',
      icon: Satellite,
      detail:
        scenes.length > 0
          ? `${scenes.length} scene${scenes.length === 1 ? '' : 's'}${sensors.length ? ` · ${sensors.join(', ')}` : ''}`
          : 'None uploaded',
    },
    {
      label: 'Geo-tagged field photos',
      icon: Camera,
      detail:
        photos.length > 0
          ? `${formatCount(photos.length)} recorded · ${exifCount} positioned by camera GPS`
          : 'None uploaded',
    },
    {
      label: 'Coordinate reference',
      icon: Database,
      detail: `Stored in ${site.crs}${site.analysis_crs ? ` · analysed in ${site.analysis_crs}` : ''}`,
    },
  ];

  return (
    <div className="p-6 rounded-3xl bg-neutral-50/80 border border-black/5">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="text-[10px] uppercase font-bold tracking-widest text-[#6F6F6F]">
          What this analysis is built from
        </div>
        <div className="text-[10px] text-neutral-400">Read from the database</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {sources.map((src) => {
          const Icon = src.icon;
          return (
            <div key={src.label} className="p-3.5 rounded-2xl bg-white border border-black/5 shadow-xs">
              <div className="w-7 h-7 rounded-lg bg-[#EEF5EC] text-[#35624B] flex items-center justify-center mb-2">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs font-semibold text-neutral-900 leading-snug">{src.label}</div>
              <div className="text-[11px] text-neutral-500 mt-1 leading-normal">{src.detail}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DataSources;
