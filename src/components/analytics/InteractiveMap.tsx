import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MapLayerControls from './MapLayerControls';
import type { BaseLayerType, LayerState } from './MapLayerControls';
import VegetationLayers from './VegetationLayers';
import WaterLayers from './WaterLayers';
import FieldObservations from './FieldObservations';
import ChangeDetection from './ChangeDetection';

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

// Controller component to update view when center or zoom changes
const MapViewController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
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
        layers={layers}
        onToggleLayer={onToggleLayer}
      />

      {/* Floating Info Badge Bottom Left */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-black/10 shadow-lg pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#35624B] animate-pulse" />
          <span className="text-xs font-semibold text-[#111111] tracking-wide">
            SASWAD STUDY REGION
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EEF5EC] text-[#35624B] font-mono">
            30m GSD
          </span>
        </div>
        <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
          18.3450° N, 74.0350° E • WGS84 / UTM 43N
        </div>
      </div>

      {/* Active Legend Bottom Right */}
      {(layers.treeCover || layers.ndvi || layers.changeDetection) && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-black/10 shadow-lg text-[11px] font-sans space-y-2 pointer-events-auto hidden sm:block max-w-[200px]">
          <div className="font-semibold text-neutral-900 uppercase text-[10px] tracking-wider border-b pb-1">
            Active Legend
          </div>

          {layers.treeCover && (
            <div className="space-y-1">
              <div className="text-[10px] text-neutral-500 font-medium">Tree Canopy Density</div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#183A2A]" />
                <span className="text-neutral-700">High Density (&gt;60%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#35624B]" />
                <span className="text-neutral-700">Moderate (30-60%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#A8C5A0]" />
                <span className="text-neutral-700">Sparse Scrub (&lt;30%)</span>
              </div>
            </div>
          )}

          {layers.ndvi && (
            <div className="space-y-1 pt-1 border-t border-black/5">
              <div className="text-[10px] text-neutral-500 font-medium">NDVI Index Vigour</div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#22C55E]" />
                <span className="text-neutral-700">High (&gt;0.60)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#EAB308]" />
                <span className="text-neutral-700">Moderate (0.40-0.60)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#EF4444]" />
                <span className="text-neutral-700">Low/Bare (&lt;0.40)</span>
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
        <MapViewController center={center} zoom={zoom} />

        {/* Dynamic Base Tile Layer */}
        <TileLayer
          key={baseLayer}
          url={getTileUrl()}
          attribution={getTileAttribution()}
          maxZoom={18}
        />

        {/* Overlay Layers */}
        <WaterLayers
          showWaterBodies={layers.waterBodies}
          showDrainage={layers.drainage}
          showBoundary={layers.boundary}
        />

        <VegetationLayers
          showTreeCover={layers.treeCover}
          showNdvi={layers.ndvi}
        />

        <ChangeDetection showChangeDetection={layers.changeDetection} />

        <FieldObservations showObservations={layers.observations} />
      </MapContainer>
    </div>
  );
};

export default InteractiveMap;
