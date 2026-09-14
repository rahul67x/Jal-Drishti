import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lightbulb, CheckCircle2, AlertTriangle, TrendingUp, Info, User, Cpu, Sigma } from 'lucide-react';
import { queryKeys } from '../../lib/queryClient';
import { listSiteInsights } from '../../features/insights/api';
import { Spinner, ErrorState, EmptyState } from '../ui/States';
import type { InsightSeverity, InsightSource } from '../../lib/database.types';

/**
 * Site findings.
 *
 * This panel used to be called "AI Insights". It called no model: a "Generate
 * Insights" button waited 1200 ms, shuffled a fixed array of ten sentences, and
 * the footer claimed "Model: HydroVision-v3.2 · confidence 94.2%".
 *
 * Findings now come from the site_insights table, and every one carries its
 * provenance — written by an analyst, computed from the rasters, or generated
 * by a named model. A reader can always tell which.
 */

const SEVERITY: Record<
  InsightSeverity,
  { icon: React.ComponentType<{ className?: string }>; wrap: string; icon_: string }
> = {
  info: { icon: Info, wrap: 'border-black/5', icon_: 'text-neutral-500' },
  positive: { icon: TrendingUp, wrap: 'border-emerald-200/60', icon_: 'text-emerald-600' },
  watch: { icon: AlertTriangle, wrap: 'border-amber-200/70', icon_: 'text-amber-600' },
  critical: { icon: AlertTriangle, wrap: 'border-rose-200/70', icon_: 'text-rose-600' },
};

const SOURCE: Record<
  InsightSource,
  { label: string; icon: React.ComponentType<{ className?: string }>; chip: string }
> = {
  analyst: { label: 'Analyst', icon: User, chip: 'bg-[#EEF5EC] text-[#35624B]' },
  computed: { label: 'Computed', icon: Sigma, chip: 'bg-[#DCEEF2] text-[#4D8FA8]' },
  model: { label: 'Model-generated', icon: Cpu, chip: 'bg-amber-100 text-amber-800' },
};

export const AIInsights: React.FC<{ siteId: string }> = ({ siteId }) => {
  const query = useQuery({
    queryKey: queryKeys.siteInsights(siteId),
    queryFn: () => listSiteInsights(siteId),
    enabled: Boolean(siteId),
  });

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-br from-[#183A2A]/5 via-[#EEF5EC]/50 to-white border border-[#35624B]/20 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#183A2A] text-white flex items-center justify-center shadow-sm">
            <Lightbulb className="w-5 h-5 text-[#A8C5A0]" />
          </div>
          <div>
            <h3 className="text-lg font-serif-display font-bold text-[#183A2A]">
              Site Findings
            </h3>
            <p className="text-xs text-[#6F6F6F]">
              Each finding is labelled with how it was produced
            </p>
          </div>
        </div>
      </div>

      {query.isLoading && <Spinner label="Loading findings" />}

      {query.isError && (
        <ErrorState
          title="Could not load findings"
          error={query.error}
          onRetry={() => query.refetch()}
        />
      )}

      {query.isSuccess && query.data.length === 0 && (
        <EmptyState
          icon={Lightbulb}
          title="No findings recorded yet"
          hint="An editor can add findings for this site. Nothing is generated automatically, so this panel stays empty until a real observation is written."
        />
      )}

      {query.isSuccess && query.data.length > 0 && (
        <div className="space-y-3">
          {query.data.map((insight) => {
            const sev = SEVERITY[insight.severity] ?? SEVERITY.info;
            const src = SOURCE[insight.source] ?? SOURCE.analyst;
            const SevIcon = sev.icon;
            const SrcIcon = src.icon;

            return (
              <div
                key={insight.id}
                className={`flex items-start gap-3 p-3.5 rounded-2xl bg-white/90 border transition-all shadow-xs ${sev.wrap}`}
              >
                <SevIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${sev.icon_}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-neutral-800 leading-relaxed">{insight.body}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${src.chip}`}
                    >
                      <SrcIcon className="w-2.5 h-2.5" />
                      {src.label}
                      {insight.source === 'model' && insight.model_name
                        ? ` · ${insight.model_name}`
                        : ''}
                    </span>
                    {insight.category && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 capitalize">
                        {insight.category}
                      </span>
                    )}
                    {insight.author && (
                      <span className="text-[10px] text-neutral-400">{insight.author}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-black/5 flex items-center gap-1.5 text-[11px] text-[#6F6F6F]">
        <CheckCircle2 className="w-3 h-3 text-[#35624B]" />
        <span>
          Findings are stored per site. Nothing on this panel is invented at render time.
        </span>
      </div>
    </div>
  );
};

export default AIInsights;
