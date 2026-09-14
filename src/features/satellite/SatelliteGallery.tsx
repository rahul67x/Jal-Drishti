import React, { useMemo, useState } from 'react';
import { Satellite, Trash2, X, FileText, Cloud, Ruler } from 'lucide-react';
import type { SiteRow, SatelliteImageRow } from '../../lib/database.types';
import { satelliteImageUrl, satelliteThumbUrl } from './api';
import {
  useSatelliteImages,
  useDeleteSatelliteImage,
  useUpdateSatelliteImage,
} from './useSatelliteImages';
import { useAuth } from '../auth/AuthContext';
import { Spinner, ErrorState, EmptyState } from '../../components/ui/States';
import { formatDate } from '../../lib/format';

const EMPTY: SatelliteImageRow[] = [];

/** Groups scenes by year so a multi-temporal set reads chronologically. */
function groupByYear(images: SatelliteImageRow[]): [string, SatelliteImageRow[]][] {
  const groups = new Map<string, SatelliteImageRow[]>();
  for (const img of images) {
    const key = img.year ? String(img.year) : 'Undated';
    const list = groups.get(key) ?? [];
    list.push(img);
    groups.set(key, list);
  }
  return [...groups.entries()].sort(([a], [b]) => {
    if (a === 'Undated') return 1;
    if (b === 'Undated') return -1;
    return Number(a) - Number(b);
  });
}

export const SatelliteGallery: React.FC<{ site: SiteRow }> = ({ site }) => {
  const { canEdit } = useAuth();
  const query = useSatelliteImages(site.id);
  const remove = useDeleteSatelliteImage(site.id);
  const update = useUpdateSatelliteImage(site.id);
  const [preview, setPreview] = useState<SatelliteImageRow | null>(null);

  const images = query.data ?? EMPTY;
  const grouped = useMemo(() => groupByYear(images), [images]);

  if (query.isLoading) return <Spinner label="Loading satellite imagery" />;
  if (query.isError) {
    return (
      <ErrorState
        title="Could not load satellite imagery"
        error={query.error}
        onRetry={() => query.refetch()}
      />
    );
  }

  if (images.length === 0) {
    return (
      <EmptyState
        icon={Satellite}
        title="No satellite imagery yet"
        hint={
          canEdit
            ? 'Add scenes above with their sensor, acquisition date and resolution. Those details are cited under every plate in the PDF report.'
            : 'No satellite scenes have been recorded for this site yet.'
        }
      />
    );
  }

  const inReport = images.filter((i) => i.include_in_report).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#6F6F6F]">
        <span>
          <span className="font-semibold text-neutral-900">{images.length}</span> scene
          {images.length === 1 ? '' : 's'}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#EEF5EC] text-[#35624B]">
          <FileText className="w-3 h-3" />
          {inReport} included in the report
        </span>
      </div>

      {grouped.map(([year, scenes]) => (
        <div key={year} className="space-y-2.5">
          <div className="flex items-center gap-2">
            <h4 className="font-serif-display text-lg text-[#111111]">{year}</h4>
            <div className="flex-1 h-px bg-black/8" />
            <span className="text-[10px] text-neutral-400">
              {scenes.length} scene{scenes.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenes.map((img) => (
              <div
                key={img.id}
                className="rounded-2xl bg-white border border-black/8 overflow-hidden shadow-sm card-hover"
              >
                <button
                  onClick={() => setPreview(img)}
                  className="block w-full aspect-video bg-neutral-100 overflow-hidden"
                >
                  <img
                    src={satelliteThumbUrl(img)}
                    alt={img.title}
                    loading="lazy"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </button>

                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-neutral-900 truncate">
                        {img.title}
                      </div>
                      <div className="text-[10px] text-neutral-500 truncate">
                        {[img.sensor, img.product].filter(Boolean).join(' · ') || '—'}
                      </div>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${img.title}"? This cannot be undone.`)) {
                            remove.mutate(img);
                          }
                        }}
                        aria-label={`Delete ${img.title}`}
                        className="text-neutral-300 hover:text-rose-600 transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-neutral-400">
                    {img.acquisition_date && <span>{formatDate(img.acquisition_date)}</span>}
                    {img.resolution_m !== null && (
                      <span className="inline-flex items-center gap-0.5">
                        <Ruler className="w-2.5 h-2.5" />
                        {img.resolution_m} m
                      </span>
                    )}
                    {img.cloud_cover_pct !== null && (
                      <span className="inline-flex items-center gap-0.5">
                        <Cloud className="w-2.5 h-2.5" />
                        {img.cloud_cover_pct}%
                      </span>
                    )}
                  </div>

                  {canEdit && (
                    <label className="flex items-center gap-1.5 text-[10px] text-neutral-600 cursor-pointer pt-1 border-t border-black/5">
                      <input
                        type="checkbox"
                        checked={img.include_in_report}
                        onChange={(e) =>
                          update.mutate({
                            id: img.id,
                            patch: { include_in_report: e.target.checked },
                          })
                        }
                        className="accent-[#183A2A]"
                      />
                      In report
                    </label>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {preview && (
        <div
          className="fixed inset-0 z-[3000] bg-black/85 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-white rounded-3xl overflow-hidden max-w-5xl w-full max-h-full flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 px-5 py-3.5 border-b border-black/8">
              <div className="min-w-0">
                <div className="font-serif-display text-lg text-[#111111] truncate">
                  {preview.title}
                </div>
                <div className="text-[11px] text-[#6F6F6F]">
                  {[
                    preview.sensor,
                    preview.product,
                    preview.acquisition_date ? formatDate(preview.acquisition_date) : null,
                    preview.resolution_m !== null ? `${preview.resolution_m} m` : null,
                    preview.cloud_cover_pct !== null ? `${preview.cloud_cover_pct}% cloud` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              </div>
              <button
                onClick={() => setPreview(null)}
                aria-label="Close preview"
                className="text-neutral-400 hover:text-neutral-900 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={satelliteImageUrl(preview)}
              alt={preview.title}
              className="w-full flex-1 object-contain bg-neutral-900 min-h-0"
            />
            {preview.caption && (
              <p className="px-5 py-3 text-xs text-neutral-700 border-t border-black/8">
                {preview.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SatelliteGallery;
