import React from 'react';
import { Polygon, Popup } from 'react-leaflet';
import { changeDetectionZones, changeStats } from '../../data/sampleData';

interface ChangeDetectionProps {
  showChangeDetection: boolean;
}

export const ChangeDetection: React.FC<ChangeDetectionProps> = ({ showChangeDetection }) => {
  if (!showChangeDetection) return null;

  return (
    <>
      {changeDetectionZones.features.map((feature, idx) => {
        const props = (feature.properties || {}) as Record<string, any>;
        const changeType = props.change as
          | 'vegetation_gain'
          | 'vegetation_loss'
          | 'water_increase';
        const coords = (feature.geometry as GeoJSON.Polygon).coordinates[0].map(
          (coord) => [coord[1], coord[0]] as [number, number]
        );

        let color = '#22C55E';
        let fillColor = '#22C55E';
        let changeTitle = 'Vegetation Gain';
        let changeDesc = 'Positive biomass accretion & afforestation.';

        if (changeType === 'vegetation_loss') {
          color = '#EF4444';
          fillColor = '#EF4444';
          changeTitle = 'Vegetation Loss';
          changeDesc = 'Canopy thinning or seasonal scrub clearance.';
        } else if (changeType === 'water_increase') {
          color = '#3B82F6';
          fillColor = '#3B82F6';
          changeTitle = 'Water Surface Expansion';
          changeDesc = 'New ponding area behind newly installed check dam.';
        }

        return (
          <Polygon
            key={`change-${idx}`}
            positions={coords}
            pathOptions={{
              color,
              weight: 2,
              fillColor,
              fillOpacity: 0.55,
            }}
          >
            <Popup>
              <div className="p-1 font-sans text-xs space-y-1">
                <div className="font-bold flex items-center justify-between gap-2" style={{ color }}>
                  <span>{props.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 uppercase">
                    {changeType.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-neutral-700 font-medium">{changeTitle}</div>
                <p className="text-[11px] text-neutral-500 leading-normal">{changeDesc}</p>
                <div className="pt-1 border-t text-[10px] text-neutral-400">
                  Multitemporal pixel delta (2021 vs 2026)
                </div>
              </div>
            </Popup>
          </Polygon>
        );
      })}
    </>
  );
};

export const ChangeDetectionBanner: React.FC = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-white/90 backdrop-blur-md rounded-2xl border border-black/8 text-xs shadow-sm">
      <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/50">
        <div className="flex items-center gap-1.5 text-emerald-800 font-medium text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Vegetation Gain
        </div>
        <div className="text-xl font-serif-display font-bold text-emerald-950 mt-1">
          {changeStats.vegetationGain}
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/50">
        <div className="flex items-center gap-1.5 text-rose-800 font-medium text-[11px]">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          Vegetation Loss
        </div>
        <div className="text-xl font-serif-display font-bold text-rose-950 mt-1">
          {changeStats.vegetationLoss}
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200/50">
        <div className="flex items-center gap-1.5 text-sky-800 font-medium text-[11px]">
          <span className="w-2 h-2 rounded-full bg-sky-500" />
          Water Coverage
        </div>
        <div className="text-xl font-serif-display font-bold text-sky-950 mt-1">
          {changeStats.waterCoverage}
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/50">
        <div className="flex items-center gap-1.5 text-amber-800 font-medium text-[11px]">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          Restored Land
        </div>
        <div className="text-xl font-serif-display font-bold text-amber-950 mt-1">
          {changeStats.restoredLand}
        </div>
      </div>
    </div>
  );
};

export default ChangeDetection;
