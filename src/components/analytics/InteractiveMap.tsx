import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, useMap, GeoJSON, ImageOverlay } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MapLayerControls from './MapLayerControls';
import type { BaseLayerType, LayerState } from './MapLayerControls';
import GeotagMapLayer from '../../features/geotag/GeotagMapLayer';
import type { SiteRow, RasterLayerRow, GeotaggedImageRow } from '../../lib/database.types';
import { rasterUrl, rasterFallbackUrl, rasterBounds, findLayer } from '../../features/rasters/api';
import { useRasterOverlays } from './useRasterOverlays';
import { formatKm2 } from '../../lib/format';
import { useFullscreen } from './useFullscreen';
import { Maximize2, Minimize2 } from 'lucide-react';

// Fix generic Leaflet icon URLs if default markers are ever used
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/**
 * Which database layer_key backs each toggle in the control panel.
 *
 * This is the one place the UI's vocabulary meets the data's. A site that
 * names its layers the same way works with no code change.
 */
const LAYER_KEYS = {
  ndvi: 'ndvi_2023',
  water2023: 'water_mask_2023',
  water2026: 'water_mask_2026',
  waterChange: 'water_change_2023_2026',
  drainage: 'streams',
  changeDetection: 'ndvi_change_2023_2026',
} as const;

interface InteractiveMapProps {
  site: SiteRow;
  rasters: RasterLayerRow[];
  /** Real field photos, drawn at their recorded coordinates. */
  geotagged: GeotaggedImageRow[];
  baseLayer: BaseLayerType;
  onSelectBaseLayer: (base: BaseLayerType) => void;
  layers: LayerState;
  /**
   * Applies a partial update to the layer state.
   *
   * A patch rather than a toggle because switching "Water Bodies" has to move
   * both child years at once. The children used to live in local state here and
   * were mirrored back with an effect, which meant two sources of truth for one
   * fact and a sync bug waiting to happen.
   */
  onLayersChange: (patch: Partial<LayerState>) => void;
}

/** Keeps the view fitted to the site boundary as it loads or the site changes. */
const MapViewController: React.FC<{
  center: [number, number];
  zoom: number;
  bounds: L.LatLngBounds | null;
}> = ({ center, zoom, bounds }) => {
  const map = useMap();
  const hasFittedRef = useRef(false);

  useEffect(() => {
    map.invalidateSize();
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [35, 35],
        maxZoom: 15,
        animate: true,
        duration: 1.2,
      });
      hasFittedRef.current = true;
    } else if (!hasFittedRef.current) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [bounds, center, zoom, map]);

  return null;
};

/**
 * Leaflet caches the container size, so entering or leaving fullscreen leaves
 * it drawing tiles for the old dimensions until it is told to re-measure.
 */
const InvalidateSizeOnFullscreen: React.FC<{ isFullscreen: boolean }> = ({ isFullscreen }) => {
  const map = useMap();
  useEffect(() => {
    // One frame after the browser has finished resizing the container.
    const id = window.setTimeout(() => map.invalidateSize(), 120);
    return () => window.clearTimeout(id);
  }, [isFullscreen, map]);
  return null;
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  site,
  rasters,
  geotagged,
  baseLayer,
  onSelectBaseLayer,
  layers,
  onLayersChange,
}) => {
  // Single source of truth: the parent owns these. "Water Bodies" is simply
  // whether either year is on, derived rather than stored.
  const water2023 = layers.water2023 ?? false;
  const water2026 = layers.water2026 ?? false;
  const waterChange = layers.waterChange ?? false;

  /** The layer_keys whose rasters actually need decoding right now. */
  const activeKeys = useMemo(() => {
    const keys: string[] = [];
    if (layers.ndvi) keys.push(LAYER_KEYS.ndvi);
    if (water2023) keys.push(LAYER_KEYS.water2023);
    if (water2026) keys.push(LAYER_KEYS.water2026);
    if (waterChange) keys.push(LAYER_KEYS.waterChange);
    if (layers.drainage) keys.push(LAYER_KEYS.drainage);
    if (layers.changeDetection) keys.push(LAYER_KEYS.changeDetection);
    return keys;
  }, [layers.ndvi, layers.drainage, layers.changeDetection, water2023, water2026, waterChange]);

  const { overlays } = useRasterOverlays(rasters, activeKeys);

  // The study-area boundary comes from the site row, not a fetched file.
  const boundaryGeoJson = site.boundary_geojson;

  const studyAreaBounds = useMemo(() => {
    if (!boundaryGeoJson) return null;
    try {
      const b = L.geoJSON(boundaryGeoJson as GeoJSON.GeoJsonObject).getBounds();
      return b.isValid() ? b : null;
    } catch {
      return null;
    }
  }, [boundaryGeoJson]);

  const center: [number, number] = [site.centre_lat, site.centre_lng];

  const containerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, usingFallback, toggle: toggleFullscreen } = useFullscreen(containerRef);

  /**
   * Translates a click in the control panel into a state patch.
   *
   * The parent row and its two children stay consistent by construction:
   * waterBodies is always recomputed from the years rather than tracked
   * separately.
   */
  const handleToggleLayer = (key: keyof LayerState) => {
    if (key === 'waterBodies') {
      const next = !(water2023 || water2026);
      onLayersChange({ water2023: next, water2026: next, waterBodies: next });
    } else if (key === 'water2023') {
      const next = !water2023;
      onLayersChange({ water2023: next, waterBodies: next || water2026 });
    } else if (key === 'water2026') {
      const next = !water2026;
      onLayersChange({ water2026: next, waterBodies: water2023 || next });
    } else if (key === 'waterChange') {
      onLayersChange({ waterChange: !waterChange });
    } else {
      onLayersChange({ [key]: !layers[key] });
    }
  };

  const combinedLayers: LayerState = {
    ...layers,
    waterBodies: water2023 || water2026,
  };

  /** Renders one decoded raster as a Leaflet overlay. */
  const overlayFor = (layerKey: string) => {
    const data = overlays[layerKey];
    const layer = findLayer(rasters, layerKey);
    if (!data || !layer) return null;
    return (
      <ImageOverlay
        key={layerKey}
        url={data.dataUrl}
        bounds={data.bounds}
        opacity={Number(layer.default_opacity)}
      />
    );
  };

  /** PNG layers skip decoding — Leaflet draws them straight from the URL. */
  const pngOverlayFor = (layerKey: string) => {
    const layer = findLayer(rasters, layerKey);
    if (!layer || layer.format !== 'png') return null;
    const bounds = rasterBounds(layer);
    if (!bounds) return null;
    return (
      <ImageOverlay
        key={layerKey}
        url={rasterUrl(layer)}
        bounds={bounds}
        opacity={Number(layer.default_opacity)}
        eventHandlers={{
          error: (e) => {
            // Same migration-window fallback as the GeoTIFF path.
            const img = (e.target as unknown as { getElement?: () => HTMLImageElement })
              ?.getElement?.();
            const fallback = rasterFallbackUrl(layer);
            if (img && img.src !== new URL(fallback, window.location.origin).href) {
              console.warn(`[InteractiveMap] ${layerKey} unavailable in Storage; using ${fallback}`);
              img.src = fallback;
            }
          },
        }}
      />
    );
  };

  const getTileUrl = () => {
    switch (baseLayer) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'terrain':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
      case 'streets':
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  const getTileAttribution = () => {
    switch (baseLayer) {
      case 'satellite':
        return '&copy; Esri, Maxar, Earthstar Geographics, GIS User Community';
      case 'terrain':
        return '&copy; Esri, HERE, Garmin, USGS, NGA, EPA';
      case 'streets':
      default:
        return '&copy; OpenStreetMap contributors';
    }
  };

  return (
    <div
      ref={containerRef}
      data-tour="map"
      className={`bg-neutral-900 overflow-hidden ${
        usingFallback
          ? // Pinned over the viewport when the native API is unavailable.
            'fixed inset-0 z-[2000] w-screen h-screen rounded-none border-0'
          : isFullscreen
          ? 'relative w-full h-screen rounded-none border-0'
          : 'relative w-full h-[520px] lg:h-[620px] rounded-3xl border border-black/10 shadow-xl'
      }`}
    >
      <button
        type="button"
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? 'Exit fullscreen map' : 'View map fullscreen'}
        title={isFullscreen ? 'Exit fullscreen (Esc)' : 'View fullscreen'}
        className="absolute top-[88px] left-3 z-[1000] w-9 h-9 rounded-xl bg-white/95 backdrop-blur-md border border-black/10 shadow-lg flex items-center justify-center text-[#183A2A] hover:bg-white hover:border-[#35624B]/40 transition-colors"
      >
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>

      {isFullscreen && (
        <div className="absolute top-[88px] left-14 z-[1000] px-2.5 py-1.5 rounded-lg bg-black/55 backdrop-blur-sm text-white text-[11px] pointer-events-none">
          Press Esc to exit
        </div>
      )}
      <MapLayerControls
        baseLayer={baseLayer}
        onSelectBaseLayer={onSelectBaseLayer}
        layers={combinedLayers}
        onToggleLayer={handleToggleLayer}
      />

      {/*
        Bottom-left stack: the legend sits directly above the site badge.
        One flex column rather than two independently positioned boxes, so the
        badge never overlaps a legend that has grown with more active layers.
        The column itself ignores pointer events; each panel takes them back.
      */}
      <div className="absolute bottom-4 left-4 z-[1000] flex flex-col items-start gap-2 pointer-events-none max-h-[calc(100%-2rem)]">
      {/* Site badge */}
      <div className="order-2 bg-white/90 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-black/10 shadow-lg pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#35624B] animate-pulse" />
          <span className="text-xs font-semibold text-[#111111] tracking-wide uppercase">
            {site.name} Study Region
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EEF5EC] text-[#35624B] font-mono">
            {formatKm2(site.area_km2)}
          </span>
        </div>
        <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
          {site.centre_lat.toFixed(4)}° N, {site.centre_lng.toFixed(4)}° E •{' '}
          {site.analysis_crs ?? site.crs}
        </div>
      </div>

      {/* Active legend */}
      {(layers.ndvi || layers.changeDetection || water2023 || water2026 || waterChange || layers.drainage) && (
        <div className="order-1 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-black/10 shadow-lg text-[11px] font-sans space-y-2 pointer-events-auto hidden sm:block w-[210px] overflow-y-auto">
          <div className="font-semibold text-neutral-900 uppercase text-[10px] tracking-wider border-b pb-1">
            Active GIS Legend
          </div>

          {layers.ndvi && (
            <div className="space-y-1">
              <div className="text-[10px] text-neutral-500 font-medium">
                {findLayer(rasters, LAYER_KEYS.ndvi)?.title ?? 'NDVI'}
              </div>
              <div
                style={{
                  width: 80,
                  height: 10,
                  background: 'linear-gradient(to right, #000000, #808080, #ffffff)',
                  borderRadius: 2,
                  display: 'block',
                }}
              />
              <div className="flex justify-between text-[10px] text-neutral-400 font-mono" style={{ width: 80 }}>
                <span>Low</span>
                <span>High</span>
              </div>
              <div className="text-[10px] text-neutral-500">Grayscale · min–max stretch</div>
            </div>
          )}

          {(water2023 || water2026) && (
            <div className="space-y-1 pt-1 border-t border-black/5">
              <div className="text-[10px] text-neutral-500 font-medium">Surface Water Masks</div>
              {water2023 && (
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-[#0EA5E9]" style={{ width: 12, height: 12, display: 'inline-block' }} />
                  <span className="text-neutral-700">
                    Water {findLayer(rasters, LAYER_KEYS.water2023)?.year_from ?? ''}
                  </span>
                </div>
              )}
              {water2026 && (
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-[#0284C7]" style={{ width: 12, height: 12, display: 'inline-block' }} />
                  <span className="text-neutral-700">
                    Water {findLayer(rasters, LAYER_KEYS.water2026)?.year_from ?? ''}
                  </span>
                </div>
              )}
            </div>
          )}

          {waterChange && (
            <div className="space-y-1 pt-1 border-t border-black/5">
              <div className="text-[10px] text-neutral-500 font-medium">Water Change</div>
              <div className="flex items-center gap-1.5">
                <span className="rounded bg-[#06B6D4]" style={{ width: 12, height: 12, display: 'inline-block' }} />
                <span className="text-neutral-700">Water Gain (+1)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="rounded bg-[#EF4444]" style={{ width: 12, height: 12, display: 'inline-block' }} />
                <span className="text-neutral-700">Water Loss (-1)</span>
              </div>
            </div>
          )}

          {layers.drainage && (
            <div className="space-y-1 pt-1 border-t border-black/5">
              <div className="text-[10px] text-neutral-500 font-medium">Drainage Flow Network</div>
              <div className="flex items-center gap-1.5">
                <span className="rounded bg-[#2563EB]" style={{ width: 12, height: 12, display: 'inline-block' }} />
                <span className="text-neutral-700">SRTM 30m Stream Channels</span>
              </div>
            </div>
          )}

          {layers.changeDetection && (
            <div className="space-y-1 pt-1 border-t border-black/5">
              <div className="text-[10px] text-neutral-500 font-medium">NDVI Change</div>
              <div className="flex items-center gap-1.5">
                <span className="rounded bg-[#22C55E]" style={{ width: 12, height: 12, display: 'inline-block' }} />
                <span className="text-neutral-700">Vegetation Gain (&gt;0)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="rounded bg-[#EF4444]" style={{ width: 12, height: 12, display: 'inline-block' }} />
                <span className="text-neutral-700">Vegetation Loss (&lt;0)</span>
              </div>
            </div>
          )}
        </div>
      )}
      </div>

      <MapContainer
        center={center}
        zoom={site.default_zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
        attributionControl={false}
      >
        <MapViewController center={center} zoom={site.default_zoom} bounds={studyAreaBounds} />
        <InvalidateSizeOnFullscreen isFullscreen={isFullscreen} />

        <TileLayer
          key={baseLayer}
          url={getTileUrl()}
          attribution={getTileAttribution()}
          maxZoom={18}
        />

        {/* Study area boundary, straight from the sites row */}
        {layers.boundary && boundaryGeoJson && (
          <GeoJSON
            key={`boundary-${site.id}`}
            data={boundaryGeoJson as GeoJSON.GeoJsonObject}
            style={() => ({
              color: '#183A2A',
              weight: 2.5,
              dashArray: '8, 6',
              fillColor: '#183A2A',
              fillOpacity: 0.04,
            })}
            onEachFeature={(_feature, layer) => {
              layer.bindPopup(`
                <div style="font-family: inherit; font-size: 12px; line-height: 1.4; padding: 2px;">
                  <div style="font-weight: 700; color: #183A2A; font-size: 13px; margin-bottom: 4px;">
                    ${site.name} Study Area
                  </div>
                  <div style="color: #374151; margin-bottom: 2px;">
                    <span style="font-weight: 600;">Analysis Extent:</span> ${formatKm2(site.area_km2)}
                  </div>
                  <div style="color: #374151; margin-bottom: 4px;">
                    <span style="font-weight: 600;">Analysis CRS:</span> ${site.analysis_crs ?? site.crs}
                  </div>
                  <div style="font-size: 11px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 4px;">
                    QGIS satellite analysis boundary
                  </div>
                </div>
              `);
            }}
          />
        )}

        {layers.ndvi && overlayFor(LAYER_KEYS.ndvi)}
        {water2023 && overlayFor(LAYER_KEYS.water2023)}
        {water2026 && overlayFor(LAYER_KEYS.water2026)}
        {waterChange && overlayFor(LAYER_KEYS.waterChange)}
        {layers.drainage && overlayFor(LAYER_KEYS.drainage)}
        {layers.changeDetection && pngOverlayFor(LAYER_KEYS.changeDetection)}

        <GeotagMapLayer images={geotagged} show={layers.observations} />
      </MapContainer>
    </div>
  );
};

export default InteractiveMap;
