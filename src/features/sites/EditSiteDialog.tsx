import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Save, Loader2, AlertTriangle, Trash2, Lock } from 'lucide-react';
import type { SiteRow } from '../../lib/database.types';
import { useUpdateSite, useDeleteSite } from './useSites';
import { formatKm2, formatLatLng } from '../../lib/format';

/**
 * Edits a site's descriptive fields.
 *
 * Slug, geometry and area are shown but not editable. The slug appears in URLs
 * and in the storage path of every file already uploaded for this site, so
 * changing it would orphan them. Geometry and area are derived from the
 * boundary, and should be corrected by replacing the boundary rather than typed
 * over — that is exactly how the original hardcoded entry ended up describing a
 * different place from its own polygon.
 */
export const EditSiteDialog: React.FC<{ site: SiteRow; onClose: () => void }> = ({
  site,
  onClose,
}) => {
  const navigate = useNavigate();
  const update = useUpdateSite();
  const remove = useDeleteSite();

  const [name, setName] = useState(site.name);
  const [district, setDistrict] = useState(site.district ?? '');
  const [state, setState] = useState(site.state ?? '');
  const [country, setCountry] = useState(site.country);
  const [analysisCrs, setAnalysisCrs] = useState(site.analysis_crs ?? '');
  const [description, setDescription] = useState(site.description ?? '');
  const [isPublished, setIsPublished] = useState(site.is_published);

  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  const save = async () => {
    setError(null);
    try {
      await update.mutateAsync({
        id: site.id,
        input: {
          name: name.trim() || site.name,
          district: district.trim() || null,
          state: state.trim() || null,
          country: country.trim() || site.country,
          analysisCrs: analysisCrs.trim() || null,
          description: description.trim() || null,
          isPublished,
        },
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the changes.');
    }
  };

  const destroy = async () => {
    setError(null);
    try {
      await remove.mutateAsync(site.id);
      onClose();
      navigate('/sites');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the site.');
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
      aria-label={`Edit ${site.name}`}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-2xl flex flex-col max-h-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-5 py-3.5 border-b border-black/8">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#35624B] font-semibold">
              Site settings
            </div>
            <h3 className="text-xl font-serif-display text-[#111111]">{site.name}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-neutral-400 hover:text-neutral-900 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto">
          {/* Fixed properties, shown so they are visible but clearly not editable */}
          <div className="rounded-2xl bg-neutral-50 border border-black/5 p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#6F6F6F] font-semibold mb-2">
              <Lock className="w-3 h-3" />
              Fixed
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Site ID</div>
                <div className="font-mono text-neutral-800">{site.slug}</div>
              </div>
              <div>
                <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Extent</div>
                <div className="text-neutral-800 tabular-nums">{formatKm2(site.area_km2)}</div>
              </div>
              <div>
                <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Centre</div>
                <div className="font-mono text-neutral-800">
                  {formatLatLng(site.centre_lat, site.centre_lng)}
                </div>
              </div>
            </div>
            <div className="text-[10px] text-neutral-500 mt-2 leading-snug">
              The ID is used in URLs and in the storage path of every uploaded file. Extent
              and centre come from the boundary — replace the boundary to change them.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="edit-name">Name</label>
              <input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} className={field} />
            </div>
            <div>
              <label className={label} htmlFor="edit-crs">Analysis CRS</label>
              <input
                id="edit-crs"
                value={analysisCrs}
                onChange={(e) => setAnalysisCrs(e.target.value)}
                placeholder="EPSG:32643"
                className={`${field} font-mono`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={label} htmlFor="edit-district">District</label>
              <input id="edit-district" value={district} onChange={(e) => setDistrict(e.target.value)} className={field} />
            </div>
            <div>
              <label className={label} htmlFor="edit-state">State</label>
              <input id="edit-state" value={state} onChange={(e) => setState(e.target.value)} className={field} />
            </div>
            <div>
              <label className={label} htmlFor="edit-country">Country</label>
              <input id="edit-country" value={country} onChange={(e) => setCountry(e.target.value)} className={field} />
            </div>
          </div>

          <div>
            <label className={label} htmlFor="edit-desc">Description</label>
            <textarea
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${field} resize-none`}
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="accent-[#183A2A]"
            />
            Published — visible to everyone. Unpublish to stage changes privately.
          </label>

          {error && (
            <div className="flex items-start gap-1.5 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-900">
              <AlertTriangle className="w-3.5 h-3.5 mt-px shrink-0 text-rose-600" />
              {error}
            </div>
          )}

          {/* Deletion, behind a typed confirmation */}
          <div className="pt-3 border-t border-black/8">
            {!showDelete ? (
              <button
                onClick={() => setShowDelete(true)}
                className="flex items-center gap-1.5 text-[11px] text-rose-600 hover:text-rose-800 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete this site
              </button>
            ) : (
              <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5">
                <div className="text-xs font-semibold text-rose-900">Delete {site.name}?</div>
                <div className="text-[11px] text-rose-800 mt-1 leading-snug">
                  This also removes its raster layers, statistics, field photos, satellite
                  imagery, findings and reports. It cannot be undone.
                </div>
                <div className="flex items-center gap-2 mt-2.5">
                  <input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={`Type ${site.slug} to confirm`}
                    className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg border border-rose-300 focus:outline-none focus:border-rose-500 font-mono"
                  />
                  <button
                    onClick={destroy}
                    disabled={confirmText !== site.slug || remove.isPending}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 text-white text-[11px] font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-rose-700 transition-colors"
                  >
                    {remove.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                    Delete
                  </button>
                  <button
                    onClick={() => {
                      setShowDelete(false);
                      setConfirmText('');
                    }}
                    className="px-3 py-1.5 rounded-lg border border-rose-300 text-[11px] text-rose-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-3.5 border-t border-black/8 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-black/10 text-xs font-medium text-neutral-700 hover:border-black/30 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={update.isPending}
            className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#183A2A] text-white text-xs font-medium disabled:opacity-40 hover:bg-[#35624B] transition-colors"
          >
            {update.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditSiteDialog;
