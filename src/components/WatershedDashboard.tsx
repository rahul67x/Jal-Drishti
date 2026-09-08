import { useEffect } from 'react';
import { Leaf, Droplets, CloudRain, Camera } from 'lucide-react';

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

export default function WatershedDashboard() {
  useReveal();

  return (
    <section className="py-24 sm:py-32 px-6 sm:px-10 lg:px-16 bg-[#F7F9F6]">
      <h2 className="font-serif-display text-4xl sm:text-5xl lg:text-6xl text-center text-[#111111] leading-tight reveal">
        One landscape. Multiple layers of intelligence.
      </h2>
      <p className="text-[#6F6F6F] text-lg text-center mt-4 max-w-2xl mx-auto reveal">
        Explore how field observations and satellite-derived datasets reveal the changing story of the Saswad watershed.
      </p>

      <div className="max-w-6xl mx-auto mt-16 rounded-[2rem] overflow-hidden border border-[rgba(0,0,0,0.08)] shadow-2xl bg-white reveal">
        <div className="grid grid-cols-1 lg:grid-cols-5">
          {/* LEFT SIDE: Map Visualization */}
          <div className="relative lg:col-span-3 h-[400px] lg:h-[520px] bg-gradient-to-br from-[#EEF5EC] via-[#DCEEF2] to-[#EEF5EC] overflow-hidden p-6">
            <svg className="w-full h-full" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
              <polygon 
                points="50,450 150,200 400,100 650,150 750,300 600,480 300,490" 
                stroke="#35624B" 
                fill="rgba(168,197,160,0.2)" 
                strokeWidth="2" 
                strokeDasharray="8 4" 
              />
              <path 
                d="M 150 200 Q 300 250 400 350 T 600 480" 
                stroke="#4D8FA8" 
                fill="none" 
                strokeWidth="1.5" 
                className="animate-flow" 
              />
              <path 
                d="M 400 100 Q 450 250 400 350" 
                stroke="#4D8FA8" 
                fill="none" 
                strokeWidth="1.5" 
                className="animate-flow" 
              />
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

            <div className="absolute bottom-6 left-6 bg-white/40 backdrop-blur-md rounded-xl px-4 py-3 border border-white/60">
              <div className="text-xs tracking-[0.15em] font-semibold text-[#111111]">SASWAD WATERSHED</div>
              <div className="text-xs text-[#6F6F6F]">30 m Spatial Resolution</div>
            </div>

            <div className="absolute top-6 right-6 bg-white/40 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-2 border border-white/60">
              <div className="w-2 h-2 rounded-full bg-[#35624B] animate-pulse"></div>
              <span className="text-xs font-medium text-[#35624B]">LIVE</span>
            </div>
          </div>

          {/* RIGHT SIDE: Analysis Cards */}
          <div className="lg:col-span-2 p-6 lg:p-8 flex flex-col gap-4">
            <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[#F7F9F6] p-4 card-hover">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-[#EEF5EC] rounded-lg">
                  <Leaf size={16} className="text-[#35624B]" />
                </div>
                <span className="text-xs text-[#6F6F6F] uppercase tracking-wider">Vegetation Health</span>
              </div>
              <div className="flex items-end justify-between mt-1">
                <div className="text-2xl font-semibold text-[#111111]">NDVI: 0.62</div>
                <div className="bg-[#EEF5EC] text-[#35624B] rounded-full px-2.5 py-0.5 text-xs font-medium">
                  Healthy
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[#F7F9F6] p-4 card-hover">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-[#DCEEF2] rounded-lg">
                  <Droplets size={16} className="text-[#4D8FA8]" />
                </div>
                <span className="text-xs text-[#6F6F6F] uppercase tracking-wider">Surface Water</span>
              </div>
              <div className="text-2xl font-semibold text-[#111111] mt-1">12 Active Bodies</div>
              <div className="text-sm text-[#35624B] mt-1">+18% Seasonal Coverage</div>
            </div>

            <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[#F7F9F6] p-4 card-hover">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-[#DCEEF2] rounded-lg">
                  <CloudRain size={16} className="text-[#4D8FA8]" />
                </div>
                <span className="text-xs text-[#6F6F6F] uppercase tracking-wider">Soil Moisture</span>
              </div>
              <div className="text-2xl font-semibold text-[#111111] mt-1">Moderate — 42%</div>
              <div className="mt-3 w-full h-1.5 rounded-full bg-[#EEF5EC]">
                <div className="h-full rounded-full bg-[#4D8FA8]" style={{ width: '42%' }}></div>
              </div>
            </div>

            <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[#F7F9F6] p-4 card-hover">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-[#EEF5EC] rounded-lg">
                  <Camera size={16} className="text-[#35624B]" />
                </div>
                <span className="text-xs text-[#6F6F6F] uppercase tracking-wider">Geo-tagged Observations</span>
              </div>
              <div className="text-2xl font-semibold text-[#111111] mt-1">1,248</div>
              <div className="text-sm text-[#6F6F6F] mt-1">Across 36 locations</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
