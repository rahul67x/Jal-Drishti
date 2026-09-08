import React, { useState, useRef, useCallback } from 'react';
import { ArrowLeftRight, Calendar, Sparkles, TrendingUp } from 'lucide-react';
import { changeStats } from '../../data/sampleData';

export const BeforeAfterComparison: React.FC = () => {
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 to 100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [beforeYear, setBeforeYear] = useState<string>('2021');
  const [afterYear, setAfterYear] = useState<string>('2026');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPos(percent);
    },
    []
  );

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Year Selectors */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-black/8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#35624B] uppercase tracking-wider">
            <ArrowLeftRight className="w-4 h-4" />
            <span>Multitemporal Satellite Comparison</span>
          </div>
          <h3 className="text-xl font-serif-display text-[#111111] mt-0.5">
            Watershed Evolution (2021 vs 2026)
          </h3>
        </div>

        {/* Year Selectors */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 border border-black/5">
            <Calendar className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-neutral-500">Baseline:</span>
            <select
              value={beforeYear}
              onChange={(e) => setBeforeYear(e.target.value)}
              className="bg-transparent font-semibold text-neutral-800 focus:outline-none cursor-pointer"
            >
              <option value="2019">2019</option>
              <option value="2020">2020</option>
              <option value="2021">2021</option>
            </select>
          </div>

          <span className="text-neutral-400 font-serif-display text-base">vs</span>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EEF5EC] border border-[#35624B]/20">
            <Sparkles className="w-3.5 h-3.5 text-[#35624B]" />
            <span className="text-[#35624B]">Current:</span>
            <select
              value={afterYear}
              onChange={(e) => setAfterYear(e.target.value)}
              className="bg-transparent font-semibold text-[#183A2A] focus:outline-none cursor-pointer"
            >
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>
        </div>
      </div>

      {/* Draggable Comparison Viewport */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        className="relative w-full h-[420px] sm:h-[480px] rounded-3xl overflow-hidden border border-black/10 shadow-2xl select-none cursor-ew-resize bg-neutral-900"
      >
        {/* RIGHT LAYER: AFTER (2026 - Lush, Active Structures, High Greenery) */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#1b3d2b] via-[#244f38] to-[#122b1e] flex items-center justify-center overflow-hidden">
          {/* Detailed synthetic satellite map representing 2026 */}
          <svg className="w-full h-full object-cover opacity-90" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
            {/* Topography contours */}
            <path d="M 0 100 Q 250 50 500 120 T 1000 80" stroke="rgba(168,197,160,0.15)" strokeWidth="60" fill="none" />
            <path d="M 0 300 Q 300 240 600 320 T 1000 280" stroke="rgba(168,197,160,0.2)" strokeWidth="80" fill="none" />
            
            {/* Lush vegetation zones (2026) */}
            <polygon points="120,80 340,60 420,180 280,240 100,190" fill="#183A2A" opacity="0.85" />
            <polygon points="520,140 760,110 880,250 680,310 500,220" fill="#23533c" opacity="0.9" />
            <polygon points="260,340 480,310 560,490 320,530 180,440" fill="#183A2A" opacity="0.8" />
            <polygon points="620,360 890,320 950,510 740,540 580,430" fill="#2d6a4f" opacity="0.85" />

            {/* Restored Land Parcels */}
            <rect x="360" y="210" width="140" height="90" rx="8" fill="#52b788" opacity="0.75" />
            <rect x="710" y="220" width="120" height="80" rx="6" fill="#74c69d" opacity="0.8" />

            {/* Active Water Bodies & Reservoirs (Fuller in 2026) */}
            <ellipse cx="440" cy="270" rx="42" ry="24" fill="#0284c7" opacity="0.95" />
            <ellipse cx="660" cy="380" rx="55" ry="32" fill="#0284c7" opacity="0.95" />
            <ellipse cx="230" cy="460" rx="35" ry="18" fill="#38bdf8" opacity="0.9" />

            {/* Drainage Network with Active Flow */}
            <path d="M 120 80 Q 280 200 440 270 T 660 380 T 960 480" stroke="#38bdf8" strokeWidth="5" fill="none" opacity="0.9" />
            <path d="M 440 100 Q 450 180 440 270" stroke="#60a5fa" strokeWidth="3" fill="none" opacity="0.8" />

            {/* Check Dam Structures (New in 2026) */}
            <circle cx="440" cy="270" r="7" fill="#fbbf24" stroke="#ffffff" strokeWidth="2" />
            <circle cx="660" cy="380" r="8" fill="#fbbf24" stroke="#ffffff" strokeWidth="2" />
            <circle cx="350" cy="235" r="6" fill="#fbbf24" stroke="#ffffff" strokeWidth="2" />
          </svg>

          {/* Label Badge 2026 */}
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/60 shadow-lg text-right pointer-events-none">
            <div className="text-[10px] uppercase font-bold text-[#35624B] tracking-wider">AFTER</div>
            <div className="text-lg font-serif-display font-bold text-[#111111]">{afterYear} — Restored</div>
            <div className="text-[11px] text-[#35624B] font-medium">+4.8% Tree Cover • 12 Active Water Bodies</div>
          </div>
        </div>

        {/* LEFT LAYER: BEFORE (2021 - Arid, Barren, Low Water, Eroded) */}
        <div
          className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#4a3b2c] via-[#5c4a37] to-[#382b1f] overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        >
          <svg className="w-full h-full object-cover opacity-90" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
            {/* Arid Topography */}
            <path d="M 0 100 Q 250 50 500 120 T 1000 80" stroke="rgba(212,195,163,0.15)" strokeWidth="60" fill="none" />
            <path d="M 0 300 Q 300 240 600 320 T 1000 280" stroke="rgba(212,195,163,0.2)" strokeWidth="80" fill="none" />

            {/* Sparse Vegetation (2021) */}
            <polygon points="130,90 280,80 340,160 220,200 120,160" fill="#354228" opacity="0.55" />
            <polygon points="560,160 680,140 740,220 620,260 540,210" fill="#3b4d2c" opacity="0.5" />
            <polygon points="280,360 410,340 460,460 310,480 230,420" fill="#354228" opacity="0.45" />

            {/* Exposed Barren & Gully Erosion Zones */}
            <rect x="360" y="210" width="140" height="90" rx="8" fill="#b08968" opacity="0.65" />
            <rect x="710" y="220" width="120" height="80" rx="6" fill="#a68a64" opacity="0.65" />

            {/* Shrinking Water Bodies in 2021 */}
            <ellipse cx="440" cy="270" rx="20" ry="10" fill="#52796f" opacity="0.6" />
            <ellipse cx="660" cy="380" rx="24" ry="12" fill="#52796f" opacity="0.6" />

            {/* Ephemeral Dry Drainage Channels */}
            <path d="M 120 80 Q 280 200 440 270 T 660 380 T 960 480" stroke="#7f7f7f" strokeWidth="2.5" strokeDasharray="6 4" fill="none" opacity="0.6" />
          </svg>

          {/* Label Badge 2021 */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/60 shadow-lg pointer-events-none">
            <div className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">BEFORE</div>
            <div className="text-lg font-serif-display font-bold text-[#111111]">{beforeYear} — Baseline</div>
            <div className="text-[11px] text-neutral-600 font-medium">Exposed Soils • Sparse Scrub • 4 Water Bodies</div>
          </div>
        </div>

        {/* Draggable Vertical Divider Handle */}
        <div
          className="comparison-slider"
          style={{ left: `${sliderPos}%` }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
        />

        {/* Drag Instruction Overlay */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-medium pointer-events-none flex items-center gap-1.5">
          <span>◂ Drag slider horizontally to compare ▸</span>
        </div>
      </div>

      {/* 4 Impact Metric Cards Below Comparison */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-black/8 card-hover shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#6F6F6F] mb-1">
            <span>TREE COVER CHANGE</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#35624B]" />
          </div>
          <div className="text-3xl font-serif-display font-bold text-[#183A2A]">
            {changeStats.vegetationGain}
          </div>
          <div className="text-xs text-[#35624B] mt-1 font-medium">
            +16.3 km² canopy expansion
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-black/8 card-hover shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#6F6F6F] mb-1">
            <span>VEGETATION HEALTH</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#35624B]" />
          </div>
          <div className="text-3xl font-serif-display font-bold text-[#183A2A]">
            {changeStats.ndviImprovement}
          </div>
          <div className="text-xs text-[#35624B] mt-1 font-medium">
            NDVI increase from 0.58 to 0.62
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-black/8 card-hover shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#6F6F6F] mb-1">
            <span>WATER STORAGE</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#4D8FA8]" />
          </div>
          <div className="text-3xl font-serif-display font-bold text-[#4D8FA8]">
            {changeStats.waterStorage}
          </div>
          <div className="text-xs text-[#4D8FA8] mt-1 font-medium">
            27 conservation structures added
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-black/8 card-hover shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#6F6F6F] mb-1">
            <span>LAND RESTORATION</span>
            <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <div className="text-3xl font-serif-display font-bold text-amber-800">
            {changeStats.restoredLand}
          </div>
          <div className="text-xs text-amber-700 mt-1 font-medium">
            Gully & sheet erosion mitigated
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeforeAfterComparison;
