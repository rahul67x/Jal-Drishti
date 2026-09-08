import { useEffect } from 'react';
import { MapPin, Satellite, ChartNoAxesCombined } from 'lucide-react';

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

export default function Challenge() {
  useReveal();

  return (
    <section className="py-24 sm:py-32 px-6 sm:px-10 lg:px-16 bg-white">
      <h2 className="font-serif-display text-4xl sm:text-5xl lg:text-6xl leading-tight max-w-4xl mx-auto text-center text-[#111111] reveal">
        Watersheds are changing faster than traditional monitoring can understand.
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mt-16 max-w-6xl mx-auto">
        <div 
          className="rounded-3xl border border-[rgba(0,0,0,0.08)] bg-white p-8 card-hover reveal"
          style={{ transitionDelay: '0s' }}
        >
          <div className="w-12 h-12 rounded-2xl bg-[#EEF5EC] flex items-center justify-center">
            <MapPin className="w-6 h-6 text-[#35624B]" />
          </div>
          <h3 className="text-xl font-semibold text-[#111111] mt-5">Fragmented Field Data</h3>
          <p className="text-[#6F6F6F] mt-3 leading-relaxed">
            Geo-tagged images are often collected only as documentation, leaving valuable location-specific information disconnected from spatial analysis.
          </p>
        </div>

        <div 
          className="rounded-3xl border border-[rgba(0,0,0,0.08)] bg-white p-8 card-hover reveal"
          style={{ transitionDelay: '0.15s' }}
        >
          <div className="w-12 h-12 rounded-2xl bg-[#EEF5EC] flex items-center justify-center">
            <Satellite className="w-6 h-6 text-[#35624B]" />
          </div>
          <h3 className="text-xl font-semibold text-[#111111] mt-5">Limited Spatial Context</h3>
          <p className="text-[#6F6F6F] mt-3 leading-relaxed">
            Manual surveys and fragmented reporting cannot provide continuous, large-scale visibility into land, water, vegetation, and environmental change.
          </p>
        </div>

        <div 
          className="rounded-3xl border border-[rgba(0,0,0,0.08)] bg-white p-8 card-hover reveal"
          style={{ transitionDelay: '0.3s' }}
        >
          <div className="w-12 h-12 rounded-2xl bg-[#EEF5EC] flex items-center justify-center">
            <ChartNoAxesCombined className="w-6 h-6 text-[#35624B]" />
          </div>
          <h3 className="text-xl font-semibold text-[#111111] mt-5">Delayed Decision-Making</h3>
          <p className="text-[#6F6F6F] mt-3 leading-relaxed">
            Without integrated visualization and analysis, planners struggle to measure intervention impacts and generate reliable evidence.
          </p>
        </div>
      </div>
    </section>
  );
}
