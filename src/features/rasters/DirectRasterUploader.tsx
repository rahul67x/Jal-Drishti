import React, { useState } from 'react';
import { Upload, FileUp, Loader2, CheckCircle, AlertTriangle, Layers, X } from 'lucide-react';
import { analyzeUploadedGeoTiff, type AnalysisEngineResult } from './analysisEngine';

interface DirectRasterUploaderProps {
  siteId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DirectRasterUploader: React.FC<DirectRasterUploaderProps> = ({
  siteId: _siteId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [redBand, setRedBand] = useState<number>(1);
  const [nirBand, setNirBand] = useState<number>(2);
  const [greenBand, setGreenBand] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisEngineResult | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!/\.tiff?$/i.test(selected.name)) {
        setError('Please select a valid GeoTIFF (.tif or .tiff) satellite raster file.');
        return;
      }
      setFile(selected);
      setError(null);
      setResult(null);
    }
  };

  const runAnalysis = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await analyzeUploadedGeoTiff(file, {
        redBand,
        nirBand,
        greenBand: greenBand ? parseInt(greenBand, 10) : undefined,
      });
      setResult(res);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not decode or analyze the GeoTIFF file.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-black/10 animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-[#EEF5EC] text-[#35624B] flex items-center justify-center">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900 font-serif-display">Direct Satellite GeoTIFF Upload</h3>
            <p className="text-xs text-neutral-500">
              Upload raw satellite GeoTIFF rasters to analyze spectral indices in-browser.
            </p>
          </div>
        </div>

        {!result ? (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-neutral-200 rounded-2xl p-6 text-center bg-neutral-50/50 hover:bg-neutral-50 transition-colors">
              <input
                type="file"
                accept=".tif,.tiff"
                onChange={handleFileChange}
                id="geotiff-file-input"
                className="hidden"
              />
              <label htmlFor="geotiff-file-input" className="cursor-pointer space-y-2 block">
                <FileUp className="w-8 h-8 text-[#35624B] mx-auto opacity-80" />
                <div className="text-sm font-semibold text-neutral-800">
                  {file ? file.name : 'Click to upload GeoTIFF raster (.tif / .tiff)'}
                </div>
                <div className="text-[11px] text-neutral-400">
                  Supports Multi-band Sentinel-2 L2A or ESA WorldCover single-band rasters
                </div>
              </label>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-neutral-700 block mb-1">Red Band Index</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={redBand}
                  onChange={(e) => setRedBand(parseInt(e.target.value, 10) || 1)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:border-[#35624B]"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-neutral-700 block mb-1">NIR Band Index</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={nirBand}
                  onChange={(e) => setNirBand(parseInt(e.target.value, 10) || 2)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:border-[#35624B]"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-neutral-700 block mb-1">Green Band (Optional)</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  placeholder="e.g. 3"
                  value={greenBand}
                  onChange={(e) => setGreenBand(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:border-[#35624B]"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-full border border-neutral-200 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={runAnalysis}
                disabled={!file || analyzing}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#183A2A] text-white text-xs font-semibold hover:bg-[#183A2A]/90 disabled:opacity-40 transition-colors shadow-md"
              >
                {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                {analyzing ? 'Analyzing Raster...' : 'Analyze GeoTIFF'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">Analysis Complete for {file?.name}</span>
              </div>
              <span className="font-mono text-[11px]">{result.width} × {result.height} px</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-neutral-50 border border-black/5">
                <div className="text-[10px] uppercase font-bold text-neutral-400">Bands</div>
                <div className="text-base font-bold text-neutral-900 mt-0.5">{result.samplesPerPixel}</div>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-50 border border-black/5">
                <div className="text-[10px] uppercase font-bold text-neutral-400">Mean NDVI</div>
                <div className="text-base font-bold text-emerald-700 mt-0.5">
                  {result.meanNdvi !== null ? result.meanNdvi : 'N/A'}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-50 border border-black/5">
                <div className="text-[10px] uppercase font-bold text-neutral-400">Mean NDWI</div>
                <div className="text-base font-bold text-sky-700 mt-0.5">
                  {result.meanNdwi !== null ? result.meanNdwi : 'N/A'}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-50 border border-black/5">
                <div className="text-[10px] uppercase font-bold text-neutral-400">Valid Pixels</div>
                <div className="text-base font-bold text-neutral-900 mt-0.5">
                  {result.validPixels.toLocaleString()}
                </div>
              </div>
            </div>

            {result.landcoverDistribution && result.landcoverDistribution.length > 0 && (
              <div className="p-4 rounded-2xl bg-neutral-50 border border-black/5 space-y-2">
                <div className="text-xs font-bold text-neutral-800">ESA WorldCover Land Use Distribution</div>
                <div className="space-y-1.5">
                  {result.landcoverDistribution.map((item) => (
                    <div key={item.category} className="flex items-center justify-between text-xs">
                      <span className="text-neutral-600">{item.category}</span>
                      <span className="font-mono font-medium text-neutral-900">{item.sharePct}% ({item.areaHa} ha)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setResult(null)}
                className="px-4 py-2 rounded-full border border-neutral-200 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
              >
                Upload Another
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-full bg-[#183A2A] text-white text-xs font-semibold shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
