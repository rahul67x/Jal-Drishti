import React from 'react';
import { Crosshair, Mountain, Leaf, Droplets, Compass, MapPin, X } from 'lucide-react';
import type { SiteRow, SiteMetricsRow, RasterLayerRow } from '../../lib/database.types';
import { queryPixelStackAtCoordinate, type PixelInspectionResult } from '../../features/map/pixelInspectorEngine';

interface PixelInspectorProps {
  site: SiteRow;
  metrics?: SiteMetricsRow | null;
  rasters?: RasterLayerRow[];
  activeCoordinate?: [number, number] | null;
  onClose?: () => void;
}

export const PixelInspector: React.FC<PixelInspectorProps> = ({
  site,
  metrics,
  rasters = [],
  activeCoordinate,
  onClose,
}) => {
  const coord: [number, number] = activeCoordinate ?? [site.centre_lat, site.centre_lng];

  const result: PixelInspectionResult = queryPixelStackAtCoordinate(
    coord[0],
    coord[1],
    site,
    metrics,
    rasters
  );

  return (
    <div className="p-5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-xl space-y-4 max-w-sm w-full font-sans text-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#EEF5EC] text-[#35624B] flex items-center justify-center font-bold">
            <Crosshair className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900">Map Pixel Inspector</div>
            <div className="text-[10px] text-slate-400 font-mono">Cross-Layer Point Query</div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Coordinate & Elevation Bar */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 font-mono text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-800">
          <MapPin className="w-3.5 h-3.5 text-[#35624B]" />
          <span>{result.lat}° N, {result.lng}° E</span>
        </div>
        <div className="flex items-center gap-1 text-slate-600">
          <Mountain className="w-3.5 h-3.5 text-amber-600" />
          <span>{result.elevationMeters}m DEM</span>
        </div>
      </div>

      {/* Multi-Layer Pixel Values Stack */}
      <div className="space-y-2">
        <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60 space-y-1">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-950">
              <Leaf className="w-3 h-3 text-emerald-600" /> NDVI Spectral Index
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${result.ndviDelta >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
              {result.ndviDelta >= 0 ? '+' : ''}{result.ndviDelta}%
            </span>
          </div>
          <div className="flex justify-between text-[11px] font-mono text-emerald-900">
            <span>2023: {result.ndvi2023}</span>
            <span>2026: {result.ndvi2026}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200/60 space-y-1">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[11px] font-bold text-sky-950">
              <Droplets className="w-3 h-3 text-sky-600" /> Surface Water Mask
            </span>
            <span className="text-[10px] font-bold text-sky-800 font-mono">
              {result.waterChangeClass}
            </span>
          </div>
          <div className="flex justify-between text-[11px] text-sky-900 font-mono">
            <span>2023: {result.waterMask2023}</span>
            <span>2026: {result.waterMask2026}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1">
          <div className="flex justify-between text-[11px] text-slate-700">
            <span className="flex items-center gap-1 font-semibold">
              <Compass className="w-3 h-3 text-amber-600" /> Stream Network:
            </span>
            <span className="font-mono text-slate-900 font-bold">{result.streamOrder}</span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-700 pt-1 border-t border-slate-200/60">
            <span className="font-semibold">Land Cover Class:</span>
            <span className="font-bold text-slate-900">{result.landcoverClass}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
