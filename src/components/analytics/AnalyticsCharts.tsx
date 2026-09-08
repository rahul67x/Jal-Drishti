import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  ndviTimeSeries,
  treeCoverYearly,
  waterAvailability,
  landUseDistribution,
} from '../../data/sampleData';

interface AnalyticsChartsProps {
  category?: 'all' | 'vegetation' | 'water' | 'overview';
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ category = 'all' }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 1. Vegetation Health (NDVI) Trend */}
      {(category === 'all' || category === 'vegetation' || category === 'overview') && (
        <div className="p-5 rounded-3xl bg-white border border-black/8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase font-semibold text-[#6F6F6F] tracking-wider">
                SPECTRAL INDEX ANALYSIS
              </div>
              <h4 className="text-base font-serif-display font-bold text-[#111111]">
                NDVI Multi-Temporal Trend (2026)
              </h4>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#EEF5EC] text-[#35624B] font-medium font-mono">
              Avg 0.62
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ndviTimeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis domain={[0.2, 0.8]} stroke="#9ca3af" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    border: '1px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [
                    typeof value === 'number' ? value.toFixed(2) : String(value ?? ''),
                    'NDVI Index',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="ndvi"
                  stroke="#35624B"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#35624B', strokeWidth: 2, stroke: '#FFFFFF' }}
                  activeDot={{ r: 6, fill: '#183A2A' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-[#6F6F6F] mt-2">
            Peak biomass corresponds with July monsoon precipitation spike.
          </div>
        </div>
      )}

      {/* 2. Tree Cover Change (2021-2026) */}
      {(category === 'all' || category === 'vegetation' || category === 'overview') && (
        <div className="p-5 rounded-3xl bg-white border border-black/8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase font-semibold text-[#6F6F6F] tracking-wider">
                CANOPY EXPANSION
              </div>
              <h4 className="text-base font-serif-display font-bold text-[#111111]">
                Tree Cover Progression (km²)
              </h4>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-medium font-mono">
              +4.8% YoY
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={treeCoverYearly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="year" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis domain={[40, 75]} stroke="#9ca3af" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    border: '1px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [
                    `${val} km²`,
                    'Tree Cover',
                  ]}
                />
                <Bar dataKey="cover" fill="#183A2A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-[#6F6F6F] mt-2">
            Net increase of 16.3 km² since continuous contour bunding began in 2021.
          </div>
        </div>
      )}

      {/* 3. Seasonal Water Availability */}
      {(category === 'all' || category === 'water') && (
        <div className="p-5 rounded-3xl bg-white border border-black/8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase font-semibold text-[#6F6F6F] tracking-wider">
                SURFACE HYDROLOGY
              </div>
              <h4 className="text-base font-serif-display font-bold text-[#111111]">
                Water Storage Dynamics (Megalitres)
              </h4>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#DCEEF2] text-[#4D8FA8] font-medium font-mono">
              +18% Peak
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterAvailability} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="season" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    border: '1px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [
                    `${val} ML`,
                    'Estimated Water Storage',
                  ]}
                />
                <Bar dataKey="storage" fill="#4D8FA8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-[#6F6F6F] mt-2">
            Percolation tanks ensure 16.2 ML retention even into post-winter dry period.
          </div>
        </div>
      )}

      {/* 4. Land Use Distribution Donut */}
      {(category === 'all' || category === 'overview') && (
        <div className="p-5 rounded-3xl bg-white border border-black/8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase font-semibold text-[#6F6F6F] tracking-wider">
                LULC CLASSIFICATION
              </div>
              <h4 className="text-base font-serif-display font-bold text-[#111111]">
                Land Use / Land Cover Distribution
              </h4>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 font-medium font-mono">
              142.6 km²
            </span>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={landUseDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {landUseDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    border: '1px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [
                    `${value}%`,
                    'Area Share',
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Donut Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-[11px] border-t border-black/5">
            {landUseDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-neutral-600">
                  {item.name} ({item.value}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsCharts;
