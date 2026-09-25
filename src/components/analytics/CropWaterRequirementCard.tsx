import React, { useState, useMemo } from 'react';
import { Sprout, Droplets, Thermometer, AlertCircle, ArrowUpRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { SiteRow, SiteMetricsRow } from '../../lib/database.types';
import { calculateCropWaterRequirements, calculateReferenceEto } from '../../features/analytics/evapotranspirationEngine';

export const CropWaterRequirementCard: React.FC<{
  site: SiteRow;
  metrics: SiteMetricsRow | null;
}> = ({ site, metrics }) => {
  const [tMax, setTMax] = useState<number>(32.5);
  const [tMin, setTMin] = useState<number>(18.2);
  const [rainfallMm, setRainfallMm] = useState<number>(12.5);
  const [activeTab, setActiveTab] = useState<'crops' | 'sim'>('crops');

  const summary = useMemo(() => {
    return calculateCropWaterRequirements(site, metrics, {
      tMax,
      tMin,
      effectiveRainfallMm: rainfallMm,
    });
  }, [site, metrics, tMax, tMin, rainfallMm]);

  const etoInfo = useMemo(() => {
    return calculateReferenceEto(tMax, tMin, site.centre_lat ?? 18.423);
  }, [tMax, tMin, site.centre_lat]);

  const formatM3 = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(2)} M m³`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k m³`;
    return `${val} m³`;
  };

  return (
    <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-md space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center border border-amber-500/20 shadow-xs">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Crop Water Requirement & ETo Forecaster</h3>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300/60">
                Penman-Monteith Model
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Evapotranspiration (ETo) forecast & irrigation stress index across {summary.totalCultivatedHa.toFixed(1)} ha
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('crops')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'crops' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🌾 Crop Demand & Stress
          </button>
          <button
            onClick={() => setActiveTab('sim')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'sim' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🌡️ Climate Simulator
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-amber-600" />
            Reference ETo
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">{summary.meanEtoMmDay} <span className="text-sm font-sans font-normal text-slate-600">mm/day</span></div>
          <div className="text-[10px] text-slate-500">Atmospheric evaporation potential</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-sky-600" />
            Monthly Agri Demand
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">{formatM3(summary.totalAgriWaterDemandM3)}</div>
          <div className="text-[10px] text-slate-500">Required crop transpiration volume</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            Irrigation Deficit Gap
          </div>
          <div className="text-2xl font-bold font-mono text-rose-700">{formatM3(summary.waterDeficitGapM3)}</div>
          <div className="text-[10px] text-rose-600 font-medium">({summary.waterDeficitLakhLiters} Lakh Liters gap)</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            Agri Stress Index (ASI)
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">{summary.overallAgriStressPct}%</div>
          <div className="flex items-center gap-1 text-[10px]">
            <span
              className={`px-1.5 py-0.2 rounded font-semibold ${
                summary.overallStressGrade === 'Critical'
                  ? 'bg-rose-100 text-rose-800'
                  : summary.overallStressGrade === 'Moderate'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {summary.overallStressGrade} Risk
            </span>
          </div>
        </div>
      </div>

      {activeTab === 'crops' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Crop Water Budget & Evapotranspiration (ETc) Breakdown</span>
            <span className="text-slate-500 text-[11px]">Saswad Cropping Pattern</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200/80 uppercase text-[10px] font-semibold">
                <tr>
                  <th className="p-3">Crop / Pattern</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">Area (ha)</th>
                  <th className="p-3 text-right">Kc Factor</th>
                  <th className="p-3 text-right">ETc (mm/day)</th>
                  <th className="p-3 text-right">Monthly Need (m³)</th>
                  <th className="p-3 text-center">Stress Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {summary.cropResults.map((item) => (
                  <tr key={item.crop.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-semibold text-slate-900">
                      {item.crop.name}
                      <div className="text-[10px] text-slate-500 font-normal">{item.crop.growthStage}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-medium">
                        {item.crop.category}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-medium">{item.cropAreaHa} ha</td>
                    <td className="p-3 text-right font-mono text-slate-600">{item.crop.kc}</td>
                    <td className="p-3 text-right font-mono font-bold text-amber-700">{item.etcMmDay}</td>
                    <td className="p-3 text-right font-mono font-semibold">{formatM3(item.totalCropVolumeM3)}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          item.stressLevel === 'Severe Drought Risk'
                            ? 'bg-rose-100 text-rose-800'
                            : item.stressLevel === 'Moderate Deficit'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.stressIndexPct}% {item.stressLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actionable Recommendations */}
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <CheckCircle2 className="w-4 h-4 text-amber-700" />
              Agronomic Action Plan & Micro-Irrigation Savings
            </div>
            <ul className="space-y-1 text-xs text-amber-950/90 list-disc list-inside">
              {summary.actionRecommendations.map((rec, idx) => (
                <li key={idx} className="leading-relaxed">
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'sim' && (
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Temperature & Monsoon Rainfall Sensitivity Simulator
            </h4>
            <span className="text-[11px] text-slate-500">
              Ra = {etoInfo.raMmDay} mm/day @ Lat {site.centre_lat ?? 18.423}° N
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Max Air Temp (Tmax)</span>
                <span className="font-mono font-bold text-slate-900">{tMax}°C</span>
              </div>
              <input
                type="range"
                min="25"
                max="45"
                step="0.5"
                value={tMax}
                onChange={(e) => setTMax(parseFloat(e.target.value))}
                className="w-full accent-amber-600"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Min Air Temp (Tmin)</span>
                <span className="font-mono font-bold text-slate-900">{tMin}°C</span>
              </div>
              <input
                type="range"
                min="10"
                max="28"
                step="0.5"
                value={tMin}
                onChange={(e) => setTMin(parseFloat(e.target.value))}
                className="w-full accent-amber-600"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Effective Post-Monsoon Rain</span>
                <span className="font-mono font-bold text-slate-900">{rainfallMm} mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="2.5"
                value={rainfallMm}
                onChange={(e) => setRainfallMm(parseFloat(e.target.value))}
                className="w-full accent-sky-600"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200/70 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-amber-600" />
              <span className="text-slate-700">
                Simulated ETo Rate: <strong>{summary.meanEtoMmDay} mm/day</strong> | Water Demand: <strong>{formatM3(summary.totalAgriWaterDemandM3)}</strong>
              </span>
            </div>
            <button
              onClick={() => {
                setTMax(32.5);
                setTMin(18.2);
                setRainfallMm(12.5);
              }}
              className="px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
            >
              Reset Baseline
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CropWaterRequirementCard;
