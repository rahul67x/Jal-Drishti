import type { SiteRow, SiteMetricsRow } from '../../lib/database.types';

export interface CropInfo {
  id: string;
  name: string;
  marathiName: string;
  category: 'Kharif' | 'Rabi' | 'Perennial' | 'Horticulture';
  kc: number; // Crop coefficient Kc
  growthStage: string;
  areaSharePct: number;
}

export interface CropWaterRequirementResult {
  crop: CropInfo;
  cropAreaHa: number;
  etoMmDay: number; // Reference ET (mm/day)
  etcMmDay: number; // Crop ET (mm/day)
  monthlyRequirementM3Ha: number;
  totalCropVolumeM3: number;
  effectiveRainfallMm: number;
  netIrrigationDeficitM3: number;
  stressIndexPct: number; // Agricultural Stress Index (ASI %)
  stressLevel: 'Low Stress' | 'Moderate Deficit' | 'Severe Drought Risk';
}

export interface WatershedAgriStressSummary {
  siteName: string;
  totalCultivatedHa: number;
  meanEtoMmDay: number;
  totalAgriWaterDemandM3: number;
  availableSurfaceWaterM3: number;
  waterDeficitGapM3: number;
  waterDeficitLakhLiters: number;
  dripSavingsPotentialM3: number;
  overallAgriStressPct: number;
  overallStressGrade: 'Low' | 'Moderate' | 'Critical';
  cropResults: CropWaterRequirementResult[];
  actionRecommendations: string[];
}

/** Default regional crop pattern for Saswad, Purandar Taluka, Pune */
export const SASWAD_CROPS: CropInfo[] = [
  {
    id: 'sorghum',
    name: 'Jowar / Sorghum (ज्वारी)',
    marathiName: 'ज्वारी',
    category: 'Rabi',
    kc: 0.85,
    growthStage: 'Grain Development Stage',
    areaSharePct: 40,
  },
  {
    id: 'onion',
    name: 'Onion / Vegetables (कांदा)',
    marathiName: 'कांदा व भाजीपाला',
    category: 'Rabi',
    kc: 0.95,
    growthStage: 'Bulb Formation',
    areaSharePct: 25,
  },
  {
    id: 'custard_apple',
    name: 'Custard Apple / Fig (सीताफळ व अंजीर)',
    marathiName: 'सीताफळ व अंजीर बागा',
    category: 'Horticulture',
    kc: 0.65,
    growthStage: 'Fruit Maturation',
    areaSharePct: 20,
  },
  {
    id: 'sugarcane',
    name: 'Sugarcane (ऊस)',
    marathiName: 'ऊस',
    category: 'Perennial',
    kc: 1.15,
    growthStage: 'Grand Growth Phase',
    areaSharePct: 15,
  },
];

/**
 * Calculates Hargreaves Reference Evapotranspiration (ETo in mm/day)
 * ETo = 0.0023 * Ra * (Tmean + 17.8) * sqrt(Tmax - Tmin)
 * For Latitude ~18.4° N (Saswad): Ra ~= 14.5 MJ/m²/day equivalent to ~6.0 mm/day water evaporation equivalent
 */
export function calculateReferenceEto(
  tMax = 32.5,
  tMin = 18.2,
  latitude = 18.423
): { etoMmDay: number; raMmDay: number } {
  const tMean = (tMax + tMin) / 2;
  const tRange = Math.max(1, tMax - tMin);
  // Estimate extraterrestrial radiation Ra in mm/day for latitude 18.4° N
  const raMmDay = 14.2 + Math.sin((latitude * Math.PI) / 180) * 2.0;

  const eto = 0.0023 * raMmDay * (tMean + 17.8) * Math.sqrt(tRange);
  return {
    etoMmDay: Number(eto.toFixed(2)),
    raMmDay: Number(raMmDay.toFixed(2)),
  };
}

/**
 * Computes agricultural water requirement and irrigation stress forecaster metrics.
 */
export function calculateCropWaterRequirements(
  site: SiteRow,
  metrics: SiteMetricsRow | null,
  options?: {
    tMax?: number;
    tMin?: number;
    effectiveRainfallMm?: number;
    customCrops?: CropInfo[];
  }
): WatershedAgriStressSummary {
  const tMax = options?.tMax ?? 32.5;
  const tMin = options?.tMin ?? 18.2;
  const effectiveRainfallMm = options?.effectiveRainfallMm ?? 12.5; // Post-monsoon effective rainfall
  const crops = options?.customCrops ?? SASWAD_CROPS;

  const { etoMmDay } = calculateReferenceEto(tMax, tMin, site.centre_lat ?? 18.423);
  const totalCultivatedHa = metrics?.vegetation_current_ha ?? 3651.68;

  let totalAgriWaterDemandM3 = 0;
  let weightedStressSum = 0;

  const cropResults: CropWaterRequirementResult[] = crops.map((crop) => {
    const cropAreaHa = Number(((totalCultivatedHa * crop.areaSharePct) / 100).toFixed(2));
    const etcMmDay = Number((etoMmDay * crop.kc).toFixed(2));

    // 30-day monthly requirement per hectare (1 mm = 10 m³/ha)
    const monthlyRequirementM3Ha = Number((etcMmDay * 30 * 10).toFixed(1));
    const totalCropVolumeM3 = Math.round(monthlyRequirementM3Ha * cropAreaHa);

    // Effective rainfall contribution in m³/ha
    const rainContributionM3Ha = effectiveRainfallMm * 10;
    const netIrrigationDeficitM3Ha = Math.max(0, monthlyRequirementM3Ha - rainContributionM3Ha);
    const netIrrigationDeficitM3 = Math.round(netIrrigationDeficitM3Ha * cropAreaHa);

    // Agricultural Stress Index % = (1 - Rain/Demand) * 100% modulated by Kc
    const stressIndexPct = Number(
      Math.min(95, Math.max(8, (1 - rainContributionM3Ha / monthlyRequirementM3Ha) * 100 * (crop.kc / 0.9))).toFixed(1)
    );

    let stressLevel: 'Low Stress' | 'Moderate Deficit' | 'Severe Drought Risk' = 'Low Stress';
    if (stressIndexPct > 45) {
      stressLevel = 'Severe Drought Risk';
    } else if (stressIndexPct > 20) {
      stressLevel = 'Moderate Deficit';
    }

    totalAgriWaterDemandM3 += totalCropVolumeM3;
    weightedStressSum += stressIndexPct * cropAreaHa;

    return {
      crop,
      cropAreaHa,
      etoMmDay,
      etcMmDay,
      monthlyRequirementM3Ha,
      totalCropVolumeM3,
      effectiveRainfallMm,
      netIrrigationDeficitM3,
      stressIndexPct,
      stressLevel,
    };
  });

  // Calculate Available Surface Water (Water Area in Ha * Avg Depth 2.5m * 10,000 m²/ha)
  const currentWaterHa = metrics?.water_current_ha ?? 3.03;
  const availableSurfaceWaterM3 = Math.round(currentWaterHa * 2.5 * 10000);

  const waterDeficitGapM3 = Math.max(0, totalAgriWaterDemandM3 - availableSurfaceWaterM3);
  const waterDeficitLakhLiters = Number(((waterDeficitGapM3 * 1000) / 100000).toFixed(1));
  const dripSavingsPotentialM3 = Math.round(totalAgriWaterDemandM3 * 0.40); // 40% drip irrigation savings

  const overallAgriStressPct = Number((weightedStressSum / Math.max(1, totalCultivatedHa)).toFixed(1));
  let overallStressGrade: 'Low' | 'Moderate' | 'Critical' = 'Low';
  if (overallAgriStressPct > 45) {
    overallStressGrade = 'Critical';
  } else if (overallAgriStressPct > 25) {
    overallStressGrade = 'Moderate';
  }

  const actionRecommendations: string[] = [
    `Mandate Micro-Drip Irrigation for Sugarcane & Vegetables: Reduces monthly water demand by ~${(dripSavingsPotentialM3 / 100000).toFixed(1)} Lakh m³.`,
    `Prioritize Protective Irrigation for Custard Apple & Horticulture (${cropResults.find((c) => c.crop.id === 'custard_apple')?.cropAreaHa.toFixed(0)} ha) during critical fruit maturation phase.`,
    `Water Deficit Warning: Surface water reservoirs meet only ${((availableSurfaceWaterM3 / Math.max(1, totalAgriWaterDemandM3)) * 100).toFixed(1)}% of monthly agricultural requirements — promote farm pond groundwater recharge.`,
  ];

  return {
    siteName: site.name,
    totalCultivatedHa,
    meanEtoMmDay: etoMmDay,
    totalAgriWaterDemandM3,
    availableSurfaceWaterM3,
    waterDeficitGapM3,
    waterDeficitLakhLiters,
    dripSavingsPotentialM3,
    overallAgriStressPct,
    overallStressGrade,
    cropResults,
    actionRecommendations,
  };
}
