import { fromBlob } from 'geotiff';

export interface AnalysisEngineResult {
  width: number;
  height: number;
  samplesPerPixel: number;
  meanNdvi: number | null;
  meanNdwi: number | null;
  landcoverDistribution?: { category: string; sharePct: number; areaHa: number }[];
  heatmapGrid: (number | null)[][];
  totalPixels: number;
  validPixels: number;
  nodataPixels: number;
  bbox: number[] | null;
}

const ANALYSIS_SIZE = 128;
const HEATMAP_COLS = 32;

// ESA WorldCover / Dynamic World classification map
const LC_MAP: Record<number, string> = {
  10: 'Trees / Forest',
  20: 'Shrubland',
  30: 'Grassland',
  40: 'Cropland / Agriculture',
  50: 'Built-up',
  60: 'Bare / Sparse vegetation',
  70: 'Snow / Ice',
  80: 'Open Water',
  90: 'Herbaceous Wetland',
  95: 'Mangroves',
};

/**
 * Parses an uploaded GeoTIFF File directly in the browser using geotiff.js.
 * Computes mean NDVI, NDWI, downsampled heatmap grid, or ESA WorldCover land use percentages.
 */
export async function analyzeUploadedGeoTiff(
  file: File,
  bands: { redBand?: number; nirBand?: number; greenBand?: number } = { redBand: 1, nirBand: 2 }
): Promise<AnalysisEngineResult> {
  const tiff = await fromBlob(file);
  const image = await tiff.getImage();
  const spp = image.getSamplesPerPixel();
  const bbox = image.getBoundingBox() ?? null;

  const rawNoData = image.getGDALNoData();
  const nodataVal = rawNoData != null ? Number(rawNoData) : null;

  const rasters = await image.readRasters({
    width: ANALYSIS_SIZE,
    height: ANALYSIS_SIZE,
    interleave: false,
  });

  const W = ANALYSIS_SIZE;
  const H = ANALYSIS_SIZE;
  const totalPixels = W * H;

  const isNoData = (v: number) =>
    v == null || Number.isNaN(v) || (nodataVal !== null && v === nodataVal);

  let ndviSum = 0;
  let ndviCount = 0;
  let ndwiSum = 0;
  let ndwiCount = 0;
  let nodataCount = 0;

  const values: (number | null)[] = new Array(totalPixels);

  if (spp === 1) {
    // Single-band raster (either pre-calculated NDVI or Landcover code)
    const band = rasters[0] as ArrayLike<number>;

    // Check if values look like Landcover integer class codes (e.g. 10, 40, 80)
    let isLandcover = false;
    const lcCounts: Record<string, number> = {};

    for (let i = 0; i < Math.min(100, band.length); i++) {
      if (LC_MAP[band[i]]) {
        isLandcover = true;
        break;
      }
    }

    for (let i = 0; i < totalPixels; i++) {
      const v = Number(band[i]);
      if (isNoData(v)) {
        values[i] = null;
        nodataCount++;
        continue;
      }

      if (isLandcover) {
        const cat = LC_MAP[v] || 'Other';
        lcCounts[cat] = (lcCounts[cat] || 0) + 1;
        values[i] = v;
      } else {
        // Raw NDVI raster
        const normVal = Math.abs(v) > 1.5 ? v / 10000 : v;
        values[i] = normVal;
        ndviSum += normVal;
        ndviCount++;
      }
    }

    let landcoverDistribution;
    if (isLandcover && totalPixels - nodataCount > 0) {
      const valid = totalPixels - nodataCount;
      landcoverDistribution = Object.entries(lcCounts).map(([category, count]) => ({
        category,
        sharePct: Number(((count / valid) * 100).toFixed(1)),
        areaHa: Number(((count * 30 * 30) / 10000).toFixed(1)),
      }));
    }

    const meanNdvi = ndviCount > 0 ? Number((ndviSum / ndviCount).toFixed(3)) : null;
    const heatmapGrid = downsampleGrid(values, W, H, HEATMAP_COLS);

    return {
      width: image.getWidth(),
      height: image.getHeight(),
      samplesPerPixel: spp,
      meanNdvi,
      meanNdwi: null,
      landcoverDistribution,
      heatmapGrid,
      totalPixels,
      validPixels: totalPixels - nodataCount,
      nodataPixels: nodataCount,
      bbox,
    };
  }

  // Multi-band raster (Red, NIR, Green)
  const redIdx = Math.max(0, (bands.redBand ?? 1) - 1);
  const nirIdx = Math.max(0, (bands.nirBand ?? 2) - 1);
  const greenIdx = bands.greenBand ? Math.max(0, bands.greenBand - 1) : null;

  const red = rasters[redIdx] as ArrayLike<number>;
  const nir = rasters[nirIdx] as ArrayLike<number>;
  const green = greenIdx !== null ? (rasters[greenIdx] as ArrayLike<number>) : null;

  for (let i = 0; i < totalPixels; i++) {
    const r = Number(red[i]);
    const n = Number(nir[i]);

    if (isNoData(r) || isNoData(n)) {
      values[i] = null;
      nodataCount++;
      continue;
    }

    const denom = n + r;
    if (denom === 0) {
      values[i] = null;
      continue;
    }

    const ndviVal = (n - r) / denom;
    values[i] = ndviVal;
    ndviSum += ndviVal;
    ndviCount++;

    if (green) {
      const g = Number(green[i]);
      if (!isNoData(g)) {
        const wDenom = g + n;
        if (wDenom !== 0) {
          ndwiSum += (g - n) / wDenom;
          ndwiCount++;
        }
      }
    }
  }

  const meanNdvi = ndviCount > 0 ? Number((ndviSum / ndviCount).toFixed(3)) : null;
  const meanNdwi = ndwiCount > 0 ? Number((ndwiSum / ndwiCount).toFixed(3)) : null;
  const heatmapGrid = downsampleGrid(values, W, H, HEATMAP_COLS);

  return {
    width: image.getWidth(),
    height: image.getHeight(),
    samplesPerPixel: spp,
    meanNdvi,
    meanNdwi,
    heatmapGrid,
    totalPixels,
    validPixels: ndviCount,
    nodataPixels: nodataCount,
    bbox,
  };
}

function downsampleGrid(values: (number | null)[], W: number, H: number, cols: number): (number | null)[][] {
  const rows = cols;
  const bw = Math.floor(W / cols);
  const bh = Math.floor(H / rows);
  const grid: (number | null)[][] = [];

  for (let gy = 0; gy < rows; gy++) {
    const row: (number | null)[] = [];
    for (let gx = 0; gx < cols; gx++) {
      let sum = 0;
      let count = 0;
      for (let y = 0; y < bh; y++) {
        for (let x = 0; x < bw; x++) {
          const v = values[(gy * bh + y) * W + (gx * bw + x)];
          if (v !== null && v !== undefined && !Number.isNaN(v)) {
            sum += v;
            count++;
          }
        }
      }
      row.push(count > 0 ? sum / count : null);
    }
    grid.push(row);
  }
  return grid;
}
