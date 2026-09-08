import { useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';

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

export default function FinalCTA() {
  useReveal();

  return (
    <section className="relative py-32 sm:py-40 px-6 sm:px-10 lg:px-16 overflow-hidden bg-gradient-to-br from-[#183A2A] via-[#1E4D35] to-[#183A2A]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(168,197,160,0.08)_0%,transparent_60%)]"></div>
      
      <div className="relative z-10 text-center max-w-3xl mx-auto">
        <h2 className="font-serif-display text-4xl sm:text-5xl lg:text-7xl text-white leading-[0.95] reveal">
          <span className="block">Every watershed tells a story.</span>
          <span className="block">Now we can finally <i className="italic">see it.</i></span>
        </h2>
        
        <button className="mt-10 inline-flex items-center gap-2 bg-white text-[#183A2A] rounded-full px-8 py-4 text-base font-medium btn-hover-scale reveal">
          Explore JalDrishti
          <ArrowUpRight size={18} />
        </button>
      </div>
    </section>
  );
}
