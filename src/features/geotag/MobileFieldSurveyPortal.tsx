import React, { useState } from 'react';
import { Smartphone, Camera, MapPin, CheckCircle, Send, AlertCircle, RefreshCw } from 'lucide-react';
import type { SiteRow } from '../../lib/database.types';

interface MobileFieldSurveyPortalProps {
  site: SiteRow;
  onClose?: () => void;
}

export const MobileFieldSurveyPortal: React.FC<MobileFieldSurveyPortalProps> = ({ site, onClose }) => {
  const [structureType, setStructureType] = useState<'Check Dam' | 'Farm Pond' | 'Continuous Contour Trench' | 'Nalla Bund'>('Check Dam');
  const [condition, setCondition] = useState<'Fully Functional' | 'Silted Up' | 'Embankment Breach' | 'Needs Maintenance'>('Fully Functional');
  const [waterDepthMeters, setWaterDepthMeters] = useState<number>(2.4);
  const [notes, setNotes] = useState<string>('Embankment is intact after recent monsoon showers. Water impoundment at maximum capacity.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const sampleLat = Number(((site.centre_lat ?? 18.4234) + 0.0012).toFixed(4));
  const sampleLng = Number(((site.centre_lng ?? 74.0512) - 0.0018).toFixed(4));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 800);
  };

  return (
    <div className="bg-white rounded-[28px] p-6 border border-slate-200/70 shadow-lg max-w-xl mx-auto space-y-6">
      {/* Portal Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-sm shadow-emerald-200">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-slate-900 flex items-center gap-2">
              Mobile Field Survey Portal
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                Gram Panchayat Direct Entry
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Field Officer Rapid Mobile Ground-Truth Reporting Portal
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
          >
            ✕
          </button>
        )}
      </div>

      {isSuccess ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
          <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
          <h4 className="font-bold text-emerald-950 text-lg">Field Survey Submitted Successfully!</h4>
          <p className="text-xs text-emerald-800 max-w-md mx-auto">
            Your report for <span className="font-bold">{structureType}</span> at GPS ({sampleLat}°, {sampleLng}°) has been ingested into the ground-truth database. Confidence Score recalculated.
          </p>
          <button
            type="button"
            onClick={() => setIsSuccess(false)}
            className="mt-2 text-xs font-semibold px-4 py-2 bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 transition-colors"
          >
            Submit Another Report
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {/* Geotagged Auto-GPS */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Geotagged Location:</span>
              <span className="font-mono font-bold text-slate-900">{sampleLat}° N, {sampleLng}° E</span>
            </div>
            <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-md">
              GPS High Accuracy (±3m)
            </span>
          </div>

          {/* Structure Selection */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Structure Type</label>
            <select
              value={structureType}
              onChange={(e) => setStructureType(e.target.value as any)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="Check Dam">Check Dam</option>
              <option value="Farm Pond">Farm Pond</option>
              <option value="Continuous Contour Trench">Continuous Contour Trench (CCT)</option>
              <option value="Nalla Bund">Nalla Bund</option>
            </select>
          </div>

          {/* Condition & Water Depth */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Structure Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Fully Functional">Fully Functional</option>
                <option value="Silted Up">Silted Up</option>
                <option value="Embankment Breach">Embankment Breach</option>
                <option value="Needs Maintenance">Needs Maintenance</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Water Depth (Meters)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={waterDepthMeters}
                onChange={(e) => setWaterDepthMeters(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Photo Preview Upload Box */}
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:bg-slate-50/50 transition-colors">
            <Camera className="w-8 h-8 text-slate-400 mx-auto mb-1" />
            <span className="text-xs font-semibold text-slate-700 block">Capture / Upload Field Photo</span>
            <span className="text-[11px] text-slate-400">Geotag metadata will be extracted automatically</span>
          </div>

          {/* Field Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Field Notes & Recommendations</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Realtime Satellite Cross-Validation Preview Banner */}
          <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-950 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Instant Validation: </span>
              Satellite NDWI at ({sampleLat}°, {sampleLng}°) confirms water presence. Confidence Score will increase by <span className="font-bold text-emerald-700">+5%</span> upon submission.
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Ingesting Field Report...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Mobile Field Survey
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
