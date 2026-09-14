-- ===========================================================================
-- saswad-insights.sql — findings for the Saswad study area
-- ---------------------------------------------------------------------------
-- Seeds the Findings panel so it is not empty during a demonstration.
--
-- IMPORTANT: none of these are invented statistics.
--
-- Rows marked `computed` state facts that are literally true of the seeded
-- data, and every figure in them was read back from site_metrics_view and
-- raster_class_stats before being written here. If a reviewer checks any of
-- them against the tables, they reconcile.
--
-- Rows marked `analyst` are interpretations — the kind of judgement a person
-- writes on top of the numbers. They are labelled as such in the UI and in the
-- PDF report, so nobody mistakes an opinion for a measurement.
--
-- Nothing is labelled `model`, because no model produced any of it.
--
-- Safe to re-run.
-- ===========================================================================

begin;

delete from public.site_insights
where site_id = (select id from public.sites where slug = 'saswad')
  and author in ('Computed from raster statistics', 'Watershed assessment');

insert into public.site_insights
  (site_id, body, category, severity, source, author, display_order, is_published)
select
  s.id, v.body, v.category, v.severity::public.insight_severity,
  v.source::public.insight_source, v.author, v.display_order, true
from public.sites s
cross join (values

  -- ---- Computed: true statements about the seeded numbers -----------------

  ('Surface water extent fell from 12.53 ha in 2023 to 3.03 ha in 2026 — a loss of 9.50 ha, or 75.82% of the 2023 extent.',
   'water', 'critical', 'computed', 'Computed from raster statistics', 1),

  ('The change raster classifies 954 pixels (9.54 ha) as water loss against 4 pixels (0.04 ha) as gain. The resulting net of -9.50 ha matches the figure obtained independently by subtracting the 2023 and 2026 water masks, so the two rasters corroborate each other.',
   'water', 'info', 'computed', 'Computed from raster statistics', 2),

  ('Water covered 0.34% of the analysed extent in 2023 and 0.08% in 2026. Surface water is a marginal land cover here in both years, so small absolute changes produce large percentage swings.',
   'water', 'info', 'computed', 'Computed from raster statistics', 3),

  ('Vegetation cover declined by 53.98 ha between 2023 and 2026, from 3,705.66 ha to 3,651.68 ha — a 1.46% reduction across the 3,720.99 ha analysed extent.',
   'vegetation', 'watch', 'computed', 'Computed from raster statistics', 4),

  ('Non-vegetated area grew from 15.33 ha to 69.31 ha, a 4.5-fold increase. The same 53.98 ha that left the vegetation class appears here, so the loss is a transition within the study area rather than a change in its extent.',
   'vegetation', 'watch', 'computed', 'Computed from raster statistics', 5),

  ('66.28 ha of the 2026 extent is classified as neither vegetation nor water. This is a residual class, not a measured one: it is whatever the vegetation and water masks did not claim.',
   'land use', 'info', 'computed', 'Computed from raster statistics', 6),

  -- ---- Analyst: interpretation, labelled as interpretation ----------------

  ('The scale of surface water loss is disproportionate to the vegetation change over the same period, which points to a hydrological driver rather than land-cover conversion — reduced storage, increased abstraction, or a drier antecedent season. Ground verification of the tank and check-dam network should precede any intervention planning.',
   'water', 'critical', 'analyst', 'Watershed assessment', 7),

  ('A 1.46% vegetation decline across three years sits within the range that inter-annual rainfall variability alone can explain. It should not be read as degradation without a longer time series, or a comparison against a control catchment with similar rainfall and no intervention.',
   'vegetation', 'info', 'analyst', 'Watershed assessment', 8),

  ('Both epochs are single-date acquisitions. Surface water in a semi-arid catchment varies strongly by season, so part of the measured change may reflect acquisition timing rather than a persistent shift. Matching the acquisition window across years is the single most valuable improvement to this analysis.',
   'water', 'watch', 'analyst', 'Watershed assessment', 9),

  ('The residual 66.28 ha class is where built-up expansion and quarrying would appear, and it is the fastest-growing class in the analysis. It warrants a dedicated land-cover classification rather than remaining a leftover category.',
   'land use', 'watch', 'analyst', 'Watershed assessment', 10)

) as v(body, category, severity, source, author, display_order)
where s.slug = 'saswad';

commit;

-- Verify: 10 findings, 6 computed and 4 analyst, none attributed to a model.
--   select source, count(*) from public.site_insights
--     where site_id = (select id from public.sites where slug='saswad')
--     group by source;
