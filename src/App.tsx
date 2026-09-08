import Hero from './components/Hero'
import Challenge from './components/Challenge'
import WatershedDashboard from './components/WatershedDashboard'
import AnalyticsDashboard from './components/analytics/AnalyticsDashboard'
import Workflow from './components/Workflow'
import AnalyticalOutputs from './components/AnalyticalOutputs'
import Impact from './components/Impact'
import Solution from './components/Solution'
import FinalCTA from './components/FinalCTA'
import Footer from './components/Footer'

export default function App() {
  return (
    <main className="min-h-screen bg-white">
      <Hero />
      <div id="the-challenge"><Challenge /></div>
      <div id="gis-analysis"><WatershedDashboard /></div>
      <AnalyticsDashboard />
      <Workflow />
      <AnalyticalOutputs />
      <Impact />
      <div id="solution"><Solution /></div>
      <FinalCTA />
      <Footer />
    </main>
  )
}
