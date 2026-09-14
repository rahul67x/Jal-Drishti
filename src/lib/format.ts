/**
 * Shared formatting.
 *
 * Centralised because the old build showed the same quantity three different
 * ways on one screen — "3,651.68 ha", "3651.65", "37.21 km²" — which made
 * figures that agreed look like figures that disagreed.
 *
 * Grouping is international (1,234,567) rather than Indian (12,34,567), even
 * though the audience is Indian: these are scientific measurements meant to be
 * checked line-by-line against the QGIS source reports, which print ungrouped
 * digits. A reviewer comparing 3,70,566 against 370566 has to stop and think.
 *
 * Values arriving from PostgREST are numeric columns, which come over the wire
 * as strings to avoid float precision loss. Every helper here accepts both.
 */

type Num = number | string | null | undefined;

function toNumber(value: Num): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** "3,651.68 ha" */
export function formatHa(value: Num, decimals = 2): string {
  const n = toNumber(value);
  if (n === null) return '—';
  return `${n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} ha`;
}

/** "37.21 km²" */
export function formatKm2(value: Num, decimals = 2): string {
  const n = toNumber(value);
  if (n === null) return '—';
  return `${n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} km²`;
}

/** "-1.46%" — always signed, so a drop is never mistaken for a gain. */
export function formatPct(value: Num, decimals = 2): string {
  const n = toNumber(value);
  if (n === null) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(decimals)}%`;
}

/** "-53.98 ha" — always signed. */
export function formatSignedHa(value: Num, decimals = 2): string {
  const n = toNumber(value);
  if (n === null) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} ha`;
}

/** "372,099" */
export function formatCount(value: Num): string {
  const n = toNumber(value);
  if (n === null) return '—';
  return n.toLocaleString('en-US');
}

/** "1.4 MB" */
export function formatBytes(value: Num): string {
  const n = toNumber(value);
  if (n === null) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** "2023 → 2026", or just "2026" for a single-date layer. */
export function formatYearRange(from: Num, to: Num): string {
  const a = toNumber(from);
  const b = toNumber(to);
  if (a === null && b === null) return '—';
  if (a !== null && b !== null && a !== b) return `${a} → ${b}`;
  return String(a ?? b);
}

/** "12 Jun 2026" */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** "18.3082° N, 73.9992° E" */
export function formatLatLng(lat: Num, lng: Num, decimals = 4): string {
  const a = toNumber(lat);
  const b = toNumber(lng);
  if (a === null || b === null) return '—';
  return `${Math.abs(a).toFixed(decimals)}° ${a >= 0 ? 'N' : 'S'}, ${Math.abs(b).toFixed(decimals)}° ${b >= 0 ? 'E' : 'W'}`;
}

/** Numeric coercion for charts, which need real numbers rather than strings. */
export const num = toNumber;
