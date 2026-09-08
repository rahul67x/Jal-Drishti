import React, { useState } from 'react';
import { Layers, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';

export type BaseLayerType = 'satellite' | 'streets' | 'terrain';

export interface LayerState {
  treeCover: boolean;
  ndvi: boolean;
  waterBodies: boolean;
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

  const layerItems: { key: keyof LayerState; label: string; icon: string; color: string }[] = [
    { key: 'treeCover', label: 'Tree Cover', icon: '🌳', color: '#183A2A' },
    { key: 'ndvi', label: 'NDVI Analysis', icon: '🌿', color: '#35624B' },
    { key: 'waterBodies', label: 'Water Bodies', icon: '💧', color: '#4D8FA8' },
    { key: 'drainage', label: 'Drainage Network', icon: '〰️', color: '#2563EB' },
    { key: 'boundary', label: 'Watershed Boundary', icon: '📍', color: '#183A2A' },
    { key: 'observations', label: 'Field Observations', icon: '📷', color: '#E11D48' },
    { key: 'changeDetection', label: 'Change Detection', icon: '🔄', color: '#D97706' },
  ];

  return (
    <div className="absolute top-4 right-4 z-[1000] max-w-xs w-72 bg-white/95 backdrop-blur-md rounded-2xl border border-black/10 shadow-xl overflow-hidden text-xs">
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
                {Object.values(layers).filter(Boolean).length} ACTIVE
              </span>
            </div>

            <div className="space-y-1.5">
              {layerItems.map((item) => {
                const isActive = layers[item.key];
                return (
                  <div
                    key={item.key}
                    onClick={() => onToggleLayer(item.key)}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-colors border ${
                      isActive
                        ? 'bg-[#EEF5EC]/70 border-[#35624B]/30 text-[#183A2A]'
                        : 'bg-white/60 border-transparent text-[#6F6F6F] hover:bg-neutral-100/80 hover:text-[#111111]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{item.icon}</span>
                      <span className="font-medium text-[12px]">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isActive ? (
                        <Eye className="w-3.5 h-3.5 text-[#35624B]" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                      <div className={`layer-toggle ${isActive ? 'active' : ''}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapLayerControls;
