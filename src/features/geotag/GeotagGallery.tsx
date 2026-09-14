import React, { useMemo, useState } from 'react';
import { Camera, MapPin, MapPinOff, Trash2, AlertTriangle, X } from 'lucide-react';
import type { SiteRow, GeotaggedImageRow, ObservationCategory } from '../../lib/database.types';
import { geotagImageUrl, geotagThumbUrl } from './api';
import { isInsideBbox } from './exif';
import { useGeotaggedImages, useDeleteGeotaggedImage } from './useGeotaggedImages';
import { useAuth } from '../auth/AuthContext';
import { Spinner, ErrorState, EmptyState } from '../../components/ui/States';
import { formatDate, formatLatLng, formatCount } from '../../lib/format';

// A module-level constant, so `query.data ?? EMPTY` is referentially stable
// while loading and useMemo is not invalidated on every render.
const EMPTY: GeotaggedImageRow[] = [];

const CATEGORY_LABEL: Record<ObservationCategory, string> = {
  vegetation: 'Vegetation',
  water: 'Water',
  intervention: 'Intervention',
  degradation: 'Degradation',
  other: 'Other',
};

const CATEGORY_CHIP: Record<ObservationCategory, string> = {
  vegetation: 'bg-emerald-100 text-emerald-800',
  water: 'bg-sky-100 text-sky-800',
  intervention: 'bg-amber-100 text-amber-800',
  degradation: 'bg-rose-100 text-rose-800',
  other: 'bg-neutral-100 text-neutral-700',
};

export const GeotagGallery: React.FC<{ site: SiteRow }> = ({ site }) => {
  const { canEdit } = useAuth();
  const query = useGeotaggedImages(site.id);
  const remove = useDeleteGeotaggedImage(site.id);

  const [filter, setFilter] = useState<ObservationCategory | 'all'>('all');
  const [preview, setPreview] = useState<GeotaggedImageRow | null>(null);

  const images = query.data ?? EMPTY;

  const stats = useMemo(() => {
    const withGps = images.filter((i) => i.gps_source === 'exif').length;
    const placed = images.filter((i) => i.lat !== null).length;
    const outside = images.filter(
      (i) => i.lat !== null && i.lng !== null && isInsideBbox(i.lat, i.lng, site) === false
    ).length;
    return { total: images.length, withGps, placed, outside };
  }, [images, site]);

  const filtered = filter === 'all' ? images : images.filter((i) => i.category === filter);

  if (query.isLoading) return <Spinner label="Loading field photos" />;
  if (query.isError) {
    return (
      <ErrorState
        title="Could not load field photos"
        error={query.error}
        onRetry={() => query.refetch()}
      />
    );
  }

  if (images.length === 0) {
    return (
      <EmptyState
        icon={Camera}
        title="No field photos yet"
        hint={
          canEdit
            ? 'Upload geo-tagged photographs above. Their GPS is read automatically and each one becomes a pin on the map.'
            : 'No geo-tagged photographs have been recorded for this site yet.'
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Provenance summary — how many positions are measured vs placed by hand */}
      <div className="flex flex-wrap items-center gap-3 text-[11px]">
        <span className="text-[#6F6F6F]">
          <span className="font-semibold text-neutral-900">{formatCount(stats.total)}</span> photo
          {stats.total === 1 ? '' : 's'}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#EEF5EC] text-[#35624B]">
          <MapPin className="w-3 h-3" />
          {stats.withGps} with camera GPS
        </span>
        {stats.placed - stats.withGps > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
            <MapPinOff className="w-3 h-3" />
            {stats.placed - stats.withGps} placed by hand
          </span>
        )}
        {stats.outside > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3" />
            {stats.outside} outside the site boundary
          </span>
        )}
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {(['all', ...Object.keys(CATEGORY_LABEL)] as (ObservationCategory | 'all')[]).map((c) => {
          const count = c === 'all' ? images.length : images.filter((i) => i.category === c).length;
          if (c !== 'all' && count === 0) return null;
          return (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-medium transition-colors ${
                filter === c
                  ? 'bg-[#183A2A] text-white'
                  : 'bg-white border border-black/8 text-[#6F6F6F] hover:text-neutral-900'
              }`}
            >
              {c === 'all' ? 'All' : CATEGORY_LABEL[c]} ({count})
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((img) => {
          const outside =
            img.lat !== null && img.lng !== null ? isInsideBbox(img.lat, img.lng, site) === false : false;

          return (
            <div
              key={img.id}
              className="group rounded-2xl bg-white border border-black/8 overflow-hidden shadow-sm card-hover"
            >
              <button
                onClick={() => setPreview(img)}
                className="block w-full aspect-[4/3] bg-neutral-100 overflow-hidden"
              >
                <img
                  src={geotagThumbUrl(img)}
                  alt={img.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </button>

              <div className="p-3 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs font-semibold text-neutral-900 truncate">{img.title}</div>
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

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${CATEGORY_CHIP[img.category]}`}
                  >
                    {CATEGORY_LABEL[img.category]}
                  </span>
                  {img.gps_source !== 'exif' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                      Manual pin
                    </span>
                  )}
                  {outside && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                      Outside site
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-neutral-400 font-mono truncate">
                  {img.lat !== null ? formatLatLng(img.lat, img.lng) : 'No position'}
                </div>
                <div className="text-[10px] text-neutral-400">{formatDate(img.captured_at)}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full-size preview */}
      {preview && (
        <div
          className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-white rounded-3xl overflow-hidden max-w-4xl w-full max-h-full flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 px-5 py-3.5 border-b border-black/8">
              <div className="min-w-0">
                <div className="font-serif-display text-lg text-[#111111] truncate">
                  {preview.title}
                </div>
                <div className="text-[11px] text-[#6F6F6F] font-mono">
                  {formatLatLng(preview.lat, preview.lng)} • {formatDate(preview.captured_at)} •{' '}
                  {preview.gps_source === 'exif' ? 'GPS from photo' : 'Position placed by hand'}
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
              src={geotagImageUrl(preview)}
              alt={preview.title}
              className="w-full flex-1 object-contain bg-neutral-900 min-h-0"
            />
            {preview.description && (
              <p className="px-5 py-3 text-xs text-neutral-700 border-t border-black/8">
                {preview.description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GeotagGallery;
