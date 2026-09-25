import React, { useState } from 'react';
import {
  Lightbulb, CheckCircle2, AlertTriangle, TrendingUp, Info, User, Cpu, Sigma, Plus, Trash2, Loader2,
} from 'lucide-react';
import {
  useSiteInsights,
  useCreateInsight,
  useDeleteInsight,
} from '../../features/insights/useSiteInsights';
import { useAuth } from '../../features/auth/AuthContext';
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
 * provenance:
 *
 *   computed  a fact derived from the raster statistics — checkable
 *   analyst   a person's interpretation — judgement, not measurement
 *   model     generated text, with the model named
 *
 * The distinction is the point. A reader must always be able to tell which of
 * the three they are looking at.
 */

const SEVERITY: Record<
  InsightSeverity,
  { icon: React.ComponentType<{ className?: string }>; wrap: string; tint: string }
> = {
  info: { icon: Info, wrap: 'border-black/5', tint: 'text-neutral-500' },
  positive: { icon: TrendingUp, wrap: 'border-emerald-200/60', tint: 'text-emerald-600' },
  watch: { icon: AlertTriangle, wrap: 'border-amber-200/70', tint: 'text-amber-600' },
  critical: { icon: AlertTriangle, wrap: 'border-rose-200/70', tint: 'text-rose-600' },
};

const SOURCE: Record<
  InsightSource,
  { label: string; icon: React.ComponentType<{ className?: string }>; chip: string; hint: string }
> = {
  computed: {
    label: 'Computed',
    icon: Sigma,
    chip: 'bg-[#DCEEF2] text-[#4D8FA8]',
    hint: 'Derived from the raster statistics — checkable against the tables',
  },
  analyst: {
    label: 'Analyst',
    icon: User,
    chip: 'bg-[#EEF5EC] text-[#35624B]',
    hint: 'A written interpretation, not a measurement',
  },
  model: {
    label: 'Model-generated',
    icon: Cpu,
    chip: 'bg-amber-100 text-amber-800',
    hint: 'Produced by a language model',
  },
};

const AddForm: React.FC<{ siteId: string; onDone: () => void }> = ({ siteId, onDone }) => {
  const create = useCreateInsight(siteId);
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState<InsightSeverity>('info');
  const [source, setSource] = useState<InsightSource>('analyst');
  const [modelName, setModelName] = useState('');
  const [author, setAuthor] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    try {
      await create.mutateAsync({
        body,
        category: category.trim() || null,
        severity,
        source,
        modelName: modelName.trim() || null,
        author: author.trim() || null,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the finding.');
    }
  };

  const field =
    'text-[11px] px-2 py-1.5 rounded-lg border border-black/10 bg-white focus:outline-none focus:border-[#35624B]';

  return (
    <div className="p-4 rounded-2xl bg-white border border-[#35624B]/25 space-y-2.5">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="What does the data show, or what does it mean?"
        className="w-full text-xs px-2.5 py-2 rounded-lg border border-black/10 resize-none focus:outline-none focus:border-[#35624B]"
      />

      <div className="flex flex-wrap items-center gap-2">
        <select value={source} onChange={(e) => setSource(e.target.value as InsightSource)} className={field}>
          <option value="analyst">Analyst — an interpretation</option>
          <option value="computed">Computed — derived from the statistics</option>
          <option value="model">Model-generated</option>
        </select>

        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value as InsightSeverity)}
          className={field}
        >
          <option value="info">Info</option>
          <option value="positive">Positive</option>
          <option value="watch">Watch</option>
          <option value="critical">Critical</option>
        </select>

        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category"
          className={`${field} w-28`}
        />
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Author"
          className={`${field} w-32`}
        />
        {source === 'model' && (
          <input
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder="Model name (required)"
            className={`${field} w-44 border-amber-300`}
          />
        )}
      </div>

      {source === 'model' && (
        <div className="text-[10px] text-amber-800">
          Naming the model is required — the database rejects a finding attributed to an
          unnamed one.
        </div>
      )}

      {error && (
        <div className="flex items-start gap-1.5 text-[11px] text-rose-700">
          <AlertTriangle className="w-3.5 h-3.5 mt-px shrink-0" />
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onDone}
          className="px-3 py-1.5 rounded-full border border-black/10 text-[11px] text-neutral-700"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={!body.trim() || create.isPending || (source === 'model' && !modelName.trim())}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#183A2A] text-white text-[11px] font-medium disabled:opacity-40"
        >
          {create.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          Add finding
        </button>
      </div>
    </div>
  );
};

import type { SiteRow, GeotaggedImageRow, RasterLayerRow, SatelliteImageRow, SiteMetricsRow } from '../../lib/database.types';
import { generateAutomatedInsights, type GeneratedInsight } from '../../features/insights/insightsRuleEngine';

export const AIInsights: React.FC<{
  siteId: string;
  site?: SiteRow;
  metrics?: SiteMetricsRow | null;
  geotagged?: GeotaggedImageRow[];
  rasters?: RasterLayerRow[];
  satelliteScenes?: SatelliteImageRow[];
}> = ({ siteId, site, metrics, geotagged = [], rasters = [], satelliteScenes = [] }) => {
  const { canEdit } = useAuth();
  const query = useSiteInsights(siteId);
  const remove = useDeleteInsight(siteId);
  const [adding, setAdding] = useState(false);
  const [filterSource, setFilterSource] = useState<'all' | InsightSource>('all');
  const [autoGenerated, setAutoGenerated] = useState<GeneratedInsight[] | null>(null);

  const handleRunRuleEngine = () => {
    if (!site) return;
    const generated = generateAutomatedInsights(site, metrics ?? null, geotagged, rasters, satelliteScenes);
    setAutoGenerated(generated);
  };

  // Combine DB findings with auto-generated findings if present
  const dbFindings = query.data ?? [];
  const combinedFindings = autoGenerated
    ? [
        ...autoGenerated.map((g) => ({
          id: g.id,
          site_id: siteId,
          body: g.body,
          category: g.category,
          severity: g.severity,
          source: g.source,
          model_name: g.model_name ?? null,
          author: g.author ?? null,
          created_at: g.created_at,
        })),
        ...dbFindings,
      ]
    : dbFindings;

  const filteredFindings = combinedFindings.filter((i) =>
    filterSource === 'all' ? true : i.source === filterSource
  );

  const counts = combinedFindings.reduce<Record<string, number>>((acc, i) => {
    acc[i.source] = (acc[i.source] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-br from-[#183A2A]/5 via-[#EEF5EC]/50 to-white border border-[#35624B]/20 shadow-md space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#183A2A] text-white flex items-center justify-center shadow-sm">
            <Lightbulb className="w-5 h-5 text-[#A8C5A0]" />
          </div>
          <div>
            <h3 className="text-lg font-serif-display font-bold text-[#183A2A]">Site Findings & Spatial Insights</h3>
            <p className="text-xs text-[#6F6F6F]">
              {counts.computed || counts.analyst || counts.model
                ? [
                    counts.computed ? `${counts.computed} computed` : null,
                    counts.analyst ? `${counts.analyst} analyst` : null,
                    counts.model ? `${counts.model} model-generated` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : 'Each finding is labelled with how it was produced'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {site && (
            <button
              onClick={handleRunRuleEngine}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#35624B] hover:bg-[#183A2A] text-white text-xs font-semibold transition-all shadow-xs"
            >
              <Cpu className="w-3.5 h-3.5 text-amber-300" />
              ⚡ Run Rule Engine
            </button>
          )}

          {canEdit && !adding && (
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#183A2A]/20 bg-white text-[#183A2A] text-xs font-medium hover:border-[#183A2A]/50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add finding
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 pt-1 overflow-x-auto pb-1">
        {(['all', 'computed', 'analyst', 'model'] as const).map((src) => (
          <button
            key={src}
            onClick={() => setFilterSource(src)}
            className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
              filterSource === src
                ? 'bg-[#183A2A] text-white'
                : 'bg-white text-neutral-600 border border-black/10 hover:bg-neutral-50'
            }`}
          >
            {src === 'all'
              ? `All (${combinedFindings.length})`
              : src === 'computed'
                ? `Σ Computed (${counts.computed ?? 0})`
                : src === 'analyst'
                  ? `👤 Analyst (${counts.analyst ?? 0})`
                  : `🤖 Model (${counts.model ?? 0})`}
          </button>
        ))}
      </div>

      {adding && (
        <div className="mb-4">
          <AddForm siteId={siteId} onDone={() => setAdding(false)} />
        </div>
      )}

      {query.isLoading && <Spinner label="Loading findings" />}

      {query.isError && (
        <ErrorState title="Could not load findings" error={query.error} onRetry={() => query.refetch()} />
      )}

      {filteredFindings.length === 0 && !adding && !query.isLoading && (
        <EmptyState
          icon={Lightbulb}
          title="No matching findings found"
          hint="Click '⚡ Run Rule Engine' to auto-generate findings based on active satellite rasters and field photos."
        />
      )}

      {filteredFindings.length > 0 && (
        <div className="space-y-3">
          {filteredFindings.map((insight) => {
            const sev = SEVERITY[insight.severity] ?? SEVERITY.info;
            const src = SOURCE[insight.source] ?? SOURCE.analyst;
            const SevIcon = sev.icon;
            const SrcIcon = src.icon;

            return (
              <div
                key={insight.id}
                className={`group flex items-start gap-3 p-3.5 rounded-2xl bg-white/90 border transition-all shadow-xs ${sev.wrap}`}
              >
                <SevIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${sev.tint}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-neutral-800 leading-relaxed">{insight.body}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span
                      title={src.hint}
                      className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${src.chip}`}
                    >
                      <SrcIcon className="w-2.5 h-2.5" />
                      {src.label}
                      {insight.source === 'model' && insight.model_name ? ` · ${insight.model_name}` : ''}
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
                {canEdit && !insight.id.startsWith('rule-') && (
                  <button
                    onClick={() => {
                      if (confirm('Delete this finding?')) remove.mutate(insight.id);
                    }}
                    aria-label="Delete finding"
                    className="text-neutral-200 group-hover:text-neutral-400 hover:!text-rose-600 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-black/5 flex items-start gap-1.5 text-[11px] text-[#6F6F6F]">
        <CheckCircle2 className="w-3 h-3 mt-0.5 text-[#35624B] shrink-0" />
        <span>
          Computed findings restate figures from the raster statistics and can be checked
          against them. Analyst findings are interpretation. Click <strong>⚡ Run Rule Engine</strong> to perform live spatial inference.
        </span>
      </div>
    </div>
  );
};

export default AIInsights;
