import React from 'react';
import { Compass, MapPin, Sparkles, PlusCircle, CheckCircle2, IndianRupee } from 'lucide-react';
import type { SiteRow, SiteMetricsRow } from '../../lib/database.types';
import { calculateSmartInterventionRecommendations } from '../../features/interventions/smartRecommenderEngine';

interface SmartInterventionRecommenderProps {
  site: SiteRow;
  metrics?: SiteMetricsRow | null;
}

export const SmartInterventionRecommender: React.FC<SmartInterventionRecommenderProps> = ({ site, metrics }) => {
  const recommenderData = calculateSmartInterventionRecommendations(site, metrics);

  const priorityStyles = {
    Critical: 'bg-rose-100 text-rose-800 border-rose-300',
    High: 'bg-amber-100 text-amber-800 border-amber-300',
    Medium: 'bg-blue-100 text-blue-800 border-blue-300',
  };

  return (
    <div className="bg-white rounded-[28px] p-6 border border-slate-200/70 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-700">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-slate-900 flex items-center gap-2">
              AI Smart Intervention Recommender
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                &quot;Where to Build Next&quot; Engine
              </span>
            </h3>
            <p className="text-sm text-slate-500">
              Scans stream channel order, slope DEM (&gt;12%), and sparse vegetation to derive exact target GPS coordinates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/80 text-emerald-900 font-medium">
            Harvesting Potential: <span className="font-bold">{recommenderData.potentialWaterHarvestedM3.toLocaleString()} m³</span>
          </div>
          <div className="bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-800 font-medium">
            Est. Budget: <span className="font-bold">₹{recommenderData.estimatedTotalBudgetLakhs} Lakhs</span>
          </div>
        </div>
      </div>

      {/* Recommended Sites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommenderData.proposals.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-mono text-slate-400">Target ID: {item.id}</span>
                <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  {item.type}
                </h4>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${priorityStyles[item.priority]}`}>
                {item.priority} Priority
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100">
              {item.terrainReason}
            </p>

            <div className="flex flex-wrap items-center justify-between text-xs pt-1 border-t border-slate-200/60 gap-2">
              <div className="flex items-center gap-1 font-mono text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                {item.lat}° N, {item.lng}° E
              </div>

              <div className="flex items-center gap-3 font-medium text-slate-600">
                <span className="flex items-center gap-0.5">
                  <IndianRupee className="w-3 h-3 text-slate-400" />
                  {item.estimatedCostInrLakhs} L
                </span>
                <span className="text-slate-900 font-bold">
                  {item.estimatedCapacityM3.toLocaleString()} m³ capacity
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Suitability Score: <span className="font-bold text-slate-800">{item.suitabilityScore}%</span>
              </div>
              <button
                type="button"
                onClick={() => alert(`Added ${item.type} at (${item.lat}, ${item.lng}) to active DPR plan!`)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-100/70 hover:bg-emerald-100 px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add to DPR Plan
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
