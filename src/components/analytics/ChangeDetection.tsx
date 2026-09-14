import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import type { SiteMetricsRow } from '../../lib/database.types';
import { formatHa, formatPct, formatSignedHa } from '../../lib/format';

/**
 * The four-tile change summary.
 *
 * Every figure is now the measured one. This banner previously read from
 * `changeStats` in sampleData.ts — "+4.8%" vegetation gain, "+12.6%" water
 * coverage — and sat directly beneath metric cards reporting the real -1.46%
 * and -75.82%. Two contradictory sets of numbers on one screen.
 */

const Tile: React.FC<{
  label: string;
  value: string;
  sub?: string;
  dot: string;
  wrap: string;
  text: string;
}> = ({ label, value, sub, dot, wrap, text }) => (
  <div className={`p-2.5 rounded-xl border ${wrap}`}>
    <div className={`flex items-center gap-1.5 font-medium text-[11px] ${text}`}>
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      {label}
    </div>
    <div className="text-xl font-serif-display font-bold mt-1 tabular-nums text-neutral-900">
      {value}
    </div>
    {sub && <div className="text-[10px] text-neutral-500 mt-0.5">{sub}</div>}
  </div>
);

export const ChangeDetectionBanner: React.FC<{ metrics?: SiteMetricsRow | null }> = ({
  metrics,
}) => {
  if (!metrics) return null;

  const vegPositive = Number(metrics.vegetation_change_ha ?? 0) >= 0;
  const crossCheck = metrics.water_change_cross_check_ok;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-white/90 backdrop-blur-md rounded-2xl border border-black/8 text-xs shadow-sm">
        <Tile
          label={vegPositive ? 'Vegetation Gain' : 'Vegetation Loss'}
          value={formatSignedHa(metrics.vegetation_change_ha)}
          sub={`${formatPct(metrics.vegetation_change_pct)} · ${metrics.vegetation_baseline_year}–${metrics.vegetation_current_year}`}
          dot={vegPositive ? 'bg-emerald-500' : 'bg-rose-500'}
          wrap={vegPositive ? 'bg-emerald-50/70 border-emerald-200/50' : 'bg-rose-50/70 border-rose-200/50'}
          text={vegPositive ? 'text-emerald-800' : 'text-rose-800'}
        />
        <Tile
          label="Water Loss"
          value={formatHa(metrics.water_loss_ha)}
          sub="Change raster, class −1"
          dot="bg-rose-500"
          wrap="bg-rose-50/70 border-rose-200/50"
          text="text-rose-800"
        />
        <Tile
          label="Water Gain"
          value={formatHa(metrics.water_gain_ha)}
          sub="Change raster, class +1"
          dot="bg-sky-500"
          wrap="bg-sky-50/70 border-sky-200/50"
          text="text-sky-800"
        />
        <Tile
          label="Net Water Change"
          value={formatSignedHa(metrics.water_net_change_ha)}
          sub={`${metrics.change_year_from}–${metrics.change_year_to}`}
          dot="bg-amber-500"
          wrap="bg-amber-50/70 border-amber-200/50"
          text="text-amber-800"
        />
      </div>

      {crossCheck !== null && crossCheck !== undefined && (
        <div
          className={`flex items-start gap-2 px-3.5 py-2 rounded-xl text-[11px] border ${
            crossCheck
              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
              : 'bg-amber-50/70 border-amber-300 text-amber-900'
          }`}
        >
          {crossCheck ? (
            <CheckCircle2 className="w-3.5 h-3.5 mt-px shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 mt-px shrink-0 text-amber-600" />
          )}
          <span>
            {crossCheck
              ? `Cross-check passed: the change raster (${formatSignedHa(metrics.water_net_change_ha)}) matches subtracting the two independently derived water masks (${formatSignedHa(metrics.water_change_ha)}).`
              : `Cross-check failed: the change raster (${formatSignedHa(metrics.water_net_change_ha)}) disagrees with the water masks (${formatSignedHa(metrics.water_change_ha)}).`}
          </span>
        </div>
      )}
    </div>
  );
};

export default ChangeDetectionBanner;
