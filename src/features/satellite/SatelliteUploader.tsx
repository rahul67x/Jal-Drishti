import React, { useRef, useState } from 'react';
import { Upload, Loader2, Satellite, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { SiteRow } from '../../lib/database.types';
import { useUploadSatelliteImage } from './useSatelliteImages';
import { useAuth } from '../auth/AuthContext';
import { formatBytes } from '../../lib/format';

/** Sensors offered as suggestions; the field stays free text for anything else. */
const SENSORS = ['Sentinel-2', 'Landsat-8 OLI/TIRS', 'Landsat-9 OLI-2/TIRS-2', 'SRTM', 'Cartosat', 'Other'];
const PRODUCTS = ['True Colour', 'False Colour', 'NDVI', 'NDWI', 'LULC', 'Change Detection', 'Other'];

interface Draft {
  file: File;
  previewUrl: string;
  title: string;
  caption: string;
  sensor: string;
  product: string;
  acquisitionDate: string;
  year: string;
  resolutionM: string;
  cloudCoverPct: string;
  includeInReport: boolean;
}

function draftFrom(file: File): Draft {
  const title = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').slice(0, 120);
  const yearMatch = title.match(/(20\d\d|19\d\d)/);
  const yearStr = yearMatch ? yearMatch[1] : '';

  return {
    file,
    previewUrl: URL.createObjectURL(file),
    title,
    caption: '',
    sensor: 'Sentinel-2',
    product: 'True Colour',
    acquisitionDate: yearStr ? `${yearStr}-01-15` : '',
    year: yearStr,
    resolutionM: '10',
    cloudCoverPct: '',
    includeInReport: true,
  };
}

/**
 * Uploader for satellite scenes and rendered analysis plates.
 *
 * Acquisition metadata is collected because a satellite image without its
 * sensor, date and resolution is not evidence — it is a picture. The PDF report
 * cites all three under every plate.
 */
export const SatelliteUploader: React.FC<{ site: SiteRow }> = ({ site }) => {
  const { user, canEdit } = useAuth();
  const upload = useUploadSatelliteImage(site.id, site.slug, user?.id ?? null);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  const clear = () => {
    if (draft) URL.revokeObjectURL(draft.previewUrl);
    setDraft(null);
  };

  const submit = async () => {
    if (!draft) return;
    setResult(null);
    try {
      await upload.mutateAsync({
        file: draft.file,
        title: draft.title,
        caption: draft.caption,
        sensor: draft.sensor,
        product: draft.product,
        acquisitionDate: draft.acquisitionDate,
        // Derive the year from the acquisition date when it was not typed, so
        // the gallery can group by year without asking twice.
        year: draft.year
          ? Number(draft.year)
          : draft.acquisitionDate
          ? new Date(draft.acquisitionDate).getFullYear()
          : null,
        resolutionM: draft.resolutionM ? Number(draft.resolutionM) : null,
        cloudCoverPct: draft.cloudCoverPct ? Number(draft.cloudCoverPct) : null,
        includeInReport: draft.includeInReport,
      });
      setResult({ ok: true, message: `"${draft.title}" saved.` });
      clear();
    } catch (err) {
      setResult({
        ok: false,
        message: err instanceof Error ? err.message : 'Upload failed',
      });
    }
  };

  if (!canEdit) {
    return (
      <div className="rounded-2xl border border-dashed border-black/12 bg-neutral-50/60 p-6 text-center">
        <Satellite className="w-5 h-5 text-neutral-400 mx-auto mb-2" />
        <div className="text-sm font-medium text-neutral-800">Sign in to add satellite imagery</div>
        <div className="text-xs text-neutral-500 mt-1.5 max-w-md mx-auto">
          Anyone can view this site. Uploading requires an editor account.
        </div>
      </div>
    );
  }

  const field = 'text-[11px] px-2 py-1.5 rounded-lg border border-black/10 focus:outline-none focus:border-[#35624B]';

  return (
    <div className="space-y-3">
      {!draft ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-2xl border-2 border-dashed border-black/12 bg-neutral-50/60 p-6 text-center hover:border-[#35624B]/50 transition-colors"
        >
          <Upload className="w-5 h-5 text-[#35624B] mx-auto mb-2" />
          <div className="text-sm font-medium text-neutral-800">Add a satellite scene</div>
          <div className="text-xs text-neutral-500 mt-1">
            True-colour, NDVI, LULC or change plates. One at a time, with its acquisition details.
          </div>
        </button>
      ) : (
        <div className="flex gap-4 p-4 rounded-2xl bg-white border border-black/8 shadow-sm">
          <img
            src={draft.previewUrl}
            alt=""
            className="w-40 h-40 object-cover rounded-xl border border-black/5 shrink-0"
          />

          <div className="flex-1 min-w-0 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <input
                value={draft.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="Title"
                className="flex-1 text-sm font-medium bg-transparent border-b border-black/10 focus:border-[#35624B] focus:outline-none pb-1"
              />
              <button
                onClick={clear}
                aria-label="Discard"
                className="text-neutral-400 hover:text-rose-600 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider text-[#6F6F6F]">Sensor</span>
                <input
                  list="satellite-sensors"
                  value={draft.sensor}
                  onChange={(e) => set('sensor', e.target.value)}
                  className={field}
                />
                <datalist id="satellite-sensors">
                  {SENSORS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider text-[#6F6F6F]">Product</span>
                <input
                  list="satellite-products"
                  value={draft.product}
                  onChange={(e) => set('product', e.target.value)}
                  className={field}
                />
                <datalist id="satellite-products">
                  {PRODUCTS.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider text-[#6F6F6F]">
                  Acquired
                </span>
                <input
                  type="date"
                  value={draft.acquisitionDate}
                  onChange={(e) => set('acquisitionDate', e.target.value)}
                  className={field}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider text-[#6F6F6F]">
                  Year <span className="normal-case text-neutral-400">(if no date)</span>
                </span>
                <input
                  type="number"
                  value={draft.year}
                  onChange={(e) => set('year', e.target.value)}
                  placeholder="2026"
                  className={field}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider text-[#6F6F6F]">
                  Resolution (m)
                </span>
                <input
                  type="number"
                  step="0.1"
                  value={draft.resolutionM}
                  onChange={(e) => set('resolutionM', e.target.value)}
                  className={field}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider text-[#6F6F6F]">
                  Cloud cover (%)
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={draft.cloudCoverPct}
                  onChange={(e) => set('cloudCoverPct', e.target.value)}
                  placeholder="optional"
                  className={field}
                />
              </label>
            </div>

            <textarea
              value={draft.caption}
              onChange={(e) => set('caption', e.target.value)}
              placeholder="Caption for the report"
              rows={2}
              className="w-full text-[11px] px-2 py-1.5 rounded-lg border border-black/10 resize-none focus:outline-none focus:border-[#35624B]"
            />

            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-1.5 text-[11px] text-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.includeInReport}
                  onChange={(e) => set('includeInReport', e.target.checked)}
                  className="accent-[#183A2A]"
                />
                Include in the PDF report
              </label>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-neutral-400">{formatBytes(draft.file.size)}</span>
                <button
                  onClick={submit}
                  disabled={upload.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#183A2A] text-white text-xs font-medium disabled:opacity-40 hover:bg-[#35624B] transition-colors"
                >
                  {upload.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  Save scene
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setResult(null);
            setDraft(draftFrom(file));
          }
          e.target.value = '';
        }}
      />

      {result && (
        <div
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] border ${
            result.ok
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-rose-50/70 border-rose-200 text-rose-900'
          }`}
        >
          {result.ok ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          )}
          {result.message}
        </div>
      )}
    </div>
  );
};

export default SatelliteUploader;
