import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, Check, MapPin, AlertTriangle, Crosshair } from 'lucide-react';
import type { SiteRow, ObservationCategory } from '../../lib/database.types';
import { isInsideBbox } from './exif';
import { formatLatLng } from '../../lib/format';

/**
 * Click-to-place location picker.
 *
 * Typing latitude and longitude by hand is how the original sample data ended
 * up with 17 of 18 observations outside the study area — a transposed digit
 * looks perfectly reasonable in a text box. Placing the pin on the map makes a
 * wrong position visible immediately, and the picker also says outright when
 * the point falls outside the site boundary.
 *
 * Photos that already carry EXIF GPS open at their recorded position, so this
 * doubles as a correction tool for a bad fix.
 */

const CATEGORY_COLOUR: Record<ObservationCategory, string> = {
  vegetation: '#183A2A',
  water: '#0284C7',
  intervention: '#D97706',
  degradation: '#DC2626',
  other: '#6F6F6F',
};

function pinIcon(category: ObservationCategory): L.DivIcon {
  return L.divIcon({
    className: 'custom-field-marker',
    html: `
      <div style="
        width: 30px; height: 30px;
        background-color: ${CATEGORY_COLOUR[category] ?? CATEGORY_COLOUR.other};
        border: 2px solid #FFFFFF;
        border-radius: 50%;
        box-shadow: 0 4px 10px rgba(0,0,0,0.35);
      "></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

/** Turns a click anywhere on the map into a position. */
const ClickToPlace: React.FC<{ onPick: (lat: number, lng: number) => void }> = ({ onPick }) => {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

interface LocationPickerProps {
  site: SiteRow;
  category: ObservationCategory;
  /** Existing position, if the photo already has one. */
  lat: number | null;
  lng: number | null;
  /** Where the existing position came from, so the picker can say so. */
  gpsSource: 'exif' | 'manual' | 'unknown';
  onConfirm: (lat: number, lng: number) => void;
  onCancel: () => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  site,
  category,
  lat,
  lng,
  gpsSource,
  onConfirm,
  onCancel,
}) => {
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(
    lat !== null && lng !== null ? { lat, lng } : null
  );

  const boundary = site.boundary_geojson;

  const bounds = useMemo(() => {
    if (!boundary) return null;
    try {
      const b = L.geoJSON(boundary as GeoJSON.GeoJsonObject).getBounds();
      return b.isValid() ? b : null;
    } catch {
      return null;
    }
  }, [boundary]);

  const inside = picked ? isInsideBbox(picked.lat, picked.lng, site) : null;

  return (
    <div
      className="fixed inset-0 z-[4000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label="Pick the photo location on the map"
    >
      <div
        className="bg-white rounded-3xl overflow-hidden w-full max-w-4xl flex flex-col max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 py-3.5 border-b border-black/8">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#35624B] font-semibold">
              <Crosshair className="w-3.5 h-3.5" />
              Place the photo
            </div>
            <div className="text-sm text-neutral-700 mt-0.5">
              Click anywhere on the map, or drag the pin to fine-tune it.
            </div>
          </div>
          <button
            onClick={onCancel}
            aria-label="Cancel"
            className="text-neutral-400 hover:text-neutral-900 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map */}
        <div className="relative h-[380px] sm:h-[460px] bg-neutral-900">
          <MapContainer
            center={[site.centre_lat, site.centre_lng]}
            zoom={site.default_zoom}
            bounds={bounds ?? undefined}
            boundsOptions={{ padding: [30, 30], maxZoom: 15 }}
            scrollWheelZoom
            className="w-full h-full"
            attributionControl={false}
          >
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />

            {boundary && (
              <GeoJSON
                data={boundary as GeoJSON.GeoJsonObject}
                style={() => ({
                  color: '#FFFFFF',
                  weight: 2,
                  dashArray: '6, 5',
                  fillColor: '#183A2A',
                  fillOpacity: 0.06,
                })}
              />
            )}

            <ClickToPlace onPick={(la, ln) => setPicked({ lat: la, lng: ln })} />

            {picked && (
              <Marker
                position={[picked.lat, picked.lng]}
                icon={pinIcon(category)}
                draggable
                eventHandlers={{
                  dragend: (e) => {
                    const p = (e.target as L.Marker).getLatLng();
                    setPicked({ lat: p.lat, lng: p.lng });
                  },
                }}
              />
            )}
          </MapContainer>

          {!picked && (
            <div className="absolute inset-x-0 top-4 flex justify-center pointer-events-none">
              <div className="px-3.5 py-2 rounded-xl bg-black/65 backdrop-blur-sm text-white text-[11px]">
                Click on the map to drop a pin
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-black/8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            {picked ? (
              <>
                <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-900">
                  <MapPin className="w-3.5 h-3.5 text-[#35624B]" />
                  <span className="font-mono">{formatLatLng(picked.lat, picked.lng, 6)}</span>
                </div>
                {inside === false ? (
                  <div className="flex items-center gap-1 text-[11px] text-rose-700 mt-1">
                    <AlertTriangle className="w-3 h-3" />
                    Outside the {site.name} boundary — allowed, but worth checking.
                  </div>
                ) : (
                  <div className="text-[11px] text-[#6F6F6F] mt-1">
                    {gpsSource === 'exif'
                      ? 'Moving this pin overrides the position recorded by the camera.'
                      : 'This will be recorded as placed by hand, not measured.'}
                  </div>
                )}
              </>
            ) : (
              <div className="text-[11px] text-[#6F6F6F]">No position chosen yet.</div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setPicked({ lat: site.centre_lat, lng: site.centre_lng })}
              className="px-3.5 py-2 rounded-full border border-black/10 text-[11px] font-medium text-neutral-700 hover:border-black/30 transition-colors"
            >
              Site centre
            </button>
            <button
              onClick={onCancel}
              className="px-3.5 py-2 rounded-full border border-black/10 text-[11px] font-medium text-neutral-700 hover:border-black/30 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => picked && onConfirm(picked.lat, picked.lng)}
              disabled={!picked}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#183A2A] text-white text-[11px] font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#35624B] transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Use this position
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
