import { useEffect } from 'react';
import { useSites, useSite, useSiteMetrics } from '../features/sites/useSites';
import { useSiteRasters } from '../features/rasters/useSiteRasters';
import { formatKm2 } from '../lib/format';

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
 * Impact band.
 *
 * The resolution figure is read from the raster grid rather than written into
 * the markup. It previously read "30 m", contradicting the 10 m stated by the
 * analytics section two screens below — the kind of inconsistency that makes a
 * reader distrust both numbers.
 */
export default function Impact() {
  useReveal();

  const sitesQuery = useSites();
  const slug = sitesQuery.data?.[0]?.slug;
  const siteQuery = useSite(slug);
  const metricsQuery = useSiteMetrics(slug);
  const rastersQuery = useSiteRasters(siteQuery.data?.id);

  // The finest grid actually analysed, not a number typed into the page.
  const finest = rastersQuery.data
    ?.filter((r) => r.pixel_size_m)
    .sort((a, b) => Number(a.pixel_size_m) - Number(b.pixel_size_m))[0];

  const siteCount = sitesQuery.data?.length ?? 0;

  return (
    <section className="py-24 sm:py-32 px-6 sm:px-10 lg:px-16 bg-[#183A2A] text-white">
      <div className="max-w-4xl mx-auto text-center reveal">
        <h2 className="font-serif-display text-4xl sm:text-5xl lg:text-6xl text-white leading-tight">
          Better evidence. Better planning. Stronger watersheds.
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto mt-16">
        <div className="text-center p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm reveal">
          <div className="text-xs text-[#A8C5A0] tracking-widest uppercase mb-3">01</div>
          <div className="text-white font-medium text-lg">Integrated Spatial Monitoring</div>
        </div>

        <div className="text-center p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm reveal">
          <div className="text-4xl sm:text-5xl font-serif-display text-white">
            {finest ? `${Number(finest.pixel_size_m)} m` : '—'}
          </div>
          <div className="text-sm text-white/70 mt-2">Analysis Grid Resolution</div>
        </div>

        <div className="text-center p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm reveal">
          <div className="text-4xl sm:text-5xl font-serif-display text-white">
            {metricsQuery.data ? formatKm2(metricsQuery.data.total_area_km2, 0) : '—'}
          </div>
          <div className="text-sm text-white/70 mt-2">Analysed to Date</div>
        </div>

        <div className="text-center p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm reveal">
          <div className="text-4xl sm:text-5xl font-serif-display text-white">
            {siteCount || '—'}
          </div>
          <div className="text-sm text-white/70 mt-2">
            {siteCount === 1 ? 'Site Monitored' : 'Sites Monitored'}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto text-center mt-16 text-white/70 text-base sm:text-lg leading-relaxed reveal">
        <p>
          JalDrishti creates a scalable and cost-effective framework for integrating
          geo-coded imagery, GIS, remote sensing, and satellite intelligence into
          watershed development programmes.
        </p>
      </div>
    </section>
  );
}
