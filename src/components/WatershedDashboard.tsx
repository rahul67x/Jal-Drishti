import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Droplets, Ruler, Camera, ArrowUpRight } from 'lucide-react';
import { useSites, useSite, useSiteMetrics } from '../features/sites/useSites';
import { useSiteRasters } from '../features/rasters/useSiteRasters';
import { useGeotaggedImages } from '../features/geotag/useGeotaggedImages';
import { Spinner } from './ui/States';
import { formatHa, formatKm2, formatPct, formatSignedHa, formatCount } from '../lib/format';

function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/**
 * Landing-page summary of the default site.
 *
 * Every figure here is read from the database. This section previously showed
 * invented placeholders — "NDVI: 0.62", "12 Active Bodies", "1,248 observations
 * across 36 locations" — directly above the real analytics dashboard. A reader
 * who took those at face value and then scrolled to the measured figures would
 * find them contradicted, which discredits the real numbers along with the fake
 * ones.
 *
 * The illustration on the left is stylised and labelled as such. It is
 * decoration, not a map.
 */
export default function WatershedDashboard() {
  useReveal();

  const sitesQuery = useSites();
  const slug = sitesQuery.data?.[0]?.slug;
  const siteQuery = useSite(slug);
  const metricsQuery = useSiteMetrics(slug);
  const rastersQuery = useSiteRasters(siteQuery.data?.id);
  const photosQuery = useGeotaggedImages(siteQuery.data?.id);

  const site = siteQuery.data;
  const m = metricsQuery.data;
  const grid = rastersQuery.data?.find((r) => r.pixel_size_m);
  const photoCount = photosQuery.data?.length ?? 0;

  const isLoading = sitesQuery.isLoading || siteQuery.isLoading || metricsQuery.isLoading;
  const vegDown = Number(m?.vegetation_change_ha ?? 0) < 0;
  const waterDown = Number(m?.water_change_ha ?? 0) < 0;

  return (
    <section className="py-24 sm:py-32 px-6 sm:px-10 lg:px-16 bg-[#F7F9F6]">
      <h2 className="font-serif-display text-4xl sm:text-5xl lg:text-6xl text-center text-[#111111] leading-tight reveal">
        One landscape. Multiple layers of intelligence.
      </h2>
      <p className="text-[#6F6F6F] text-lg text-center mt-4 max-w-2xl mx-auto reveal">
        Field observations and satellite-derived datasets, measured across the{' '}
        {site?.name ?? 'study'} watershed.
      </p>

      <div className="max-w-6xl mx-auto mt-16 rounded-[2rem] overflow-hidden border border-[rgba(0,0,0,0.08)] shadow-2xl bg-white reveal">
        <div className="grid grid-cols-1 lg:grid-cols-5">
          {/* LEFT: stylised illustration, explicitly not a map */}
          <div className="relative lg:col-span-3 h-[400px] lg:h-[520px] bg-gradient-to-br from-[#EEF5EC] via-[#DCEEF2] to-[#EEF5EC] overflow-hidden p-6">
            <svg className="w-full h-full" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <polygon points="50,450 150,200 400,100 650,150 750,300 600,480 300,490" stroke="#35624B" fill="rgba(168,197,160,0.2)" strokeWidth="2" strokeDasharray="8 4" />
              <path d="M 150 200 Q 300 250 400 350 T 600 480" stroke="#4D8FA8" fill="none" strokeWidth="1.5" className="animate-flow" />
              <path d="M 400 100 Q 450 250 400 350" stroke="#4D8FA8" fill="none" strokeWidth="1.5" className="animate-flow" />
              <circle cx="250" cy="300" r="60" fill="rgba(168,197,160,0.3)" />
              <ellipse cx="550" cy="250" rx="80" ry="40" fill="rgba(168,197,160,0.3)" />
              <circle cx="650" cy="380" r="45" fill="rgba(168,197,160,0.3)" />
              <rect x="200" y="380" width="100" height="60" rx="8" fill="rgba(200,180,150,0.2)" />
              <rect x="450" y="150" width="120" height="50" rx="8" fill="rgba(200,180,150,0.2)" />
              <circle cx="350" cy="280" r="4" fill="#4D8FA8" className="animate-map-pulse" />
              <circle cx="410" cy="360" r="4" fill="#4D8FA8" className="animate-map-pulse" style={{ animationDelay: '0.2s' }} />
              <circle cx="580" cy="260" r="4" fill="#4D8FA8" className="animate-map-pulse" style={{ animationDelay: '0.4s' }} />
              <circle cx="220" cy="410" r="4" fill="#4D8FA8" className="animate-map-pulse" style={{ animationDelay: '0.6s' }} />
              <circle cx="500" cy="180" r="4" fill="#4D8FA8" className="animate-map-pulse" style={{ animationDelay: '0.8s' }} />
            </svg>

            <div className="absolute bottom-6 left-6 bg-white/60 backdrop-blur-md rounded-xl px-4 py-3 border border-white/60">
              <div className="text-xs tracking-[0.15em] font-semibold text-[#111111]">
                {site?.name?.toUpperCase() ?? 'STUDY AREA'} WATERSHED
              </div>
              <div className="text-xs text-[#6F6F6F]">
                {grid ? `${grid.pixel_size_m} m analysis grid · ${grid.crs}` : 'Illustration'}
              </div>
            </div>

            {/* Honest label: this is decoration, and the real map is one click away. */}
            <Link
              to={site ? `/sites/${site.slug}` : '/sites'}
              className="absolute top-6 right-6 bg-white/70 hover:bg-white backdrop-blur-md rounded-full px-3.5 py-1.5 flex items-center gap-1.5 border border-white/60 transition-colors"
            >
              <span className="text-xs font-medium text-[#35624B]">Illustration — open the real map</span>
              <ArrowUpRight size={13} className="text-[#35624B]" />
            </Link>
          </div>

          {/* RIGHT: measured figures */}
          <div className="lg:col-span-2 p-6 lg:p-8 flex flex-col gap-4 justify-center">
            {isLoading ? (
              <Spinner label="Loading measurements" />
            ) : !m ? (
              <div className="text-sm text-[#6F6F6F]">
                No measurements available yet. Seed a site to populate this panel.
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[#F7F9F6] p-4 card-hover">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-[#EEF5EC] rounded-lg">
                      <Leaf size={16} className="text-[#35624B]" />
                    </div>
                    <span className="text-xs text-[#6F6F6F] uppercase tracking-wider">
                      Vegetation Area
                    </span>
                  </div>
                  <div className="flex items-end justify-between mt-1 gap-2">
                    <div className="text-2xl font-semibold text-[#111111] tabular-nums">
                      {formatHa(m.vegetation_current_ha)}
                    </div>
                    <div
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        vegDown ? 'bg-rose-50 text-rose-700' : 'bg-[#EEF5EC] text-[#35624B]'
                      }`}
                    >
                      {formatPct(m.vegetation_change_pct)}
                    </div>
                  </div>
                  <div className="text-xs text-[#6F6F6F] mt-1">
                    {m.vegetation_baseline_year}: {formatHa(m.vegetation_baseline_ha)}
                  </div>
                </div>

                <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[#F7F9F6] p-4 card-hover">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-[#DCEEF2] rounded-lg">
                      <Droplets size={16} className="text-[#4D8FA8]" />
                    </div>
                    <span className="text-xs text-[#6F6F6F] uppercase tracking-wider">
                      Surface Water
                    </span>
                  </div>
                  <div className="flex items-end justify-between mt-1 gap-2">
                    <div className="text-2xl font-semibold text-[#111111] tabular-nums">
                      {formatHa(m.water_current_ha)}
                    </div>
                    <div
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        waterDown ? 'bg-rose-50 text-rose-700' : 'bg-[#DCEEF2] text-[#4D8FA8]'
                      }`}
                    >
                      {formatPct(m.water_change_pct)}
                    </div>
                  </div>
                  <div className="text-xs text-[#6F6F6F] mt-1">
                    Net {formatSignedHa(m.water_net_change_ha)} between {m.change_year_from} and{' '}
                    {m.change_year_to}
                  </div>
                </div>

                <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[#F7F9F6] p-4 card-hover">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-[#EEF5EC] rounded-lg">
                      <Ruler size={16} className="text-[#35624B]" />
                    </div>
                    <span className="text-xs text-[#6F6F6F] uppercase tracking-wider">
                      Analysis Extent
                    </span>
                  </div>
                  <div className="text-2xl font-semibold text-[#111111] mt-1 tabular-nums">
                    {formatKm2(m.total_area_km2)}
                  </div>
                  <div className="text-xs text-[#6F6F6F] mt-1">
                    {grid
                      ? `${formatCount(grid.total_pixels)} pixels at ${grid.pixel_size_m} m`
                      : formatHa(m.total_area_ha)}
                  </div>
                </div>

                <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[#F7F9F6] p-4 card-hover">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-[#EEF5EC] rounded-lg">
                      <Camera size={16} className="text-[#35624B]" />
                    </div>
                    <span className="text-xs text-[#6F6F6F] uppercase tracking-wider">
                      Geo-tagged Observations
                    </span>
                  </div>
                  <div className="text-2xl font-semibold text-[#111111] mt-1 tabular-nums">
                    {formatCount(photoCount)}
                  </div>
                  <div className="text-xs text-[#6F6F6F] mt-1">
                    {photoCount === 0
                      ? 'None recorded yet'
                      : `${photosQuery.data?.filter((p) => p.gps_source === 'exif').length ?? 0} positioned by camera GPS`}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
