import React, { useState, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trees, Droplets, MapPin, Layers, ChevronDown, Upload, Smartphone } from 'lucide-react';
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
import { TrendConfidenceCard } from './TrendConfidenceCard';
import { WatershedHealthReportCard } from './WatershedHealthReportCard';
import { PhotoSatelliteValidationCard } from './PhotoSatelliteValidationCard';
import { MultilingualAudioSummary } from './MultilingualAudioSummary';
import { InterventionImpactTool } from './InterventionImpactTool';
import { LulcTransitionMatrix } from './LulcTransitionMatrix';
import { SiteComparisonDashboard } from './SiteComparisonDashboard';
import { SoilErosionSimulator } from './SoilErosionSimulator';
import { ClimateStressNormalizer } from './ClimateStressNormalizer';
import { CropWaterRequirementCard } from './CropWaterRequirementCard';
import { SmartInterventionRecommender } from './SmartInterventionRecommender';
import { MobileFieldSurveyPortal } from '../../features/geotag/MobileFieldSurveyPortal';
import { DirectRasterUploader } from '../../features/rasters/DirectRasterUploader';
import { Spinner, ErrorState, EmptyState } from '../ui/States';
import { useSites, useSite, useSiteMetrics } from '../../features/sites/useSites';
import { useSiteRasters } from '../../features/rasters/useSiteRasters';
import { useGeotaggedImages } from '../../features/geotag/useGeotaggedImages';
import { useSatelliteImages } from '../../features/satellite/useSatelliteImages';
import GeotagGallery from '../../features/geotag/GeotagGallery';
import GeotagUploader from '../../features/geotag/GeotagUploader';
import SatelliteUploader from '../../features/satellite/SatelliteUploader';
import SatelliteGallery from '../../features/satellite/SatelliteGallery';
// @react-pdf/renderer is around 1.4 MB. Loading it eagerly would push it onto
// every visitor, including on the landing page, for a tab most never open.
const ReportPanel = lazy(() => import('../../features/reports/ReportPanel'));
import { formatHa, formatKm2, formatPct, formatSignedHa, formatCount } from '../../lib/format';
import TourOverlay from '../../features/tour/TourOverlay';
import type { TourStep } from '../../features/tour/steps';

interface AnalyticsDashboardProps {
  /** Runs the guided tour. The host owns the flag so the Hero button can set it. */
  tourOpen?: boolean;
  onTourClose?: () => void;
  /** Which site to show. Falls back to the first published site when omitted. */
  siteSlug?: string;
  /** The workspace page renders its own header, so it hides this one. */
  showHeading?: boolean;
}

/**
 * The analytics dashboard.
 *
 * Every figure on this screen now comes from Postgres. Previously the metric
 * cards read a hand-typed realMetrics.ts while the banner beside them read a
 * fabricated sampleData.ts, so the same screen reported vegetation at both
 * -1.46% and +4.8%. The cards below are computed by site_metrics_view from the
 * raw QGIS pixel counts and cannot drift.
 */
export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  siteSlug,
  showHeading = true,
  tourOpen = false,
  onTourClose,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AnalyticsTabId>('overview');
  const [baseLayer, setBaseLayer] = useState<BaseLayerType>('satellite');
  const [uploaderOpen, setUploaderOpen] = useState(false);
  const [workspaceCategory, setWorkspaceCategory] = useState<'overview' | 'soil_climate' | 'smart_planning'>('overview');
  const [mobilePortalOpen, setMobilePortalOpen] = useState(false);

  // The dashboard owns all layer visibility, including the two water years.
  // The map derives 'waterBodies' from them rather than storing it twice.
  const [layers, setLayers] = useState<LayerState>({
    treeCover: true,
    ndvi: false,
    waterBodies: true,
    water2023: true,
    water2026: true,
    waterChange: false,
    drainage: true,
    boundary: true,
    observations: true,
    changeDetection: false,
  });

  // Without an explicit slug (the landing page), show the first published site.
  const sitesQuery = useSites();
  const resolvedSlug = siteSlug ?? sitesQuery.data?.[0]?.slug;

  const siteQuery = useSite(resolvedSlug);
  const metricsQuery = useSiteMetrics(resolvedSlug);
  const rastersQuery = useSiteRasters(siteQuery.data?.id);
  const geotagQuery = useGeotaggedImages(siteQuery.data?.id);
  const satelliteQuery = useSatelliteImages(siteQuery.data?.id);

  const site = siteQuery.data;
  const metrics = metricsQuery.data;

  const toggleLayer = (key: keyof LayerState) => {
    setLayers((prev) =>
      key === 'waterBodies'
        ? { ...prev, waterBodies: !prev.waterBodies, water2023: !prev.waterBodies, water2026: !prev.waterBodies }
        : { ...prev, [key]: !prev[key] }
    );
  };

  const patchLayers = (patch: Partial<LayerState>) =>
    setLayers((prev) => ({ ...prev, ...patch }));

  /**
   * Applies one tour step.
   *
   * Goes through the same state setters a click would, so the tour cannot fall
   * out of step with the UI: if a tab or layer key is removed, this stops
   * compiling rather than silently doing nothing.
   */
  const applyTourStep = (step: TourStep) => {
    setWorkspaceCategory('overview');
    if (step.apply?.tab) setActiveTab(step.apply.tab);
    if (step.apply?.layers) patchLayers(step.apply.layers);
  };

  const handleTabSelect = (tab: AnalyticsTabId) => {
    setActiveTab(tab);
    if (tab === 'vegetation') {
      setLayers((prev) => ({ ...prev, treeCover: true, ndvi: true, changeDetection: false }));
    } else if (tab === 'water') {
      setLayers((prev) => ({
        ...prev,
        waterBodies: true,
        water2023: true,
        water2026: true,
        drainage: true,
        changeDetection: false,
      }));
    } else if (tab === 'change') {
      setLayers((prev) => ({ ...prev, changeDetection: true }));
    } else if (tab === 'field') {
      setLayers((prev) => ({ ...prev, observations: true }));
    }
  };

  /**
   * The six metric cards, built from the computed view.
   *
   * Each `hint` states the underlying pixel arithmetic, so hovering a card
   * shows where the number came from rather than asking for trust.
   */
  const cards = useMemo(() => {
    if (!metrics) return [];

    const vegUp = Number(metrics.vegetation_change_ha ?? 0) >= 0;
    const waterUp = Number(metrics.water_change_ha ?? 0) >= 0;

    return [
      {
        icon: Trees,
        iconColor: '#183A2A',
        iconBg: '#EEF5EC',
        label: 'Vegetation Area',
        value: formatHa(metrics.vegetation_current_ha),
        subtext: `${metrics.vegetation_baseline_year ?? '—'}: ${formatHa(metrics.vegetation_baseline_ha)}`,
        badge: {
          text: formatPct(metrics.vegetation_change_pct),
          type: (vegUp ? 'positive' : 'neutral') as 'positive' | 'neutral',
        },
        isActive: layers.treeCover,
        onClick: () => {
          toggleLayer('treeCover');
          setActiveTab('vegetation');
        },
        hint: `${metrics.vegetation_baseline_year}: ${formatHa(metrics.vegetation_baseline_ha)} → ${metrics.vegetation_current_year}: ${formatHa(metrics.vegetation_current_ha)} (net ${formatSignedHa(metrics.vegetation_change_ha)}, ${formatPct(metrics.vegetation_change_pct)})`,
      },
      {
        icon: Droplets,
        iconColor: '#4D8FA8',
        iconBg: '#DCEEF2',
        label: 'Water Area',
        value: formatHa(metrics.water_current_ha),
        subtext: `${metrics.water_baseline_year ?? '—'}: ${formatHa(metrics.water_baseline_ha)}`,
        badge: {
          text: formatPct(metrics.water_change_pct),
          type: (waterUp ? 'positive' : 'neutral') as 'positive' | 'neutral',
        },
        isActive: layers.waterBodies,
        onClick: () => {
          toggleLayer('waterBodies');
          setActiveTab('water');
        },
        hint: `${metrics.water_baseline_year}: ${formatHa(metrics.water_baseline_ha)} → ${metrics.water_current_year}: ${formatHa(metrics.water_current_ha)} (net ${formatSignedHa(metrics.water_change_ha)}, ${formatPct(metrics.water_change_pct)})`,
      },
      {
        icon: Droplets,
        iconColor: '#E11D48',
        iconBg: '#FFE4E6',
        label: 'Water Loss',
        value: formatHa(metrics.water_loss_ha),
        subtext: 'Change raster, class −1',
        badge: { text: 'Loss', type: 'neutral' as const },
        isActive: layers.changeDetection,
        onClick: () => {
          toggleLayer('changeDetection');
          setActiveTab('change');
        },
        hint: `Pixels classified as water loss between ${metrics.change_year_from} and ${metrics.change_year_to}`,
      },
      {
        icon: Droplets,
        iconColor: '#35624B',
        iconBg: '#EEF5EC',
        label: 'Water Gain',
        value: formatHa(metrics.water_gain_ha),
        subtext: 'Change raster, class +1',
        badge: { text: 'Gain', type: 'positive' as const },
        isActive: layers.changeDetection,
        onClick: () => {
          toggleLayer('changeDetection');
          setActiveTab('change');
        },
        hint: `Pixels classified as water gain between ${metrics.change_year_from} and ${metrics.change_year_to}`,
      },
      {
        icon: Layers,
        iconColor: '#D97706',
        iconBg: '#FEF3C7',
        label: 'Net Water Change',
        value: formatSignedHa(metrics.water_net_change_ha),
        subtext: `Net ${metrics.change_year_from}–${metrics.change_year_to}`,
        badge: {
          text: metrics.water_change_cross_check_ok ? 'Verified' : 'Check',
          type: (metrics.water_change_cross_check_ok ? 'positive' : 'neutral') as
            | 'positive'
            | 'neutral',
        },
        isActive: layers.changeDetection,
        onClick: () => {
          toggleLayer('changeDetection');
          setActiveTab('change');
        },
        hint: `${formatHa(metrics.water_gain_ha)} gain − ${formatHa(metrics.water_loss_ha)} loss = ${formatSignedHa(metrics.water_net_change_ha)}. ${
          metrics.water_change_cross_check_ok
            ? 'Matches the independently derived water masks.'
            : 'Does NOT match the water masks — re-run the analysis.'
        }`,
      },
      {
        icon: MapPin,
        iconColor: '#183A2A',
        iconBg: '#EEF5EC',
        label: 'Analysis Extent',
        value: formatKm2(metrics.total_area_km2),
        subtext: `${formatHa(metrics.total_area_ha)} analysed`,
        badge: { text: 'Measured', type: 'info' as const },
        isActive: layers.boundary,
        onClick: () => {
          toggleLayer('boundary');
          setActiveTab('overview');
        },
        hint: `${formatHa(metrics.total_area_ha)} total, summed from the QGIS class areas`,
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metrics, layers.treeCover, layers.waterBodies, layers.changeDetection, layers.boundary]);

  const isLoading = sitesQuery.isLoading || siteQuery.isLoading || metricsQuery.isLoading;
  const error = sitesQuery.error ?? siteQuery.error ?? metricsQuery.error;

  const gridMeta = useMemo(() => {
    const withGrid = rastersQuery.data?.find((r) => r.pixel_size_m && r.total_pixels);
    if (!withGrid) return null;
    return `${withGrid.width_px} × ${withGrid.height_px} @ ${withGrid.pixel_size_m} m · ${formatCount(withGrid.total_pixels)} px · ${withGrid.crs}`;
  }, [rastersQuery.data]);

  return (
    <section
      id="analytics"
      className="py-24 sm:py-32 px-4 sm:px-8 lg:px-16 bg-[#F7F9F6] border-y border-black/5"
    >
      <div className="max-w-7xl mx-auto space-y-10">
        {showHeading && (
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
                Explore multi-spectral remote sensing, hydrological modelling, and
                field-verified conservation interventions.
              </p>
            </div>

            {/* Site selector + Direct GeoTIFF Upload button */}
            <div className="flex flex-col items-start lg:items-end gap-2">
              <button
                onClick={() => setUploaderOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#183A2A] text-white text-xs font-semibold hover:bg-[#183A2A]/90 transition-colors shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                Direct GeoTIFF Upload
              </button>
              <div className="relative inline-block">
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white border border-black/10 shadow-sm hover:border-[#35624B] transition-colors cursor-pointer">
                  <MapPin className="w-4 h-4 text-[#35624B]" />
                  <select
                    value={resolvedSlug ?? ''}
                    aria-label="Select study area"
                    onChange={(e) => navigate(`/sites/${e.target.value}`)}
                    className="appearance-none bg-transparent font-serif-display text-lg text-[#111111] pr-6 focus:outline-none cursor-pointer"
                  >
                    {(sitesQuery.data ?? []).map((s) => (
                      <option key={s.id} value={s.slug}>
                        {s.name}
                        {s.state ? `, ${s.state}` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3 pointer-events-none" />
                </div>
              </div>
              {site && (
                <div className="text-xs text-[#6F6F6F]">
                  Extent:{' '}
                  <span className="font-semibold text-neutral-800">
                    {formatKm2(site.area_km2)}
                  </span>{' '}
                  • Site ID: {site.slug}
                </div>
              )}
            </div>
          </div>
        )}

        {isLoading && <Spinner label="Loading watershed analytics" />}

        {error && (
          <ErrorState
            title="Could not load analytics"
            error={error}
            onRetry={() => {
              siteQuery.refetch();
              metricsQuery.refetch();
            }}
          />
        )}

        {!isLoading && !error && !site && (
          <EmptyState
            icon={MapPin}
            title="No study area available"
            hint="The sites table is empty. Apply supabase/seed/saswad.sql to populate it."
          />
        )}

        {site && (
          <>
            {/* Beginner-Friendly Workspace Category Navigation (Site View Only) */}
            {!showHeading && (
              <div className="bg-white rounded-2xl p-3 sm:p-4 border border-black/8 shadow-xs flex flex-wrap items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">Workspace Focus:</span>
                  <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setWorkspaceCategory('overview')}
                      className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                        workspaceCategory === 'overview'
                          ? 'bg-[#183A2A] text-white shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900 bg-white/50'
                      }`}
                    >
                      <span>🏆</span> Overview &amp; Map
                    </button>
                    <button
                      type="button"
                      onClick={() => setWorkspaceCategory('soil_climate')}
                      className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                        workspaceCategory === 'soil_climate'
                          ? 'bg-[#183A2A] text-white shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900 bg-white/50'
                      }`}
                    >
                      <span>⛰️</span> Soil &amp; Hydrology Risk
                    </button>
                    <button
                      type="button"
                      onClick={() => setWorkspaceCategory('smart_planning')}
                      className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                        workspaceCategory === 'smart_planning'
                          ? 'bg-[#183A2A] text-white shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900 bg-white/50'
                      }`}
                    >
                      <span>🤖</span> AI Smart Planning
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMobilePortalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs"
                >
                  <Smartphone className="w-4 h-4" />
                  📱 Mobile Survey Portal
                </button>
              </div>
            )}

            {/* Overview & Map Category */}
            {(showHeading || workspaceCategory === 'overview') && (
              <>
                {/* Trend Claim Confidence Card, Watershed Health Report Card, and Geo-Photo Ground-Truth Validation */}
                <div className="space-y-6">
                  <TrendConfidenceCard
                    metrics={metrics}
                    geotagged={geotagQuery.data ?? []}
                    satelliteScenes={satelliteQuery.data ?? []}
                    rasters={rastersQuery.data ?? []}
                  />

                  <WatershedHealthReportCard
                    site={site}
                    metrics={metrics}
                    geotagged={geotagQuery.data ?? []}
                    satelliteScenes={satelliteQuery.data ?? []}
                  />

                  {!showHeading && (
                    <MultilingualAudioSummary
                      site={site}
                      metrics={metrics}
                    />
                  )}

                  {!showHeading && (
                    <PhotoSatelliteValidationCard
                      geotagged={geotagQuery.data ?? []}
                      metrics={metrics}
                      rasters={rastersQuery.data ?? []}
                    />
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4">
                  <AnalyticsTabs activeTab={activeTab} onSelectTab={handleTabSelect} />
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setUploaderOpen(true)}
                      className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#183A2A] text-white text-xs font-semibold hover:bg-[#183A2A]/90 transition-colors shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Direct GeoTIFF Upload
                    </button>
                    {gridMeta && (
                      <div className="text-xs text-[#6F6F6F] flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-mono">{gridMeta}</span>
                      </div>
                    )}
                  </div>
                </div>

                {metricsQuery.isLoading ? (
                  <Spinner label="Computing metrics" />
                ) : cards.length > 0 ? (
                  <div data-tour="metric-cards" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                    {cards.map((card) => (
                      <MetricCard key={card.label} {...card} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No metrics for this site yet"
                    hint="Raster statistics have not been seeded, so there is nothing to compute from."
                  />
                )}

                {activeTab === 'report' ? (
                  <div data-tour="report-panel">
                    <Suspense fallback={<Spinner label="Loading report builder" />}>
                      <ReportPanel site={site} />
                    </Suspense>
                  </div>
                ) : activeTab === 'satellite' ? (
                  <div className="space-y-6">
                    <SatelliteUploader site={site} />
                    <SatelliteGallery site={site} />
                  </div>
                ) : activeTab === 'field' ? (
                  <div data-tour="field-panel" className="space-y-6">
                    <GeotagUploader site={site} />
                    <GeotagGallery site={site} />
                  </div>
                ) : activeTab === 'change' ? (
                  <div className="space-y-6">
                    <div data-tour="change-banner"><ChangeDetectionBanner metrics={metrics} /></div>
                    <BeforeAfterComparison metrics={metrics} satellite={satelliteQuery.data ?? []} site={site} />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {layers.changeDetection && <ChangeDetectionBanner metrics={metrics} />}
                    {rastersQuery.isLoading ? (
                      <Spinner label="Loading map layers" />
                    ) : (
                      <InteractiveMap
                        site={site}
                        rasters={rastersQuery.data ?? []}
                        geotagged={geotagQuery.data ?? []}
                        baseLayer={baseLayer}
                        onSelectBaseLayer={setBaseLayer}
                        layers={layers}
                        onLayersChange={patchLayers}
                      />
                    )}
                  </div>
                )}
              </>
            )}

            {/* Soil & Hydrology Risk Category */}
            {(showHeading || workspaceCategory === 'soil_climate') && (
              <div className="space-y-8 pt-4">
                {!showHeading && (
                  <SoilErosionSimulator
                    site={site}
                    metrics={metrics}
                  />
                )}

                {!showHeading && (
                  <ClimateStressNormalizer
                    site={site}
                    metrics={metrics}
                  />
                )}

                {!showHeading && (
                  <CropWaterRequirementCard
                    site={site}
                    metrics={metrics ?? null}
                  />
                )}

                {!showHeading && (
                  <InterventionImpactTool
                    geotagged={geotagQuery.data ?? []}
                    metrics={metrics}
                  />
                )}

                <LulcTransitionMatrix
                  metrics={metrics}
                />

                <AnalyticsCharts
                  slug={site.slug}
                  category={
                    activeTab === 'vegetation'
                      ? 'vegetation'
                      : activeTab === 'water'
                      ? 'water'
                      : 'overview'
                  }
                />
              </div>
            )}

            {/* AI Smart Planning Category */}
            {(showHeading || workspaceCategory === 'smart_planning') && (
              <div className="space-y-8 pt-4">
                {!showHeading && (
                  <SmartInterventionRecommender
                    site={site}
                    metrics={metrics}
                  />
                )}

                <AIInsights
                  siteId={site.id}
                  site={site}
                  metrics={metrics}
                  geotagged={geotagQuery.data ?? []}
                  rasters={rastersQuery.data ?? []}
                  satelliteScenes={satelliteQuery.data ?? []}
                />

                <SiteComparisonDashboard
                  sites={sitesQuery.data ?? []}
                  activeMetrics={metrics}
                />

                <DataSources site={site} />
              </div>
            )}

            {/* Direct GeoTIFF Uploader Modal */}
            <DirectRasterUploader
              siteId={site.id}
              isOpen={uploaderOpen}
              onClose={() => setUploaderOpen(false)}
            />

            {/* Separate Mobile Field Survey Portal Modal Popup */}
            {mobilePortalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="relative w-full max-w-lg my-8">
                  <MobileFieldSurveyPortal
                    site={site}
                    onClose={() => setMobilePortalOpen(false)}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {tourOpen && site && (
        <TourOverlay onApply={applyTourStep} onClose={() => onTourClose?.()} />
      )}
    </section>
  );
};

export default AnalyticsDashboard;
