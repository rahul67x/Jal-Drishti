import React, { useState } from 'react';
import { Sparkles, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';
import { aiInsightsPool } from '../../data/sampleData';

export const AIInsights: React.FC = () => {
  const [insights, setInsights] = useState<string[]>([
    aiInsightsPool[0],
    aiInsightsPool[1],
    aiInsightsPool[2],
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleGenerate = () => {
    setIsLoading(true);

    setTimeout(() => {
      // Shuffle and pick 3 distinct insights
      const shuffled = [...aiInsightsPool].sort(() => 0.5 - Math.random());
      setInsights(shuffled.slice(0, 3));
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-br from-[#183A2A]/5 via-[#EEF5EC]/50 to-white border border-[#35624B]/20 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#183A2A] text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-[#A8C5A0]" />
          </div>
          <div>
            <h3 className="text-lg font-serif-display font-bold text-[#183A2A]">
              JalDrishti Insights
            </h3>
            <p className="text-xs text-[#6F6F6F]">
              AI-assisted geospatial interpretation & automated anomaly detection
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-full bg-[#183A2A] text-white text-xs font-medium hover:bg-[#35624B] transition-colors shadow-sm disabled:opacity-75 cursor-pointer btn-hover-scale"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Synthesizing...' : 'Generate Insights'}</span>
        </button>
      </div>

      {/* Loading state skeleton */}
      {isLoading ? (
        <div className="space-y-3 py-4">
          <div className="flex items-center gap-2 text-xs text-[#35624B] font-medium justify-center">
            <span className="insights-loading-dot w-2 h-2 rounded-full bg-[#35624B]" />
            <span className="insights-loading-dot w-2 h-2 rounded-full bg-[#35624B]" />
            <span className="insights-loading-dot w-2 h-2 rounded-full bg-[#35624B]" />
            <span className="ml-1 font-mono">Running convolutional feature extraction on raster layers...</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/90 border border-black/5 hover:border-[#35624B]/30 transition-all shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4 text-[#35624B] mt-0.5 flex-shrink-0" />
              <p className="text-xs text-neutral-800 leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between text-[11px] text-[#6F6F6F]">
        <span>Model: HydroVision-v3.2 • Multi-temporal change confidence: 94.2%</span>
        <span className="flex items-center gap-1 font-medium text-[#183A2A] hover:underline cursor-pointer">
          Export Report <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
};

export default AIInsights;
