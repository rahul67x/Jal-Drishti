import { lazy, Suspense } from 'react'
import Hero from '../components/Hero'
import Challenge from '../components/Challenge'
import WatershedDashboard from '../components/WatershedDashboard'
import Workflow from '../components/Workflow'
import AnalyticalOutputs from '../components/AnalyticalOutputs'
import Impact from '../components/Impact'
import Solution from '../components/Solution'
import FinalCTA from '../components/FinalCTA'
import Footer from '../components/Footer'
import { Spinner } from '../components/ui/States'

/*
 * The dashboard drags in Leaflet, geotiff and Recharts — around 700 kB. Loading
 * it eagerly meant the hero could not paint until all of it had arrived, on a
 * page most visitors scroll rather than interact with.
 */
const AnalyticsDashboard = lazy(() => import('../components/analytics/AnalyticsDashboard'))

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <Hero />
      <div id="the-challenge"><Challenge /></div>
      <div id="gis-analysis"><WatershedDashboard /></div>
      {/*
        No siteSlug: the dashboard falls back to the first published site, so
        the landing page keeps working as more sites are added.
      */}
      <Suspense
        fallback={
          <div className="py-32 bg-[#F7F9F6] border-y border-black/5">
            <Spinner label="Loading watershed analytics" />
          </div>
        }
      >
        <AnalyticsDashboard />
      </Suspense>
      <Workflow />
      <AnalyticalOutputs />
      <Impact />
      <div id="solution"><Solution /></div>
      <FinalCTA />
      <Footer />
    </main>
  )
}
