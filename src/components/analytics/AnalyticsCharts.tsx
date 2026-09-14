import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useSiteMetrics, useSiteLulc } from '../../features/sites/useSites';
import { Spinner, ErrorState } from '../ui/States';
import { formatHa, formatKm2, formatPct, formatSignedHa, num } from '../../lib/format';

interface AnalyticsChartsProps {
  slug: string;
  category?: 'all' | 'vegetation' | 'water' | 'overview';
}

const tooltipStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  borderRadius: '12px',
  border: '1px solid rgba(0,0,0,0.08)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  fontSize: '12px',
};

const Panel: React.FC<{
  eyebrow: string;
  title: string;
  badge?: string;
  badgeClass?: string;
  footnote?: string;
  children: React.ReactNode;
}> = ({ eyebrow, title, badge, badgeClass = 'bg-neutral-100 text-neutral-700', footnote, children }) => (
  <div className="p-5 rounded-3xl bg-white border border-black/8 shadow-sm">
    <div className="flex items-center justify-between mb-4 gap-3">
      <div className="min-w-0">
        <div className="text-[10px] uppercase font-semibold text-[#6F6F6F] tracking-wider">
          {eyebrow}
        </div>
        <h4 className="text-base font-serif-display font-bold text-[#111111] truncate">{title}</h4>
      </div>
      {badge && (
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium font-mono shrink-0 ${badgeClass}`}>
          {badge}
        </span>
      )}
    </div>
    <div className="h-56 w-full">{children}</div>
    {footnote && <div className="text-[11px] text-[#6F6F6F] mt-2">{footnote}</div>}
  </div>
);

/**
 * The four charts, all fed by site_metrics_view and site_lulc_view.
 *
 * Axis domains are derived from the data rather than hardcoded — the previous
 * version pinned the vegetation axis to [3500, 3800] and the water axis to
 * [0, 15], which happened to suit Saswad and would have clipped any other site.
 */
export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ slug, category = 'all' }) => {
  const metricsQuery = useSiteMetrics(slug);
  const lulcQuery = useSiteLulc(slug);

  const m = metricsQuery.data;

  const vegetationData = useMemo(() => {
    if (!m?.vegetation_baseline_ha || !m?.vegetation_current_ha) return [];
    return [
      { year: String(m.vegetation_baseline_year), areaHa: num(m.vegetation_baseline_ha)! },
      { year: String(m.vegetation_current_year), areaHa: num(m.vegetation_current_ha)! },
    ];
  }, [m]);

  const waterData = useMemo(() => {
    if (m?.water_baseline_ha == null || m?.water_current_ha == null) return [];
    return [
      { year: String(m.water_baseline_year), areaHa: num(m.water_baseline_ha)! },
      { year: String(m.water_current_year), areaHa: num(m.water_current_ha)! },
    ];
  }, [m]);

  const changeData = useMemo(() => {
    if (m?.water_loss_ha == null && m?.water_gain_ha == null) return [];
    return [
      { category: 'Water Loss', areaHa: num(m?.water_loss_ha) ?? 0, fill: '#E11D48' },
      { category: 'Water Gain', areaHa: num(m?.water_gain_ha) ?? 0, fill: '#35624B' },
    ];
  }, [m]);

  const lulcData = useMemo(
    () =>
      (lulcQuery.data ?? []).map((row) => ({
        name: row.class_name,
        value: num(row.area_ha) ?? 0,
        share: num(row.share_pct) ?? 0,
        color: row.colour,
      })),
    [lulcQuery.data]
  );

  /**
   * Rounds a raw step up to the nearest 1, 2, or 5 times a power of ten, so
   * axis ticks land on readable numbers.
   */
  const niceStep = (raw: number): number => {
    if (raw <= 0) return 1;
    const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
    const fraction = raw / magnitude;
    const multiplier = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
    return multiplier * magnitude;
  };

  /**
   * A padded, rounded axis domain.
   *
   * `zeroBased` anchors the axis at zero, which is right for absolute
   * quantities like water extent. Comparisons of two large, similar values —
   * vegetation at 3705 vs 3651 ha — are zoomed instead, otherwise a real 54 ha
   * change is invisible against a 3700 ha baseline.
   *
   * Rounding matters: multiplying a maximum by 1.2 produced axis labels like
   * "15.035999999999998 ha".
   */
  const domainFor = (values: number[], zeroBased = false): [number, number] => {
    if (values.length === 0) return [0, 1];
    const max = Math.max(...values);
    const min = zeroBased ? 0 : Math.min(...values);
    const span = max - min || max || 1;
    const pad = span * (zeroBased ? 0.2 : 0.8);
    const lo = zeroBased ? 0 : Math.max(0, min - pad);
    const hi = max + pad;
    const step = niceStep((hi - lo) / 4);
    return [Math.floor(lo / step) * step, Math.ceil(hi / step) * step];
  };

  /** Consistent tick labels — `unit=" ha"` produced inconsistent spacing. */
  const haTick = (v: number) => `${v.toLocaleString('en-IN')} ha`;

  if (metricsQuery.isLoading || lulcQuery.isLoading) {
    return <Spinner label="Loading charts" />;
  }

  if (metricsQuery.isError) {
    return (
      <ErrorState
        title="Could not load chart data"
        error={metricsQuery.error}
        onRetry={() => metricsQuery.refetch()}
      />
    );
  }

  const showVegetation =
    (category === 'all' || category === 'vegetation' || category === 'overview') &&
    vegetationData.length > 0;
  const showWater =
    (category === 'all' || category === 'water' || category === 'overview') && waterData.length > 0;
  const showChange = (category === 'all' || category === 'water') && changeData.length > 0;
  const showLulc =
    (category === 'all' || category === 'vegetation' || category === 'overview') &&
    lulcData.length > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {showVegetation && (
        <Panel
          eyebrow="Positive NDVI raster analysis"
          title={`Vegetation Area: ${m!.vegetation_baseline_year} vs ${m!.vegetation_current_year}`}
          badge={`${formatSignedHa(m!.vegetation_change_ha)} (${formatPct(m!.vegetation_change_pct)})`}
          badgeClass="bg-[#EEF5EC] text-[#35624B]"
          footnote={`Measured from the vegetation mask rasters. ${formatHa(m!.vegetation_baseline_ha)} → ${formatHa(m!.vegetation_current_ha)}.`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={vegetationData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="year" stroke="#9ca3af" fontSize={11} tickLine={false} />
              <YAxis
                domain={domainFor(vegetationData.map((d) => d.areaHa))}
                stroke="#9ca3af"
                fontSize={11}
                tickLine={false}
                width={70}
                tickFormatter={haTick}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [formatHa(value as number), 'Vegetation area']}
              />
              <Bar dataKey="areaHa" fill="#183A2A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      )}

      {showWater && (
        <Panel
          eyebrow="Surface water extent"
          title={`Water Area: ${m!.water_baseline_year} vs ${m!.water_current_year}`}
          badge={`${formatSignedHa(m!.water_change_ha)} (${formatPct(m!.water_change_pct)})`}
          badgeClass="bg-[#DCEEF2] text-[#4D8FA8]"
          footnote={`Measured from the water mask rasters. ${formatHa(m!.water_baseline_ha)} → ${formatHa(m!.water_current_ha)}.`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={waterData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="year" stroke="#9ca3af" fontSize={11} tickLine={false} />
              <YAxis
                domain={domainFor(waterData.map((d) => d.areaHa), true)}
                stroke="#9ca3af"
                fontSize={11}
                tickLine={false}
                width={70}
                tickFormatter={haTick}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [formatHa(value as number), 'Water extent']}
              />
              <Bar dataKey="areaHa" fill="#4D8FA8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      )}

      {showChange && (
        <Panel
          eyebrow="Raster change detection"
          title={`Water Change ${m!.change_year_from}–${m!.change_year_to}`}
          badge={`Net ${formatSignedHa(m!.water_net_change_ha)}`}
          badgeClass="bg-rose-50 text-[#E11D48]"
          footnote={
            m!.water_change_cross_check_ok
              ? `Loss ${formatHa(m!.water_loss_ha)} · Gain ${formatHa(m!.water_gain_ha)}. Cross-check passed: this independently derived raster agrees with the two water masks.`
              : `Loss ${formatHa(m!.water_loss_ha)} · Gain ${formatHa(m!.water_gain_ha)}. Cross-check FAILED against the water masks.`
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={changeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="category" stroke="#9ca3af" fontSize={11} tickLine={false} />
              <YAxis
                domain={domainFor(changeData.map((d) => d.areaHa), true)}
                stroke="#9ca3af"
                fontSize={11}
                tickLine={false}
                width={70}
                tickFormatter={haTick}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [formatHa(value as number), 'Area affected']}
              />
              <Bar dataKey="areaHa" radius={[6, 6, 0, 0]}>
                {changeData.map((entry) => (
                  <Cell key={entry.category} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      )}

      {showLulc && (
        <div className="p-5 rounded-3xl bg-white border border-black/8 shadow-sm">
          <div className="flex items-center justify-between mb-4 gap-3">
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-semibold text-[#6F6F6F] tracking-wider">
                Land cover classification
              </div>
              <h4 className="text-base font-serif-display font-bold text-[#111111]">
                LULC Distribution — {lulcQuery.data?.[0]?.year ?? ''}
              </h4>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 font-medium font-mono shrink-0">
              {formatKm2(m?.total_area_km2)}
            </span>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={lulcData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {lulcData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, _n, item) => [
                    `${formatHa(value as number)} (${((item?.payload as { share?: number })?.share ?? 0).toFixed(2)}%)`,
                    'Class area',
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-[11px] border-t border-black/5">
            {lulcData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-neutral-600 font-medium">
                  {item.name}: {formatHa(item.value)} ({item.share.toFixed(2)}%)
                </span>
              </div>
            ))}
          </div>
          <div className="text-[11px] text-[#6F6F6F] mt-2 text-center">
            Vegetation and water are measured; "Other" is the remainder, so the three
            always total the analysed extent.
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsCharts;
