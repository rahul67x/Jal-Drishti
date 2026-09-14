import { useEffect } from 'react';
import { Camera, Satellite, Layers, Sparkles, BarChart3 } from 'lucide-react';

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

const steps = [
  {
    icon: Camera,
    title: 'Geo-tagged Images',
    description: 'Field photographs capture real-world watershed conditions with precise geographic locations.',
  },
  {
    icon: Satellite,
    title: 'Satellite Intelligence',
    // The vegetation and water analysis runs on 10 m Sentinel-2; only the
    // terrain-derived drainage network comes from 30 m SRTM. Stating a single
    // "30 m" figure contradicted the resolution shown by the analytics section.
    description:
      'Sentinel-2 imagery at 10 m, with 30 m SRTM elevation for terrain, provides consistent coverage across the landscape.',
  },
  {
    icon: Layers,
    title: 'GIS Integration',
    description: 'Spatial layers, watershed boundaries, imagery, and field observations are connected in one system.',
  },
  {
    icon: Sparkles,
    title: 'AI-Assisted Interpretation',
    description: 'The system helps identify environmental patterns, changes, interventions, and areas requiring attention.',
  },
  {
    icon: BarChart3,
    title: 'Actionable Insights',
    description: 'Clear visualization supports planners and administrators in making evidence-based decisions.',
  },
];

export default function Workflow() {
  useReveal();

  return (
    <section className="py-24 sm:py-32 px-6 sm:px-10 lg:px-16 bg-white reveal">
      <h2 className="font-serif-display text-4xl sm:text-5xl lg:text-6xl text-center text-[#111111] leading-tight max-w-3xl mx-auto reveal">
        From field evidence to informed action.
      </h2>

      {/* Desktop Layout */}
      <div className="hidden lg:flex items-start justify-between max-w-6xl mx-auto mt-16 relative">
        <div className="absolute top-[36px] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-[#A8C5A0] via-[#4D8FA8] to-[#A8C5A0]"></div>
        
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center text-center w-1/5 relative z-10 reveal" style={{ transitionDelay: `${index * 150}ms` }}>
            <div className="w-[72px] h-[72px] rounded-full bg-white border-2 border-[#A8C5A0] flex items-center justify-center shadow-md">
              <step.icon size={28} color="#35624B" />
            </div>
            <span className="text-xs text-[#6F6F6F] mt-4 tracking-wider uppercase font-medium">
              Step {String(index + 1).padStart(2, '0')}
            </span>
            <h3 className="text-sm font-semibold text-[#111111] mt-2">{step.title}</h3>
            <p className="text-xs text-[#6F6F6F] mt-2 max-w-[160px] leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden relative max-w-lg mx-auto mt-12">
        <div className="absolute left-[35px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#A8C5A0] to-[#4D8FA8]"></div>
        
        {steps.map((step, index) => (
          <div key={index} className="flex items-start gap-6 mb-10 relative reveal">
            <div className="w-[72px] h-[72px] min-w-[72px] rounded-full bg-white border-2 border-[#A8C5A0] flex items-center justify-center shadow-md z-10">
              <step.icon size={28} color="#35624B" />
            </div>
            <div className="flex flex-col pt-2">
              <span className="text-xs text-[#6F6F6F] tracking-wider uppercase font-medium">
                Step {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="text-sm font-semibold text-[#111111] mt-1">{step.title}</h3>
              <p className="text-xs text-[#6F6F6F] mt-2 leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
