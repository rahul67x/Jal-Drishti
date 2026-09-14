import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import type { ReportData } from './reportData';
import { formatHa, formatKm2, formatPct, formatSignedHa, formatCount, formatDate, formatLatLng } from '../../lib/format';

/**
 * The PDF site report.
 *
 * Built with @react-pdf/renderer, entirely in the browser. Text is real and
 * selectable rather than a screenshot, and no server has to stay warm during a
 * demo.
 *
 * The charts are drawn with plain Views rather than converted from Recharts:
 * a bar is a rectangle of a known width, which is exact, vector, and cannot
 * fail the way an SVG-to-canvas conversion can.
 */

const C = {
  ink: '#111111',
  body: '#374151',
  muted: '#6F6F6F',
  faint: '#9CA3AF',
  green: '#183A2A',
  greenMid: '#35624B',
  greenPale: '#EEF5EC',
  blue: '#4D8FA8',
  bluePale: '#DCEEF2',
  red: '#E11D48',
  amber: '#D97706',
  line: '#E5E7EB',
  paper: '#FFFFFF',
  panel: '#F7F9F6',
};

const s = StyleSheet.create({
  page: { paddingTop: 42, paddingBottom: 56, paddingHorizontal: 44, fontSize: 9, color: C.body, lineHeight: 1.5 },
  coverPage: { padding: 0, fontSize: 9, color: C.body },

  // Cover
  coverBand: { backgroundColor: C.green, paddingHorizontal: 48, paddingTop: 90, paddingBottom: 44 },
  coverEyebrow: { fontSize: 8, color: '#A8C5A0', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 },
  coverTitle: { fontSize: 34, color: C.paper, marginBottom: 6 },
  coverSub: { fontSize: 12, color: '#C7D9C2' },
  coverBody: { paddingHorizontal: 48, paddingTop: 32 },

  h1: { fontSize: 17, color: C.green, marginBottom: 3 },
  h2: { fontSize: 12, color: C.ink, marginTop: 16, marginBottom: 6 },
  eyebrow: { fontSize: 7, color: C.muted, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 3 },
  p: { marginBottom: 6 },
  small: { fontSize: 7.5, color: C.muted },
  mono: { fontFamily: 'Courier', fontSize: 7.5 },

  rule: { borderBottomWidth: 1, borderBottomColor: C.line, marginVertical: 10 },

  // Key-value grid
  kvRow: { flexDirection: 'row', flexWrap: 'wrap' },
  kv: { width: '33.33%', marginBottom: 10, paddingRight: 8 },
  kvLabel: { fontSize: 7, color: C.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 },
  kvValue: { fontSize: 10.5, color: C.ink },

  // Tables
  table: { marginTop: 6, borderWidth: 1, borderColor: C.line, borderRadius: 3 },
  th: { flexDirection: 'row', backgroundColor: C.panel, borderBottomWidth: 1, borderBottomColor: C.line },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: C.line },
  trLast: { flexDirection: 'row' },
  cell: { paddingVertical: 4.5, paddingHorizontal: 7, fontSize: 8 },
  cellHead: { paddingVertical: 5, paddingHorizontal: 7, fontSize: 7, color: C.muted, letterSpacing: 0.6, textTransform: 'uppercase' },
  num: { textAlign: 'right' },

  // Callouts
  callout: { padding: 9, borderRadius: 4, borderWidth: 1, marginTop: 8 },
  ok: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  warn: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  info: { backgroundColor: C.panel, borderColor: C.line },

  // Charts
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', height: 92, marginTop: 8, marginBottom: 4 },
  chartCol: { flex: 1, alignItems: 'center' },
  bar: { width: 44, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  barLabel: { fontSize: 7.5, color: C.muted, marginTop: 4 },
  barValue: { fontSize: 8, color: C.ink, marginBottom: 3 },

  // Images
  plate: { marginBottom: 14, breakInside: 'avoid' },
  plateImg: { width: '100%', height: 210, objectFit: 'cover', borderRadius: 3 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  photoCell: { width: '33.33%', paddingHorizontal: 4, marginBottom: 10 },
  photoImg: { width: '100%', height: 92, objectFit: 'cover', borderRadius: 3 },

  footer: { position: 'absolute', bottom: 26, left: 44, right: 44, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.line, paddingTop: 6 },
});

const Footer: React.FC<{ site: string }> = ({ site }) => (
  <View style={s.footer} fixed>
    <Text style={s.small}>JalDrishti · {site}</Text>
    <Text style={s.small} render={({ pageNumber, totalPages }) => `${pageNumber} of ${totalPages}`} />
  </View>
);

const KV: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={s.kv}>
    <Text style={s.kvLabel}>{label}</Text>
    <Text style={s.kvValue}>{value}</Text>
  </View>
);

const Section: React.FC<{ eyebrow?: string; title: string; children: React.ReactNode }> = ({
  eyebrow,
  title,
  children,
}) => (
  <View>
    {eyebrow && <Text style={s.eyebrow}>{eyebrow}</Text>}
    <Text style={s.h1}>{title}</Text>
    <View style={s.rule} />
    {children}
  </View>
);

/** A vertical bar chart drawn from Views — exact, vector, and cannot fail. */
const BarChart: React.FC<{
  data: { label: string; value: number; display: string; colour: string }[];
}> = ({ data }) => {
  const max = Math.max(...data.map((d) => d.value), 0.0001);
  return (
    <View style={s.chartRow}>
      {data.map((d) => (
        <View key={d.label} style={s.chartCol}>
          <Text style={s.barValue}>{d.display}</Text>
          <View
            style={[
              s.bar,
              {
                height: Math.max(2, (d.value / max) * 62),
                backgroundColor: d.colour,
              },
            ]}
          />
          <Text style={s.barLabel}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
};

export const ReportDocument: React.FC<{ data: ReportData; omitted?: { photos: number; plates: number } }> = ({
  data,
  omitted = { photos: 0, plates: 0 },
}) => {
  const { site, metrics: m, lulc, rasters, insights, geotagged, satellite, options } = data;
  const statRasters = rasters.filter((r) => r.stats.length > 0);
  const gridLayer = rasters.find((r) => r.pixel_size_m && r.total_pixels);

  return (
    <Document
      title={`JalDrishti — ${site.name} Site Report`}
      author="JalDrishti"
      subject={`Watershed analysis report for ${site.name}`}
    >
      {/* ---------------------------------------------------------------- */}
      {/* Cover                                                             */}
      {/* ---------------------------------------------------------------- */}
      <Page size="A4" style={s.coverPage}>
        <View style={s.coverBand}>
          <Text style={s.coverEyebrow}>Geospatial Intelligence for Watershed Development</Text>
          <Text style={s.coverTitle}>{site.name}</Text>
          <Text style={s.coverSub}>
            {[site.district, site.state, site.country].filter(Boolean).join(', ')}
          </Text>
        </View>

        <View style={s.coverBody}>
          <Text style={s.h2}>Site Analysis Report</Text>
          <Text style={[s.p, { color: C.muted }]}>
            Generated {formatDate(data.generatedAt)} from satellite-derived raster analysis.
            All figures are computed from the pixel counts recorded in the source rasters.
          </Text>

          <View style={s.rule} />

          <View style={s.kvRow}>
            <KV label="Site ID" value={site.slug} />
            <KV label="Analysis extent" value={formatKm2(m?.total_area_km2 ?? site.area_km2)} />
            <KV label="Analysis CRS" value={site.analysis_crs ?? site.crs} />
            <KV label="Centre" value={formatLatLng(site.centre_lat, site.centre_lng)} />
            <KV
              label="Grid"
              value={
                gridLayer
                  ? `${gridLayer.width_px} × ${gridLayer.height_px} @ ${gridLayer.pixel_size_m} m`
                  : '—'
              }
            />
            <KV label="Total pixels" value={formatCount(gridLayer?.total_pixels)} />
          </View>

          {m && (
            <>
              <Text style={s.h2}>Headline findings</Text>
              <View style={s.kvRow}>
                <KV
                  label={`Vegetation ${m.vegetation_baseline_year}→${m.vegetation_current_year}`}
                  value={`${formatSignedHa(m.vegetation_change_ha)} (${formatPct(m.vegetation_change_pct)})`}
                />
                <KV
                  label={`Water ${m.water_baseline_year}→${m.water_current_year}`}
                  value={`${formatSignedHa(m.water_change_ha)} (${formatPct(m.water_change_pct)})`}
                />
                <KV label="Net water change" value={formatSignedHa(m.water_net_change_ha)} />
              </View>

              <View style={[s.callout, m.water_change_cross_check_ok ? s.ok : s.warn]}>
                <Text style={{ fontSize: 8.5, color: m.water_change_cross_check_ok ? '#065F46' : '#92400E' }}>
                  {m.water_change_cross_check_ok
                    ? `Cross-check passed. The change raster reports ${formatSignedHa(m.water_net_change_ha)}, and subtracting the two independently derived water masks gives ${formatSignedHa(m.water_change_ha)}. Two separately produced rasters agreeing to the hectare is evidence the analysis is internally consistent.`
                    : `Cross-check FAILED. The change raster reports ${formatSignedHa(m.water_net_change_ha)} but the water masks give ${formatSignedHa(m.water_change_ha)}. These figures should be reconciled before the report is relied upon.`}
                </Text>
              </View>
            </>
          )}

          <View style={[s.callout, s.info]}>
            <Text style={s.small}>
              Every number in this report is derived at read time from the raster pixel
              counts stored in the database. No figure is transcribed by hand.
            </Text>
          </View>
        </View>

        <Footer site={site.name} />
      </Page>

      {/* ---------------------------------------------------------------- */}
      {/* Data and methods + derived metrics                                */}
      {/* ---------------------------------------------------------------- */}
      <Page size="A4" style={s.page}>
        <Section eyebrow="Section 1" title="Data and methods">
          <Text style={s.p}>
            The analysis covers {formatHa(m?.total_area_ha)} ({formatKm2(m?.total_area_km2)}) of the{' '}
            {site.name} watershed
            {gridLayer
              ? `, on a ${gridLayer.width_px} × ${gridLayer.height_px} grid at ${gridLayer.pixel_size_m} m resolution in ${gridLayer.crs}`
              : ''}
            . Class areas are the product of pixel counts and pixel area, exactly as
            reported by the source raster analysis.
          </Text>

          <Text style={s.h2}>Raster layers</Text>
          <View style={s.table}>
            <View style={s.th}>
              <Text style={[s.cellHead, { width: '30%' }]}>Layer</Text>
              <Text style={[s.cellHead, { width: '18%' }]}>Kind</Text>
              <Text style={[s.cellHead, { width: '14%' }]}>Period</Text>
              <Text style={[s.cellHead, { width: '16%', textAlign: 'right' }]}>Grid</Text>
              <Text style={[s.cellHead, { width: '22%' }]}>Source file</Text>
            </View>
            {rasters.map((r, i) => (
              <View key={r.id} style={i === rasters.length - 1 ? s.trLast : s.tr}>
                <Text style={[s.cell, { width: '30%' }]}>{r.title}</Text>
                <Text style={[s.cell, { width: '18%', color: C.muted }]}>{r.kind}</Text>
                <Text style={[s.cell, { width: '14%' }]}>
                  {r.year_to ? `${r.year_from}–${r.year_to}` : r.year_from ?? '—'}
                </Text>
                <Text style={[s.cell, s.num, { width: '16%' }]}>
                  {r.width_px ? `${r.width_px}×${r.height_px}` : '—'}
                </Text>
                <Text style={[s.cell, s.mono, { width: '22%' }]}>{r.source_file ?? '—'}</Text>
              </View>
            ))}
          </View>
        </Section>

        {m && (
          <View style={{ marginTop: 20 }}>
            <Section eyebrow="Section 2" title="Derived metrics">
              <View style={s.table}>
                <View style={s.th}>
                  <Text style={[s.cellHead, { width: '34%' }]}>Metric</Text>
                  <Text style={[s.cellHead, s.num, { width: '17%' }]}>Baseline</Text>
                  <Text style={[s.cellHead, s.num, { width: '17%' }]}>Current</Text>
                  <Text style={[s.cellHead, s.num, { width: '16%' }]}>Change</Text>
                  <Text style={[s.cellHead, s.num, { width: '16%' }]}>Percent</Text>
                </View>
                <View style={s.tr}>
                  <Text style={[s.cell, { width: '34%' }]}>
                    Vegetation area ({m.vegetation_baseline_year}→{m.vegetation_current_year})
                  </Text>
                  <Text style={[s.cell, s.num, { width: '17%' }]}>{formatHa(m.vegetation_baseline_ha)}</Text>
                  <Text style={[s.cell, s.num, { width: '17%' }]}>{formatHa(m.vegetation_current_ha)}</Text>
                  <Text style={[s.cell, s.num, { width: '16%' }]}>{formatSignedHa(m.vegetation_change_ha)}</Text>
                  <Text style={[s.cell, s.num, { width: '16%' }]}>{formatPct(m.vegetation_change_pct)}</Text>
                </View>
                <View style={s.tr}>
                  <Text style={[s.cell, { width: '34%' }]}>
                    Surface water area ({m.water_baseline_year}→{m.water_current_year})
                  </Text>
                  <Text style={[s.cell, s.num, { width: '17%' }]}>{formatHa(m.water_baseline_ha)}</Text>
                  <Text style={[s.cell, s.num, { width: '17%' }]}>{formatHa(m.water_current_ha)}</Text>
                  <Text style={[s.cell, s.num, { width: '16%' }]}>{formatSignedHa(m.water_change_ha)}</Text>
                  <Text style={[s.cell, s.num, { width: '16%' }]}>{formatPct(m.water_change_pct)}</Text>
                </View>
                <View style={s.tr}>
                  <Text style={[s.cell, { width: '34%' }]}>Water loss (change raster, class −1)</Text>
                  <Text style={[s.cell, s.num, { width: '17%' }]}>—</Text>
                  <Text style={[s.cell, s.num, { width: '17%' }]}>{formatHa(m.water_loss_ha)}</Text>
                  <Text style={[s.cell, s.num, { width: '16%' }]}>—</Text>
                  <Text style={[s.cell, s.num, { width: '16%' }]}>—</Text>
                </View>
                <View style={s.tr}>
                  <Text style={[s.cell, { width: '34%' }]}>Water gain (change raster, class +1)</Text>
                  <Text style={[s.cell, s.num, { width: '17%' }]}>—</Text>
                  <Text style={[s.cell, s.num, { width: '17%' }]}>{formatHa(m.water_gain_ha)}</Text>
                  <Text style={[s.cell, s.num, { width: '16%' }]}>—</Text>
                  <Text style={[s.cell, s.num, { width: '16%' }]}>—</Text>
                </View>
                <View style={s.trLast}>
                  <Text style={[s.cell, { width: '34%' }]}>Net water change</Text>
                  <Text style={[s.cell, s.num, { width: '17%' }]}>—</Text>
                  <Text style={[s.cell, s.num, { width: '17%' }]}>—</Text>
                  <Text style={[s.cell, s.num, { width: '16%' }]}>{formatSignedHa(m.water_net_change_ha)}</Text>
                  <Text style={[s.cell, s.num, { width: '16%' }]}>—</Text>
                </View>
              </View>

              {options.charts && (
                <>
                  <Text style={s.h2}>Vegetation and water extent</Text>
                  <View style={{ flexDirection: 'row' }}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={s.eyebrow}>Vegetation area</Text>
                      <BarChart
                        data={[
                          {
                            label: String(m.vegetation_baseline_year),
                            value: Number(m.vegetation_baseline_ha ?? 0),
                            display: formatHa(m.vegetation_baseline_ha, 0),
                            colour: C.greenMid,
                          },
                          {
                            label: String(m.vegetation_current_year),
                            value: Number(m.vegetation_current_ha ?? 0),
                            display: formatHa(m.vegetation_current_ha, 0),
                            colour: C.green,
                          },
                        ]}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.eyebrow}>Surface water area</Text>
                      <BarChart
                        data={[
                          {
                            label: String(m.water_baseline_year),
                            value: Number(m.water_baseline_ha ?? 0),
                            display: formatHa(m.water_baseline_ha),
                            colour: C.blue,
                          },
                          {
                            label: String(m.water_current_year),
                            value: Number(m.water_current_ha ?? 0),
                            display: formatHa(m.water_current_ha),
                            colour: '#0284C7',
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={s.small}>
                    Bars are scaled within each chart. Vegetation and water differ by three
                    orders of magnitude, so a shared axis would render water invisible.
                  </Text>
                </>
              )}

              {lulc.length > 0 && (
                <>
                  <Text style={s.h2}>Land cover composition</Text>
                  <View style={s.table}>
                    <View style={s.th}>
                      <Text style={[s.cellHead, { width: '46%' }]}>Class</Text>
                      <Text style={[s.cellHead, s.num, { width: '27%' }]}>Area</Text>
                      <Text style={[s.cellHead, s.num, { width: '27%' }]}>Share</Text>
                    </View>
                    {lulc.map((row, i) => (
                      <View key={row.class_name} style={i === lulc.length - 1 ? s.trLast : s.tr}>
                        <Text style={[s.cell, { width: '46%' }]}>{row.class_name}</Text>
                        <Text style={[s.cell, s.num, { width: '27%' }]}>{formatHa(row.area_ha)}</Text>
                        <Text style={[s.cell, s.num, { width: '27%' }]}>
                          {Number(row.share_pct ?? 0).toFixed(2)}%
                        </Text>
                      </View>
                    ))}
                  </View>
                  <Text style={s.small}>
                    Vegetation and water are measured directly. "Other" is the remainder, so
                    the three always total the analysed extent.
                  </Text>
                </>
              )}
            </Section>
          </View>
        )}

        <Footer site={site.name} />
      </Page>

      {/* ---------------------------------------------------------------- */}
      {/* Statistical tables                                                */}
      {/* ---------------------------------------------------------------- */}
      {options.statisticalTables && statRasters.length > 0 && (
        <Page size="A4" style={s.page}>
          <Section eyebrow="Section 3" title="Raster class statistics">
            <Text style={s.p}>
              Pixel counts and areas exactly as produced by the raster analysis, before any
              derivation. Every figure elsewhere in this report is calculated from these rows.
            </Text>

            {statRasters.map((r) => {
              const total = r.stats.reduce((acc, c) => acc + Number(c.pixel_count), 0);
              return (
                <View key={r.id} style={{ marginTop: 12 }} wrap={false}>
                  <Text style={{ fontSize: 10, color: C.ink }}>{r.title}</Text>
                  <Text style={s.small}>
                    {r.source_file ?? '—'} · {r.width_px}×{r.height_px} @ {r.pixel_size_m} m ·{' '}
                    {r.crs} · NoData {formatCount(r.nodata_pixels)}
                  </Text>
                  <View style={s.table}>
                    <View style={s.th}>
                      <Text style={[s.cellHead, { width: '14%' }]}>Value</Text>
                      <Text style={[s.cellHead, { width: '30%' }]}>Class</Text>
                      <Text style={[s.cellHead, s.num, { width: '19%' }]}>Pixels</Text>
                      <Text style={[s.cellHead, s.num, { width: '20%' }]}>Area (m²)</Text>
                      <Text style={[s.cellHead, s.num, { width: '17%' }]}>Area (ha)</Text>
                    </View>
                    {r.stats.map((c, i) => (
                      <View key={c.id} style={i === r.stats.length - 1 ? s.trLast : s.tr}>
                        <Text style={[s.cell, s.mono, { width: '14%' }]}>{c.class_value}</Text>
                        <Text style={[s.cell, { width: '30%' }]}>
                          {c.class_label}
                          {c.is_primary ? ' ·' : ''}
                        </Text>
                        <Text style={[s.cell, s.num, { width: '19%' }]}>{formatCount(c.pixel_count)}</Text>
                        <Text style={[s.cell, s.num, { width: '20%' }]}>{formatCount(c.area_m2)}</Text>
                        <Text style={[s.cell, s.num, { width: '17%' }]}>
                          {Number(c.area_ha).toFixed(2)}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <Text style={s.small}>
                    Total {formatCount(total)} pixels
                    {r.total_pixels && total === Number(r.total_pixels)
                      ? ' — matches the recorded grid total.'
                      : r.total_pixels
                      ? ` — recorded grid total is ${formatCount(r.total_pixels)}.`
                      : '.'}
                  </Text>
                </View>
              );
            })}
            <Text style={[s.small, { marginTop: 8 }]}>· marks the class carrying the layer's meaning.</Text>
          </Section>
          <Footer site={site.name} />
        </Page>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Satellite plates                                                  */}
      {/* ---------------------------------------------------------------- */}
      {options.satellitePlates && satellite.length > 0 && (
        <Page size="A4" style={s.page}>
          <Section eyebrow="Section 4" title="Satellite imagery">
            {satellite.map((img) => (
              <View key={img.id} style={s.plate} wrap={false}>
                <Image src={img.url} style={s.plateImg} />
                <Text style={{ fontSize: 9.5, color: C.ink, marginTop: 4 }}>{img.title}</Text>
                <Text style={s.small}>
                  {[
                    img.sensor,
                    img.product,
                    img.acquisition_date ? formatDate(img.acquisition_date) : null,
                    img.resolution_m !== null ? `${img.resolution_m} m` : null,
                    img.cloud_cover_pct !== null ? `${img.cloud_cover_pct}% cloud` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
                {img.caption && <Text style={[s.small, { marginTop: 2 }]}>{img.caption}</Text>}
              </View>
            ))}
            {omitted.plates > 0 && (
              <Text style={s.small}>
                {omitted.plates} further scene{omitted.plates === 1 ? '' : 's'} omitted to keep
                the file size manageable.
              </Text>
            )}
          </Section>
          <Footer site={site.name} />
        </Page>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Field evidence                                                    */}
      {/* ---------------------------------------------------------------- */}
      {options.fieldPhotos && geotagged.length > 0 && (
        <Page size="A4" style={s.page}>
          <Section eyebrow="Section 5" title="Field evidence">
            <Text style={s.p}>
              {geotagged.length} geo-tagged photograph{geotagged.length === 1 ? '' : 's'}.{' '}
              {geotagged.filter((g) => g.gps_source === 'exif').length} carry coordinates
              recorded by the camera; the remainder were positioned by hand and are marked
              as such.
            </Text>

            <View style={s.photoGrid}>
              {geotagged.map((img) => (
                <View key={img.id} style={s.photoCell} wrap={false}>
                  <Image src={img.url} style={s.photoImg} />
                  <Text style={{ fontSize: 8, color: C.ink, marginTop: 3 }}>{img.title}</Text>
                  <Text style={s.small}>
                    {img.category}
                    {img.status ? ` · ${img.status}` : ''}
                  </Text>
                  <Text style={[s.mono, { color: C.faint }]}>
                    {formatLatLng(img.lat, img.lng, 4)}
                  </Text>
                  <Text style={s.small}>
                    {formatDate(img.captured_at)}
                    {img.gps_source === 'exif' ? '' : ' · manual pin'}
                  </Text>
                </View>
              ))}
            </View>

            {omitted.photos > 0 && (
              <Text style={s.small}>
                {omitted.photos} further photograph{omitted.photos === 1 ? '' : 's'} omitted to
                keep the file size manageable.
              </Text>
            )}
          </Section>
          <Footer site={site.name} />
        </Page>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Findings and provenance                                           */}
      {/* ---------------------------------------------------------------- */}
      {(options.findings || options.provenance) && (
        <Page size="A4" style={s.page}>
          {options.findings && (
            <Section eyebrow="Section 6" title="Findings">
              {insights.length === 0 ? (
                <Text style={[s.p, { color: C.muted }]}>
                  No findings have been recorded for this site. Nothing is generated
                  automatically, so this section stays empty until an analyst writes one.
                </Text>
              ) : (
                insights.map((ins) => (
                  <View key={ins.id} style={{ marginBottom: 8 }} wrap={false}>
                    <Text style={{ fontSize: 8.5 }}>{ins.body}</Text>
                    <Text style={s.small}>
                      {ins.source === 'analyst'
                        ? `Written by ${ins.author ?? 'an analyst'}`
                        : ins.source === 'computed'
                        ? 'Computed from raster statistics'
                        : `Generated by ${ins.model_name ?? 'a language model'}`}
                      {ins.category ? ` · ${ins.category}` : ''} · {ins.severity}
                    </Text>
                  </View>
                ))
              )}
            </Section>
          )}

          {options.provenance && (
            <View style={{ marginTop: options.findings ? 20 : 0 }}>
              <Section eyebrow="Appendix" title="Provenance">
                <Text style={s.p}>
                  Source files behind every layer in this report, as recorded at the time of
                  analysis.
                </Text>
                <View style={s.table}>
                  <View style={s.th}>
                    <Text style={[s.cellHead, { width: '30%' }]}>Layer key</Text>
                    <Text style={[s.cellHead, { width: '44%' }]}>Original file</Text>
                    <Text style={[s.cellHead, { width: '26%' }]}>Stored as</Text>
                  </View>
                  {rasters.map((r, i) => (
                    <View key={r.id} style={i === rasters.length - 1 ? s.trLast : s.tr}>
                      <Text style={[s.cell, s.mono, { width: '30%' }]}>{r.layer_key}</Text>
                      <Text style={[s.cell, s.mono, { width: '44%' }]}>
                        {r.source_path ?? r.source_file ?? '—'}
                      </Text>
                      <Text style={[s.cell, s.mono, { width: '26%' }]}>{r.format}</Text>
                    </View>
                  ))}
                </View>

                <View style={[s.callout, s.info]}>
                  <Text style={s.small}>
                    Report generated {formatDate(data.generatedAt)} by JalDrishti. Figures are
                    computed from stored raster pixel counts at the moment of generation; a
                    later re-analysis may change the live values without altering this document.
                  </Text>
                </View>
              </Section>
            </View>
          )}
          <Footer site={site.name} />
        </Page>
      )}
    </Document>
  );
};

export default ReportDocument;
