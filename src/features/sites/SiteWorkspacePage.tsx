import React from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, MapPin, Ruler, Globe2, CheckCircle2, AlertTriangle, Settings } from 'lucide-react';
import { useSite, useSiteMetrics } from './useSites';
import { Spinner, ErrorState, EmptyState } from '../../components/ui/States';
import AnalyticsDashboard from '../../components/analytics/AnalyticsDashboard';
import { formatKm2, formatLatLng, formatSignedHa } from '../../lib/format';
import AuthButton from '../auth/AuthButton';
import { useAuth } from '../auth/AuthContext';
import EditSiteDialog from './EditSiteDialog';

/**
 * A single site's analysis workspace at /sites/:slug.
 *
 * Phase 3 gives it the header plus the full analytics dashboard. The image,
 * satellite and report tabs arrive in phases 4 to 6.
 */
export const SiteWorkspacePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { canEdit } = useAuth();
  const location = useLocation();
  const [editOpen, setEditOpen] = React.useState(false);
  // The Hero's "Watch the Analysis" button navigates here with this flag set.
  const [tourOpen, setTourOpen] = React.useState(
    Boolean((location.state as { startTour?: boolean } | null)?.startTour)
  );
  const siteQuery = useSite(slug);
  const metricsQuery = useSiteMetrics(slug);

  if (siteQuery.isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F9F6] flex items-center justify-center">
        <Spinner label="Loading site" />
      </div>
    );
  }

  if (siteQuery.isError) {
    return (
      <div className="min-h-screen bg-[#F7F9F6] flex items-center justify-center px-6">
        <ErrorState
          title="Could not load this site"
          error={siteQuery.error}
          onRetry={() => siteQuery.refetch()}
          className="max-w-md w-full"
        />
      </div>
    );
  }

  const site = siteQuery.data;

  if (!site) {
    return (
      <div className="min-h-screen bg-[#F7F9F6] flex items-center justify-center px-6">
        <EmptyState
          icon={MapPin}
          title={`No site called "${slug}"`}
          hint="It may have been renamed or is not published."
          action={
            <Link
              to="/sites"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-full bg-[#183A2A] text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              All sites
            </Link>
          }
          className="max-w-md w-full"
        />
      </div>
    );
  }

  const metrics = metricsQuery.data;
  const crossCheck = metrics?.water_change_cross_check_ok;

  return (
    <div className="min-h-screen bg-[#F7F9F6]">
      {/* Site header */}
      <header className="bg-white border-b border-black/8" data-tour="site-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-8">
          <div className="flex items-center justify-between gap-4 mb-3">
            <Link
              to="/sites"
              className="inline-flex items-center gap-1.5 text-xs text-[#6F6F6F] hover:text-[#183A2A] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              All sites
            </Link>
            <div className="flex items-center gap-2">
              {canEdit && (
                <button
                  onClick={() => setEditOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-black/10 text-xs font-medium text-neutral-700 hover:border-[#183A2A]/40 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Settings
                </button>
              )}
              <AuthButton compact />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-[#35624B] font-semibold">
                <MapPin className="w-3.5 h-3.5" />
                {[site.district, site.state, site.country].filter(Boolean).join(', ')}
              </div>
              <h1 className="text-4xl sm:text-5xl font-serif-display text-[#111111] leading-tight mt-1">
                {site.name}
              </h1>
              {site.description && (
                <p className="text-sm text-[#6F6F6F] max-w-2xl mt-2 leading-relaxed">
                  {site.description}
                </p>
              )}
            </div>

            <dl className="flex flex-wrap items-start gap-x-8 gap-y-3 text-xs">
              <div>
                <dt className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[#6F6F6F] font-semibold">
                  <Ruler className="w-3 h-3" /> Extent
                </dt>
                <dd className="text-sm font-semibold text-[#111111] mt-0.5 tabular-nums">
                  {formatKm2(site.area_km2)}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[#6F6F6F] font-semibold">
                  <Globe2 className="w-3 h-3" /> Analysis CRS
                </dt>
                <dd className="text-sm font-semibold text-[#111111] mt-0.5 font-mono">
                  {site.analysis_crs ?? site.crs}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-[#6F6F6F] font-semibold">
                  Centre
                </dt>
                <dd className="text-sm font-semibold text-[#111111] mt-0.5 font-mono tabular-nums">
                  {formatLatLng(site.centre_lat, site.centre_lng)}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-[#6F6F6F] font-semibold">
                  Site ID
                </dt>
                <dd className="text-sm font-semibold text-[#111111] mt-0.5 font-mono">
                  {site.slug}
                </dd>
              </div>
            </dl>
          </div>

          {/*
            Whether the change raster agrees with the two independent water
            masks. Surfaced rather than hidden: if the data ever stops agreeing,
            that should be visible, not silently swallowed.
          */}
          {metrics && crossCheck !== null && crossCheck !== undefined && (
            <div
              data-tour="cross-check"
              className={`mt-5 inline-flex items-start gap-2 px-3.5 py-2 rounded-xl text-[11px] border ${
                crossCheck
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50/70 border-amber-300 text-amber-900'
              }`}
            >
              {crossCheck ? (
                <CheckCircle2 className="w-3.5 h-3.5 mt-px shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 mt-px shrink-0 text-amber-600" />
              )}
              <span>
                {crossCheck ? (
                  <>
                    <span className="font-semibold">Cross-check passed.</span> The change
                    raster ({formatSignedHa(metrics.water_net_change_ha)}) agrees with the
                    two independently derived water masks (
                    {formatSignedHa(metrics.water_change_ha)}).
                  </>
                ) : (
                  <>
                    <span className="font-semibold">Cross-check failed.</span> The change
                    raster ({formatSignedHa(metrics.water_net_change_ha)}) disagrees with
                    the water masks ({formatSignedHa(metrics.water_change_ha)}). Re-run the
                    analysis before relying on these figures.
                  </>
                )}
              </span>
            </div>
          )}
        </div>
      </header>

      <AnalyticsDashboard
        siteSlug={site.slug}
        showHeading={false}
        tourOpen={tourOpen}
        onTourClose={() => setTourOpen(false)}
      />

      {editOpen && <EditSiteDialog site={site} onClose={() => setEditOpen(false)} />}
    </div>
  );
};

export default SiteWorkspacePage;
