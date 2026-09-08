import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { fieldObservations } from '../../data/sampleData';

interface FieldObservationsProps {
  showObservations: boolean;
}

// Category visual mapping
const categoryConfig = {
  vegetation: {
    emoji: '🌳',
    bg: '#183A2A',
    border: '#A8C5A0',
    title: 'Vegetation Assessment',
    chipColor: 'bg-emerald-100 text-emerald-800',
  },
  water: {
    emoji: '💧',
    bg: '#0284C7',
    border: '#BAE6FD',
    title: 'Water Resource Survey',
    chipColor: 'bg-sky-100 text-sky-800',
  },
  intervention: {
    emoji: '🏗',
    bg: '#D97706',
    border: '#FDE68A',
    title: 'Watershed Intervention',
    chipColor: 'bg-amber-100 text-amber-800',
  },
  degradation: {
    emoji: '⚠',
    bg: '#DC2626',
    border: '#FECACA',
    title: 'Soil Erosion & Degradation',
    chipColor: 'bg-rose-100 text-rose-800',
  },
};

const createCustomIcon = (category: 'vegetation' | 'water' | 'intervention' | 'degradation') => {
  const config = categoryConfig[category];
  return L.divIcon({
    className: 'custom-field-marker',
    html: `
      <div style="
        width: 30px;
        height: 30px;
        background-color: ${config.bg};
        border: 2px solid #FFFFFF;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.25);
        cursor: pointer;
        transition: transform 0.15s ease;
      ">
        ${config.emoji}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
  });
};

export const FieldObservations: React.FC<FieldObservationsProps> = ({ showObservations }) => {
  if (!showObservations) return null;

  return (
    <>
      {fieldObservations.map((obs) => {
        const config = categoryConfig[obs.category];
        const icon = createCustomIcon(obs.category);

        return (
          <Marker key={obs.id} position={obs.position} icon={icon}>
            <Popup>
              <div className="p-1 font-sans text-xs space-y-2 min-w-[220px]">
                {/* Header */}
                <div className="flex items-center justify-between border-b pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{config.emoji}</span>
                    <span className="font-bold text-neutral-900 tracking-tight">
                      FIELD OBSERVATION #{obs.id}
                    </span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${config.chipColor}`}>
                    {obs.status}
                  </span>
                </div>

                {/* Simulated Thumbnail */}
                <div className="w-full h-24 rounded-lg bg-gradient-to-br from-neutral-200 to-neutral-300 relative overflow-hidden flex items-center justify-center border border-black/5 shadow-inner">
                  <div className="text-center">
                    <span className="text-2xl">{config.emoji}</span>
                    <div className="text-[10px] text-neutral-600 font-medium mt-0.5">
                      Geo-tagged Imagery (30m GSD)
                    </div>
                  </div>
                  <div className="absolute bottom-1 right-1.5 bg-black/60 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                    GPS Fix: ±2.4m
                  </div>
                </div>

                {/* Metadata */}
                <div className="space-y-1 text-[11px] text-neutral-600">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Category:</span>
                    <span className="font-medium text-neutral-800">{config.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Location:</span>
                    <span className="font-medium text-neutral-800">Saswad Watershed</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Observation Date:</span>
                    <span className="font-mono text-neutral-800">{obs.date}</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[11px] text-neutral-700 bg-neutral-50 p-2 rounded-lg border border-black/5 leading-relaxed">
                  {obs.description}
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

export default FieldObservations;
