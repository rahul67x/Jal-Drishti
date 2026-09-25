import React from 'react';
import { CloudRain, Activity, AlertTriangle, ShieldCheck, ThermometerSun } from 'lucide-react';
import type { SiteRow, SiteMetricsRow } from '../../lib/database.types';
import { calculateClimateStressNormalization } from '../../features/analytics/climateStressEngine';

interface ClimateStressNormalizerProps {
  site: SiteRow;
  metrics?: SiteMetricsRow | null;
}

export const ClimateStressNormalizer: React.FC<ClimateStressNormalizerProps> = ({ site, metrics }) => {
  const climateData = calculateClimateStressNormalization(site, metrics);

  const verdictBadge = {
    'Climate-Driven Drop': 'bg-sky-100 text-sky-800 border-sky-300',
    'Structural Leakage Alert': 'bg-rose-100 text-rose-800 border-rose-300',
    'Balanced Equilibrium': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'High Resilience': 'bg-teal-100 text-teal-800 border-teal-300',
  }[climateData.verdict];

  return (
    <div className="bg-white rounded-[28px] p-6 border border-slate-200/70 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-50 rounded-2xl text-sky-700">
            <CloudRain className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-slate-900 flex items-center gap-2">
              Seasonal Rainfall & Climate Stress Normalizer
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-sky-100 text-sky-800 border border-sky-200">
                Climate Normalization Engine
              </span>
            </h3>
            <p className="text-sm text-slate-500">
              Separates seasonal drought effects from structural seepage & agricultural over-extraction
            </p>
          </div>
        </div>

        <div className={`px-4 py-1.5 rounded-full font-semibold text-sm border flex items-center gap-1.5 ${verdictBadge}`}>
          {climateData.verdict === 'Structural Leakage Alert' ? (
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-sky-600" />
          )}
          {climateData.verdict}
        </div>
      </div>

      {/* Main KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Monsoon Rainfall Deficit
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-sky-900">
              {climateData.rainfallAnomalyPct}%
            </span>
            <span className="text-xs text-slate-500">
              ({climateData.observedMonsoonRainfallMm}mm vs {climateData.baselineMonsoonRainfallMm}mm norm)
            </span>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1 pt-1">
            <ThermometerSun className="w-3.5 h-3.5 text-amber-500" />
            Seasonal dry spell anomaly
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Raw Water Area Reduction
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-rose-900">
              {climateData.waterLossTotalPct}%
            </span>
            <span className="text-xs text-slate-500">Total area drop</span>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1 pt-1">
            <Activity className="w-3.5 h-3.5 text-rose-500" />
            Un-normalized satellite observation
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Climate Vulnerability Index
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">
              {climateData.vulnerabilityIndex} / 100
            </span>
          </div>
          <p className="text-xs text-slate-500 pt-1">
            Overall climate stress sensitivity
          </p>
        </div>
      </div>

      {/* Attribution Progress Split */}
      <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-sky-700 flex items-center gap-1">
            <CloudRain className="w-4 h-4 text-sky-600" />
            Monsoon Drought Factor: <span className="font-bold">{climateData.climateImpactSharePct}%</span>
          </span>
          <span className="text-amber-700 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Seepage / Extraction Deficit: <span className="font-bold">{climateData.structuralDeficitSharePct}%</span>
          </span>
        </div>

        {/* Dual Progress Bar */}
        <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-sky-500 transition-all duration-500"
            style={{ width: `${climateData.climateImpactSharePct}%` }}
            title={`Monsoon Dry Spell: ${climateData.climateImpactSharePct}%`}
          />
          <div
            className="h-full bg-amber-500 transition-all duration-500"
            style={{ width: `${climateData.structuralDeficitSharePct}%` }}
            title={`Seepage/Extraction: ${climateData.structuralDeficitSharePct}%`}
          />
        </div>

        <div className="text-xs text-slate-500 flex justify-between">
          <span>Natural Weather Attribution</span>
          <span>Human & Structural Action Required</span>
        </div>
      </div>

      {/* Explanation Banner */}
      <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-4 text-sky-950 text-sm">
        <span className="font-bold">Normalization Verdict: </span>
        {climateData.explanation}
      </div>
    </div>
  );
};
