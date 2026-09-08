import { useEffect } from 'react';

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

export default function Impact() {
  useReveal();

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
          <div className="text-4xl sm:text-5xl font-serif-display text-white">30 m</div>
          <div className="text-sm text-white/70 mt-2">Satellite Data Resolution</div>
        </div>

        <div className="text-center p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm reveal">
          <div className="text-4xl sm:text-5xl font-serif-display text-white">360°</div>
          <div className="text-sm text-white/70 mt-2">Watershed Visualization</div>
        </div>

        <div className="text-center p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm reveal">
          <div className="text-4xl sm:text-5xl font-serif-display text-white">Scalable</div>
          <div className="text-sm text-white/70 mt-2">Across Regions</div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto text-center mt-16 text-white/70 text-base sm:text-lg leading-relaxed reveal">
        <p>
          JalDrishti creates a scalable and cost-effective framework for integrating geo-coded imagery, GIS, remote sensing, and satellite intelligence into watershed development programs.
        </p>
      </div>
    </section>
  );
}
