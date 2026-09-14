import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import { Spinner } from '../components/ui/States';

/*
 * Split per route. Lazy-loading the dashboard inside LandingPage alone changed
 * nothing, because SiteWorkspacePage imported it eagerly and the router
 * imported that — so it stayed in the main chunk. The split has to happen at
 * the route boundary to have any effect.
 */
const SiteDirectoryPage = lazy(() => import('../features/sites/SiteDirectoryPage'));
const SiteWorkspacePage = lazy(() => import('../features/sites/SiteWorkspacePage'));
import { EmptyState } from '../components/ui/States';
import ErrorBoundary from '../components/ui/ErrorBoundary';

/**
 * Every route in one place.
 *
 *   /                  the marketing landing page, unchanged
 *   /sites             the site directory
 *   /sites/:slug       one site's analysis workspace
 *
 * The slug in the URL is what selects the site. This is what makes "pick a
 * site and enter its analysis section" possible at all — the previous build
 * was a single scroll page with no routing, so there was nowhere for a second
 * site to live.
 */
const PageLoading: React.FC = () => (
  <div className="min-h-screen bg-[#F7F9F6] flex items-center justify-center">
    <Spinner label="Loading" />
  </div>
);

const NotFound: React.FC = () => (
  <div className="min-h-screen bg-[#F7F9F6] flex items-center justify-center px-6">
    <EmptyState
      title="Page not found"
      hint="That URL does not match anything in JalDrishti."
      action={
        <Link
          to="/"
          className="inline-block text-xs font-medium px-4 py-2 rounded-full bg-[#183A2A] text-white"
        >
          Go home
        </Link>
      }
      className="max-w-md w-full"
    />
  </div>
);

export const AppRouter: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<ErrorBoundary label="This page"><LandingPage /></ErrorBoundary>} />
      <Route path="/sites" element={<ErrorBoundary label="The site directory"><Suspense fallback={<PageLoading />}><SiteDirectoryPage /></Suspense></ErrorBoundary>} />
      <Route path="/sites/:slug" element={<ErrorBoundary label="This site"><Suspense fallback={<PageLoading />}><SiteWorkspacePage /></Suspense></ErrorBoundary>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
