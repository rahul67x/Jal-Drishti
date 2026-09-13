export interface MetricDetail {
  value: string;
  subtext: string;
  badge?: {
    text: string;
    type: 'positive' | 'neutral' | 'info';
  };
}

export const realGisMetrics = {
  metadata: {
    crs: 'EPSG:32643 — WGS 84 / UTM zone 43N',
    resolution: '10 m × 10 m',
    totalPixels: 372099,
    source: 'QGIS raster analysis (Sentinel-2)',
  },
  vegetation: {
    name: 'Vegetation Area',
    year2023: {
      pixels: 370566,
      areaM2: 37056600,
      areaHa: 3705.66,
    },
    year2026: {
      pixels: 365168,
      areaM2: 36516800,
      areaHa: 3651.68,
    },
    netChangeHa: -53.98,
    percentChange: -1.46,
    display: {
      value: '3,651.68 ha',
      subtext: '2023: 3,705.66 ha',
      badge: { text: '-1.46%', type: 'neutral' as const },
    },
  },
  water: {
    name: 'Water Area',
    year2023: {
      pixels: 1253,
      areaM2: 125300,
      areaHa: 12.53,
      areaKm2: 0.1253,
    },
    year2026: {
      pixels: 303,
      areaM2: 30300,
      areaHa: 3.03,
      areaKm2: 0.0303,
    },
    netChangeHa: -9.50,
    percentChange: -75.82,
    display: {
      value: '3.03 ha',
      subtext: '2023: 12.53 ha',
      badge: { text: '-75.8%', type: 'neutral' as const },
    },
  },
  waterChange: {
    loss: {
      pixels: 954,
      areaM2: 95400,
      areaHa: 9.54,
      display: {
        value: '9.54 ha',
        subtext: '954 pixels detected',
        badge: { text: 'Loss', type: 'neutral' as const },
      },
    },
    gain: {
      pixels: 4,
      areaM2: 400,
      areaHa: 0.04,
      display: {
        value: '0.04 ha',
        subtext: '4 pixels detected',
        badge: { text: 'Gain', type: 'positive' as const },
      },
    },
    net: {
      areaHa: -9.50,
      display: {
        value: '-9.50 ha',
        subtext: 'Net 2023–2026 change',
        badge: { text: '-9.50 ha', type: 'neutral' as const },
      },
    },
  },
  lulc2026: {
    name: 'LULC Distribution (2026)',
    totalAreaHa: 3721.0,
    totalAreaKm2: 37.21,
    classes: [
      { name: 'Vegetation', areaHa: 3651.65, percentage: 98.14, color: '#183A2A' },
      { name: 'Other', areaHa: 66.31, percentage: 1.78, color: '#D97706' },
      { name: 'Water', areaHa: 3.03, percentage: 0.08, color: '#4D8FA8' },
    ],
    display: {
      value: '37.21 km²',
      subtext: '3,721 ha analyzed extent',
      badge: { text: '10m Res', type: 'info' as const },
    },
  },
};

// Chart-ready datasets
export const vegetationComparisonData = [
  { year: '2023', areaHa: 3705.66, label: '3,705.66 ha' },
  { year: '2026', areaHa: 3651.68, label: '3,651.68 ha' },
];

export const waterComparisonData = [
  { year: '2023', areaHa: 12.53, label: '12.53 ha' },
  { year: '2026', areaHa: 3.03, label: '3.03 ha' },
];

export const waterChangeBreakdownData = [
  { category: 'Water Loss', areaHa: 9.54, fill: '#E11D48' },
  { category: 'Water Gain', areaHa: 0.04, fill: '#35624B' },
];

export const lulcDistributionData = [
  { name: 'Vegetation', value: 3651.65, share: 98.14, color: '#183A2A' },
  { name: 'Other', value: 66.31, share: 1.78, color: '#D97706' },
  { name: 'Water', value: 3.03, share: 0.08, color: '#4D8FA8' },
];
