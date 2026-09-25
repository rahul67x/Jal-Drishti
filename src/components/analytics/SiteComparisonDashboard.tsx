import React from 'react';
import { BarChart3, Star, MapPin, ExternalLink, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { SiteRow, SiteMetricsRow } from '../../lib/database.types';
import { calculateSiteComparisonBenchmark } from '../../features/sites/siteComparisonEngine';

interface SiteComparisonDashboardProps {
  sites?: SiteRow[];
  activeMetrics?: SiteMetricsRow | null;
}

export const SiteComparisonDashboard: React.FC<SiteComparisonDashboardProps> = ({
  sites = [],
  activeMetrics,
}) => {
  const navigate = useNavigate();
  const benchmarks = calculateSiteComparisonBenchmark(sites, activeMetrics);

  return (
    <div className="p-6 rounded-[28px] bg-white border border-slate-200/70 shadow-sm space-y-5">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/60 shadow-xs">
            <BarChart3 className="w-5 h-5 text-amber-800" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-serif-display tracking-tight">
              Regional Multi-Site Benchmark &amp; Comparison
            </h3>
            <p className="text-xs text-slate-500">
              Compares watershed study regions side-by-side on Health Grade, Vegetation Trend, and Confidence Score.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
          <span>{benchmarks.length} Study Regions Registered</span>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-sans border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <th className="p-3 text-left font-bold">Watershed Study Area</th>
              <th className="p-3 text-center font-bold">Health Grade</th>
              <th className="p-3 text-right font-bold">Extent (km²)</th>
              <th className="p-3 text-right font-bold">Vegetation (ha)</th>
              <th className="p-3 text-right font-bold">Veg Trend</th>
              <th className="p-3 text-right font-bold">Water (ha)</th>
              <th className="p-3 text-center font-bold">Confidence</th>
              <th className="p-3 text-center font-bold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {benchmarks.map((b) => (
              <tr key={b.siteId} className="hover:bg-slate-50/70 transition-colors">
                <td className="p-3">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#35624B]" />
                    <span>{b.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">{b.state ?? 'Maharashtra, India'}</div>
                </td>
                <td className="p-3 text-center">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold">
                    <span>Grade {b.overallGrade}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="font-mono text-[10px]">{b.starRating}</span>
                  </div>
                </td>
                <td className="p-3 text-right font-mono text-slate-800 font-medium">
                  {b.areaKm2} km²
                </td>
                <td className="p-3 text-right font-mono text-slate-800 font-medium">
                  {b.vegetationHa} ha
                </td>
                <td className="p-3 text-right font-mono font-bold">
                  <span className={b.vegetationChangePct >= 0 ? 'text-emerald-700' : 'text-slate-600'}>
                    {b.vegetationChangePct >= 0 ? '+' : ''}{b.vegetationChangePct}%
                  </span>
                </td>
                <td className="p-3 text-right font-mono text-slate-800 font-medium">
                  {b.waterHa} ha
                </td>
                <td className="p-3 text-center font-mono">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    {b.confidenceScorePct}%
                  </span>
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => navigate(`/sites/${b.slug}`)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#183A2A] hover:underline"
                  >
                    <span>View Workspace</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
