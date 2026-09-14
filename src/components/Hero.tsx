import { ArrowUpRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSites } from '../features/sites/useSites';
import VideoBackground from './VideoBackground';
import Navbar from './Navbar';

export default function Hero() {
  const navigate = useNavigate();
  const { data: sites } = useSites();

  /*
   * The tour needs a site to run on, so this opens the first one and requests
   * the tour through router state rather than a query string — it is a UI
   * mode, not something anyone should bookmark or share.
   */
  const startTour = () => {
    const slug = sites?.[0]?.slug;
    if (slug) navigate(`/sites/${slug}`, { state: { startTour: true } });
    else navigate('/sites');
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col justify-end">
      <VideoBackground />
      <Navbar />
      
      <div className="relative z-10 px-6 sm:px-10 lg:px-16 pb-16 sm:pb-20 lg:pb-24 max-w-7xl mx-auto w-full">
        {/* Eyebrow */}
        <div className="animate-fade-rise flex items-center gap-2 mb-6">
          <div className="w-2 h-2 rounded-full bg-[#35624B] animate-pulse-marker" />
          <span className="uppercase tracking-[0.2em] text-xs sm:text-sm text-[#6F6F6F] font-medium">
            FROM FIELD EVIDENCE TO SPATIAL INTELLIGENCE
          </span>
        </div>

        {/* Headline */}
        <h1 className="animate-fade-rise-delay text-5xl sm:text-7xl lg:text-8xl font-serif-display leading-[0.9] tracking-tight max-w-5xl">
          <div className="text-[#111111]">See the watershed.</div>
          <div className="text-[#35624B]">Understand the change.</div>
          <div className="text-[#6F6F6F]">
            Shape a <span className="italic">sustainable</span> future.
          </div>
        </h1>

        {/* Description */}
        <p className="animate-fade-rise-delay-2 max-w-xl text-base sm:text-lg text-[#6F6F6F] leading-relaxed mt-6 sm:mt-8">
          JalDrishti integrates geo-tagged field imagery, GIS intelligence, remote sensing, and satellite datasets to transform watershed monitoring into clear, actionable insight.
        </p>

        {/* Buttons */}
        <div className="animate-fade-rise-delay-3 flex flex-wrap gap-4 mt-8">
          <a href="#analytics" className="bg-[#183A2A] text-white rounded-full px-7 py-3.5 text-sm font-medium flex items-center gap-2 btn-hover-scale transition-transform">
            Explore Watershed Analytics
            <ArrowUpRight size={18} />
          </a>
          
          <button
            onClick={startTour}
            className="glass border border-white/60 bg-white/40 backdrop-blur-md rounded-full px-7 py-3.5 text-sm font-medium text-[#111111] flex items-center gap-2 btn-hover-scale transition-transform"
          >
            <Play size={16} className="fill-[#111111]" />
            Watch the Analysis
          </button>
        </div>
      </div>
    </div>
  );
}

