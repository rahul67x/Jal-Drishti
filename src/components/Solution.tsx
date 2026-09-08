import { useEffect } from 'react';
import { Check } from 'lucide-react';

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

export default function Solution() {
  useReveal();

  const features = [
    "Integrated Geospatial Visualization",
    "Improved Geo-Coded Image Interpretation",
    "Enhanced Watershed Monitoring",
    "Evidence-Based Decision Support"
  ];

  return (
    <section className="py-24 sm:py-32 px-6 sm:px-10 lg:px-16 bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 max-w-6xl mx-auto items-center">
        <div>
          <h2 className="font-serif-display text-3xl sm:text-4xl lg:text-5xl text-[#111111] leading-[1.1] reveal">
            <span className="block">Not just documentation.</span>
            <span className="block text-[#35624B]">A living spatial record</span>
            <span className="block">of the watershed.</span>
          </h2>
          <p className="mt-6 text-[#6F6F6F] text-base leading-relaxed reveal">
            Geo-tagged images become analytical assets rather than static photographs — each observation linked to spatial context, temporal change, and watershed-scale intelligence.
          </p>
        </div>

        <div>
          <div className="flex flex-col">
            {features.map((feature, index) => (
              <div key={index} className="py-5 flex items-start gap-4 border-b border-[rgba(0,0,0,0.08)] last:border-b-0 reveal">
                <div className="w-6 h-6 rounded-full bg-[#EEF5EC] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={14} color="#35624B" />
                </div>
                <div className="font-medium text-[#111111] text-base sm:text-lg">
                  {feature}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
