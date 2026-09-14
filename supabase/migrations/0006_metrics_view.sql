-- ===========================================================================
-- 0006_metrics_view.sql — derived metrics, computed not stored
-- ---------------------------------------------------------------------------
-- Everything the dashboard cards and charts display is calculated here from
-- raster_class_stats. Nothing is stored twice, so nothing can drift.
--
-- This is the permanent fix for the credibility problem in the current build,
-- where hand-typed figures sat beside real ones and contradicted them: the
-- metric cards said vegetation -1.46% while the banner beside them said +4.8%.
-- It also fixes the 0.03 ha error in the hand-typed LULC split, because 'Other'
-- is now a subtraction rather than a number somebody keyed in.
--
-- The views are deliberately site-agnostic: baseline and current years are
-- discovered with min()/max() per site rather than hardcoded to 2023 and 2026,
-- so a second site with different years works with no changes here.
--
-- security_invoker = on makes the views respect the caller's RLS rather than
-- the view owner's. Without it a view is a hole straight through row security.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- site_metrics_view — one row per site, all headline figures
-- ---------------------------------------------------------------------------
create or replace view public.site_metrics_view
with (security_invoker = on)
as
with
-- Earliest and latest vegetation year available for each site.
veg_years as (
  select site_id,
         min(year_from) as baseline_year,
         max(year_from) as current_year
  from public.raster_layers
  where kind = 'vegetation_mask' and year_from is not null
  group by site_id
),
veg as (
  select
    y.site_id,
    y.baseline_year,
    y.current_year,
    max(cs.area_ha) filter (where rl.year_from = y.baseline_year) as baseline_ha,
    max(cs.area_ha) filter (where rl.year_from = y.current_year)  as current_ha
  from veg_years y
  join public.raster_layers rl
    on rl.site_id = y.site_id
   and rl.kind = 'vegetation_mask'
  join public.raster_class_stats cs
    on cs.raster_layer_id = rl.id
   and cs.is_primary                      -- the "is vegetation" class
  group by y.site_id, y.baseline_year, y.current_year
),

-- Same again for surface water.
water_years as (
  select site_id,
         min(year_from) as baseline_year,
         max(year_from) as current_year
  from public.raster_layers
  where kind = 'water_mask' and year_from is not null
  group by site_id
),
water as (
  select
    y.site_id,
    y.baseline_year,
    y.current_year,
    max(cs.area_ha) filter (where rl.year_from = y.baseline_year) as baseline_ha,
    max(cs.area_ha) filter (where rl.year_from = y.current_year)  as current_ha
  from water_years y
  join public.raster_layers rl
    on rl.site_id = y.site_id
   and rl.kind = 'water_mask'
  join public.raster_class_stats cs
    on cs.raster_layer_id = rl.id
   and cs.is_primary                      -- the "is water" class
  group by y.site_id, y.baseline_year, y.current_year
),

-- The change raster: -1 is loss, +1 is gain. This is measured independently of
-- the two water masks above, which makes it a genuine cross-check rather than
-- a restatement. For Saswad both routes give -9.50 ha.
change as (
  select
    rl.site_id,
    min(rl.year_from) as year_from,
    max(rl.year_to)   as year_to,
    coalesce(max(cs.area_ha) filter (where cs.class_value = -1), 0) as loss_ha,
    coalesce(max(cs.area_ha) filter (where cs.class_value =  1), 0) as gain_ha
  from public.raster_layers rl
  join public.raster_class_stats cs on cs.raster_layer_id = rl.id
  where rl.kind = 'change'
  group by rl.site_id
),

-- Total analysed extent.
--
-- Deliberately summed from the QGIS class areas rather than recomputed from
-- pixel counts, so the extent is traceable to the same reports as everything
-- else. Only layers that actually carry statistics are considered: the streams
-- raster is a coarser 30 m grid covering a slightly larger footprint, and
-- including it would overstate the analysed area by about 61 ha.
extent as (
  select site_id, max(layer_area_ha) as total_area_ha
  from (
    select rl.site_id, rl.id, sum(cs.area_ha) as layer_area_ha
    from public.raster_layers rl
    join public.raster_class_stats cs on cs.raster_layer_id = rl.id
    group by rl.site_id, rl.id
  ) per_layer
  group by site_id
)

select
  s.id                                    as site_id,
  s.slug,
  s.name,

  -- Vegetation
  veg.baseline_year                       as vegetation_baseline_year,
  veg.current_year                        as vegetation_current_year,
  round(veg.baseline_ha, 2)               as vegetation_baseline_ha,
  round(veg.current_ha, 2)                as vegetation_current_ha,
  case when veg.baseline_year is distinct from veg.current_year
       then round(veg.current_ha - veg.baseline_ha, 2)
  end                                     as vegetation_change_ha,
  case when veg.baseline_year is distinct from veg.current_year
        and veg.baseline_ha > 0
       then round(((veg.current_ha - veg.baseline_ha) / veg.baseline_ha) * 100, 2)
  end                                     as vegetation_change_pct,

  -- Surface water
  water.baseline_year                     as water_baseline_year,
  water.current_year                      as water_current_year,
  round(water.baseline_ha, 2)             as water_baseline_ha,
  round(water.current_ha, 2)              as water_current_ha,
  case when water.baseline_year is distinct from water.current_year
       then round(water.current_ha - water.baseline_ha, 2)
  end                                     as water_change_ha,
  case when water.baseline_year is distinct from water.current_year
        and water.baseline_ha > 0
       then round(((water.current_ha - water.baseline_ha) / water.baseline_ha) * 100, 2)
  end                                     as water_change_pct,

  -- Change raster
  change.year_from                        as change_year_from,
  change.year_to                          as change_year_to,
  round(change.loss_ha, 2)                as water_loss_ha,
  round(change.gain_ha, 2)                as water_gain_ha,
  round(change.gain_ha - change.loss_ha, 2) as water_net_change_ha,

  -- Cross-check: does the change raster agree with the two water masks?
  -- Surfacing this as a column means the report can state the agreement, and a
  -- future data error shows up as false instead of hiding.
  case
    when change.gain_ha is null or water.baseline_ha is null then null
    else abs((change.gain_ha - change.loss_ha)
             - (water.current_ha - water.baseline_ha)) < 0.01
  end                                     as water_change_cross_check_ok,

  -- Extent
  round(extent.total_area_ha, 2)         as total_area_ha,
  round(extent.total_area_ha / 100, 4)   as total_area_km2

from public.sites s
left join veg    on veg.site_id    = s.id
left join water  on water.site_id  = s.id
left join change on change.site_id = s.id
left join extent on extent.site_id = s.id;

comment on view public.site_metrics_view is
  'Headline figures per site, computed live from raster_class_stats so they can never drift from QGIS.';

-- ---------------------------------------------------------------------------
-- site_lulc_view — the land cover donut, three rows per site
-- ---------------------------------------------------------------------------
-- Vegetation and Water are measured. "Other" is whatever is left over, so the
-- three always sum to exactly the analysed extent.
-- ---------------------------------------------------------------------------
create or replace view public.site_lulc_view
with (security_invoker = on)
as
with base as (
  select
    m.site_id,
    m.slug,
    m.vegetation_current_year as year,
    coalesce(m.vegetation_current_ha, 0) as vegetation_ha,
    coalesce(m.water_current_ha, 0)      as water_ha,
    m.total_area_ha
  from public.site_metrics_view m
  where m.total_area_ha is not null
),
parts as (
  select site_id, slug, year, total_area_ha, 'Vegetation' as class_name,
         vegetation_ha as area_ha, 1 as display_order, '#183A2A' as colour
  from base
  union all
  select site_id, slug, year, total_area_ha, 'Other',
         greatest(total_area_ha - vegetation_ha - water_ha, 0), 2, '#D97706'
  from base
  union all
  select site_id, slug, year, total_area_ha, 'Water',
         water_ha, 3, '#4D8FA8'
  from base
)
select
  site_id,
  slug,
  year,
  class_name,
  round(area_ha, 2) as area_ha,
  case when total_area_ha > 0
       then round((area_ha / total_area_ha) * 100, 2)
  end as share_pct,
  colour,
  display_order
from parts
order by site_id, display_order;

comment on view public.site_lulc_view is
  'Land cover split per site. Vegetation and Water measured, Other derived, so the three always total the extent.';

grant select on public.site_metrics_view to anon, authenticated;
grant select on public.site_lulc_view    to anon, authenticated;
