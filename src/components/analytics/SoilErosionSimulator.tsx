import React from 'react';
import { ShieldAlert, TrendingDown, Layers, Info, Mountain } from 'lucide-react';
import type { SiteRow, SiteMetricsRow } from '../../lib/database.types';
import { calculateRusleSoilErosion } from '../../features/analytics/rusleErosionEngine';

interface SoilErosionSimulatorProps {
  site: SiteRow;
  metrics?: SiteMetricsRow | null;
}

export const SoilErosionSimulator: React.FC<SoilErosionSimulatorProps> = ({ site, metrics }) => {
  const erosionData = calculateRusleSoilErosion(site, metrics);

  const riskBadgeStyles = {
    Low: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    Moderate: 'bg-amber-100 text-amber-800 border-amber-300',
    High: 'bg-orange-100 text-orange-800 border-orange-300',
    Severe: 'bg-rose-100 text-rose-800 border-rose-300',
  }[erosionData.riskLevel];

  return (
    <div className="bg-white rounded-[28px] p-6 border border-slate-200/70 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-700">
            <Mountain className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-slate-900 flex items-center gap-2">
              Soil Erosion Risk & Runoff Simulator
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800 border border-amber-200">
                RUSLE Model (A = R·K·LS·C·P)
              </span>
            </h3>
            <p className="text-sm text-slate-500">
              Calculates empirical soil loss rate based on terrain DEM slope, rainfall erosivity & vegetation canopy cover
            </p>
          </div>
        </div>

        <div className={`px-4 py-1.5 rounded-full font-semibold text-sm border ${riskBadgeStyles}`}>
          {erosionData.riskLevel} Erosion Risk
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Potential Soil Loss Rate
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">
              {erosionData.overallSoilLossThaYr}
            </span>
            <span className="text-sm font-medium text-slate-500">t / ha / year</span>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1 pt-1">
            <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
            Topsoil removal speed
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Annual Watershed Sediment Yield
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">
              {erosionData.annualSedimentYieldTons.toLocaleString()}
            </span>
            <span className="text-sm font-medium text-slate-500">Tons / yr</span>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1 pt-1">
            <Layers className="w-3.5 h-3.5 text-rose-500" />
            Reservoir siltation load
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Active Gully Channels
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">
              {erosionData.vulnerableGulliesCount}
            </span>
            <span className="text-sm font-medium text-slate-500">Vulnerable sectors</span>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1 pt-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            Requires slope stabilization
          </p>
        </div>
      </div>

      {/* RUSLE Equation Factors */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
          <span>RUSLE FACTOR BREAKDOWN</span>
          <span className="font-mono text-emerald-400">A = {erosionData.factors.rRainfallFactor} × {erosionData.factors.kSoilErodibility} × {erosionData.factors.lsSlopeFactor} × {erosionData.factors.cCoverManagement} × {erosionData.factors.pConservationPractice}</span>
        </div>
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          <div className="bg-slate-800 p-2 rounded-xl">
            <div className="text-slate-400 font-mono">R (Rainfall)</div>
            <div className="text-white font-bold">{erosionData.factors.rRainfallFactor}</div>
          </div>
          <div className="bg-slate-800 p-2 rounded-xl">
            <div className="text-slate-400 font-mono">K (Soil)</div>
            <div className="text-white font-bold">{erosionData.factors.kSoilErodibility}</div>
          </div>
          <div className="bg-slate-800 p-2 rounded-xl">
            <div className="text-slate-400 font-mono">LS (Slope)</div>
            <div className="text-white font-bold">{erosionData.factors.lsSlopeFactor}</div>
          </div>
          <div className="bg-slate-800 p-2 rounded-xl">
            <div className="text-slate-400 font-mono">C (Cover)</div>
            <div className="text-emerald-400 font-bold">{erosionData.factors.cCoverManagement}</div>
          </div>
          <div className="bg-slate-800 p-2 rounded-xl">
            <div className="text-slate-400 font-mono">P (Practice)</div>
            <div className="text-white font-bold">{erosionData.factors.pConservationPractice}</div>
          </div>
        </div>
      </div>

      {/* Slope Zone Breakdown Table */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Terrain Slope Zone Breakdown
        </h4>
        <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
          {erosionData.zones.map((zone, idx) => (
            <div key={idx} className="p-3 bg-white hover:bg-slate-50/80 flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${zone.colorClass}`}>
                  {zone.severity}
                </span>
                <div>
                  <div className="font-semibold text-slate-800">{zone.zoneName}</div>
                  <div className="text-xs text-slate-400">{zone.areaHa} ha area</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900">{zone.soilLossThaYr} t/ha/yr</div>
                <div className="text-xs text-slate-400">Predicted Loss Rate</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendation Box */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-amber-950 text-sm">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Intervention Recommendation: </span>
          {erosionData.recommendation}
        </div>
      </div>
    </div>
  );
};
