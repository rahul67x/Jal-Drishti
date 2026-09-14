import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FileText, Download, Loader2, CheckCircle2, AlertTriangle, Trash2, History, Save,
} from 'lucide-react';
import type { SiteRow, ReportRow } from '../../lib/database.types';
import { useAuth } from '../auth/AuthContext';
import { Spinner, ErrorState, EmptyState } from '../../components/ui/States';
import { formatBytes, formatDate } from '../../lib/format';
import {
  collectReportData,
  countOmitted,
  metricsSnapshot,
  DEFAULT_OPTIONS,
  type ReportOptions,
} from './reportData';
import ReportDocument from './ReportDocument';
import { listReports, reportDownloadUrl, saveReport, deleteReport } from './api';

const SECTIONS: { key: keyof ReportOptions; label: string; hint: string }[] = [
  { key: 'statisticalTables', label: 'Raster class statistics', hint: 'Raw pixel counts and areas per class' },
  { key: 'charts', label: 'Charts', hint: 'Vegetation and water extent comparisons' },
  { key: 'satellitePlates', label: 'Satellite imagery', hint: 'Scenes marked "in report"' },
  { key: 'fieldPhotos', label: 'Field evidence', hint: 'Geo-tagged photographs with coordinates' },
  { key: 'findings', label: 'Findings', hint: 'Written observations for this site' },
  { key: 'provenance', label: 'Provenance appendix', hint: 'Source files behind every layer' },
];

/**
 * Report builder — requirement #4.
 *
 * The PDF is rendered in the browser. Downloading works for anyone; saving to
 * the history requires an editor, because the reports bucket is private.
 * Keeping those separate means a viewer can still take a report away without
 * being able to write to shared storage.
 */
export const ReportPanel: React.FC<{ site: SiteRow }> = ({ site }) => {
  const { user, canEdit } = useAuth();
  const qc = useQueryClient();

  const [options, setOptions] = useState<ReportOptions>(DEFAULT_OPTIONS);
  const [busy, setBusy] = useState<null | 'download' | 'save'>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const history = useQuery({
    queryKey: ['reports', site.id],
    queryFn: () => listReports(site.id),
    // Open demo mode: report history is readable by everyone.
  });

  const toggle = (key: keyof ReportOptions) =>
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));

  /** Renders the PDF and hands back the blob plus what it was built from. */
  const build = async () => {
    const data = await collectReportData(site, options);
    const omitted = await countOmitted(site, data);
    const blob = await pdf(<ReportDocument data={data} omitted={omitted} />).toBlob();
    return { blob, data };
  };

  const download = async () => {
    setBusy('download');
    setResult(null);
    try {
      const { blob } = await build();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jaldrishti-${site.slug}-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Revoke on the next tick; revoking immediately can cancel the download
      // in some browsers before it has started reading the blob.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setResult({ ok: true, message: `Report downloaded (${formatBytes(blob.size)}).` });
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : 'Could not generate the report' });
    } finally {
      setBusy(null);
    }
  };

  const saveToHistory = async () => {
    setBusy('save');
    setResult(null);
    try {
      const { blob, data } = await build();
      await saveReport({
        site,
        blob,
        title: `${site.name} site report`,
        params: { ...options },
        metricsSnapshot: metricsSnapshot(data),
        userId: user?.id ?? null,
      });
      await qc.invalidateQueries({ queryKey: ['reports', site.id] });
      setResult({ ok: true, message: `Report saved to history (${formatBytes(blob.size)}).` });
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : 'Could not save the report' });
    } finally {
      setBusy(null);
    }
  };

  const openStored = async (row: ReportRow) => {
    try {
      const url = await reportDownloadUrl(row);
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : 'Could not open the report' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Builder */}
      <div className="p-6 rounded-3xl bg-white border border-black/8 shadow-sm">
        <div className="flex items-start gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-[#183A2A] text-white flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-[#A8C5A0]" />
          </div>
          <div>
            <h3 className="text-lg font-serif-display font-bold text-[#183A2A]">
              Site Report
            </h3>
            <p className="text-xs text-[#6F6F6F]">
              A statistical PDF for {site.name}, built from the stored raster analysis.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-5">
          {SECTIONS.map((section) => (
            <label
              key={section.key}
              className={`flex items-start gap-2 p-3 rounded-2xl border cursor-pointer transition-colors ${
                options[section.key]
                  ? 'bg-[#EEF5EC]/60 border-[#35624B]/30'
                  : 'bg-white border-black/8 hover:border-black/20'
              }`}
            >
              <input
                type="checkbox"
                checked={options[section.key]}
                onChange={() => toggle(section.key)}
                className="accent-[#183A2A] mt-0.5"
              />
              <span className="min-w-0">
                <span className="block text-xs font-medium text-neutral-900">{section.label}</span>
                <span className="block text-[10px] text-neutral-500 leading-snug">
                  {section.hint}
                </span>
              </span>
            </label>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={download}
            disabled={busy !== null}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#183A2A] text-white text-sm font-medium disabled:opacity-40 hover:bg-[#35624B] transition-colors"
          >
            {busy === 'download' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download PDF
          </button>

          <button
            onClick={saveToHistory}
            disabled={busy !== null || !canEdit}
            title="Store this report for the team"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-black/12 bg-white text-[#183A2A] text-sm font-medium disabled:opacity-40 hover:border-[#183A2A]/40 transition-colors"
          >
            {busy === 'save' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save to history
          </button>

          {busy && (
            <span className="text-[11px] text-[#6F6F6F]">
              Rendering — embedding images can take a few seconds.
            </span>
          )}
        </div>

        {result && (
          <div
            className={`flex items-start gap-1.5 mt-3 px-3 py-2 rounded-xl text-[11px] border ${
              result.ok
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-rose-50/70 border-rose-200 text-rose-900'
            }`}
          >
            {result.ok ? (
              <CheckCircle2 className="w-3.5 h-3.5 mt-px shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 mt-px shrink-0 text-rose-600" />
            )}
            {result.message}
          </div>
        )}
      </div>

      {/* History */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-[#35624B]" />
          <h4 className="text-sm font-semibold text-neutral-900">Previously generated</h4>
        </div>

        {history.isLoading && <Spinner label="Loading report history" />}

        {history.isError && (
          <ErrorState
            title="Could not load report history"
            error={history.error}
            onRetry={() => history.refetch()}
          />
        )}

        {history.isSuccess && history.data.length === 0 && (
          <EmptyState
            icon={FileText}
            title="No reports saved yet"
            hint="Generate one above and choose Save to history to keep it for the team."
          />
        )}

        {history.isSuccess && history.data.length > 0 && (
          <div className="space-y-2">
            {history.data.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-black/8 shadow-sm"
              >
                <div className="min-w-0">
                  <div className="text-xs font-medium text-neutral-900 truncate">{row.title}</div>
                  <div className="text-[10px] text-neutral-500">
                    {formatDate(row.generated_at ?? row.created_at)}
                    {row.file_size_bytes ? ` · ${formatBytes(row.file_size_bytes)}` : ''}
                    {row.status !== 'ready' ? ` · ${row.status}` : ''}
                    {row.error_message ? ` · ${row.error_message}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {row.status === 'ready' && (
                    <button
                      onClick={() => openStored(row)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-black/10 text-[11px] font-medium text-[#183A2A] hover:border-[#183A2A]/40 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      Open
                    </button>
                  )}
                  {canEdit && (
                    <button
                      onClick={async () => {
                        if (!confirm('Delete this report? This cannot be undone.')) return;
                        await deleteReport(row);
                        qc.invalidateQueries({ queryKey: ['reports', site.id] });
                      }}
                      aria-label="Delete report"
                      className="p-1.5 text-neutral-300 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportPanel;
