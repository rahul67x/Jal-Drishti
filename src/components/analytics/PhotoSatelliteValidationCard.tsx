import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, ChevronRight, Layers, Eye, RefreshCw } from 'lucide-react';
import type { GeotaggedImageRow, RasterLayerRow, SiteMetricsRow } from '../../lib/database.types';
import { usePhotoAnalysis } from '../../features/geotag/usePhotoAnalysis';
import { geotagThumbUrl } from '../../features/geotag/api';
import { formatLatLng } from '../../lib/format';

interface PhotoSatelliteValidationCardProps {
  geotagged?: GeotaggedImageRow[];
  metrics?: SiteMetricsRow | null;
  rasters?: RasterLayerRow[];
}

export const PhotoSatelliteValidationCard: React.FC<PhotoSatelliteValidationCardProps> = ({
  geotagged = [],
  metrics,
  rasters = [],
}) => {
  const analysis = usePhotoAnalysis(geotagged, metrics, rasters);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const selectedResult = analysis.results.find((r) => r.photoId === selectedPhotoId);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="p-6 rounded-[28px] bg-white border border-slate-200/70 shadow-sm space-y-6">
      {/* Top Header & Gauge Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-slate-100">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#EEF5EC] text-[#35624B] flex items-center justify-center shrink-0 border border-[#35624B]/10 shadow-xs">
            <ShieldCheck className="w-5 h-5 text-[#35624B]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 font-serif-display tracking-tight">
                Automated Field-Photo &amp; Satellite Validation
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Automated Audit Active
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed mt-0.5">
              Cross-references geotagged field photo visual features against underlying multi-spectral
              satellite rasters at exact coordinates to ground-truth satellite predictions.
            </p>
          </div>
        </div>

        {/* Alignment Gauge Badge */}
        <div className="flex items-center gap-4 p-3.5 px-4 rounded-2xl bg-[#F0FDF4] border border-emerald-200/80 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-[#10B981] text-white text-lg font-extrabold flex items-center justify-center shadow-xs font-mono">
            {analysis.alignmentIndexPct}%
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-800">
              Ground-Truth Alignment Index
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-bold text-emerald-950">
                {analysis.verifiedCount + analysis.subpixelFlagsCount} / {analysis.positionedPhotos} Photos Verified
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 text-[10px] font-extrabold">
                {analysis.alignmentGrade} Grade
              </span>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            title="Re-run ground truth audit"
            className="p-2 rounded-xl hover:bg-emerald-100 text-emerald-700 transition-colors ml-1"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Results Table / Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-[11px] uppercase font-bold tracking-wider text-slate-400">
          <span>Field Photo Spatial Pairs ({analysis.results.length})</span>
          <span>Click pair for pixel spatial query</span>
        </div>

        {analysis.results.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
            No geotagged field photos uploaded yet. Upload field photos to trigger automated spatial cross-validation.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {analysis.results.map((res) => {
              const photo = geotagged.find((g) => g.id === res.photoId);
              if (!photo) return null;

              const isVerified = res.verdict === 'verified';
              const isSubpixel = res.verdict === 'subpixel_flag';
              const isUnpositioned = res.verdict === 'unpositioned';

              let badgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-200';
              if (isSubpixel) {
                badgeBg = 'bg-amber-100 text-amber-800 border-amber-200';
              } else if (isUnpositioned) {
                badgeBg = 'bg-slate-100 text-slate-600 border-slate-200';
              }

              return (
                <div
                  key={res.photoId}
                  onClick={() => setSelectedPhotoId(selectedPhotoId === res.photoId ? null : res.photoId)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
                    selectedPhotoId === res.photoId
                      ? 'bg-slate-50 border-[#35624B] ring-2 ring-[#35624B]/20'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={geotagThumbUrl(photo)}
                      alt={res.title}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 truncate">{res.title}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${badgeBg}`}>
                          {isVerified ? 'Verified' : isSubpixel ? 'Sub-pixel' : 'Unpositioned'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 font-mono">
                        {res.lat !== null && res.lng !== null
                          ? formatLatLng(res.lat, res.lng, 3)
                          : 'No GPS Location'}
                      </div>

                      <div className="text-[11px] text-slate-700 font-medium truncate">
                        Visual: {res.visualFeatures.primaryVisualTag}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-[#35624B]" />
                      <span>{res.satelliteRasterMatch.layerName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[#35624B] font-semibold">
                      <Eye className="w-3 h-3" />
                      <span>{res.satelliteRasterMatch.alignmentPct}% Match</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Spatial Correlation Popover Details */}
      {selectedResult && (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-[#35624B]" />
              <span>Spatial Cross-Validation Details for "{selectedResult.title}"</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Photo ID: {selectedResult.photoId.slice(0, 8)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white border border-slate-200/60">
              <div className="text-[10px] uppercase font-bold text-slate-400">Computer Vision Feature</div>
              <div className="font-semibold text-slate-900 mt-1">{selectedResult.visualFeatures.primaryVisualTag}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                Green: {selectedResult.visualFeatures.greennessPct}% · Water: {selectedResult.visualFeatures.waterReflectancePct}%
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200/60">
              <div className="text-[10px] uppercase font-bold text-slate-400">Satellite Pixel at (Lat, Lng)</div>
              <div className="font-semibold text-slate-900 mt-1">
                Estimated NDVI: {selectedResult.satelliteRasterMatch.estimatedNdvi}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Mask: {selectedResult.satelliteRasterMatch.waterMaskStatus}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200/60">
              <div className="text-[10px] uppercase font-bold text-slate-400">Ground-Truth Verdict</div>
              <div className="font-semibold text-emerald-800 mt-1">{selectedResult.verdictTitle}</div>
              <div className="text-[11px] text-slate-600 mt-1 leading-normal">
                {selectedResult.verdictDescription}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
