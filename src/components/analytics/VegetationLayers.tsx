import React from 'react';
import { Polygon, Popup } from 'react-leaflet';
import { vegetationZones, ndviZones } from '../../data/sampleData';

interface VegetationLayersProps {
  showTreeCover: boolean;
  showNdvi: boolean;
}

export const VegetationLayers: React.FC<VegetationLayersProps> = ({
  showTreeCover,
  showNdvi,
}) => {
  return (
    <>
      {/* 1. Tree Cover Layer */}
      {showTreeCover &&
        vegetationZones.features.map((feature, idx) => {
          const props = (feature.properties || {}) as Record<string, any>;
          const density = props.density as 'high' | 'moderate' | 'sparse';
          const coords = (feature.geometry as GeoJSON.Polygon).coordinates[0].map(
            (coord) => [coord[1], coord[0]] as [number, number]
          );

          let fillColor = '#183A2A';
          let fillOpacity = 0.65;
          if (density === 'moderate') {
            fillColor = '#35624B';
            fillOpacity = 0.5;
          } else if (density === 'sparse') {
            fillColor = '#A8C5A0';
            fillOpacity = 0.4;
          }

          return (
            <Polygon
              key={`tree-${idx}`}
              positions={coords}
              pathOptions={{
                color: fillColor,
                weight: 1.5,
                fillColor: fillColor,
                fillOpacity: fillOpacity,
              }}
            >
              <Popup>
                <div className="p-1 space-y-1 font-sans text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-[#183A2A]">
                    <span>🌳</span>
                    <span>{props.label}</span>
                  </div>
                  <div className="text-neutral-600">
                    <span className="font-medium">Canopy Density:</span>{' '}
                    <span className="capitalize font-semibold text-neutral-800">{density}</span>
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Calculated from Sentinel-2 multispectral band indices (B8/B4).
                  </div>
                </div>
              </Popup>
            </Polygon>
          );
        })}

      {/* 2. NDVI Layer */}
      {showNdvi &&
        ndviZones.features.map((feature, idx) => {
          const ndviProps = (feature.properties || {}) as Record<string, any>;
          const level = ndviProps.level as 'high' | 'moderate' | 'low';
          const ndviVal = Number(ndviProps.ndvi || 0);
          const coords = (feature.geometry as GeoJSON.Polygon).coordinates[0].map(
            (coord) => [coord[1], coord[0]] as [number, number]
          );

          let fillColor = '#22C55E';
          let fillOpacity = 0.55;
          if (level === 'moderate') {
            fillColor = '#EAB308';
            fillOpacity = 0.5;
          } else if (level === 'low') {
            fillColor = '#EF4444';
            fillOpacity = 0.45;
          }

          return (
            <Polygon
              key={`ndvi-${idx}`}
              positions={coords}
              pathOptions={{
                color: fillColor,
                weight: 2,
                dashArray: '3, 6',
                fillColor: fillColor,
                fillOpacity: fillOpacity,
              }}
            >
              <Popup>
                <div className="p-1 space-y-1 font-sans text-xs">
                  <div className="flex items-center justify-between gap-2 font-bold text-neutral-900">
                    <span>🌿 NDVI Zone #{idx + 1}</span>
                    <span className="px-1.5 py-0.5 rounded bg-neutral-100 font-mono text-[11px]">
                      {ndviVal.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-neutral-600">
                    <span className="font-medium">Classification:</span>{' '}
                    <span className="capitalize font-semibold text-neutral-800">{level} Vigour</span>
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Reflectance ratio: (NIR - Red) / (NIR + Red)
                  </div>
                </div>
              </Popup>
            </Polygon>
          );
        })}
    </>
  );
};

export default VegetationLayers;
