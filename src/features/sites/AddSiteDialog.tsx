import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Upload, MapPin, Loader2, AlertTriangle, CheckCircle2, FileJson, Info,
} from 'lucide-react';
import { useCreateSite } from './useSites';
import { summariseBoundary, slugify, type BoundarySummary } from './geo';
import { formatKm2, formatLatLng } from '../../lib/format';

/**
 * Registers a new study area.
 *
 * The boundary file does most of the work: centre, bounding box, area and a
 * sensible default zoom are all derived from it rather than typed. Those four
 * values describe the same polygon, so asking for them separately is asking for
 * them to disagree — which is exactly what happened with the original hardcoded
 * Saswad entry, whose centre sat outside its own boundary and whose stated area
 * was nearly four times the real one.
 *
 * A boundary is optional: a site can be registered from a centre point alone
 * and given its polygon later.
 */
export const AddSiteDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const navigate = useNavigate();
  const create = useCreateSite();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [slug, setSlug] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [analysisCrs, setAnalysisCrs] = useState('');
  const [description, setDescription] = useState('');

  const [boundary, setBoundary] = useState<BoundarySummary | null>(null);
  const [boundaryName, setBoundaryName] = useState<string | null>(null);
  const [boundaryError, setBoundaryError] = useState<string | null>(null);

  // Only used when there is no boundary to derive them from.
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  const [error, setError] = useState<string | null>(null);

  const effectiveSlug = slugTouched ? slug : slugify(name);

  const centre = useMemo(() => {
    if (boundary) return { lat: boundary.centreLat, lng: boundary.centreLng };
    const lat = Number(manualLat);
    const lng = Number(manualLng);
    if (!manualLat || !manualLng || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  }, [boundary, manualLat, manualLng]);

  const slugValid = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(effectiveSlug);
  const canSubmit =
    name.trim().length > 0 && slugValid && centre !== null && !create.isPending;

  const readBoundary = async (file: File) => {
    setBoundaryError(null);
    try {
      const summary = summariseBoundary(await file.text());
      setBoundary(summary);
      setBoundaryName(file.name);
    } catch (err) {
      setBoundary(null);
      setBoundaryName(file.name);
      setBoundaryError(err instanceof Error ? err.message : 'Could not read that file.');
    }
  };

  const submit = async () => {
    if (!centre) return;
    setError(null);
    try {
      const site = await create.mutateAsync({
        slug: effectiveSlug,
        name: name.trim(),
        district: district.trim() || null,
        state: state.trim() || null,
        country: country.trim() || 'India',
        centreLat: centre.lat,
        centreLng: centre.lng,
        defaultZoom: boundary?.suggestedZoom ?? 13,
        areaKm2: boundary?.areaKm2 ?? null,
        analysisCrs: analysisCrs.trim() || null,
        boundaryGeojson: boundary?.geojson ?? null,
        bbox: boundary
          ? {
              minLat: boundary.minLat,
              minLng: boundary.minLng,
              maxLat: boundary.maxLat,
              maxLng: boundary.maxLng,
            }
          : null,
        description: description.trim() || null,
      });
      onClose();
      navigate(`/sites/${site.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the site.');
    }
  };

  const field =
    'w-full text-sm px-3 py-2 rounded-xl border border-black/10 focus:outline-none focus:border-[#35624B] transition-colors';
  const label = 'block text-[10px] uppercase tracking-wider text-[#6F6F6F] font-semibold mb-1';

  return (
    <div
      className="fixed inset-0 z-[4000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Register a new study area"
    >
      <div
        className="bg-white rounded-3xl w-full max-w-2xl flex flex-col max-h-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-5 py-3.5 border-b border-black/8">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#35624B] font-semibold">
              <MapPin className="w-3.5 h-3.5" />
              Site registry
            </div>
            <h3 className="text-xl font-serif-display text-[#111111]">Add a study area</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Cancel"
            className="text-neutral-400 hover:text-neutral-900 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto">
          {/* Boundary */}
          <div>
            <span className={label}>Boundary (GeoJSON)</span>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={`w-full rounded-2xl border-2 border-dashed p-4 text-center transition-colors ${
                boundary
                  ? 'border-[#35624B]/40 bg-[#EEF5EC]/50'
                  : boundaryError
                  ? 'border-rose-300 bg-rose-50/50'
                  : 'border-black/12 bg-neutral-50/60 hover:border-[#35624B]/50'
              }`}
            >
              {boundary ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-[#35624B] mx-auto mb-1.5" />
                  <div className="text-xs font-medium text-neutral-900">{boundaryName}</div>
                  <div className="text-[11px] text-[#6F6F6F] mt-0.5">
                    {boundary.ringCount} ring{boundary.ringCount === 1 ? '' : 's'} ·{' '}
                    {formatKm2(boundary.areaKm2)}{' '}
                    <span className="text-neutral-400">
                      ({boundary.areaSource === 'file' ? 'from the file' : 'measured'})
                    </span>{' '}
                    · centre {formatLatLng(boundary.centreLat, boundary.centreLng)}
                  </div>
                </>
              ) : (
                <>
                  <FileJson className="w-5 h-5 text-neutral-400 mx-auto mb-1.5" />
                  <div className="text-xs font-medium text-neutral-800">
                    {boundaryError ? boundaryName : 'Upload a .geojson boundary'}
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    Centre, extent and area are calculated from it
                  </div>
                </>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".geojson,.json,application/geo+json,application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void readBoundary(f);
                e.target.value = '';
              }}
            />
            {boundaryError && (
              <div className="flex items-start gap-1.5 mt-2 text-[11px] text-rose-700">
                <AlertTriangle className="w-3.5 h-3.5 mt-px shrink-0" />
                {boundaryError}
              </div>
            )}

            {/*
              Warnings, not errors: these are things that are usually a mistake
              but can legitimately be correct, so they inform rather than block.
            */}
            {boundary?.warnings.map((w) => (
              <div
                key={w}
                className="flex items-start gap-1.5 mt-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900"
              >
                <AlertTriangle className="w-3.5 h-3.5 mt-px shrink-0 text-amber-600" />
                {w}
              </div>
            ))}
          </div>

          {/* Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="site-name">Name</label>
              <input
                id="site-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Saswad"
                className={field}
              />
            </div>
            <div>
              <label className={label} htmlFor="site-slug">
                Site ID <span className="normal-case text-neutral-400">(used in the URL)</span>
              </label>
              <input
                id="site-slug"
                value={effectiveSlug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                placeholder="saswad"
                className={`${field} font-mono ${
                  effectiveSlug && !slugValid ? 'border-rose-300' : ''
                }`}
              />
              {effectiveSlug && !slugValid && (
                <div className="text-[10px] text-rose-600 mt-1">
                  Lowercase letters, numbers and hyphens only.
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={label} htmlFor="site-district">District</label>
              <input id="site-district" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Pune" className={field} />
            </div>
            <div>
              <label className={label} htmlFor="site-state">State</label>
              <input id="site-state" value={state} onChange={(e) => setState(e.target.value)} placeholder="Maharashtra" className={field} />
            </div>
            <div>
              <label className={label} htmlFor="site-country">Country</label>
              <input id="site-country" value={country} onChange={(e) => setCountry(e.target.value)} className={field} />
            </div>
          </div>

          {/* Centre — only asked for when there is no boundary to derive it from */}
          {!boundary && (
            <div>
              <span className={label}>Centre point</span>
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  placeholder="Latitude, e.g. 18.3082"
                  inputMode="decimal"
                  className={field}
                />
                <input
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                  placeholder="Longitude, e.g. 73.9992"
                  inputMode="decimal"
                  className={field}
                />
              </div>
              <div className="flex items-start gap-1.5 mt-2 text-[11px] text-[#6F6F6F]">
                <Info className="w-3.5 h-3.5 mt-px shrink-0" />
                Upload a boundary instead and this is worked out for you, along with the
                extent and area.
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="site-crs">
                Analysis CRS <span className="normal-case text-neutral-400">(optional)</span>
              </label>
              <input
                id="site-crs"
                value={analysisCrs}
                onChange={(e) => setAnalysisCrs(e.target.value)}
                placeholder="EPSG:32643"
                className={`${field} font-mono`}
              />
            </div>
            <div>
              <span className={label}>Derived</span>
              <div className="text-xs text-neutral-700 px-3 py-2 rounded-xl bg-neutral-50 border border-black/5">
                {boundary
                  ? `${formatKm2(boundary.areaKm2)} · zoom ${boundary.suggestedZoom}`
                  : centre
                  ? `Centre only · zoom 13`
                  : 'Add a boundary or centre point'}
              </div>
            </div>
          </div>

          <div>
            <label className={label} htmlFor="site-desc">Description</label>
            <textarea
              id="site-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What is being monitored here, and with what data?"
              className={`${field} resize-none`}
            />
          </div>

          {error && (
            <div className="flex items-start gap-1.5 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-900">
              <AlertTriangle className="w-3.5 h-3.5 mt-px shrink-0 text-rose-600" />
              {error}
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-black/8 flex items-center justify-between gap-3">
          <div className="text-[11px] text-[#6F6F6F]">
            {centre ? (
              <>Centre {formatLatLng(centre.lat, centre.lng)}</>
            ) : (
              'A boundary or centre point is required'
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-black/10 text-xs font-medium text-neutral-700 hover:border-black/30 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={!canSubmit}
              className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#183A2A] text-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#35624B] transition-colors"
            >
              {create.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              Create site
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSiteDialog;
