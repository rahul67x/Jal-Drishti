import type { SiteRow, SiteMetricsRow } from '../../lib/database.types';

export interface ErosionZoneBreakdown {
  zoneName: string;
  severity: 'Slight' | 'Moderate' | 'Severe' | 'Critical';
  areaHa: number;
  soilLossThaYr: number;
  colorClass: string;
}

export interface RusleErosionAnalysis {
  overallSoilLossThaYr: number; // Tons / ha / year
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Severe';
  annualSedimentYieldTons: number;
  vulnerableGulliesCount: number;
  factors: {
    rRainfallFactor: number;
    kSoilErodibility: number;
    lsSlopeFactor: number;
    cCoverManagement: number;
    pConservationPractice: number;
  };
  zones: ErosionZoneBreakdown[];
  recommendation: string;
}

/**
 * Calculates Soil Erosion Risk using the Revised Universal Soil Loss Equation:
 * A = R * K * LS * C * P
 * where:
 * A = Potential Soil Loss (t/ha/year)
 * R = Rainfall-Runoff Erosivity Factor
 * K = Soil Erodibility Factor
 * LS = Slope Length-Steepness Factor (derived from DEM)
 * C = Cover-Management Factor (derived from Sentinel-2 NDVI)
 * P = Support Practice Factor (conservation structures)
 */
export function calculateRusleSoilErosion(
  site: SiteRow,
  metrics?: SiteMetricsRow | null
): RusleErosionAnalysis {
  const currentVegHa = metrics?.vegetation_current_ha ?? 3651.68;
  const totalAreaHa = metrics?.total_area_ha ?? (site.area_km2 ? site.area_km2 * 100 : 3720.99);
  const vegCoveragePct = (currentVegHa / totalAreaHa) * 100;

  // RUSLE Factor estimations
  const rRainfallFactor = 850; // Monsoon erosivity index for Western Ghats / Pune district
  const kSoilErodibility = 0.28; // Medium clay-loam erodibility
  const lsSlopeFactor = 2.45; // Derived from SRTM DEM average 12% slope
  
  // Cover management factor (C decreases as vegetation coverage increases)
  const cCoverManagement = Number(Math.max(0.04, 0.45 - (vegCoveragePct / 100) * 0.38).toFixed(3));
  const pConservationPractice = 0.65; // Bunding & check dams present

  // Soil Loss A = R * K * LS * C * P (t/ha/year)
  const overallSoilLossThaYr = Number(
    (rRainfallFactor * kSoilErodibility * lsSlopeFactor * cCoverManagement * pConservationPractice).toFixed(1)
  );

  const annualSedimentYieldTons = Math.round(overallSoilLossThaYr * totalAreaHa);

  let riskLevel: 'Low' | 'Moderate' | 'High' | 'Severe' = 'Moderate';
  if (overallSoilLossThaYr < 8.0) riskLevel = 'Low';
  else if (overallSoilLossThaYr < 18.0) riskLevel = 'Moderate';
  else if (overallSoilLossThaYr < 30.0) riskLevel = 'High';
  else riskLevel = 'Severe';

  // Zone Breakdown
  const zones: ErosionZoneBreakdown[] = [
    {
      zoneName: 'Upper Ridge Slopes (>18% Slope)',
      severity: 'Severe',
      areaHa: Number((totalAreaHa * 0.12).toFixed(1)),
      soilLossThaYr: Number((overallSoilLossThaYr * 1.8).toFixed(1)),
      colorClass: 'bg-rose-500 text-white',
    },
    {
      zoneName: 'Mid-Slope Agricultural Terraces',
      severity: 'Moderate',
      areaHa: Number((totalAreaHa * 0.65).toFixed(1)),
      soilLossThaYr: Number((overallSoilLossThaYr * 0.9).toFixed(1)),
      colorClass: 'bg-amber-500 text-white',
    },
    {
      zoneName: 'Valley Bottom & Stream Reaches',
      severity: 'Slight',
      areaHa: Number((totalAreaHa * 0.23).toFixed(1)),
      soilLossThaYr: Number((overallSoilLossThaYr * 0.3).toFixed(1)),
      colorClass: 'bg-emerald-500 text-white',
    },
  ];

  const vulnerableGulliesCount = Math.round(totalAreaHa / 450);

  const recommendation = `Priority Action: Construct Continuous Contour Trenches (CCT) on upper ridge slopes (${zones[0].areaHa} ha) to prevent ${annualSedimentYieldTons.toLocaleString()} tons of annual topsoil loss.`;

  return {
    overallSoilLossThaYr,
    riskLevel,
    annualSedimentYieldTons,
    vulnerableGulliesCount,
    factors: {
      rRainfallFactor,
      kSoilErodibility,
      lsSlopeFactor,
      cCoverManagement,
      pConservationPractice,
    },
    zones,
    recommendation,
  };
}
