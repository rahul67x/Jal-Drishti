/**
 * Geometry helpers for registering a new site from a boundary file.
 *
 * A site's centre, bounding box and area are all derivable from its boundary,
 * so the form computes them rather than asking. That is not just convenience:
 * the hardcoded Saswad entry had a centre outside its own boundary and an area
 * of 142.6 km² against a real 37.21 km², precisely because those three numbers
 * were typed independently of the polygon they describe.
 */

export interface BoundarySummary {
  geojson: GeoJSON.FeatureCollection;
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
  centreLat: number;
  centreLng: number;
  areaKm2: number;
  /** Whether the area came from the file or was calculated from the geometry. */
  areaSource: 'file' | 'computed';
  /** A zoom level that fits the extent in a typical map viewport. */
  suggestedZoom: number;
  ringCount: number;
  /** Non-fatal things worth showing the user before they commit. */
  warnings: string[];
}

/**
 * Authalic (equal-area) mean radius, not the equatorial radius.
 *
 * Using 6,378,137 m — the equatorial figure most people reach for — overstates
 * area by about 0.22%. Small, but this number ends up in a report next to
 * measurements quoted to two decimal places.
 */
const EARTH_AUTHALIC_RADIUS_M = 6_371_007.181;

/** Walks every coordinate pair in any GeoJSON geometry. */
function eachCoord(coords: unknown, visit: (lng: number, lat: number) => void): void {
  if (!Array.isArray(coords)) return;
  if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
    visit(coords[0], coords[1]);
    return;
  }
  for (const c of coords) eachCoord(c, visit);
}

/** Collects the outer and inner rings of every polygon in the collection. */
function collectRings(fc: GeoJSON.FeatureCollection): number[][][] {
  const rings: number[][][] = [];
  for (const feature of fc.features ?? []) {
    const g = feature.geometry;
    if (!g) continue;
    if (g.type === 'Polygon') rings.push(...(g.coordinates as number[][][]));
    else if (g.type === 'MultiPolygon') {
      for (const poly of g.coordinates as number[][][][]) rings.push(...poly);
    }
  }
  return rings;
}

/**
 * Spherical polygon area, in square metres.
 *
 * Uses the spherical excess formula rather than treating latitude and longitude
 * as a flat plane. At Saswad's latitude a planar approximation is off by several
 * percent, which is the difference between a report that reconciles with QGIS
 * and one that does not.
 *
 * Holes (rings after the first in a polygon) are subtracted.
 */
function ringAreaM2(ring: number[][]): number {
  if (ring.length < 3) return 0;
  const rad = (deg: number) => (deg * Math.PI) / 180;

  let total = 0;
  for (let i = 0; i < ring.length; i++) {
    const [lng1, lat1] = ring[i];
    const [lng2, lat2] = ring[(i + 1) % ring.length];
    total += (rad(lng2) - rad(lng1)) * (2 + Math.sin(rad(lat1)) + Math.sin(rad(lat2)));
  }
  return Math.abs((total * EARTH_AUTHALIC_RADIUS_M * EARTH_AUTHALIC_RADIUS_M) / 2);
}

/** Fits an extent to a roughly 1000 px wide viewport. */
function zoomForExtent(minLng: number, maxLng: number): number {
  const span = Math.abs(maxLng - minLng) || 0.01;
  // 360 degrees spans 256 px at zoom 0; solve for the zoom that fits `span`.
  const zoom = Math.log2((360 / span) * (1000 / 256));
  return Math.max(3, Math.min(16, Math.round(zoom)));
}

/**
 * Parses a GeoJSON boundary file and derives everything the site row needs.
 *
 * Throws with a readable message rather than returning null, because every
 * failure here is something the user has to fix in their file.
 */
export function summariseBoundary(raw: string): BoundarySummary {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('That file is not valid JSON.');
  }

  const obj = parsed as GeoJSON.FeatureCollection | GeoJSON.Feature | GeoJSON.Geometry;

  // Accept a bare Feature or Geometry too — plenty of exports are not wrapped.
  let fc: GeoJSON.FeatureCollection;
  if ((obj as GeoJSON.FeatureCollection).type === 'FeatureCollection') {
    fc = obj as GeoJSON.FeatureCollection;
  } else if ((obj as GeoJSON.Feature).type === 'Feature') {
    fc = { type: 'FeatureCollection', features: [obj as GeoJSON.Feature] };
  } else if ((obj as GeoJSON.Geometry).type) {
    fc = {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: {}, geometry: obj as GeoJSON.Geometry }],
    };
  } else {
    throw new Error('That file is JSON but not GeoJSON — no FeatureCollection, Feature or geometry found.');
  }

  if (!fc.features?.length) throw new Error('The GeoJSON contains no features.');

  const rings = collectRings(fc);
  if (rings.length === 0) {
    throw new Error('No Polygon or MultiPolygon found. A site boundary must be an area, not a point or line.');
  }

  let minLat = Infinity, minLng = Infinity, maxLat = -Infinity, maxLng = -Infinity;
  let coordCount = 0;
  for (const feature of fc.features) {
    eachCoord(feature.geometry && (feature.geometry as { coordinates?: unknown }).coordinates, (lng, lat) => {
      coordCount++;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    });
  }

  if (coordCount === 0) throw new Error('The GeoJSON has no coordinates.');

  // GeoJSON is [longitude, latitude]. A file authored the other way round often
  // produces out-of-range values, but not always — swapping 18.3 N / 74.0 E
  // gives 74.0 N / 18.3 E, which is a real place in the Arctic Ocean and passes
  // every range check. That case is caught by the heuristic below, as a warning
  // rather than an error, because it cannot be distinguished with certainty
  // from a genuine high-latitude site.
  if (Math.abs(minLat) > 90 || Math.abs(maxLat) > 90) {
    throw new Error(
      'Latitudes outside ±90° — the coordinates may be in [lat, lng] order. GeoJSON expects [lng, lat].'
    );
  }
  if (Math.abs(minLng) > 180 || Math.abs(maxLng) > 180) {
    throw new Error('Longitudes outside ±180°. Check the file is in WGS84 degrees, not a projected CRS.');
  }

  const warnings: string[] = [];
  const centreLat = (minLat + maxLat) / 2;
  const centreLng = (minLng + maxLng) / 2;

  if (Math.abs(centreLat) > 60 && Math.abs(centreLng) < 60) {
    warnings.push(
      `Centre works out at ${centreLat.toFixed(3)}° latitude, ${centreLng.toFixed(3)}° longitude. ` +
        'If this is not a polar site, the file may have its coordinates in [lat, lng] order — ' +
        'GeoJSON expects [lng, lat].'
    );
  }

  // Outer ring adds, holes subtract.
  let areaM2 = 0;
  for (const feature of fc.features) {
    const g = feature.geometry;
    if (!g) continue;
    const polys: number[][][][] =
      g.type === 'Polygon'
        ? [g.coordinates as number[][][]]
        : g.type === 'MultiPolygon'
        ? (g.coordinates as number[][][][])
        : [];
    for (const poly of polys) {
      poly.forEach((ring, i) => {
        areaM2 += i === 0 ? ringAreaM2(ring) : -ringAreaM2(ring);
      });
    }
  }

  /**
   * Prefer an AREA the file already carries.
   *
   * QGIS writes the area it measured in the projected CRS the analysis ran in.
   * That differs from a geodesic area on the ellipsoid by a few tenths of a
   * percent — for Saswad, 37.21 km² projected against 37.34 km² geodesic.
   * Neither is wrong, but the app should agree with the analysis it is
   * reporting on, so the file's own figure wins when it has one.
   */
  const declaredM2 = fc.features
    .map((f) => (f.properties as Record<string, unknown> | null)?.AREA)
    .find((v): v is number => typeof v === 'number' && v > 0);

  let areaKm2: number;
  let areaSource: 'file' | 'computed';

  if (declaredM2 && Math.abs(declaredM2 / 1_000_000 - areaM2 / 1_000_000) / (areaM2 / 1_000_000) < 0.1) {
    // Within 10% of the geodesic figure, so it is plausibly the same polygon
    // measured a different way rather than a stray field that means something else.
    areaKm2 = Number((declaredM2 / 1_000_000).toFixed(4));
    areaSource = 'file';
  } else {
    areaKm2 = Number((areaM2 / 1_000_000).toFixed(4));
    areaSource = 'computed';
    if (declaredM2) {
      warnings.push(
        `The file declares an AREA of ${(declaredM2 / 1_000_000).toFixed(2)} km², but the geometry ` +
          `measures ${areaKm2.toFixed(2)} km². Using the measured value.`
      );
    }
  }

  return {
    geojson: fc,
    minLat,
    minLng,
    maxLat,
    maxLng,
    centreLat,
    centreLng,
    areaKm2,
    areaSource,
    suggestedZoom: zoomForExtent(minLng, maxLng),
    ringCount: rings.length,
    warnings,
  };
}

/** "Saswad, Pune" -> "saswad-pune" */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
