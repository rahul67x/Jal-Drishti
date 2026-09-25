import React, { useState } from 'react';
import { Target, MapPin, CheckCircle2, Award } from 'lucide-react';
import type { GeotaggedImageRow, SiteMetricsRow } from '../../lib/database.types';
import { analyzeAllInterventions } from '../../features/interventions/impactBufferEngine';

interface InterventionImpactToolProps {
  geotagged?: GeotaggedImageRow[];
  metrics?: SiteMetricsRow | null;
}

export const InterventionImpactTool: React.FC<InterventionImpactToolProps> = ({
  geotagged = [],
  metrics,
}) => {
  const interventions = analyzeAllInterventions(geotagged, metrics);
  const [selectedId, setSelectedId] = useState<string | null>(
    interventions[0]?.interventionId ?? null
  );

  const activeIntervention = interventions.find((i) => i.interventionId === selectedId) ?? interventions[0];

  if (interventions.length === 0) {
    return (
      <div className="p-6 rounded-[28px] bg-white border border-slate-200/70 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#EEF5EC] text-[#35624B] flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-serif-display">
              Intervention Structure Impact Buffer Tool
            </h3>
            <p className="text-xs text-slate-500">
              Measures localized vegetation growth (ΔNDVI) within 100m, 250m, and 500m radii.
            </p>
          </div>
        </div>
        <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
          No intervention structures tagged yet. Tag a field photo as "Intervention" to calculate buffer rings.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-[28px] bg-white border border-slate-200/70 shadow-sm space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#EEF5EC] text-[#35624B] flex items-center justify-center shrink-0 border border-[#35624B]/10 shadow-xs">
            <Target className="w-5 h-5 text-[#35624B]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 font-serif-display tracking-tight">
                Intervention Impact Buffer Tool
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                Outcome Evaluator
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mt-0.5 max-w-xl">
              Evaluates localized vegetation growth ($\Delta NDVI$) and water retention across 100m, 250m, and 500m influence zones.
            </p>
          </div>
        </div>

        {/* Structure Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Select Structure:</span>
          <select
            value={activeIntervention?.interventionId ?? ''}
            onChange={(e) => setSelectedId(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#35624B]"
          >
            {interventions.map((item) => (
              <option key={item.interventionId} value={item.interventionId}>
                {item.title} ({item.structureType})
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeIntervention && (
        <div className="space-y-5">
          {/* Active Structure Headline */}
          <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-emerald-950">{activeIntervention.title}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {activeIntervention.structureType}
                </span>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                {activeIntervention.overallVerdict}
              </p>
              <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-700">
                <MapPin className="w-3 h-3" />
                <span>{activeIntervention.lat.toFixed(4)}° N, {activeIntervention.lng.toFixed(4)}° E</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-emerald-200 shadow-2xs shrink-0">
              <Award className="w-8 h-8 text-emerald-600" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Effectiveness Score</div>
                <div className="text-lg font-extrabold text-emerald-950 font-mono">
                  {activeIntervention.effectivenessScore} / 100
                </div>
              </div>
            </div>
          </div>

          {/* Buffer Ring Columns (100m, 250m, 500m) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeIntervention.bufferRings.map((ring) => {
              const isHigh = ring.impactVerdict === 'High Positive Impact';

              return (
                <div key={ring.radiusMeters} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                        {ring.radiusMeters}m
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        {ring.radiusMeters}m Buffer Ring
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${isHigh ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                      +{ring.vegetationDeltaPct}%
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Vegetation Cover</span>
                      <span className="font-bold text-slate-900">{ring.vegetationCurrentHa} ha</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#22C55E]"
                        style={{ width: `${Math.min(100, ring.vegetationDeltaPct * 4 + 40)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 font-mono">
                    <div className="flex justify-between">
                      <span>Baseline Cover:</span>
                      <span>{ring.vegetationBaselineHa} ha</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Water Retention:</span>
                      <span>{ring.waterCurrentHa} ha</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{ring.impactVerdict}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
