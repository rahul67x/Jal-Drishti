import type { AnalyticsTabId } from '../../components/analytics/AnalyticsTabs';
import type { LayerState } from '../../components/analytics/MapLayerControls';

/**
 * The guided tour, as data.
 *
 * Each step declares two things separately:
 *
 *   `apply`   what the app should be showing — a tab, a set of layers. The
 *             tour hands this to the dashboard's own state setters, so it
 *             drives the application exactly as a user's clicks would.
 *
 *   `anchor`  which element to spotlight. Cosmetic only. If the element is
 *             gone the step still runs, just without a highlight.
 *
 * Splitting them is what makes the tour survive UI churn. Restyle a card, move
 * it, rewrite its component — the tour is unaffected, because it never touched
 * the DOM. Delete a tab id and TypeScript fails the build, so a broken tour
 * cannot ship silently. `npm run tour:check` verifies the anchors separately.
 */

export interface TourStep {
  id: string;
  title: string;
  /** Shown on screen. Kept to two or three sentences. */
  body: string;
  /**
   * A secondary line for the detail that matters but would crowd the card.
   * Rendered smaller, and spoken after the body.
   */
  detail?: string;
  /**
   * What the narrator says, when it should differ from the written text.
   *
   * Written text can lean on symbols and abbreviations that read badly aloud:
   * "−53.98 ha (−1.46%)" becomes "minus 53.98 hectares, a drop of 1.46 percent".
   * Where a step reads fine either way, this is omitted.
   */
  spoken?: string;
  anchor?: string;
  apply?: {
    tab?: AnalyticsTabId;
    layers?: Partial<LayerState>;
  };
  /** Milliseconds before auto-advancing when playing. */
  dwell?: number;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'What you are looking at',
    body:
      'The Saswad watershed in Purandar taluka, near Pune. 37.21 square kilometres, analysed from Sentinel-2 satellite imagery at 10 metre resolution.',
    detail:
      'Every number on this page is calculated from raster pixel counts at the moment you load it. None of them is typed into the code.',
    spoken:
      'This is the Saswad watershed in Purandar taluka, near Pune. Thirty seven point two one square kilometres, analysed from Sentinel 2 satellite imagery at ten metre resolution. Every number on this page is calculated from raster pixel counts at the moment you load it. None of them is typed into the code.',
    anchor: 'site-header',
    apply: { tab: 'overview' },
    dwell: 11000,
  },
  {
    id: 'cross-check',
    title: 'The analysis checks itself',
    body:
      'Water loss can be measured two independent ways: by subtracting the 2023 and 2026 water masks, or by counting the separate change raster directly. Both give exactly −9.50 hectares.',
    detail:
      'Two separately produced datasets agreeing to the hectare is the strongest internal evidence this analysis has. If they ever stop agreeing, this banner turns amber rather than hiding it.',
    spoken:
      'Water loss here can be measured two independent ways. You can subtract the 2023 and 2026 water masks, or you can count the separate change raster directly. Both give exactly minus nine point five hectares. Two separately produced datasets agreeing to the hectare is the strongest internal evidence this analysis has. And if they ever stop agreeing, this banner turns amber rather than hiding it.',
    anchor: 'cross-check',
    apply: { tab: 'overview' },
    dwell: 13000,
  },
  {
    id: 'metrics',
    title: 'Measured, not asserted',
    body:
      'Vegetation fell by 53.98 hectares, a drop of 1.46 percent. Surface water fell by 9.50 hectares — three quarters of what was there in 2023.',
    detail:
      'Hover any card to see the pixel arithmetic behind it. Each one traces back to a specific class count in a specific raster.',
    spoken:
      'Vegetation fell by fifty three point nine eight hectares, a drop of one point four six percent. Surface water fell by nine point five hectares, which is three quarters of what was there in 2023. Hovering any card shows the pixel arithmetic behind it, tracing back to a specific class count in a specific raster.',
    anchor: 'metric-cards',
    apply: { tab: 'overview' },
    dwell: 11000,
  },
  {
    id: 'water',
    title: 'Surface water, 2023 against 2026',
    body:
      'Both water masks drawn together. The lighter blue is 2023; almost none of it survives into 2026.',
    detail:
      '12.53 hectares down to 3.03. In a semi-arid catchment this is the signal that matters most to a planner.',
    spoken:
      'Here are both water masks drawn together. The lighter blue is 2023, and almost none of it survives into 2026. Twelve point five three hectares down to three point zero three. In a semi arid catchment, this is the signal that matters most to a planner.',
    anchor: 'map',
    apply: {
      tab: 'water',
      layers: { water2023: true, water2026: true, waterBodies: true, ndvi: false, changeDetection: false },
    },
    dwell: 12000,
  },
  {
    id: 'ndvi',
    title: 'Vegetation vigour',
    body:
      'The NDVI raster for 2023, decoded in your browser from the original GeoTIFF and rendered as a greyscale stretch, exactly as QGIS would draw it.',
    detail:
      'Brighter means denser, healthier vegetation. Nothing was pre-rendered — the raw raster is fetched and coloured client-side.',
    spoken:
      'This is the NDVI raster for 2023, decoded in your browser from the original GeoTIFF and rendered as a greyscale stretch, exactly as QGIS would draw it. Brighter means denser, healthier vegetation. Nothing here was pre-rendered. The raw raster is fetched and coloured in the browser.',
    anchor: 'map',
    apply: { tab: 'vegetation', layers: { ndvi: true, water2023: false, water2026: false, waterBodies: false } },
    dwell: 12000,
  },
  {
    id: 'change',
    title: 'Where it changed',
    body:
      'The change raster classifies every pixel as loss, gain, or stable. 954 pixels lost water; 4 gained it.',
    detail:
      'At 10 metres square per pixel that is 9.54 hectares against 0.04 — the asymmetry is the finding.',
    spoken:
      'The change raster classifies every pixel as loss, gain, or stable. Nine hundred and fifty four pixels lost water. Four gained it. At ten metres square per pixel, that is nine point five four hectares against zero point zero four. The asymmetry is the finding.',
    anchor: 'change-banner',
    apply: { tab: 'change' },
    dwell: 12000,
  },
  {
    id: 'field',
    title: 'Ground evidence',
    body:
      'Field photographs positioned by the GPS recorded in their own EXIF data, or placed on the map by hand when a photo has none.',
    detail:
      'Which of the two is stored for every photograph, so a measured position is never mistaken for an estimated one.',
    spoken:
      'Field photographs are positioned by the GPS recorded in their own EXIF data, or placed on the map by hand when a photo has none. Which of the two applies is stored for every photograph, so a measured position is never mistaken for an estimated one.',
    anchor: 'field-panel',
    apply: { tab: 'field' },
    dwell: 11000,
  },
  {
    id: 'report',
    title: 'Take it away',
    body:
      'Everything here — the statistics, the charts, the satellite plates and the field evidence — generates as a PDF in your browser.',
    detail:
      'No server involved, and the text is real and selectable rather than a screenshot. Pick the sections you want and download.',
    spoken:
      'Everything here, the statistics, the charts, the satellite plates and the field evidence, generates as a PDF in your browser. No server is involved, and the text is real and selectable rather than a screenshot. Pick the sections you want, and download.',
    anchor: 'report-panel',
    apply: { tab: 'report' },
    dwell: 11000,
  },
];

/** The full text for a step, in the order it should be read aloud. */
export function spokenText(step: TourStep): string {
  if (step.spoken) return step.spoken;
  return [step.title, step.body, step.detail].filter(Boolean).join('. ');
}
