import React from 'react';

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconColor?: string;
  iconBg?: string;
  label: string;
  value: string;
  subtext?: string;
  badge?: {
    text: string;
    type?: 'positive' | 'neutral' | 'info';
  };
  isActive?: boolean;
  onClick?: () => void;
  hint?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  icon: Icon,
  iconColor = '#35624B',
  iconBg = '#EEF5EC',
  label,
  value,
  subtext,
  badge,
  isActive = false,
  onClick,
  hint,
}) => {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      title={hint || `Filter for ${label}`}
      className={`relative text-left p-5 rounded-2xl border transition-all duration-300 cursor-pointer select-none card-hover ${
        isActive
          ? 'bg-white border-[#35624B] shadow-md ring-2 ring-[#35624B]/20'
          : 'bg-white/90 backdrop-blur-sm border-black/8 hover:border-black/20 hover:bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
          style={{ backgroundColor: iconBg }}
        >
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
        {badge && (
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
              badge.type === 'positive'
                ? 'bg-[#EEF5EC] text-[#35624B]'
                : badge.type === 'info'
                ? 'bg-[#DCEEF2] text-[#4D8FA8]'
                : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>

      <div className="text-xs uppercase tracking-wider text-[#6F6F6F] font-medium mb-1">
        {label}
      </div>

      <div className="text-2xl font-serif-display font-medium text-[#111111] leading-tight">
        {value}
      </div>

      {subtext && (
        <div className="text-xs text-[#6F6F6F] mt-1.5 flex items-center gap-1 font-sans-body">
          {subtext}
        </div>
      )}

      {isActive && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#35624B] animate-pulse" />
      )}
    </div>
  );
};

export default MetricCard;
