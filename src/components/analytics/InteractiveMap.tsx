import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, useMap, GeoJSON, ImageOverlay } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MapLayerControls from './MapLayerControls';
import type { BaseLayerType, LayerState } from './MapLayerControls';
import FieldObservations from './FieldObservations';
import {
  loadAndRenderGeoTiff,
  STREAMS_RASTER_BOUNDS,
  NDVI_CHANGE_PNG_BOUNDS,
  type RasterLayerData,
} from './geoTiffRenderer';

// Fix generic Leaflet icon URLs if default markers are ever used
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface InteractiveMapProps {
  center: [number, number];
  zoom: number;
  baseLayer: BaseLayerType;
  onSelectBaseLayer: (base: BaseLayerType) => void;
  layers: LayerState;
  onToggleLayer: (layerKey: keyof LayerState) => void;
}

// Controller component to update view when bounds, center, or zoom changes
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

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  center,
  zoom,
  baseLayer,
  onSelectBaseLayer,
  layers,
  onToggleLayer,
}) => {
  // 1. Real QGIS Study Area boundary
  const [studyAreaGeoJson, setStudyAreaGeoJson] = useState<GeoJSON.FeatureCollection | null>(null);

  // 2. Child states for Water Bodies and Water Change overlays
  const [water2023, setWater2023] = useState(true);
  const [water2026, setWater2026] = useState(true);
  const [waterChange, setWaterChange] = useState(false);

  // 3. Real GeoTIFF Raster layers
  const [ndviRaster, setNdviRaster] = useState<RasterLayerData | null>(null);
  const [waterRaster2023, setWaterRaster2023] = useState<RasterLayerData | null>(null);
  const [waterRaster2026, setWaterRaster2026] = useState<RasterLayerData | null>(null);
  const [waterChangeRaster, setWaterChangeRaster] = useState<RasterLayerData | null>(null);
  const [streamsRaster, setStreamsRaster] = useState<RasterLayerData | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch('/gis/Purandar_Saswad_Study_Area.geojson')
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load study area GeoJSON: ${res.statusText}`);
        return res.json();
      })
      .then((data: GeoJSON.FeatureCollection) => {
        if (isMounted) setStudyAreaGeoJson(data);
      })
      .catch((err) => {
        console.warn('Could not load /gis/Purandar_Saswad_Study_Area.geojson:', err);
      });

    return () => { isMounted = false; };
  }, []);

  // Synchronize when parent waterBodies state is toggled from outside (e.g. tab switches in dashboard)
  useEffect(() => {
    if (layers.waterBodies && !water2023 && !water2026) {
      setWater2023(true);
      setWater2026(true);
    } else if (!layers.waterBodies && (water2023 || water2026)) {
      setWater2023(false);
      setWater2026(false);
    }
  }, [layers.waterBodies]);

  // Compute exact bounds from real QGIS GeoJSON
  const studyAreaBounds = useMemo(() => {
    if (!studyAreaGeoJson) return null;
    try {
      const layer = L.geoJSON(studyAreaGeoJson);
      const b = layer.getBounds();
      return b.isValid() ? b : null;
    } catch {
      return null;
    }
  }, [studyAreaGeoJson]);

  // Load real GeoTIFF rasters on demand when their layer is active
  useEffect(() => {
    let active = true;

    if (layers.ndvi && !ndviRaster) {
      loadAndRenderGeoTiff('/gis/NDVI_2023_float.tif', 'ndvi')
        .then((data) => { if (active) setNdviRaster(data); })
        .catch((err) => console.error('Failed to decode NDVI_2023_float.tif:', err));
    }

    if (water2023 && !waterRaster2023) {
      loadAndRenderGeoTiff('/gis/water_mask_2023.tif', 'water_2023')
        .then((data) => { if (active) setWaterRaster2023(data); })
        .catch((err) => console.error('Failed to decode water_mask_2023.tif:', err));
    }

    if (water2026 && !waterRaster2026) {
      loadAndRenderGeoTiff('/gis/water_mask.tif', 'water_2026')
        .then((data) => { if (active) setWaterRaster2026(data); })
        .catch((err) => console.error('Failed to decode water_mask.tif:', err));
    }

    if (waterChange && !waterChangeRaster) {
      loadAndRenderGeoTiff('/gis/Water_Change_2023_2026.tif', 'water_change')
        .then((data) => { if (active) setWaterChangeRaster(data); })
        .catch((err) => console.error('Failed to decode Water_Change_2023_2026.tif:', err));
    }

    if (layers.drainage && !streamsRaster) {
      loadAndRenderGeoTiff('/gis/purandar_streams_raster.tif', 'streams', STREAMS_RASTER_BOUNDS)
        .then((data) => { if (active) setStreamsRaster(data); })
        .catch((err) => console.error('Failed to decode purandar_streams_raster.tif:', err));
    }

    return () => { active = false; };
  }, [
    layers.ndvi,
    water2023,
    water2026,
    waterChange,
    layers.drainage,
    ndviRaster,
    waterRaster2023,
    waterRaster2026,
    waterChangeRaster,
    streamsRaster,
  ]);

  // Handler for layer toggle interactions from MapLayerControls
  const handleToggleLayer = (key: keyof LayerState) => {
    if (key === 'waterBodies') {
      const willBeActive = !(water2023 || water2026);
      setWater2023(willBeActive);
      setWater2026(willBeActive);
      if (layers.waterBodies !== willBeActive) {
        onToggleLayer('waterBodies');
      }
    } else if (key === 'water2023') {
      const next2023 = !water2023;
      setWater2023(next2023);
      const nextParent = next2023 || water2026;
      if (layers.waterBodies !== nextParent) {
        onToggleLayer('waterBodies');
      }
    } else if (key === 'water2026') {
      const next2026 = !water2026;
      setWater2026(next2026);
      const nextParent = water2023 || next2026;
      if (layers.waterBodies !== nextParent) {
        onToggleLayer('waterBodies');
      }
    } else if (key === 'waterChange') {
      setWaterChange((prev) => !prev);
    } else {
      onToggleLayer(key);
    }
  };

  // Construct combined LayerState with sublayers for controls
  const combinedLayers: LayerState = {
    ...layers,
    waterBodies: water2023 || water2026,
    water2023,
    water2026,
    waterChange,
  };

  // Base layer tile URLs
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
    <div className="relative w-full h-[520px] lg:h-[620px] rounded-3xl overflow-hidden border border-black/10 shadow-xl bg-neutral-900">
      {/* Map Layer Controls Floating Panel */}
      <MapLayerControls
        baseLayer={baseLayer}
        onSelectBaseLayer={onSelectBaseLayer}
        layers={combinedLayers}
        onToggleLayer={handleToggleLayer}
      />

      {/* Floating Info Badge Bottom Left */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-black/10 shadow-lg pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#35624B] animate-pulse" />
          <span className="text-xs font-semibold text-[#111111] tracking-wide">
            PURANDAR-SASWAD STUDY REGION
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EEF5EC] text-[#35624B] font-mono">
            {studyAreaGeoJson ? '37.2 km²' : '30m GSD'}
          </span>
        </div>
        <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
          {studyAreaBounds
            ? `${studyAreaBounds.getCenter().lat.toFixed(4)}° N, ${studyAreaBounds.getCenter().lng.toFixed(4)}° E • WGS84`
            : `${center[0].toFixed(4)}° N, ${center[1].toFixed(4)}° E • WGS84`}
        </div>
      </div>

      {/* Active Legend Bottom Right */}
      {(layers.ndvi || layers.changeDetection || water2023 || water2026 || waterChange || layers.drainage) && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-black/10 shadow-lg text-[11px] font-sans space-y-2 pointer-events-auto hidden sm:block max-w-[210px]">
          <div className="font-semibold text-neutral-900 uppercase text-[10px] tracking-wider border-b pb-1">
            Active GIS Legend
          </div>

          {layers.ndvi && (
            <div className="space-y-1">
              <div className="text-[10px] text-neutral-500 font-medium">NDVI Analysis (2023)</div>
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
                  <span className="text-neutral-700">Water 2023</span>
                </div>
              )}
              {water2026 && (
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-[#0284C7]" style={{ width: 12, height: 12, display: 'inline-block' }} />
                  <span className="text-neutral-700">Water 2026</span>
                </div>
              )}
            </div>
          )}

          {waterChange && (
            <div className="space-y-1 pt-1 border-t border-black/5">
              <div className="text-[10px] text-neutral-500 font-medium">Water Change (2023–2026)</div>
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
              <div className="text-[10px] text-neutral-500 font-medium">NDVI Change (2023–2026)</div>
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

      {/* Leaflet Map */}
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
        attributionControl={false}
      >
        <MapViewController center={center} zoom={zoom} bounds={studyAreaBounds} />

        {/* Dynamic Base Tile Layer */}
        <TileLayer
          key={baseLayer}
          url={getTileUrl()}
          attribution={getTileAttribution()}
          maxZoom={18}
        />

        {/* 1. Real Study Area Boundary GeoJSON */}
        {layers.boundary && studyAreaGeoJson && (
          <GeoJSON
            key="real-study-area-boundary"
            data={studyAreaGeoJson}
            style={() => ({
              color: '#183A2A',
              weight: 2.5,
              dashArray: '8, 6',
              fillColor: '#183A2A',
              fillOpacity: 0.04,
            })}
            onEachFeature={(feature, layer) => {
              const props = (feature.properties || {}) as Record<string, any>;
              const areaKm2 = props.AREA ? (props.AREA / 1e6).toFixed(2) : '37.21';
              const widthKm = props.WIDTH ? (props.WIDTH / 1e3).toFixed(2) : '6.11';
              const heightKm = props.HEIGHT ? (props.HEIGHT / 1e3).toFixed(2) : '6.09';
              layer.bindPopup(`
                <div style="font-family: inherit; font-size: 12px; line-height: 1.4; padding: 2px;">
                  <div style="font-weight: 700; color: #183A2A; font-size: 13px; margin-bottom: 4px;">
                    📍 Purandar-Saswad Study Area
                  </div>
                  <div style="color: #374151; margin-bottom: 2px;">
                    <span style="font-weight: 600;">Analysis Extent:</span> ${areaKm2} km² (${widthKm} km × ${heightKm} km)
                  </div>
                  <div style="color: #374151; margin-bottom: 4px;">
                    <span style="font-weight: 600;">Coordinate Reference:</span> WGS 84 (EPSG:4326)
                  </div>
                  <div style="font-size: 11px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 4px;">
                    QGIS Satellite Analysis Boundary
                  </div>
                </div>
              `);
            }}
          />
        )}

        {/* 2. Real NDVI Grayscale Singleband GeoTIFF — linear min–max stretch, matching QGIS */}
        {layers.ndvi && ndviRaster && (
          <ImageOverlay
            url={ndviRaster.dataUrl}
            bounds={ndviRaster.bounds}
            opacity={0.85}
          />
        )}

        {/* 3. Real Water 2023 GeoTIFF */}
        {water2023 && waterRaster2023 && (
          <ImageOverlay
            url={waterRaster2023.dataUrl}
            bounds={waterRaster2023.bounds}
            opacity={0.9}
          />
        )}

        {/* 4. Real Water 2026 GeoTIFF */}
        {water2026 && waterRaster2026 && (
          <ImageOverlay
            url={waterRaster2026.dataUrl}
            bounds={waterRaster2026.bounds}
            opacity={0.9}
          />
        )}

        {/* 5. Real Water Change 2023–2026 GeoTIFF */}
        {waterChange && waterChangeRaster && (
          <ImageOverlay
            url={waterChangeRaster.dataUrl}
            bounds={waterChangeRaster.bounds}
            opacity={0.95}
          />
        )}

        {/* 6. Real Drainage Network Streams Raster GeoTIFF */}
        {layers.drainage && streamsRaster && (
          <ImageOverlay
            url={streamsRaster.dataUrl}
            bounds={streamsRaster.bounds}
            opacity={0.95}
          />
        )}

        {/* 7. Real NDVI Change Detection Web Overlay — DO NOT MODIFY */}
        {layers.changeDetection && (
          <ImageOverlay
            url="/gis/NDVI_Change_2023_2026.png"
            bounds={NDVI_CHANGE_PNG_BOUNDS}
            opacity={0.8}
          />
        )}

        {/* 8. Field Observations */}
        <FieldObservations showObservations={layers.observations} />
      </MapContainer>
    </div>
  );
};

export default InteractiveMap;
