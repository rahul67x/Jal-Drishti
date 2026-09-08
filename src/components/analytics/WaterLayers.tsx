import React from 'react';
import { CircleMarker, Polyline, Polygon, Popup } from 'react-leaflet';
import { waterBodies, drainageNetwork, watershedBoundary } from '../../data/sampleData';

interface WaterLayersProps {
  showWaterBodies: boolean;
  showDrainage: boolean;
  showBoundary: boolean;
}

export const WaterLayers: React.FC<WaterLayersProps> = ({
  showWaterBodies,
  showDrainage,
  showBoundary,
}) => {
  const boundaryCoords = (watershedBoundary.geometry as GeoJSON.Polygon).coordinates[0].map(
    (coord) => [coord[1], coord[0]] as [number, number]
  );

  return (
    <>
      {/* 1. Watershed Boundary */}
      {showBoundary && (
        <Polygon
          positions={boundaryCoords}
          pathOptions={{
            color: '#183A2A',
            weight: 2.5,
            dashArray: '8, 6',
            fillColor: '#183A2A',
            fillOpacity: 0.04,
          }}
        >
          <Popup>
            <div className="p-1 font-sans text-xs space-y-1">
              <div className="font-bold text-[#183A2A] text-sm">
                📍 {watershedBoundary.properties?.name || 'Watershed Boundary'}
              </div>
              <div className="text-neutral-600">
                <span className="font-medium">Hydrological Extent:</span>{' '}
                {watershedBoundary.properties?.area || '142.6 km²'}
              </div>
              <div className="text-[11px] text-neutral-500">
                Delineated using SRTM 30m Digital Elevation Model (DEM) and flow accumulation algorithms.
              </div>
            </div>
          </Popup>
        </Polygon>
      )}

      {/* 2. Drainage Network */}
      {showDrainage &&
        drainageNetwork.features.map((feature, idx) => {
          const props = (feature.properties || {}) as Record<string, any>;
          const order = props.order as 'primary' | 'secondary' | 'channel';
          const coords = (feature.geometry as GeoJSON.LineString).coordinates.map(
            (coord) => [coord[1], coord[0]] as [number, number]
          );

          let color = '#2563EB';
          let weight = 4;
          let opacity = 0.85;

          if (order === 'secondary') {
            color = '#3B82F6';
            weight = 2.5;
            opacity = 0.75;
          } else if (order === 'channel') {
            color = '#60A5FA';
            weight = 1.8;
            opacity = 0.65;
          }

          return (
            <Polyline
              key={`drainage-${idx}`}
              positions={coords}
              pathOptions={{
                color,
                weight,
                opacity,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            >
              <Popup>
                <div className="p-1 font-sans text-xs space-y-1">
                  <div className="font-bold text-blue-900 flex items-center gap-1">
                    <span>〰️</span>
                    <span>{props.name}</span>
                  </div>
                  <div className="text-neutral-600">
                    <span className="font-medium">Classification:</span>{' '}
                    <span className="capitalize font-semibold text-neutral-800">{order} Channel</span>
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Natural gravity-fed runoff pathway towards the main river basin.
                  </div>
                </div>
              </Popup>
            </Polyline>
          );
        })}

      {/* 3. Water Bodies */}
      {showWaterBodies &&
        waterBodies.map((body) => {
          let radius = 9;
          let fillColor = '#4D8FA8';

          if (body.type === 'Minor Reservoir') {
            radius = 13;
            fillColor = '#0284C7';
          } else if (body.type === 'Check Dam') {
            radius = 8;
            fillColor = '#0D9488';
          }

          return (
            <CircleMarker
              key={body.id}
              center={body.position}
              radius={radius}
              pathOptions={{
                color: '#FFFFFF',
                weight: 2,
                fillColor,
                fillOpacity: 0.9,
              }}
            >
              <Popup>
                <div className="p-1 font-sans text-xs space-y-1.5 min-w-[190px]">
                  <div className="flex items-center justify-between border-b pb-1">
                    <span className="font-mono font-bold text-blue-700">{body.id}</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      {body.status}
                    </span>
                  </div>
                  <div className="font-semibold text-neutral-900 text-sm">{body.name}</div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-neutral-600 bg-neutral-50 p-1.5 rounded-lg">
                    <div>
                      <div className="text-neutral-400">Type</div>
                      <div className="font-medium text-neutral-800">{body.type}</div>
                    </div>
                    <div>
                      <div className="text-neutral-400">Storage</div>
                      <div className="font-medium text-neutral-800">{body.storage}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-neutral-500 pt-0.5">
                    Satellite radar detected surface water contour.
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
    </>
  );
};

export default WaterLayers;
