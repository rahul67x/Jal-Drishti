import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, MapPinned, ArrowLeft } from 'lucide-react';
import { useSites, useAllSiteMetrics } from './useSites';
import SiteCard from './SiteCard';
import { Spinner, ErrorState, EmptyState } from '../../components/ui/States';
import AuthButton from '../auth/AuthButton';
import { useAuth } from '../auth/AuthContext';
import AddSiteDialog from './AddSiteDialog';

/**
 * The site directory — requirement #1.
 *
 * Lists every site in the database. Clicking one opens its own analysis
 * workspace at /sites/:slug.
 *
 * Only Saswad exists today, by design: the pathway for many sites is built,
 * but no dummy locations are invented to fill it out.
 */
export const SiteDirectoryPage: React.FC = () => {
  const { canEdit } = useAuth();
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const sitesQuery = useSites();
  const metricsQuery = useAllSiteMetrics();

  const filtered = useMemo(() => {
    const sites = sitesQuery.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return sites;
    return sites.filter((s) =>
      [s.name, s.district, s.state, s.slug]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q))
    );
  }, [sitesQuery.data, search]);

  const total = sitesQuery.data?.length ?? 0;

  return (
    <div className="min-h-screen bg-[#F7F9F6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-10 sm:py-16">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-black/8">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-[#6F6F6F] hover:text-[#183A2A] transition-colors mb-3"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to JalDrishti
            </Link>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#35624B] uppercase tracking-[0.2em] mb-2">
              <span className="w-2 h-2 rounded-full bg-[#35624B] animate-pulse" />
              <span>Site Registry</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-serif-display text-[#111111] leading-tight">
              Watershed Study Areas
            </h1>
            <p className="text-[#6F6F6F] text-sm sm:text-base max-w-2xl mt-2">
              Every monitored site, its own analysis, its own evidence. Select one to
              open its workspace.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <AuthButton />
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sites"
                aria-label="Search sites"
                className="pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-black/10 text-sm w-56 focus:outline-none focus:border-[#35624B] transition-colors"
              />
            </div>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              disabled={!canEdit}
              title="Register a new study area"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#183A2A] text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#35624B] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add site
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="mt-8">
          {sitesQuery.isLoading && <Spinner label="Loading sites" />}

          {sitesQuery.isError && (
            <ErrorState
              title="Could not load the site registry"
              error={sitesQuery.error}
              onRetry={() => sitesQuery.refetch()}
            />
          )}

          {sitesQuery.isSuccess && total === 0 && (
            <EmptyState
              icon={MapPinned}
              title="No sites yet"
              hint="Run the Saswad seed to populate the registry: npm run db:build, then apply supabase/seed/saswad.sql."
            />
          )}

          {sitesQuery.isSuccess && total > 0 && filtered.length === 0 && (
            <EmptyState
              icon={Search}
              title={`No site matches "${search}"`}
              hint="Try a different name, district, or state."
            />
          )}

          {filtered.length > 0 && (
            <>
              <div className="text-xs text-[#6F6F6F] mb-4">
                {filtered.length === total
                  ? `${total} site${total === 1 ? '' : 's'}`
                  : `${filtered.length} of ${total} sites`}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((site) => (
                  <SiteCard
                    key={site.id}
                    site={site}
                    metrics={metricsQuery.data?.get(site.slug)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {addOpen && <AddSiteDialog onClose={() => setAddOpen(false)} />}
    </div>
  );
};

export default SiteDirectoryPage;
