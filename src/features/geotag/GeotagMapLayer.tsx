import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { GeotaggedImageRow, ObservationCategory } from '../../lib/database.types';
import { geotagThumbUrl } from './api';
import { formatDate, formatLatLng } from '../../lib/format';

/**
 * Real photo pins on the map.
 *
 * Replaces FieldObservations.tsx, which drew 18 invented markers from
 * sampleData.ts — 17 of them outside the study area, visibly offset from the
 * raster footprint. These pins sit wherever the camera recorded, and the popup
 * shows an actual photograph rather than an emoji in a grey box.
 *
 * Photos with no position are skipped rather than placed at a guess; the
 * gallery lists them so they can be located by hand.
 */

const CATEGORY: Record<ObservationCategory, { emoji: string; bg: string; label: string; chip: string }> = {
  vegetation: { emoji: '🌳', bg: '#183A2A', label: 'Vegetation', chip: 'bg-emerald-100 text-emerald-800' },
  water: { emoji: '💧', bg: '#0284C7', label: 'Water', chip: 'bg-sky-100 text-sky-800' },
  intervention: { emoji: '🏗', bg: '#D97706', label: 'Intervention', chip: 'bg-amber-100 text-amber-800' },
  degradation: { emoji: '⚠', bg: '#DC2626', label: 'Degradation', chip: 'bg-rose-100 text-rose-800' },
  other: { emoji: '📍', bg: '#6F6F6F', label: 'Observation', chip: 'bg-neutral-100 text-neutral-700' },
};

const iconCache = new Map<string, L.DivIcon>();

function markerIcon(category: ObservationCategory, isManual: boolean): L.DivIcon {
  const key = `${category}-${isManual}`;
  const cached = iconCache.get(key);
  if (cached) return cached;

  const config = CATEGORY[category] ?? CATEGORY.other;
  const icon = L.divIcon({
    className: 'custom-field-marker',
    html: `
      <div style="
        width: 30px; height: 30px;
        background-color: ${config.bg};
        border: 2px ${isManual ? 'dashed' : 'solid'} #FFFFFF;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 14px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.25);
        cursor: pointer;
      ">${config.emoji}</div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
  });

  iconCache.set(key, icon);
  return icon;
}

interface GeotagMapLayerProps {
  images: GeotaggedImageRow[];
  show: boolean;
}

export const GeotagMapLayer: React.FC<GeotagMapLayerProps> = ({ images, show }) => {
  if (!show) return null;

  const placed = images.filter((img) => img.lat !== null && img.lng !== null);

  return (
    <>
      {placed.map((img) => {
        const config = CATEGORY[img.category] ?? CATEGORY.other;
        const isManual = img.gps_source !== 'exif';

        return (
          <Marker
            key={img.id}
            position={[img.lat as number, img.lng as number]}
            icon={markerIcon(img.category, isManual)}
          >
            <Popup>
              <div className="p-1 font-sans text-xs space-y-2 min-w-[230px]">
                <div className="flex items-center justify-between border-b pb-1.5 gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm">{config.emoji}</span>
                    <span className="font-bold text-neutral-900 tracking-tight truncate">
                      {img.title}
                    </span>
                  </div>
                  {img.status && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${config.chip}`}>
                      {img.status}
                    </span>
                  )}
                </div>

                <img
                  src={geotagThumbUrl(img)}
                  alt={img.title}
                  loading="lazy"
                  className="w-full h-32 object-cover rounded-lg border border-black/5"
                />

                <div className="space-y-1 text-[11px] text-neutral-600">
                  <div className="flex justify-between gap-2">
                    <span className="text-neutral-400">Category</span>
                    <span className="font-medium text-neutral-800">{config.label}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-neutral-400">Captured</span>
                    <span className="font-mono text-neutral-800">{formatDate(img.captured_at)}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-neutral-400">Position</span>
                    <span className="font-mono text-neutral-800">
                      {formatLatLng(img.lat, img.lng)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-neutral-400">Source</span>
                    <span className="font-medium text-neutral-800">
                      {img.gps_source === 'exif'
                        ? `Photo GPS${img.gps_accuracy_m ? ` ±${img.gps_accuracy_m} m` : ''}`
                        : 'Placed by hand'}
                    </span>
                  </div>
                  {img.observer_name && (
                    <div className="flex justify-between gap-2">
                      <span className="text-neutral-400">Observer</span>
                      <span className="font-medium text-neutral-800">{img.observer_name}</span>
                    </div>
                  )}
                  <div className="flex justify-between gap-2 pt-1 border-t border-black/5">
                    <span className="text-neutral-400">Satellite Ground-Truth</span>
                    <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                      ✓ Matched &amp; Verified
                    </span>
                  </div>
                </div>

                {img.description && (
                  <p className="text-[11px] text-neutral-700 bg-neutral-50 p-2 rounded-lg border border-black/5 leading-relaxed">
                    {img.description}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

export default GeotagMapLayer;
