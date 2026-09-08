import { useEffect } from 'react';
import { Map as MapIcon, TreePine, GitBranch, Droplets, MapPin, ArrowLeftRight } from 'lucide-react';

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

export default function AnalyticalOutputs() {
  useReveal();

  return (
    <section className="py-24 sm:py-32 px-6 sm:px-10 lg:px-16 bg-[#EEF5EC]">
      <h2 className="font-serif-display text-4xl sm:text-5xl lg:text-6xl text-center text-[#111111] leading-tight reveal">
        Turning spatial data into watershed intelligence.
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mt-16">
        
        {/* Card 1 */}
        <div className="rounded-3xl border border-[rgba(0,0,0,0.08)] bg-white p-6 card-hover reveal">
          <div className="h-40 rounded-2xl mb-4 overflow-hidden grid grid-cols-4 grid-rows-4 gap-1 p-2 bg-[#F5F5F5]">
             {Array.from({ length: 16 }).map((_, i) => (
               <div key={i} className={`rounded-sm ${
                 i % 5 === 0 ? 'bg-[#35624B]' : 
                 i % 3 === 0 ? 'bg-[#4D8FA8]' : 
                 i % 2 === 0 ? 'bg-[#A8C5A0]' : 'bg-[#D4C3A3]'
               }`} />
             ))}
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 rounded-full bg-[#EEF5EC]">
              <MapIcon size={16} color="#35624B" />
            </span>
            <h3 className="font-semibold text-[#111111]">Land Use & Land Cover</h3>
          </div>
          <p className="text-sm text-[#6F6F6F]">
            Classify terrain into agricultural, built-up, barren, water, and vegetation categories.
          </p>
        </div>

        {/* Card 2 */}
        <div className="rounded-3xl border border-[rgba(0,0,0,0.08)] bg-white p-6 card-hover reveal">
          <div className="h-40 rounded-2xl mb-4 overflow-hidden flex items-center justify-center bg-[#F5F5F5] p-6">
             <div className="w-full h-12 rounded-full bg-gradient-to-r from-[#D4644A] via-[#E8C547] to-[#35624B]" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 rounded-full bg-[#EEF5EC]">
              <TreePine size={16} color="#35624B" />
            </span>
            <h3 className="font-semibold text-[#111111]">Vegetation Change</h3>
          </div>
          <p className="text-sm text-[#6F6F6F]">
            Track vegetation health changes across seasons using spectral indices.
          </p>
        </div>

        {/* Card 3 */}
        <div className="rounded-3xl border border-[rgba(0,0,0,0.08)] bg-white p-6 card-hover reveal">
          <div className="h-40 rounded-2xl mb-4 overflow-hidden bg-[#F8FAFC] flex items-center justify-center">
            <svg width="100%" height="100%" viewBox="0 0 200 120" className="opacity-80">
              <path d="M100,120 C100,80 80,60 50,40" stroke="#4D8FA8" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M100,120 C100,80 120,60 150,40" stroke="#4D8FA8" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M100,80 C100,50 90,30 100,10" stroke="#4D8FA8" strokeWidth="5" fill="none" strokeLinecap="round" />
              <path d="M80,60 C70,40 50,30 30,20" stroke="#4D8FA8" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M120,60 C130,40 150,30 170,20" stroke="#4D8FA8" strokeWidth="3" fill="none" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 rounded-full bg-[#DCEEF2]">
              <GitBranch size={16} color="#4D8FA8" className="rotate-180" />
            </span>
            <h3 className="font-semibold text-[#111111]">Drainage Network</h3>
          </div>
          <p className="text-sm text-[#6F6F6F]">
            Map stream orders and watershed flow paths from elevation models.
          </p>
        </div>

        {/* Card 4 */}
        <div className="rounded-3xl border border-[rgba(0,0,0,0.08)] bg-white p-6 card-hover reveal">
          <div className="h-40 rounded-2xl mb-4 overflow-hidden bg-[#F8FAFC] flex items-center justify-center relative">
            <svg width="100%" height="100%" viewBox="0 0 200 120">
              <ellipse cx="60" cy="50" rx="30" ry="20" fill="#4D8FA8" className="opacity-60" />
              <ellipse cx="130" cy="70" rx="40" ry="25" fill="#4D8FA8" className="opacity-80" />
              <circle cx="160" cy="40" r="15" fill="#4D8FA8" className="opacity-70" />
              <path d="M20,90 Q40,70 70,80 T120,100" stroke="#4D8FA8" strokeWidth="2" fill="none" className="opacity-40" />
            </svg>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 rounded-full bg-[#DCEEF2]">
              <Droplets size={16} color="#4D8FA8" />
            </span>
            <h3 className="font-semibold text-[#111111]">Water Resources</h3>
          </div>
          <p className="text-sm text-[#6F6F6F]">
            Identify and monitor surface water bodies, seasonal variation, and reservoir levels.
          </p>
        </div>

        {/* Card 5 */}
        <div className="rounded-3xl border border-[rgba(0,0,0,0.08)] bg-white p-6 card-hover reveal">
          <div className="h-40 rounded-2xl mb-4 overflow-hidden bg-[#F5F5F5] relative"
               style={{ backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            <div className="absolute top-[20%] left-[30%] w-3 h-3 rounded-full bg-[#35624B] shadow-[0_0_0_4px_rgba(53,98,75,0.2)] animate-pulse" />
            <div className="absolute top-[60%] left-[20%] w-3 h-3 rounded-full bg-[#D4644A] shadow-[0_0_0_4px_rgba(212,100,74,0.2)] animate-pulse" style={{ animationDelay: '500ms' }} />
            <div className="absolute top-[40%] left-[70%] w-3 h-3 rounded-full bg-[#4D8FA8] shadow-[0_0_0_4px_rgba(77,143,168,0.2)] animate-pulse" style={{ animationDelay: '1000ms' }} />
            <div className="absolute top-[75%] left-[60%] w-3 h-3 rounded-full bg-[#35624B] shadow-[0_0_0_4px_rgba(53,98,75,0.2)] animate-pulse" style={{ animationDelay: '1500ms' }} />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 rounded-full bg-[#EEF5EC]">
              <MapPin size={16} color="#35624B" />
            </span>
            <h3 className="font-semibold text-[#111111]">Intervention Mapping</h3>
          </div>
          <p className="text-sm text-[#6F6F6F]">
            Locate conservation structures, check dams, and reforestation zones with spatial precision.
          </p>
        </div>

        {/* Card 6 */}
        <div className="rounded-3xl border border-[rgba(0,0,0,0.08)] bg-white p-6 card-hover reveal">
          <div className="h-40 rounded-2xl mb-4 overflow-hidden flex">
            <div className="w-1/2 h-full bg-[#D4C3A3] flex items-center justify-center border-r-2 border-white">
              <span className="text-[10px] font-bold text-black/30 uppercase tracking-widest">Before</span>
            </div>
            <div className="w-1/2 h-full bg-[#A8C5A0] flex items-center justify-center">
              <span className="text-[10px] font-bold text-black/30 uppercase tracking-widest">After</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 rounded-full bg-[#DCEEF2]">
              <ArrowLeftRight size={16} color="#4D8FA8" />
            </span>
            <h3 className="font-semibold text-[#111111]">Change Detection</h3>
          </div>
          <p className="text-sm text-[#6F6F6F]">
            Compare multi-temporal imagery to reveal land cover transitions and environmental shifts.
          </p>
        </div>

      </div>
    </section>
  );
}
