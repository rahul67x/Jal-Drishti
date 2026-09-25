import React from 'react';
import { FileText, Sparkles, MapPin, ChevronRight, Star, Droplets, Leaf, AlertTriangle } from 'lucide-react';
import type { SiteRow, SiteMetricsRow, GeotaggedImageRow, SatelliteImageRow } from '../../lib/database.types';
import { calculateWatershedReportCard } from '../../features/insights/reportCard';
import { geotagThumbUrl } from '../../features/geotag/api';

interface WatershedHealthReportCardProps {
  site: SiteRow;
  metrics?: SiteMetricsRow | null;
  geotagged?: GeotaggedImageRow[];
  satelliteScenes?: SatelliteImageRow[];
}

export const WatershedHealthReportCard: React.FC<WatershedHealthReportCardProps> = ({
  site,
  metrics,
  geotagged = [],
  satelliteScenes = [],
}) => {
  const cardData = calculateWatershedReportCard(site, metrics, geotagged, satelliteScenes);

  const heroImage = geotagged[0]
    ? geotagThumbUrl(geotagged[0])
    : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="p-6 rounded-[28px] bg-white border border-slate-200/70 shadow-sm space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 border border-sky-100 shadow-xs">
            <FileText className="w-5 h-5 text-sky-800" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-serif-display tracking-tight">
              Watershed Health Report Card
            </h3>
            <p className="text-xs text-slate-500">
              AI-powered assessment of overall site health
            </p>
          </div>
        </div>

        {/* Site Pill */}
        <div className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/60 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors">
          <MapPin className="w-3.5 h-3.5 text-slate-500" />
          <span>{cardData.siteCode} — {cardData.siteName}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Hero Photo (4 cols) */}
        <div className="lg:col-span-4 relative h-64 lg:h-auto min-h-[220px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm group">
          <img
            src={heroImage}
            alt={site.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white font-mono text-[11px] shadow-sm">
            <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>{cardData.coordinatesText}</span>
          </div>
        </div>

        {/* Right Section (8 cols) */}
        <div className="lg:col-span-8 space-y-5 flex flex-col justify-between">
          {/* Top Rating & AI Summary Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Grade Circle & Stars (5 cols) */}
            <div className="md:col-span-5 flex items-center gap-4 p-4 rounded-2xl bg-slate-50/70 border border-slate-200/50">
              <div className="w-16 h-16 rounded-full bg-[#D1FAE5] text-[#065F46] text-3xl font-extrabold flex items-center justify-center shrink-0 shadow-inner">
                {cardData.overallGrade}
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Overall Health Grade
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-extrabold text-slate-900 font-serif-display">
                    {cardData.overallGrade}
                  </span>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-slate-700 font-mono">
                      {cardData.starRating} / 5
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Summary Box (7 cols) */}
            <div className="md:col-span-7 p-4 rounded-2xl bg-[#F0FDF4]/70 border border-emerald-100 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>AI Summary</span>
              </div>
              <p className="text-[11px] text-emerald-950 leading-relaxed font-sans">
                {cardData.aiSummaryParagraph}
              </p>
            </div>
          </div>

          {/* Component Scores (3 columns) */}
          <div>
            <div className="text-[11px] uppercase font-bold tracking-widest text-slate-400 mb-2.5">
              Component Scores
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {cardData.componentScores.map((comp) => {
                const Icon = comp.key === 'vegetation' ? Leaf : comp.key === 'water' ? Droplets : AlertTriangle;

                return (
                  <div key={comp.key} className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-7 h-7 rounded-lg ${comp.iconBgClass} ${comp.iconTextClass} flex items-center justify-center shrink-0`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {comp.title}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${comp.badgeBgClass} ${comp.badgeTextClass}`}>
                        {comp.grade}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${comp.barColorClass}`}
                        style={{ width: `${comp.score}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                      <span>{comp.statusText}</span>
                      <span className="font-bold text-slate-700">{comp.score} / 100</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Status Banner */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-semibold ${cardData.statusColorClass}`}>
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 shrink-0" />
              <span>{cardData.statusLabel}</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-70" />
          </div>
        </div>
      </div>
    </div>
  );
};
