// ============================================================
// JalDrishti — Sample Demonstration Data
// All data is representative for the Saswad watershed demo
// ============================================================

// --- NDVI Time Series ---
export const ndviTimeSeries = [
  { month: 'Jan', ndvi: 0.38 },
  { month: 'Mar', ndvi: 0.42 },
  { month: 'May', ndvi: 0.55 },
  { month: 'Jul', ndvi: 0.68 },
  { month: 'Sep', ndvi: 0.62 },
  { month: 'Nov', ndvi: 0.48 },
];

// --- Tree Cover Yearly ---
export const treeCoverYearly = [
  { year: '2021', cover: 52.1 },
  { year: '2022', cover: 55.8 },
  { year: '2023', cover: 58.4 },
  { year: '2024', cover: 62.0 },
  { year: '2025', cover: 65.2 },
  { year: '2026', cover: 68.4 },
];

// --- Water Availability Seasonal ---
export const waterAvailability = [
  { season: 'Pre-Monsoon', storage: 12.4 },
  { season: 'Monsoon', storage: 38.6 },
  { season: 'Post-Monsoon', storage: 24.8 },
  { season: 'Winter', storage: 16.2 },
];

// --- Land Use Distribution ---
export const landUseDistribution = [
  { name: 'Forest / Tree Cover', value: 34, color: '#183A2A' },
  { name: 'Agriculture', value: 38, color: '#A8C5A0' },
  { name: 'Water', value: 8, color: '#4D8FA8' },
  { name: 'Built-up', value: 12, color: '#6F6F6F' },
  { name: 'Open Land', value: 8, color: '#D4C3A3' },
];

// --- Field Observations ---
export interface FieldObservation {
  id: number;
  position: [number, number];
  category: 'vegetation' | 'water' | 'intervention' | 'degradation';
  title: string;
  status: string;
  date: string;
  description: string;
}

export const fieldObservations: FieldObservation[] = [
  { id: 101, position: [18.352, 74.028], category: 'vegetation', title: 'Dense Canopy Cover', status: 'Healthy', date: '2026-06-12', description: 'Mature tree plantation with dense canopy cover observed along the ridge.' },
  { id: 102, position: [18.341, 74.042], category: 'vegetation', title: 'Reforestation Site', status: 'Moderate', date: '2026-05-20', description: 'Young plantation showing moderate growth. Survival rate estimated at 72%.' },
  { id: 103, position: [18.356, 74.048], category: 'vegetation', title: 'Grassland Assessment', status: 'Sparse', date: '2026-07-08', description: 'Seasonal grass cover with minimal shrub presence.' },
  { id: 104, position: [18.338, 74.031], category: 'water', title: 'Check Dam — Active', status: 'Functional', date: '2026-06-25', description: 'Stone masonry check dam retaining water. Estimated storage 2.4 ML.' },
  { id: 105, position: [18.349, 74.052], category: 'water', title: 'Farm Pond', status: 'Seasonal', date: '2026-07-15', description: 'Lined farm pond with partial water storage. Used for supplemental irrigation.' },
  { id: 106, position: [18.360, 74.038], category: 'water', title: 'Percolation Tank', status: 'Active', date: '2026-04-10', description: 'Large percolation tank supporting groundwater recharge in downstream area.' },
  { id: 107, position: [18.335, 74.025], category: 'intervention', title: 'Contour Bunding', status: 'Completed', date: '2026-03-18', description: 'Contour bunds constructed across 12 hectares of sloping agricultural land.' },
  { id: 108, position: [18.344, 74.056], category: 'intervention', title: 'Gabion Structure', status: 'Active', date: '2026-05-02', description: 'Wire gabion structure stabilizing a gully erosion zone.' },
  { id: 109, position: [18.358, 74.030], category: 'intervention', title: 'Nala Bund', status: 'Functional', date: '2026-06-08', description: 'Earthen nala bund capturing seasonal runoff. Surrounding area shows revegetation.' },
  { id: 110, position: [18.347, 74.020], category: 'degradation', title: 'Exposed Soil', status: 'Degraded', date: '2026-07-22', description: 'Barren hillslope with visible sheet erosion. Priority area for intervention.' },
  { id: 111, position: [18.340, 74.045], category: 'degradation', title: 'Gully Erosion', status: 'Severe', date: '2026-06-30', description: 'Active gully formation observed. Requires immediate structural intervention.' },
  { id: 112, position: [18.353, 74.060], category: 'vegetation', title: 'Riparian Buffer', status: 'Healthy', date: '2026-05-14', description: 'Dense riparian vegetation along stream bank providing erosion protection.' },
  { id: 113, position: [18.362, 74.044], category: 'water', title: 'Spring Source', status: 'Perennial', date: '2026-04-28', description: 'Natural spring source feeding into the drainage network. Flow rate stable.' },
  { id: 114, position: [18.337, 74.038], category: 'intervention', title: 'Loose Boulder Structure', status: 'Active', date: '2026-08-05', description: 'Loose boulder check across first-order stream reducing flow velocity.' },
  { id: 115, position: [18.350, 74.033], category: 'vegetation', title: 'Mixed Plantation', status: 'Moderate', date: '2026-07-12', description: 'Mixed species plantation with moderate canopy closure. 3-year-old stand.' },
  { id: 116, position: [18.345, 74.048], category: 'water', title: 'Reservoir Inlet', status: 'Active', date: '2026-06-18', description: 'Inlet channel to minor reservoir. Siltation visible at mouth.' },
  { id: 117, position: [18.355, 74.022], category: 'degradation', title: 'Overgrazing Impact', status: 'Moderate', date: '2026-08-10', description: 'Reduced ground cover due to overgrazing. Soil compaction visible.' },
  { id: 118, position: [18.342, 74.055], category: 'intervention', title: 'CCT Trench', status: 'Completed', date: '2026-02-20', description: 'Continuous contour trenches across barren hillslope. Plantation in progress.' },
];

// --- Water Bodies ---
export interface WaterBody {
  id: string;
  position: [number, number];
  type: string;
  status: string;
  storage: string;
  name: string;
}

export const waterBodies: WaterBody[] = [
  { id: 'WB-01', position: [18.340, 74.032], type: 'Check Dam', status: 'Active', storage: '2.4 ML', name: 'Morewadi Check Dam' },
  { id: 'WB-02', position: [18.348, 74.045], type: 'Farm Pond', status: 'Seasonal', storage: '0.8 ML', name: 'Bhutonde Farm Pond' },
  { id: 'WB-03', position: [18.355, 74.038], type: 'Percolation Tank', status: 'Active', storage: '5.2 ML', name: 'Saswad PT-1' },
  { id: 'WB-04', position: [18.362, 74.050], type: 'Minor Reservoir', status: 'Active', storage: '12.6 ML', name: 'Pargaon Reservoir' },
  { id: 'WB-05', position: [18.338, 74.028], type: 'Check Dam', status: 'Active', storage: '1.8 ML', name: 'Jejuri Road CD' },
  { id: 'WB-06', position: [18.350, 74.055], type: 'Farm Pond', status: 'Active', storage: '0.6 ML', name: 'Kondhwa FP' },
  { id: 'WB-07', position: [18.344, 74.040], type: 'Check Dam', status: 'Active', storage: '2.4 ML', name: 'Nala Bund CD-3' },
  { id: 'WB-08', position: [18.358, 74.030], type: 'Nala Bund', status: 'Functional', storage: '3.1 ML', name: 'Ridge Nala Bund' },
  { id: 'WB-09', position: [18.336, 74.048], type: 'Farm Pond', status: 'Seasonal', storage: '0.4 ML', name: 'East Valley FP' },
  { id: 'WB-10', position: [18.352, 74.025], type: 'Percolation Tank', status: 'Active', storage: '4.8 ML', name: 'Western PT' },
  { id: 'WB-11', position: [18.346, 74.058], type: 'Check Dam', status: 'Active', storage: '1.6 ML', name: 'Streambed CD' },
  { id: 'WB-12', position: [18.360, 74.042], type: 'Minor Reservoir', status: 'Active', storage: '8.4 ML', name: 'North Reservoir' },
];

// --- Watershed Boundary (GeoJSON polygon) ---
export const watershedBoundary: GeoJSON.Feature = {
  type: 'Feature',
  properties: { name: 'Saswad Watershed', area: '142.6 km²' },
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [73.995, 18.325], [74.010, 18.310], [74.035, 18.308],
      [74.055, 18.315], [74.070, 18.330], [74.075, 18.350],
      [74.068, 18.370], [74.050, 18.380], [74.030, 18.378],
      [74.010, 18.370], [73.998, 18.355], [73.995, 18.340],
      [73.995, 18.325],
    ]],
  },
};

// --- Vegetation Zones (Tree Cover) ---
export const vegetationZones: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { density: 'high', label: 'Dense Forest' },
      geometry: { type: 'Polygon', coordinates: [[[74.015, 18.350], [74.030, 18.355], [74.035, 18.365], [74.020, 18.368], [74.010, 18.360], [74.015, 18.350]]] },
    },
    {
      type: 'Feature',
      properties: { density: 'high', label: 'Ridge Plantation' },
      geometry: { type: 'Polygon', coordinates: [[[74.045, 18.340], [74.060, 18.345], [74.058, 18.355], [74.048, 18.358], [74.042, 18.348], [74.045, 18.340]]] },
    },
    {
      type: 'Feature',
      properties: { density: 'moderate', label: 'Mixed Vegetation' },
      geometry: { type: 'Polygon', coordinates: [[[74.025, 18.330], [74.040, 18.328], [74.045, 18.338], [74.035, 18.345], [74.020, 18.340], [74.025, 18.330]]] },
    },
    {
      type: 'Feature',
      properties: { density: 'moderate', label: 'Regeneration Area' },
      geometry: { type: 'Polygon', coordinates: [[[74.050, 18.360], [74.065, 18.358], [74.068, 18.368], [74.055, 18.375], [74.048, 18.365], [74.050, 18.360]]] },
    },
    {
      type: 'Feature',
      properties: { density: 'sparse', label: 'Sparse Scrub' },
      geometry: { type: 'Polygon', coordinates: [[[74.005, 18.335], [74.018, 18.332], [74.022, 18.342], [74.012, 18.348], [74.002, 18.342], [74.005, 18.335]]] },
    },
    {
      type: 'Feature',
      properties: { density: 'sparse', label: 'Open Grassland' },
      geometry: { type: 'Polygon', coordinates: [[[74.055, 18.325], [74.068, 18.322], [74.072, 18.332], [74.062, 18.338], [74.052, 18.332], [74.055, 18.325]]] },
    },
  ],
};

// --- NDVI Zones ---
export const ndviZones: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { level: 'high', ndvi: 0.72 },
      geometry: { type: 'Polygon', coordinates: [[[74.018, 18.352], [74.032, 18.356], [74.036, 18.364], [74.022, 18.366], [74.012, 18.358], [74.018, 18.352]]] },
    },
    {
      type: 'Feature',
      properties: { level: 'high', ndvi: 0.68 },
      geometry: { type: 'Polygon', coordinates: [[[74.046, 18.342], [74.058, 18.346], [74.056, 18.354], [74.046, 18.356], [74.040, 18.348], [74.046, 18.342]]] },
    },
    {
      type: 'Feature',
      properties: { level: 'moderate', ndvi: 0.52 },
      geometry: { type: 'Polygon', coordinates: [[[74.028, 18.332], [74.042, 18.330], [74.046, 18.340], [74.036, 18.346], [74.022, 18.342], [74.028, 18.332]]] },
    },
    {
      type: 'Feature',
      properties: { level: 'low', ndvi: 0.28 },
      geometry: { type: 'Polygon', coordinates: [[[74.006, 18.336], [74.016, 18.334], [74.020, 18.344], [74.010, 18.346], [74.004, 18.340], [74.006, 18.336]]] },
    },
    {
      type: 'Feature',
      properties: { level: 'low', ndvi: 0.24 },
      geometry: { type: 'Polygon', coordinates: [[[74.056, 18.326], [74.066, 18.324], [74.070, 18.334], [74.060, 18.336], [74.054, 18.330], [74.056, 18.326]]] },
    },
  ],
};

// --- Drainage Network ---
export const drainageNetwork: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { order: 'primary', name: 'Main Stream' }, geometry: { type: 'LineString', coordinates: [[74.010, 18.370], [74.025, 18.355], [74.035, 18.345], [74.045, 18.340], [74.060, 18.335], [74.070, 18.330]] } },
    { type: 'Feature', properties: { order: 'secondary', name: 'North Tributary' }, geometry: { type: 'LineString', coordinates: [[74.020, 18.375], [74.028, 18.362], [74.035, 18.345]] } },
    { type: 'Feature', properties: { order: 'secondary', name: 'South Branch' }, geometry: { type: 'LineString', coordinates: [[74.030, 18.320], [74.038, 18.330], [74.045, 18.340]] } },
    { type: 'Feature', properties: { order: 'secondary', name: 'East Fork' }, geometry: { type: 'LineString', coordinates: [[74.065, 18.355], [74.058, 18.348], [74.060, 18.335]] } },
    { type: 'Feature', properties: { order: 'channel', name: 'Channel A' }, geometry: { type: 'LineString', coordinates: [[74.015, 18.360], [74.022, 18.352], [74.025, 18.355]] } },
    { type: 'Feature', properties: { order: 'channel', name: 'Channel B' }, geometry: { type: 'LineString', coordinates: [[74.050, 18.325], [74.055, 18.330], [74.060, 18.335]] } },
    { type: 'Feature', properties: { order: 'channel', name: 'Channel C' }, geometry: { type: 'LineString', coordinates: [[74.040, 18.365], [74.042, 18.355], [74.045, 18.340]] } },
    { type: 'Feature', properties: { order: 'channel', name: 'Channel D' }, geometry: { type: 'LineString', coordinates: [[74.008, 18.345], [74.018, 18.348], [74.025, 18.355]] } },
  ],
};

// --- Change Detection Zones ---
export const changeDetectionZones: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { change: 'vegetation_gain', label: 'Reforestation Zone' }, geometry: { type: 'Polygon', coordinates: [[[74.018, 18.350], [74.028, 18.354], [74.030, 18.362], [74.020, 18.364], [74.014, 18.356], [74.018, 18.350]]] } },
    { type: 'Feature', properties: { change: 'vegetation_gain', label: 'Natural Regeneration' }, geometry: { type: 'Polygon', coordinates: [[[74.048, 18.344], [74.056, 18.346], [74.054, 18.354], [74.046, 18.352], [74.044, 18.348], [74.048, 18.344]]] } },
    { type: 'Feature', properties: { change: 'vegetation_loss', label: 'Clearing Zone' }, geometry: { type: 'Polygon', coordinates: [[[74.058, 18.326], [74.064, 18.324], [74.066, 18.330], [74.060, 18.332], [74.056, 18.328], [74.058, 18.326]]] } },
    { type: 'Feature', properties: { change: 'water_increase', label: 'New Check Dam Impact' }, geometry: { type: 'Polygon', coordinates: [[[74.034, 18.328], [74.042, 18.326], [74.044, 18.334], [74.036, 18.336], [74.032, 18.332], [74.034, 18.328]]] } },
    { type: 'Feature', properties: { change: 'water_increase', label: 'Reservoir Expansion' }, geometry: { type: 'Polygon', coordinates: [[[74.052, 18.362], [74.062, 18.360], [74.064, 18.368], [74.054, 18.372], [74.050, 18.366], [74.052, 18.362]]] } },
  ],
};

// --- AI Insights Pool ---
export const aiInsightsPool = [
  'Vegetation density shows a consistent improvement of +4.8% in the north-western portion of the study area, particularly around reforestation zones established in 2023.',
  'Three water conservation structures (WB-01, WB-07, WB-08) demonstrate increased surrounding vegetation within a 200 m buffer, suggesting positive downstream ecological impact.',
  'Two regions in the eastern sector demonstrate declining vegetation health (NDVI < 0.30) and may require immediate field verification and intervention planning.',
  'Seasonal water coverage has increased by 18% compared to the previous analysis period, with the highest gains observed near nala bund structures.',
  'Soil moisture levels remain moderate (42%) across the central watershed, with higher values observed near percolation tanks and contour bunding areas.',
  'Change detection analysis reveals 34.2 hectares of restored land since 2021, primarily in areas with combined structural and biological interventions.',
  'Drainage network analysis indicates first-order streams in the southern sector are showing reduced flow velocities, likely due to upstream check dams and loose boulder structures.',
  'Field observation density is highest in the central watershed zone (36 locations), but the northern ridge remains under-surveyed and requires additional ground-truthing.',
  'Land use transition analysis shows a 6.3% shift from open/barren land to forest/tree cover between 2021 and 2026, consistent with watershed development program targets.',
  'NDVI temporal analysis suggests peak vegetation health occurs in July–August (monsoon), with a secondary recovery visible in post-monsoon October readings.',
];

// --- Change Detection Stats ---
export const changeStats = {
  vegetationGain: '+4.8%',
  vegetationLoss: '-1.2%',
  waterCoverage: '+12.6%',
  restoredLand: '34.2 ha',
  treeCoverChange: '+16.3 km²',
  ndviImprovement: '+7.3%',
  waterStorage: '+12.6%',
};
