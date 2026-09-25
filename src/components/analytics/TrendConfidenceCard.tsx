import React from 'react';
import { TrendingUp, ShieldCheck, Image, Satellite, Leaf, ChevronRight } from 'lucide-react';
import type { SiteMetricsRow, GeotaggedImageRow, SatelliteImageRow, RasterLayerRow } from '../../lib/database.types';
import { calculateSiteConfidence } from '../../features/insights/confidence';
import { geotagThumbUrl } from '../../features/geotag/api';

interface TrendConfidenceCardProps {
  metrics?: SiteMetricsRow | null;
  geotagged?: GeotaggedImageRow[];
  satelliteScenes?: SatelliteImageRow[];
  rasters?: RasterLayerRow[];
}

export const TrendConfidenceCard: React.FC<TrendConfidenceCardProps> = ({
  metrics,
  geotagged = [],
  satelliteScenes = [],
  rasters = [],
}) => {
  const confidence = calculateSiteConfidence(metrics, geotagged, satelliteScenes, rasters);

  return (
    <div className="p-6 rounded-[28px] bg-slate-50/90 border border-slate-200/70 shadow-sm space-y-5">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/60 shadow-xs">
            <TrendingUp className="w-5 h-5 text-slate-800" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-serif-display tracking-tight">
              {confidence.claimTitle}
            </h3>
            <p className="text-xs text-slate-500 max-w-xl leading-relaxed mt-0.5">
              {confidence.claimSubtitle}
            </p>
          </div>
        </div>

        {/* Confidence Score Pill Badge */}
        <div className="self-start sm:self-auto flex items-center gap-3 p-3 px-4 rounded-2xl bg-[#ECFDF5] border border-emerald-200/70 shadow-2xs">
          <div className="w-9 h-9 rounded-full bg-[#10B981] text-white flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-800">
              Confidence Score
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xl font-extrabold font-mono text-emerald-950">
                {confidence.scorePct}%
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-bold">
                {confidence.level}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-emerald-600 ml-1" />
        </div>
      </div>

      {/* Inner "Evidence Behind This Claim" Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/60 shadow-xs">
        <div className="text-[11px] uppercase font-bold tracking-widest text-slate-400 mb-4">
          Evidence Behind This Claim
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* Column 1: Field Photos */}
          <div className="space-y-3 pt-2 md:pt-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Image className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Field Photos</div>
                <div className="text-[11px] text-slate-500">
                  {confidence.fieldPhotosCount} photo{confidence.fieldPhotosCount === 1 ? '' : 's'}{' '}
                  <span className="text-slate-400">(across {confidence.seasonsCount} season{confidence.seasonsCount === 1 ? '' : 's'})</span>
                </div>
              </div>
            </div>

            {/* Field Photo Thumbnails */}
            <div className="flex items-center gap-2 pt-1">
              {geotagged.slice(0, 4).map((photo) => (
                <img
                  key={photo.id}
                  src={geotagThumbUrl(photo)}
                  alt={photo.title}
                  className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-2xs"
                />
              ))}
              {geotagged.length > 4 && (
                <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center border border-slate-200">
                  +{geotagged.length - 4}
                </div>
              )}
              {geotagged.length === 0 && (
                <div className="text-xs text-slate-400 italic font-mono py-1">No field photos uploaded</div>
              )}
            </div>
          </div>

          {/* Column 2: Satellite Passes */}
          <div className="space-y-3 pt-4 md:pt-0 md:pl-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                <Satellite className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Satellite Passes</div>
                <div className="text-[11px] text-slate-500">
                  {confidence.satellitePassesCount} passes{' '}
                  <span className="text-slate-400">
                    ({confidence.crossCheckVerified ? 'consistent trend' : 'variable passes'})
                  </span>
                </div>
              </div>
            </div>

            {/* Satellite Pass Heatmap Stack Previews */}
            <div className="flex items-center gap-2 pt-1">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600 via-yellow-500 to-amber-700 border border-slate-200 shadow-2xs" />
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 via-green-400 to-amber-600 border border-slate-200 shadow-2xs" />
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-700 via-yellow-400 to-rose-600 border border-slate-200 shadow-2xs" />
            </div>
          </div>

          {/* Column 3: NDVI Trend */}
          <div className="space-y-3 pt-4 md:pt-0 md:pl-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Leaf className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">NDVI Trend</div>
                <div className="text-[11px] font-semibold text-emerald-700">
                  {confidence.trendDirectionText}{' '}
                  <span className="font-mono text-slate-600">({confidence.trendDeltaText})</span>
                </div>
              </div>
            </div>

            {/* Mini Sparkline Vector Graph */}
            <div className="pt-1">
              <svg className="w-full h-9" viewBox="0 0 120 30" fill="none">
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 22 Q 30 18, 50 20 T 90 10 T 120 4 L 120 30 L 0 30 Z"
                  fill="url(#trendGradient)"
                />
                <path
                  d="M0 22 Q 30 18, 50 20 T 90 10 T 120 4"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="0" cy="22" r="3" fill="#10B981" />
                <circle cx="50" cy="20" r="3" fill="#10B981" />
                <circle cx="90" cy="10" r="3" fill="#10B981" />
                <circle cx="120" cy="4" r="3" fill="#10B981" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
