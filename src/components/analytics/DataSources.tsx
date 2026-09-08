import React from 'react';
import { Database, Satellite, Compass, Layers, ShieldCheck } from 'lucide-react';

export const DataSources: React.FC = () => {
  const sources = [
    { label: 'Geo-tagged Field Observations', icon: Database, detail: 'Mobile app synced, ±2.4m GPS accuracy' },
    { label: 'Satellite Imagery', icon: Satellite, detail: 'Sentinel-2 (10m) & Landsat-8/9 OLI/TIRS' },
    { label: 'Remote Sensing Analysis', icon: Compass, detail: 'Automated NDVI, NDWI & SAVI spectral indices' },
    { label: 'GIS Spatial Layers', icon: Layers, detail: 'SRTM DEM 30m, hydrologic flow accumulation' },
    { label: 'SRISHTI-DRISHTI Compatible Framework', icon: ShieldCheck, detail: 'Compliant with national watershed standards' },
  ];

  return (
    <div className="p-6 rounded-3xl bg-neutral-50/80 border border-black/5">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] uppercase font-bold tracking-widest text-[#6F6F6F]">
          GEOSPATIAL DATA INFRASTRUCTURE &amp; COMPATIBILITY
        </div>
        <div className="text-[10px] px-2 py-0.5 rounded bg-emerald-100/70 text-emerald-800 font-mono">
          ISO 19115 GIS Standard
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {sources.map((src, i) => {
          const Icon = src.icon;
          return (
            <div key={i} className="p-3.5 rounded-2xl bg-white border border-black/5 shadow-xs">
              <div className="w-7 h-7 rounded-lg bg-[#EEF5EC] text-[#35624B] flex items-center justify-center mb-2">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs font-semibold text-neutral-900 leading-snug">{src.label}</div>
              <div className="text-[11px] text-neutral-500 mt-1 leading-normal">{src.detail}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DataSources;
