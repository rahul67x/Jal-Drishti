import React, { useState } from 'react';
import {
  Trees,
  Droplets,
  MapPin,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { studyAreas, defaultStudyArea } from '../../data/studyAreas';
import type { StudyArea } from '../../data/studyAreas';
import { realGisMetrics } from '../../data/realMetrics';
import MetricCard from './MetricCard';
import AnalyticsTabs from './AnalyticsTabs';
import type { AnalyticsTabId } from './AnalyticsTabs';
import InteractiveMap from './InteractiveMap';
import type { BaseLayerType, LayerState } from './MapLayerControls';
import AnalyticsCharts from './AnalyticsCharts';
import BeforeAfterComparison from './BeforeAfterComparison';
import { ChangeDetectionBanner } from './ChangeDetection';
import AIInsights from './AIInsights';
import DataSources from './DataSources';

export const AnalyticsDashboard: React.FC = () => {
  const [selectedArea, setSelectedArea] = useState<StudyArea>(defaultStudyArea);
  const [activeTab, setActiveTab] = useState<AnalyticsTabId>('overview');
  const [baseLayer, setBaseLayer] = useState<BaseLayerType>('satellite');

  // Layer toggles
  const [layers, setLayers] = useState<LayerState>({
    treeCover: true,
    ndvi: false,
    waterBodies: true,
    drainage: true,
    boundary: true,
    observations: true,
    changeDetection: false,
  });

  const toggleLayer = (key: keyof LayerState) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // When tab changes, automatically adapt visible map layers
  const handleTabSelect = (tab: AnalyticsTabId) => {
    setActiveTab(tab);
    if (tab === 'vegetation') {
      setLayers((prev) => ({
        ...prev,
        treeCover: true,
        ndvi: true,
        changeDetection: false,
      }));
    } else if (tab === 'water') {
      setLayers((prev) => ({
        ...prev,
        waterBodies: true,
        drainage: true,
        changeDetection: false,
      }));
    } else if (tab === 'change') {
      setLayers((prev) => ({
        ...prev,
        changeDetection: true,
      }));
    } else if (tab === 'field') {
      setLayers((prev) => ({
        ...prev,
        observations: true,
      }));
    }
  };

  return (
    <section
      id="analytics"
      className="py-24 sm:py-32 px-4 sm:px-8 lg:px-16 bg-[#F7F9F6] border-y border-black/5"
    >
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header with Study Area Selector */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-black/8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#35624B] uppercase tracking-[0.2em] mb-2">
              <span className="w-2 h-2 rounded-full bg-[#35624B] animate-pulse" />
              <span>INTERACTIVE GIS PLATFORM</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif-display text-[#111111] leading-tight">
              Watershed Insights &amp; Analytics
            </h2>
            <p className="text-[#6F6F6F] text-base sm:text-lg max-w-2xl mt-2">
              Explore multi-spectral remote sensing, high-resolution hydrological modeling, and field-verified conservation interventions.
            </p>
          </div>

          {/* Study Area Dropdown */}
          <div className="flex flex-col items-start lg:items-end gap-1.5">
            <div className="text-[11px] uppercase font-semibold text-[#6F6F6F] tracking-wider">
              Selected Study Area
            </div>
            <div className="relative inline-block">
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white border border-black/10 shadow-sm hover:border-[#35624B] transition-colors cursor-pointer">
                <MapPin className="w-4 h-4 text-[#35624B]" />
                <select
                  value={selectedArea.id}
                  onChange={(e) => {
                    const found = studyAreas.find((a) => a.id === e.target.value);
                    if (found) setSelectedArea(found);
                  }}
                  className="appearance-none bg-transparent font-serif-display text-lg text-[#111111] pr-6 focus:outline-none cursor-pointer"
                >
                  {studyAreas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}, {area.state}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3 pointer-events-none" />
              </div>
            </div>
            <div className="text-xs text-[#6F6F6F]">
              Extent: <span className="font-semibold text-neutral-800">{selectedArea.area}</span> • Hydrologic Basin ID: SAS-43N
            </div>
          </div>
        </div>

        {/* Analytics Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <AnalyticsTabs activeTab={activeTab} onSelectTab={handleTabSelect} />
          <div className="text-xs text-[#6F6F6F] flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>Source: QGIS raster analysis (Sentinel-2, 10m, EPSG:32643)</span>
          </div>
        </div>

        {/* 6 Clickable Analytics Metric Cards — Powered by Real GIS Analysis */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <MetricCard
            icon={Trees}
            iconColor="#183A2A"
            iconBg="#EEF5EC"
            label="Vegetation Area"
            value={realGisMetrics.vegetation.display.value}
            subtext={realGisMetrics.vegetation.display.subtext}
            badge={realGisMetrics.vegetation.display.badge}
            isActive={layers.treeCover}
            onClick={() => {
              toggleLayer('treeCover');
              setActiveTab('vegetation');
            }}
            hint="2023: 3,705.66 ha → 2026: 3,651.68 ha (Net: -53.98 ha / -1.46%)"
          />

          <MetricCard
            icon={Droplets}
            iconColor="#4D8FA8"
            iconBg="#DCEEF2"
            label="Water Area"
            value={realGisMetrics.water.display.value}
            subtext={realGisMetrics.water.display.subtext}
            badge={realGisMetrics.water.display.badge}
            isActive={layers.waterBodies}
            onClick={() => {
              toggleLayer('waterBodies');
              setActiveTab('water');
            }}
            hint="2023: 12.53 ha → 2026: 3.03 ha (Net: -9.50 ha / -75.82%)"
          />

          <MetricCard
            icon={Droplets}
            iconColor="#E11D48"
            iconBg="#FFE4E6"
            label="Water Loss"
            value={realGisMetrics.waterChange.loss.display.value}
            subtext={realGisMetrics.waterChange.loss.display.subtext}
            badge={realGisMetrics.waterChange.loss.display.badge}
            isActive={layers.changeDetection}
            onClick={() => {
              toggleLayer('changeDetection');
              setActiveTab('change');
            }}
            hint="Water loss raster pixel count: 954 px (95,400 m² = 9.54 ha)"
          />

          <MetricCard
            icon={Droplets}
            iconColor="#35624B"
            iconBg="#EEF5EC"
            label="Water Gain"
            value={realGisMetrics.waterChange.gain.display.value}
            subtext={realGisMetrics.waterChange.gain.display.subtext}
            badge={realGisMetrics.waterChange.gain.display.badge}
            isActive={layers.changeDetection}
            onClick={() => {
              toggleLayer('changeDetection');
              setActiveTab('change');
            }}
            hint="Water gain raster pixel count: 4 px (400 m² = 0.04 ha)"
          />

          <MetricCard
            icon={Layers}
            iconColor="#D97706"
            iconBg="#FEF3C7"
            label="Net Water Change"
            value={realGisMetrics.waterChange.net.display.value}
            subtext={realGisMetrics.waterChange.net.display.subtext}
            badge={realGisMetrics.waterChange.net.display.badge}
            isActive={layers.changeDetection}
            onClick={() => {
              toggleLayer('changeDetection');
              setActiveTab('change');
            }}
            hint="Net change: 0.04 ha gain - 9.54 ha loss = -9.50 ha"
          />

          <MetricCard
            icon={MapPin}
            iconColor="#183A2A"
            iconBg="#EEF5EC"
            label="LULC Analysis Area"
            value={realGisMetrics.lulc2026.display.value}
            subtext={realGisMetrics.lulc2026.display.subtext}
            badge={realGisMetrics.lulc2026.display.badge}
            isActive={layers.boundary}
            onClick={() => {
              toggleLayer('boundary');
              setActiveTab('overview');
            }}
            hint="3,721 ha total analyzed extent (372,099 pixels @ 10m × 10m)"
          />
        </div>

        {/* Main Content Area: Change Detection vs Interactive Map */}
        {activeTab === 'change' ? (
          <div className="space-y-6">
            <ChangeDetectionBanner />
            <BeforeAfterComparison />
          </div>
        ) : (
          <div className="space-y-6">
            {layers.changeDetection && <ChangeDetectionBanner />}
            <InteractiveMap
              center={selectedArea.center}
              zoom={selectedArea.zoom}
              baseLayer={baseLayer}
              onSelectBaseLayer={setBaseLayer}
              layers={layers}
              onToggleLayer={toggleLayer}
            />
          </div>
        )}

        {/* Secondary Section: Charts & AI Insights */}
        <div className="space-y-8">
          <AnalyticsCharts
            category={
              activeTab === 'vegetation'
                ? 'vegetation'
                : activeTab === 'water'
                ? 'water'
                : 'overview'
            }
          />

          {/* AI Insights Panel */}
          <AIInsights />

          {/* Data Sources Framework */}
          <DataSources />
        </div>
      </div>
    </section>
  );
};

export default AnalyticsDashboard;
