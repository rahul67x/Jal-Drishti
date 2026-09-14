import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowUpRight, Trees, Droplets, Layers } from 'lucide-react';
import type { SiteRow, SiteMetricsRow } from '../../lib/database.types';
import { formatKm2, formatSignedHa, formatPct, formatLatLng } from '../../lib/format';

interface SiteCardProps {
  site: SiteRow;
  metrics?: SiteMetricsRow;
}

/** A signed figure with a colour that matches its direction. */
const Delta: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  pct?: string | null;
  positive: boolean | null;
}> = ({ icon: Icon, label, value, pct, positive }) => {
  const tone =
    positive === null
      ? 'text-neutral-600'
      : positive
      ? 'text-[#35624B]'
      : 'text-rose-600';

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#6F6F6F] font-medium">
        <Icon className="w-3 h-3" />
        <span className="truncate">{label}</span>
      </div>
      <div className={`text-sm font-semibold mt-1 tabular-nums ${tone}`}>{value}</div>
      {pct && <div className={`text-[11px] tabular-nums ${tone}`}>{pct}</div>}
    </div>
  );
};

export const SiteCard: React.FC<SiteCardProps> = ({ site, metrics }) => {
  const vegChange = metrics?.vegetation_change_ha ?? null;
  const waterChange = metrics?.water_change_ha ?? null;

  return (
    <Link
      to={`/sites/${site.slug}`}
      className="group block rounded-3xl border border-black/8 bg-white p-6 card-hover hover:border-[#35624B]/40 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#35624B] font-semibold">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">
              {[site.district, site.state].filter(Boolean).join(', ') || site.country}
            </span>
          </div>
          <h3 className="font-serif-display text-2xl text-[#111111] mt-1 truncate">
            {site.name}
          </h3>
        </div>
        <ArrowUpRight className="w-5 h-5 text-neutral-300 group-hover:text-[#35624B] transition-colors shrink-0" />
      </div>

      {site.description && (
        <p className="text-xs text-[#6F6F6F] mt-3 leading-relaxed line-clamp-2">
          {site.description}
        </p>
      )}

      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-black/5">
        <Delta
          icon={Trees}
          label="Vegetation"
          value={formatSignedHa(vegChange)}
          pct={metrics ? formatPct(metrics.vegetation_change_pct) : null}
          positive={vegChange === null ? null : Number(vegChange) >= 0}
        />
        <Delta
          icon={Droplets}
          label="Water"
          value={formatSignedHa(waterChange)}
          pct={metrics ? formatPct(metrics.water_change_pct) : null}
          positive={waterChange === null ? null : Number(waterChange) >= 0}
        />
        <Delta
          icon={Layers}
          label="Extent"
          value={formatKm2(site.area_km2)}
          positive={null}
        />
      </div>

      <div className="text-[10px] text-neutral-400 font-mono mt-3">
        {formatLatLng(site.centre_lat, site.centre_lng)}
        {site.analysis_crs ? ` • ${site.analysis_crs}` : ''}
      </div>
    </Link>
  );
};

export default SiteCard;
