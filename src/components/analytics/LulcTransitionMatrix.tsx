import React from 'react';
import { ArrowRight, Grid, Info } from 'lucide-react';
import type { SiteMetricsRow, SiteLulcRow } from '../../lib/database.types';
import { calculateLulcTransitionMatrix } from '../../features/analytics/lulcTransitionEngine';

interface LulcTransitionMatrixProps {
  metrics?: SiteMetricsRow | null;
  lulc?: SiteLulcRow[];
}

export const LulcTransitionMatrix: React.FC<LulcTransitionMatrixProps> = ({
  metrics,
  lulc = [],
}) => {
  const data = calculateLulcTransitionMatrix(metrics, lulc);

  return (
    <div className="p-6 rounded-[28px] bg-white border border-slate-200/70 shadow-sm space-y-5">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#DCEEF2] text-[#4D8FA8] flex items-center justify-center shrink-0 border border-[#4D8FA8]/10 shadow-xs">
            <Grid className="w-5 h-5 text-[#4D8FA8]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-serif-display tracking-tight">
              Land Cover Transition Matrix ({data.yearFrom} → {data.yearTo})
            </h3>
            <p className="text-xs text-slate-500">
              Quantifies exact spatial conversion flows between land cover classes in hectares.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
          <span>{data.yearFrom} Baseline</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <span>{data.yearTo} Current</span>
        </div>
      </div>

      {/* Headline Summary Box */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
        <Info className="w-4 h-4 text-[#35624B] shrink-0 mt-0.5" />
        <span>{data.headlineSummary}</span>
      </div>

      {/* Transition Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-sans border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <th className="p-3 text-left font-bold">
                From ({data.yearFrom}) \ To ({data.yearTo})
              </th>
              {data.classes.map((cls) => (
                <th key={cls} className="p-3 text-right font-bold">
                  {cls}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.matrix.map((row, rIdx) => (
              <tr key={data.classes[rIdx]} className="hover:bg-slate-50/60 transition-colors">
                <td className="p-3 font-bold text-slate-900 bg-slate-50/50">
                  {data.classes[rIdx]}
                </td>
                {row.map((cell) => {
                  let cellStyle = 'bg-slate-50/30 text-slate-600';
                  if (cell.type === 'retained' && cell.areaHa > 0) cellStyle = 'bg-emerald-50 text-emerald-950 font-bold';
                  else if (cell.type === 'loss' && cell.areaHa > 0) cellStyle = 'bg-rose-50 text-rose-900 font-bold';
                  else if (cell.type === 'gain' && cell.areaHa > 0) cellStyle = 'bg-sky-50 text-sky-900 font-bold';

                  return (
                    <td key={cell.toClass} className={`p-3 text-right font-mono ${cellStyle}`}>
                      <div className="font-semibold">{cell.areaHa} ha</div>
                      <div className="text-[10px] opacity-75">{cell.sharePct}%</div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
