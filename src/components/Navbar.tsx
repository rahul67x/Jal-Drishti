import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  const navLinks = [
    { name: 'Home', href: '#', active: true },
    { name: 'The Challenge', href: '#the-challenge', active: false },
    { name: 'GIS Analysis', href: '#gis-analysis', active: false },
    { name: 'Watershed Insights', href: '#analytics', active: false },
    { name: 'Solution', href: '#solution', active: false }
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pt-4 sm:pt-6 px-4">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-4 sm:py-5 glass rounded-full border border-white/60 shadow-lg flex items-center justify-between bg-white/60 backdrop-blur-xl">
        <div className="flex items-center gap-1">
          <span className="font-serif-display text-3xl text-[#111111]">JalDrishti</span>
          <sup className="text-xs font-medium text-[#111111]">®</sup>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className={`text-sm transition ${link.active ? 'text-[#111111] font-medium' : 'text-[#6F6F6F] hover:text-[#183A2A]'}`}
            >
              {link.name}
            </a>
          ))}
        </nav>

        <div className="hidden lg:block">
          <a href="#analytics" className="rounded-full bg-[#183A2A] text-white px-5 py-2.5 text-sm font-medium btn-hover-scale inline-block">
            Launch Platform
          </a>
        </div>

        {/* Mobile Toggle */}
        <button className="lg:hidden text-[#111111] p-1" onClick={() => setIsOpen(true)}>
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Drawer */}
      <div className={`fixed inset-0 z-50 glass bg-white/90 backdrop-blur-xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="absolute top-6 right-6">
          <button className="text-[#111111] p-2" onClick={() => setIsOpen(false)}>
            <X size={28} />
          </button>
        </div>
        
        <div className="h-full flex flex-col items-center justify-center gap-8">
          {navLinks.map((link, index) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`text-2xl font-medium stagger-${index + 1} ${isOpen ? 'visible' : ''} ${link.active ? 'text-[#111111]' : 'text-[#6F6F6F]'}`}
            >
              {link.name}
            </a>
          ))}
          <a href="#analytics" onClick={() => setIsOpen(false)} className={`mt-4 rounded-full bg-[#183A2A] text-white px-8 py-4 text-lg font-medium stagger-5 ${isOpen ? 'visible' : ''}`}>
            Launch Platform
          </a>
        </div>
      </div>
    </div>
  );
}
