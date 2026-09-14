import React, { useCallback, useRef, useState } from 'react';
import {
  Upload, X, MapPin, MapPinOff, Loader2, CheckCircle2, AlertTriangle, Camera, Crosshair,
} from 'lucide-react';
import type { SiteRow, ObservationCategory } from '../../lib/database.types';
import { prepareUpload, type PendingUpload } from './api';
import { isInsideBbox } from './exif';
import { useUploadGeotaggedImage } from './useGeotaggedImages';
import { useAuth } from '../auth/AuthContext';
import LocationPicker from './LocationPicker';
import { formatBytes, formatDate, formatLatLng } from '../../lib/format';

const CATEGORIES: { value: ObservationCategory; label: string }[] = [
  { value: 'vegetation', label: 'Vegetation' },
  { value: 'water', label: 'Water' },
  { value: 'intervention', label: 'Intervention' },
  { value: 'degradation', label: 'Degradation' },
  { value: 'other', label: 'Other' },
];

interface QueueItem extends PendingUpload {
  id: string;
  previewUrl: string;
  state: 'ready' | 'uploading' | 'done' | 'error';
  message?: string;
}

/**
 * Drag-and-drop uploader for geotagged field photos.
 *
 * The position comes from the photo's own EXIF. Where a photo has none, the
 * uploader says so plainly and the user places the pin on a map rather than the
 * app quietly guessing somewhere plausible. Whichever route was taken is
 * recorded in `gps_source`, so nobody later has to guess whether a position was
 * measured or estimated.
 *
 * Placing by map rather than by typing is deliberate: a transposed digit looks
 * entirely reasonable in a coordinate box, and on a map it is obviously wrong.
 *
 * It also warns when a photo's coordinates fall outside the site boundary,
 * which is exactly the defect that shipped in the old hardcoded sample data.
 */
export const GeotagUploader: React.FC<{ site: SiteRow; onDone?: () => void }> = ({
  site,
  onDone,
}) => {
  const { user, canEdit } = useAuth();
  const upload = useUploadGeotaggedImage(site.id, site.slug, user?.id ?? null);

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);
  // Which queued photo the map picker is currently open for.
  const [pickingFor, setPickingFor] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const images = [...files].filter((f) => f.type.startsWith('image/'));
    if (images.length === 0) return;

    setIsReading(true);
    const prepared = await Promise.all(
      images.map(async (file) => ({
        ...(await prepareUpload(file)),
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
        previewUrl: URL.createObjectURL(file),
        state: 'ready' as const,
      }))
    );
    setQueue((prev) => [...prev, ...prepared]);
    setIsReading(false);
  }, []);

  const patch = (id: string, changes: Partial<QueueItem>) =>
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, ...changes } : q)));

  const remove = (id: string) =>
    setQueue((prev) => {
      const item = prev.find((q) => q.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((q) => q.id !== id);
    });

  const uploadAll = async () => {
    for (const item of queue.filter((q) => q.state === 'ready')) {
      if (item.lat === null || item.lng === null) {
        patch(item.id, { state: 'error', message: 'Needs a position before it can be saved' });
        continue;
      }
      patch(item.id, { state: 'uploading', message: undefined });
      try {
        await upload.mutateAsync(item);
        patch(item.id, { state: 'done', message: 'Saved' });
      } catch (err) {
        patch(item.id, {
          state: 'error',
          message: err instanceof Error ? err.message : 'Upload failed',
        });
      }
    }
    onDone?.();
  };

  if (!canEdit) {
    return (
      <div className="rounded-2xl border border-dashed border-black/12 bg-neutral-50/60 p-6 text-center">
        <Camera className="w-5 h-5 text-neutral-400 mx-auto mb-2" />
        <div className="text-sm font-medium text-neutral-800">Sign in to add field photos</div>
        <div className="text-xs text-neutral-500 mt-1.5 max-w-md mx-auto">
          Anyone can view this site. Uploading requires an editor account, which is
          enforced by the database, not just hidden in the interface.
        </div>
      </div>
    );
  }

  const readyCount = queue.filter((q) => q.state === 'ready').length;
  const withoutPosition = queue.filter((q) => q.lat === null || q.lng === null).length;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          void addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-[#35624B] bg-[#EEF5EC]/60'
            : 'border-black/12 bg-neutral-50/60 hover:border-[#35624B]/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void addFiles(e.target.files);
            e.target.value = '';
          }}
        />
        {isReading ? (
          <Loader2 className="w-6 h-6 text-[#35624B] mx-auto mb-2 animate-spin" />
        ) : (
          <Upload className="w-6 h-6 text-[#35624B] mx-auto mb-2" />
        )}
        <div className="text-sm font-medium text-neutral-800">
          {isReading ? 'Reading photo metadata…' : 'Drop field photos here, or click to choose'}
        </div>
        <div className="text-xs text-neutral-500 mt-1.5">
          GPS is read from each photo automatically. Images are compressed before upload.
        </div>
      </div>

      {queue.length > 0 && (
        <>
          {withoutPosition > 0 && (
            <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900">
              <AlertTriangle className="w-3.5 h-3.5 mt-px shrink-0 text-amber-600" />
              <span>
                {withoutPosition} photo{withoutPosition === 1 ? ' has' : 's have'} no GPS in
                their metadata — common when a photo has been sent through a messaging app.
                Use "Set on map" to place each one, and it will be recorded as placed by
                hand rather than measured.
              </span>
            </div>
          )}

          <div className="space-y-3">
            {queue.map((item) => {
              const inside =
                item.lat !== null && item.lng !== null
                  ? isInsideBbox(item.lat, item.lng, site)
                  : null;

              return (
                <div
                  key={item.id}
                  className="flex gap-4 p-3.5 rounded-2xl bg-white border border-black/8 shadow-sm"
                >
                  <img
                    src={item.previewUrl}
                    alt=""
                    className="w-24 h-24 object-cover rounded-xl border border-black/5 shrink-0"
                  />

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <input
                        value={item.title}
                        onChange={(e) => patch(item.id, { title: e.target.value })}
                        placeholder="Title"
                        className="flex-1 text-sm font-medium bg-transparent border-b border-black/10 focus:border-[#35624B] focus:outline-none pb-1"
                      />
                      <button
                        onClick={() => remove(item.id)}
                        aria-label={`Remove ${item.title}`}
                        className="text-neutral-400 hover:text-rose-600 transition-colors shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={item.category}
                        onChange={(e) =>
                          patch(item.id, { category: e.target.value as ObservationCategory })
                        }
                        className="text-[11px] px-2 py-1 rounded-lg border border-black/10 bg-white focus:outline-none focus:border-[#35624B]"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <input
                        value={item.status}
                        onChange={(e) => patch(item.id, { status: e.target.value })}
                        placeholder="Status, e.g. Healthy"
                        className="text-[11px] px-2 py-1 rounded-lg border border-black/10 w-36 focus:outline-none focus:border-[#35624B]"
                      />
                      <input
                        value={item.observerName}
                        onChange={(e) => patch(item.id, { observerName: e.target.value })}
                        placeholder="Observer"
                        className="text-[11px] px-2 py-1 rounded-lg border border-black/10 w-32 focus:outline-none focus:border-[#35624B]"
                      />
                    </div>

                    <textarea
                      value={item.description}
                      onChange={(e) => patch(item.id, { description: e.target.value })}
                      placeholder="What does this photo show?"
                      rows={2}
                      className="w-full text-[11px] px-2 py-1.5 rounded-lg border border-black/10 resize-none focus:outline-none focus:border-[#35624B]"
                    />

                    {/* Position */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      {item.lat !== null && item.lng !== null ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-medium ${
                            item.gpsSource === 'exif'
                              ? 'bg-[#EEF5EC] text-[#35624B]'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {item.gpsSource === 'exif' ? (
                            <MapPin className="w-3 h-3" />
                          ) : (
                            <MapPinOff className="w-3 h-3" />
                          )}
                          {item.gpsSource === 'exif' ? 'GPS from photo' : 'Placed by hand'}:{' '}
                          {formatLatLng(item.lat, item.lng)}
                          {item.gpsSource === 'exif' && item.gpsAccuracyM
                            ? ` ±${item.gpsAccuracyM} m`
                            : ''}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                          <MapPinOff className="w-3 h-3" />
                          No position yet
                        </span>
                      )}

                      {/*
                        Clicking the map beats typing coordinates: a transposed
                        digit looks perfectly fine in a text box, which is how
                        the original sample data ended up almost entirely
                        outside the study area.
                      */}
                      <button
                        type="button"
                        onClick={() => setPickingFor(item.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#183A2A] text-white hover:bg-[#35624B] transition-colors"
                      >
                        <Crosshair className="w-3 h-3" />
                        {item.lat === null ? 'Set on map' : 'Move on map'}
                      </button>

                      {inside === false && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3" />
                          Outside the {site.name} boundary
                        </span>
                      )}

                      {item.capturedAt && (
                        <span className="text-neutral-400">{formatDate(item.capturedAt)}</span>
                      )}
                      <span className="text-neutral-400">{formatBytes(item.file.size)}</span>
                    </div>

                    {item.state !== 'ready' && (
                      <div
                        className={`flex items-center gap-1.5 text-[11px] font-medium ${
                          item.state === 'done'
                            ? 'text-emerald-700'
                            : item.state === 'error'
                            ? 'text-rose-700'
                            : 'text-neutral-600'
                        }`}
                      >
                        {item.state === 'uploading' && <Loader2 className="w-3 h-3 animate-spin" />}
                        {item.state === 'done' && <CheckCircle2 className="w-3 h-3" />}
                        {item.state === 'error' && <AlertTriangle className="w-3 h-3" />}
                        {item.message ?? 'Uploading…'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => {
                queue.forEach((q) => URL.revokeObjectURL(q.previewUrl));
                setQueue([]);
              }}
              className="text-xs text-[#6F6F6F] hover:text-neutral-900 transition-colors"
            >
              Clear all
            </button>
            <button
              onClick={uploadAll}
              disabled={readyCount === 0 || upload.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#183A2A] text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#35624B] transition-colors"
            >
              {upload.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Upload {readyCount || ''} photo{readyCount === 1 ? '' : 's'}
            </button>
          </div>
        </>
      )}

      {pickingFor &&
        (() => {
          const item = queue.find((q) => q.id === pickingFor);
          if (!item) return null;
          return (
            <LocationPicker
              site={site}
              category={item.category}
              lat={item.lat}
              lng={item.lng}
              gpsSource={item.gpsSource}
              onCancel={() => setPickingFor(null)}
              onConfirm={(lat, lng) => {
                // A position chosen on the map is 'manual' even when the photo
                // had EXIF: it is no longer what the camera measured.
                patch(item.id, { lat, lng, gpsSource: 'manual' });
                setPickingFor(null);
              }}
            />
          );
        })()}
    </div>
  );
};

export default GeotagUploader;
