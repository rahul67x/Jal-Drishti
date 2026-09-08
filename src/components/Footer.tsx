export default function Footer() {
  return (
    <footer className="py-12 sm:py-16 px-6 sm:px-10 lg:px-16 bg-white border-t border-[rgba(0,0,0,0.08)]">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <div className="font-serif-display text-2xl text-[#111111]">JalDrishti®</div>
            <div className="text-sm text-[#6F6F6F] mt-1">Geospatial Intelligence for Watershed Development</div>
          </div>
          <div>
            <div className="text-sm text-[#6F6F6F]">Smart India Hackathon 2026</div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-[rgba(0,0,0,0.08)] flex flex-wrap gap-6">
          {['Project', 'Methodology', 'Technology', 'Contact'].map((link) => (
            <a key={link} className="text-sm text-[#6F6F6F] hover:text-[#183A2A] nav-link cursor-pointer">
              {link}
            </a>
          ))}
        </div>

        <div className="mt-8">
          <div className="text-xs text-[#6F6F6F]/60">
            © 2026 JalDrishti. Smart India Hackathon Project.
          </div>
        </div>
      </div>
    </footer>
  );
}
