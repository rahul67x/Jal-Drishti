import React, { useState, useRef, useCallback, useMemo } from 'react';
import { ArrowLeftRight, TrendingUp, TrendingDown, Info, Satellite } from 'lucide-react';
import type { SiteMetricsRow, SatelliteImageRow, SiteRow } from '../../lib/database.types';
import { satelliteImageUrl } from '../../features/satellite/api';
import { formatHa, formatPct, formatSignedHa, formatDate } from '../../lib/format';

/**
 * Draggable before/after comparison.
 *
 * When two satellite scenes from different years exist, it compares the real
 * imagery. When they do not, it falls back to a schematic and says so — the
 * original version presented hand-drawn SVG as a "Multitemporal Satellite
 * Comparison", with year dropdowns that only changed the caption, implying
 * imagery the app did not have.
 *
 * Upload two scenes on the Satellite tab and this becomes a genuine comparison.
 */
export const BeforeAfterComparison: React.FC<{
  metrics?: SiteMetricsRow | null;
  satellite?: SatelliteImageRow[];
  /** Used to shape the viewport so square extents are not cropped. */
  site?: SiteRow | null;
}> = ({ metrics, satellite = [], site = null }) => {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * The earliest and latest dated scenes, when there are two different years to
   * compare. One scene, or several from the same year, is not a comparison.
   */
  const pair = useMemo(() => {
    const dated = satellite
      .filter((s) => s.year !== null)
      .sort((a, b) => (a.year as number) - (b.year as number));
    if (dated.length < 2) return null;
    const before = dated[0];
    const after = dated[dated.length - 1];
    return before.year === after.year ? null : { before, after };
  }, [satellite]);

  const beforeYear = pair?.before.year ?? metrics?.vegetation_baseline_year ?? '—';
  const afterYear = pair?.after.year ?? metrics?.vegetation_current_year ?? '—';

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(percent);
  }, []);

  /**
   * Shape the viewport to the site's own extent.
   *
   * A fixed 8:3 window with object-cover crops a square study area badly —
   * Saswad is 6110 x 6090 m, so roughly a third of it was being cut off top and
   * bottom. Clamped so a very long or very tall extent still gives a usable box.
   */
  const aspect = (() => {
    if (!site?.bbox_min_lat || !site.bbox_max_lat || !site.bbox_min_lng || !site.bbox_max_lng) {
      return 16 / 9;
    }
    const midLat = ((site.bbox_min_lat + site.bbox_max_lat) / 2) * (Math.PI / 180);
    const widthDeg = (site.bbox_max_lng - site.bbox_min_lng) * Math.cos(midLat);
    const heightDeg = site.bbox_max_lat - site.bbox_min_lat;
    if (heightDeg <= 0) return 16 / 9;
    return Math.max(0.75, Math.min(2.5, widthDeg / heightDeg));
  })();

  const vegDown = Number(metrics?.vegetation_change_ha ?? 0) < 0;
  const waterDown = Number(metrics?.water_change_ha ?? 0) < 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-black/8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#35624B] uppercase tracking-wider">
            {pair ? <Satellite className="w-4 h-4" /> : <ArrowLeftRight className="w-4 h-4" />}
            <span>{pair ? 'Multitemporal Satellite Comparison' : 'Schematic Comparison'}</span>
          </div>
          <h3 className="text-xl font-serif-display text-[#111111] mt-0.5">
            Watershed Evolution ({beforeYear} vs {afterYear})
          </h3>
        </div>

        {pair ? (
          <div className="text-[11px] text-[#6F6F6F] sm:text-right leading-relaxed">
            <div>
              <span className="font-medium text-neutral-800">{pair.before.title}</span>
              {pair.before.sensor ? ` · ${pair.before.sensor}` : ''}
              {pair.before.acquisition_date ? ` · ${formatDate(pair.before.acquisition_date)}` : ''}
            </div>
            <div>
              <span className="font-medium text-neutral-800">{pair.after.title}</span>
              {pair.after.sensor ? ` · ${pair.after.sensor}` : ''}
              {pair.after.acquisition_date ? ` · ${formatDate(pair.after.acquisition_date)}` : ''}
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-1.5 text-[11px] text-amber-800 bg-amber-50/80 border border-amber-200 rounded-xl px-3 py-2 max-w-sm">
            <Info className="w-3.5 h-3.5 mt-px shrink-0 text-amber-600" />
            <span>
              These panels are illustrations, not satellite imagery. Upload two scenes
              from different years on the Satellite tab and this becomes a real
              comparison. The measured figures below are real either way.
            </span>
          </div>
        )}
      </div>

      <div
        ref={containerRef}
        onMouseMove={(e) => isDragging && handleMove(e.clientX)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onTouchMove={(e) => e.touches[0] && handleMove(e.touches[0].clientX)}
        style={{ aspectRatio: String(aspect) }}
        className="relative w-full max-h-[70vh] rounded-3xl overflow-hidden border border-black/10 shadow-2xl select-none cursor-ew-resize bg-neutral-900"
      >
        {/* AFTER — greener, fuller water */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#1b3d2b] via-[#244f38] to-[#122b1e] flex items-center justify-center overflow-hidden">
          {pair ? (
            <img
              src={satelliteImageUrl(pair.after)}
              alt={pair.after.title}
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />
          ) : (
          <svg className="w-full h-full opacity-90" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
            <path d="M 0 100 Q 250 50 500 120 T 1000 80" stroke="rgba(168,197,160,0.15)" strokeWidth="60" fill="none" />
            <path d="M 0 300 Q 300 240 600 320 T 1000 280" stroke="rgba(168,197,160,0.2)" strokeWidth="80" fill="none" />
            <polygon points="120,80 340,60 420,180 280,240 100,190" fill="#183A2A" opacity="0.85" />
            <polygon points="520,140 760,110 880,250 680,310 500,220" fill="#23533c" opacity="0.9" />
            <polygon points="260,340 480,310 560,490 320,530 180,440" fill="#183A2A" opacity="0.8" />
            <polygon points="620,360 890,320 950,510 740,540 580,430" fill="#2d6a4f" opacity="0.85" />
            <rect x="360" y="210" width="140" height="90" rx="8" fill="#52b788" opacity="0.75" />
            <rect x="710" y="220" width="120" height="80" rx="6" fill="#74c69d" opacity="0.8" />
            <ellipse cx="440" cy="270" rx="42" ry="24" fill="#0284c7" opacity="0.95" />
            <ellipse cx="660" cy="380" rx="55" ry="32" fill="#0284c7" opacity="0.95" />
            <path d="M 120 80 Q 280 200 440 270 T 660 380 T 960 480" stroke="#38bdf8" strokeWidth="5" fill="none" opacity="0.9" />
          </svg>
          )}
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/60 shadow-lg text-right pointer-events-none">
            <div className="text-[10px] uppercase font-bold text-[#35624B] tracking-wider">After</div>
            <div className="text-lg font-serif-display font-bold text-[#111111]">{afterYear}</div>
            <div className="text-[11px] text-[#35624B] font-medium">
              Vegetation {formatHa(metrics?.vegetation_current_ha)}
            </div>
          </div>
        </div>

        {/* BEFORE — drier */}
        <div
          className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#4a3b2c] via-[#5c4a37] to-[#382b1f] overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        >
          {pair ? (
            <img
              src={satelliteImageUrl(pair.before)}
              alt={pair.before.title}
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />
          ) : (
          <svg className="w-full h-full opacity-90" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
            <path d="M 0 100 Q 250 50 500 120 T 1000 80" stroke="rgba(212,195,163,0.15)" strokeWidth="60" fill="none" />
            <path d="M 0 300 Q 300 240 600 320 T 1000 280" stroke="rgba(212,195,163,0.2)" strokeWidth="80" fill="none" />
            <polygon points="130,90 280,80 340,160 220,200 120,160" fill="#354228" opacity="0.55" />
            <polygon points="560,160 680,140 740,220 620,260 540,210" fill="#3b4d2c" opacity="0.5" />
            <polygon points="280,360 410,340 460,460 310,480 230,420" fill="#354228" opacity="0.45" />
            <rect x="360" y="210" width="140" height="90" rx="8" fill="#b08968" opacity="0.65" />
            <rect x="710" y="220" width="120" height="80" rx="6" fill="#a68a64" opacity="0.65" />
            <ellipse cx="440" cy="270" rx="20" ry="10" fill="#52796f" opacity="0.6" />
            <path d="M 120 80 Q 280 200 440 270 T 660 380 T 960 480" stroke="#7f7f7f" strokeWidth="2.5" strokeDasharray="6 4" fill="none" opacity="0.6" />
          </svg>
          )}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/60 shadow-lg pointer-events-none">
            <div className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Before</div>
            <div className="text-lg font-serif-display font-bold text-[#111111]">{beforeYear}</div>
            <div className="text-[11px] text-neutral-600 font-medium">
              Vegetation {formatHa(metrics?.vegetation_baseline_ha)}
            </div>
          </div>
        </div>

        <div
          className="comparison-slider"
          style={{ left: `${sliderPos}%` }}
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
        />

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-medium pointer-events-none">
          ◂ Drag to compare ▸
        </div>
      </div>

      {/* Measured figures */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Vegetation Change',
            value: formatSignedHa(metrics?.vegetation_change_ha),
            sub: `${formatPct(metrics?.vegetation_change_pct)} of ${formatHa(metrics?.vegetation_baseline_ha)}`,
            down: vegDown,
          },
          {
            label: 'Water Change',
            value: formatSignedHa(metrics?.water_change_ha),
            sub: `${formatPct(metrics?.water_change_pct)} of ${formatHa(metrics?.water_baseline_ha)}`,
            down: waterDown,
          },
          {
            label: 'Water Loss Area',
            value: formatHa(metrics?.water_loss_ha),
            sub: 'Change raster, class −1',
            down: true,
          },
          {
            label: 'Water Gain Area',
            value: formatHa(metrics?.water_gain_ha),
            sub: 'Change raster, class +1',
            down: false,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="p-4 rounded-2xl bg-white border border-black/8 card-hover shadow-sm"
          >
            <div className="flex items-center justify-between text-xs text-[#6F6F6F] mb-1">
              <span className="uppercase tracking-wider text-[10px]">{card.label}</span>
              {card.down ? (
                <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
              ) : (
                <TrendingUp className="w-3.5 h-3.5 text-[#35624B]" />
              )}
            </div>
            <div
              className={`text-2xl font-serif-display font-bold tabular-nums ${
                card.down ? 'text-rose-700' : 'text-[#183A2A]'
              }`}
            >
              {card.value}
            </div>
            <div className="text-xs text-[#6F6F6F] mt-1">{card.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BeforeAfterComparison;
