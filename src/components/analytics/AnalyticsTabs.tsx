import React from 'react';
import { LayoutDashboard, Trees, Droplets, ArrowLeftRight, Camera } from 'lucide-react';

export type AnalyticsTabId = 'overview' | 'vegetation' | 'water' | 'change' | 'field';

interface AnalyticsTabsProps {
  activeTab: AnalyticsTabId;
  onSelectTab: (tab: AnalyticsTabId) => void;
}

const tabs: { id: AnalyticsTabId; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'vegetation', label: 'Vegetation', icon: Trees },
  { id: 'water', label: 'Water', icon: Droplets },
  { id: 'change', label: 'Change Detection', icon: ArrowLeftRight },
  { id: 'field', label: 'Field Data', icon: Camera },
];

export const AnalyticsTabs: React.FC<AnalyticsTabsProps> = ({ activeTab, onSelectTab }) => {
  return (
    <div className="flex items-center gap-1.5 p-1.5 bg-neutral-100/90 backdrop-blur-md rounded-2xl border border-black/5 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap select-none ${
              isActive
                ? 'bg-white text-[#183A2A] shadow-sm font-semibold'
                : 'text-[#6F6F6F] hover:text-[#111111] hover:bg-white/50'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-[#35624B]' : 'text-[#6F6F6F]'}`} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default AnalyticsTabs;
