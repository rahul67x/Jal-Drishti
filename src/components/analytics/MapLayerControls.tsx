import React, { useState } from 'react';
import { Layers, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';

export type BaseLayerType = 'satellite' | 'streets' | 'terrain';

export interface LayerState {
  treeCover?: boolean; // deprecated / kept for backward-compatibility
  ndvi: boolean;
  waterBodies: boolean;
  water2023?: boolean;
  water2026?: boolean;
  waterChange?: boolean;
  drainage: boolean;
  boundary: boolean;
  observations: boolean;
  changeDetection: boolean;
}

interface MapLayerControlsProps {
  baseLayer: BaseLayerType;
  onSelectBaseLayer: (base: BaseLayerType) => void;
  layers: LayerState;
  onToggleLayer: (layerKey: keyof LayerState) => void;
  onEnableAll?: () => void;
}

export const MapLayerControls: React.FC<MapLayerControlsProps> = ({
  baseLayer,
  onSelectBaseLayer,
  layers,
  onToggleLayer,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Active status for child water layers (defaulting to true if undefined and waterBodies is true)
  const isWater2023Active = layers.water2023 ?? (layers.waterBodies !== false);
  const isWater2026Active = layers.water2026 ?? (layers.waterBodies !== false);
  const isWaterBodiesActive = layers.waterBodies && (isWater2023Active || isWater2026Active);
  const isWaterChangeActive = Boolean(layers.waterChange);

  // Count active overlays excluding deprecated treeCover
  const activeCount = [
    layers.ndvi,
    isWater2023Active,
    isWater2026Active,
    isWaterChangeActive,
    layers.drainage,
    layers.boundary,
    layers.observations,
    layers.changeDetection,
  ].filter(Boolean).length;

  return (
    // On a 375 px phone a fixed 288 px panel covers most of the map. Cap it to
    // the viewport minus the map's own inset so the map stays usable.
    <div className="absolute top-4 right-4 z-[1000] w-[min(18rem,calc(100vw-3rem))] bg-white/95 backdrop-blur-md rounded-2xl border border-black/10 shadow-xl overflow-hidden text-xs">
      {/* Header with collapse button */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-black/5 cursor-pointer select-none hover:bg-neutral-100 transition-colors"
      >
        <div className="flex items-center gap-2 font-medium text-[#111111]">
          <Layers className="w-4 h-4 text-[#35624B]" />
          <span className="font-sans font-semibold tracking-wide">MAP LAYERS</span>
        </div>
        <button className="text-neutral-500 hover:text-neutral-900">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-3.5 space-y-3.5 max-h-[70vh] overflow-y-auto no-scrollbar">
          {/* Base Layer Switcher */}
          <div>
            <div className="text-[10px] uppercase font-semibold text-[#6F6F6F] tracking-wider mb-2">
              BASE MAP
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-100 rounded-xl">
              {(['satellite', 'streets', 'terrain'] as BaseLayerType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => onSelectBaseLayer(type)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-medium capitalize transition-all duration-150 ${
                    baseLayer === type
                      ? 'bg-white text-[#183A2A] shadow-sm font-semibold'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Overlay Layers Switcher */}
          <div>
            <div className="flex items-center justify-between text-[10px] uppercase font-semibold text-[#6F6F6F] tracking-wider mb-2">
              <span>GIS OVERLAYS</span>
              <span className="text-neutral-400">
                {activeCount} ACTIVE
              </span>
            </div>

            <div className="space-y-1.5">
              {/* 1. NDVI Analysis */}
              <div
                id="layer-toggle-ndvi"
                onClick={() => onToggleLayer('ndvi')}
                className={`flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-colors border ${
                  layers.ndvi
                    ? 'bg-[#EEF5EC]/70 border-[#35624B]/30 text-[#183A2A]'
                    : 'bg-white/60 border-transparent text-[#6F6F6F] hover:bg-neutral-100/80 hover:text-[#111111]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">🌿</span>
                  <span className="font-medium text-[12px]">NDVI Analysis</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {layers.ndvi ? (
                    <Eye className="w-3.5 h-3.5 text-[#35624B]" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-neutral-400" />
                  )}
                  <div className={`layer-toggle ${layers.ndvi ? 'active' : ''}`} />
                </div>
              </div>

              {/* 2. Water Bodies (Parent with child toggles) */}
              <div className="rounded-xl border border-black/8 bg-neutral-50/60 p-1 space-y-1">
                {/* Parent Row */}
                <div
                  id="layer-toggle-water-bodies"
                  onClick={() => onToggleLayer('waterBodies')}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors border ${
                    isWaterBodiesActive
                      ? 'bg-[#EEF5EC]/80 border-[#35624B]/30 text-[#183A2A]'
                      : 'bg-white/70 border-transparent text-[#6F6F6F] hover:bg-neutral-100/80 hover:text-[#111111]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">💧</span>
                    <span className="font-semibold text-[12px]">Water Bodies</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isWaterBodiesActive ? (
                      <Eye className="w-3.5 h-3.5 text-[#35624B]" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-neutral-400" />
                    )}
                    <div className={`layer-toggle ${isWaterBodiesActive ? 'active' : ''}`} />
                  </div>
                </div>

                {/* Child Toggles */}
                <div className="pl-3 pr-1 py-0.5 space-y-1">
                  {/* Water 2023 */}
                  <div
                    id="layer-toggle-water-2023"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLayer('water2023');
                    }}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors border text-[11px] ${
                      isWater2023Active
                        ? 'bg-[#E0F2FE]/80 border-sky-300/60 text-sky-900 font-medium'
                        : 'bg-white/50 border-transparent text-[#6F6F6F] hover:bg-neutral-100/80 hover:text-[#111111]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400 font-mono text-[10px] select-none">├──</span>
                      <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                      <span>Water 2023</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isWater2023Active ? (
                        <Eye className="w-3 h-3 text-sky-600" />
                      ) : (
                        <EyeOff className="w-3 h-3 text-neutral-400" />
                      )}
                      <div
                        className={`layer-toggle ${isWater2023Active ? 'active' : ''}`}
                        style={{ transform: 'scale(0.85)' }}
                      />
                    </div>
                  </div>

                  {/* Water 2026 */}
                  <div
                    id="layer-toggle-water-2026"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLayer('water2026');
                    }}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors border text-[11px] ${
                      isWater2026Active
                        ? 'bg-[#DBEAFE]/80 border-blue-300/60 text-blue-900 font-medium'
                        : 'bg-white/50 border-transparent text-[#6F6F6F] hover:bg-neutral-100/80 hover:text-[#111111]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400 font-mono text-[10px] select-none">└──</span>
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      <span>Water 2026</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isWater2026Active ? (
                        <Eye className="w-3 h-3 text-blue-600" />
                      ) : (
                        <EyeOff className="w-3 h-3 text-neutral-400" />
                      )}
                      <div
                        className={`layer-toggle ${isWater2026Active ? 'active' : ''}`}
                        style={{ transform: 'scale(0.85)' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Water Change 2023–2026 */}
              <div
                id="layer-toggle-water-change"
                onClick={() => onToggleLayer('waterChange')}
                className={`flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-colors border ${
                  isWaterChangeActive
                    ? 'bg-[#EEF5EC]/70 border-[#35624B]/30 text-[#183A2A]'
                    : 'bg-white/60 border-transparent text-[#6F6F6F] hover:bg-neutral-100/80 hover:text-[#111111]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">🌊</span>
                  <span className="font-medium text-[12px]">Water Change 2023–2026</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isWaterChangeActive ? (
                    <Eye className="w-3.5 h-3.5 text-[#35624B]" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-neutral-400" />
                  )}
                  <div className={`layer-toggle ${isWaterChangeActive ? 'active' : ''}`} />
                </div>
              </div>

              {/* 4. Drainage Network */}
              <div
                id="layer-toggle-drainage"
                onClick={() => onToggleLayer('drainage')}
                className={`flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-colors border ${
                  layers.drainage
                    ? 'bg-[#EEF5EC]/70 border-[#35624B]/30 text-[#183A2A]'
                    : 'bg-white/60 border-transparent text-[#6F6F6F] hover:bg-neutral-100/80 hover:text-[#111111]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">〰️</span>
                  <span className="font-medium text-[12px]">Drainage Network</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {layers.drainage ? (
                    <Eye className="w-3.5 h-3.5 text-[#35624B]" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-neutral-400" />
                  )}
                  <div className={`layer-toggle ${layers.drainage ? 'active' : ''}`} />
                </div>
              </div>

              {/* 5. Watershed Boundary */}
              <div
                id="layer-toggle-boundary"
                onClick={() => onToggleLayer('boundary')}
                className={`flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-colors border ${
                  layers.boundary
                    ? 'bg-[#EEF5EC]/70 border-[#35624B]/30 text-[#183A2A]'
                    : 'bg-white/60 border-transparent text-[#6F6F6F] hover:bg-neutral-100/80 hover:text-[#111111]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">📍</span>
                  <span className="font-medium text-[12px]">Watershed Boundary</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {layers.boundary ? (
                    <Eye className="w-3.5 h-3.5 text-[#35624B]" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-neutral-400" />
                  )}
                  <div className={`layer-toggle ${layers.boundary ? 'active' : ''}`} />
                </div>
              </div>

              {/* 6. Field Observations */}
              <div
                id="layer-toggle-observations"
                onClick={() => onToggleLayer('observations')}
                className={`flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-colors border ${
                  layers.observations
                    ? 'bg-[#EEF5EC]/70 border-[#35624B]/30 text-[#183A2A]'
                    : 'bg-white/60 border-transparent text-[#6F6F6F] hover:bg-neutral-100/80 hover:text-[#111111]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">📷</span>
                  <span className="font-medium text-[12px]">Field Observations</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {layers.observations ? (
                    <Eye className="w-3.5 h-3.5 text-[#35624B]" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-neutral-400" />
                  )}
                  <div className={`layer-toggle ${layers.observations ? 'active' : ''}`} />
                </div>
              </div>

              {/* 7. Change Detection */}
              <div
                id="layer-toggle-change-detection"
                onClick={() => onToggleLayer('changeDetection')}
                className={`flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-colors border ${
                  layers.changeDetection
                    ? 'bg-[#EEF5EC]/70 border-[#35624B]/30 text-[#183A2A]'
                    : 'bg-white/60 border-transparent text-[#6F6F6F] hover:bg-neutral-100/80 hover:text-[#111111]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">🔄</span>
                  <span className="font-medium text-[12px]">Change Detection</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {layers.changeDetection ? (
                    <Eye className="w-3.5 h-3.5 text-[#35624B]" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-neutral-400" />
                  )}
                  <div className={`layer-toggle ${layers.changeDetection ? 'active' : ''}`} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapLayerControls;
