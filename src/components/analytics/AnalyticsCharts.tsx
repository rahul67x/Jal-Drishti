import React from 'react';
import {
  ResponsiveContainer,
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
  vegetationComparisonData,
  waterComparisonData,
  waterChangeBreakdownData,
  lulcDistributionData,
} from '../../data/realMetrics';

interface AnalyticsChartsProps {
  category?: 'all' | 'vegetation' | 'water' | 'overview';
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ category = 'all' }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 1. Vegetation Area: 2023 vs 2026 */}
      {(category === 'all' || category === 'vegetation' || category === 'overview') && (
        <div className="p-5 rounded-3xl bg-white border border-black/8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase font-semibold text-[#6F6F6F] tracking-wider">
                POSITIVE NDVI RASTER ANALYSIS
              </div>
              <h4 className="text-base font-serif-display font-bold text-[#111111]">
                Vegetation Area: 2023 vs 2026
              </h4>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#EEF5EC] text-[#35624B] font-medium font-mono">
              -53.98 ha (-1.46%)
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vegetationComparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="year" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis domain={[3500, 3800]} stroke="#9ca3af" fontSize={11} tickLine={false} unit=" ha" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    border: '1px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [
                    `${typeof value === 'number' ? value.toLocaleString('en-US', { minimumFractionDigits: 2 }) : value} ha`,
                    'Vegetation Area',
                  ]}
                />
                <Bar dataKey="areaHa" fill="#183A2A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-[#6F6F6F] mt-2">
            veg_positive_2023 (3,705.66 ha) → veg_positive_2026 (3,651.68 ha). Source: QGIS analysis
          </div>
        </div>
      )}

      {/* 2. Water Area: 2023 vs 2026 */}
      {(category === 'all' || category === 'water' || category === 'overview') && (
        <div className="p-5 rounded-3xl bg-white border border-black/8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase font-semibold text-[#6F6F6F] tracking-wider">
                SURFACE WATER EXTENT
              </div>
              <h4 className="text-base font-serif-display font-bold text-[#111111]">
                Water Area: 2023 vs 2026
              </h4>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#DCEEF2] text-[#4D8FA8] font-medium font-mono">
              -9.50 ha (-75.82%)
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterComparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="year" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 15]} stroke="#9ca3af" fontSize={11} tickLine={false} unit=" ha" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    border: '1px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [
                    `${typeof val === 'number' ? val.toFixed(2) : val} ha`,
                    'Water Extent',
                  ]}
                />
                <Bar dataKey="areaHa" fill="#4D8FA8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-[#6F6F6F] mt-2">
            water_mask_2023 (12.53 ha) → water_mask.tif (3.03 ha). Source: QGIS analysis
          </div>
        </div>
      )}

      {/* 3. Water Change Dynamics (2023–2026) */}
      {(category === 'all' || category === 'water') && (
        <div className="p-5 rounded-3xl bg-white border border-black/8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase font-semibold text-[#6F6F6F] tracking-wider">
                RASTER CHANGE DETECTION
              </div>
              <h4 className="text-base font-serif-display font-bold text-[#111111]">
                Water Change 2023–2026
              </h4>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-rose-50 text-[#E11D48] font-medium font-mono">
              Net -9.50 ha
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterChangeBreakdownData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="category" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 11]} stroke="#9ca3af" fontSize={11} tickLine={false} unit=" ha" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    border: '1px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [
                    `${typeof val === 'number' ? val.toFixed(2) : val} ha`,
                    'Area Affected',
                  ]}
                />
                <Bar dataKey="areaHa" radius={[6, 6, 0, 0]}>
                  {waterChangeBreakdownData.map((entry, index) => (
                    <Cell key={`change-cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-[#6F6F6F] mt-2">
            Water Loss (-1): 9.54 ha (954 px) • Water Gain (+1): 0.04 ha (4 px). Source: QGIS analysis
          </div>
        </div>
      )}

      {/* 4. Land Use / Land Cover Distribution (2026) */}
      {(category === 'all' || category === 'vegetation' || category === 'overview') && (
        <div className="p-5 rounded-3xl bg-white border border-black/8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase font-semibold text-[#6F6F6F] tracking-wider">
                LULC CLASSIFICATION (2026)
              </div>
              <h4 className="text-base font-serif-display font-bold text-[#111111]">
                LULC Distribution — 2026
              </h4>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 font-medium font-mono">
              37.21 km² Extent
            </span>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={lulcDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {lulcDistributionData.map((entry, index) => (
                    <Cell key={`lulc-cell-${index}`} fill={entry.color} />
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
                  formatter={(value: any, _name: any, item: any) => [
                    `${typeof value === 'number' ? value.toLocaleString('en-US', { minimumFractionDigits: 2 }) : value} ha (${item.payload.share}%)`,
                    'Class Area',
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Donut Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-[11px] border-t border-black/5">
            {lulcDistributionData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-neutral-600 font-medium">
                  {item.name}: {item.value.toLocaleString('en-US', { minimumFractionDigits: 2 })} ha ({item.share}%)
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
