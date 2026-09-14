-- ===========================================================================
-- 0002_rasters.sql — map layers and their QGIS pixel statistics
-- ---------------------------------------------------------------------------
-- Two tables:
--
--   raster_layers       one row per .tif / .png the map can display.
--                       Replaces the hardcoded file paths AND the three
--                       hardcoded bounding boxes in geoTiffRenderer.ts.
--
--   raster_class_stats  the value / pixel-count / area table out of each QGIS
--                       report in analysed-data/. Stored raw and untouched.
--
-- Design rule: store what QGIS measured, derive everything else. No rounded
-- percentage is ever stored as source data.
-- ===========================================================================

create type public.raster_kind as enum (
  'ndvi',              -- continuous NDVI values
  'ndvi_change',       -- NDVI difference between two years
  'vegetation_mask',   -- binary: is this pixel vegetated
  'water_mask',        -- binary: is this pixel water
  'change',            -- ternary: -1 loss / 0 stable / +1 gain
  'streams',           -- drainage network
  'lulc',              -- land use / land cover classification
  'other'
);

create type public.raster_format as enum ('geotiff', 'png');

-- ---------------------------------------------------------------------------
-- raster_layers
-- ---------------------------------------------------------------------------
create table public.raster_layers (
  id                     uuid primary key default gen_random_uuid(),
  site_id                uuid not null references public.sites(id) on delete cascade,

  -- Stable machine name, unique within a site: 'water_mask_2023', 'ndvi_2023'.
  -- The frontend switches on this, so treat it as an API contract.
  layer_key              text not null
                           check (layer_key ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),

  kind                   public.raster_kind not null,
  title                  text not null,
  description            text,

  -- year_from alone = a single-date layer.
  -- year_from + year_to = a change layer spanning two dates.
  year_from              smallint check (year_from between 1970 and 2100),
  year_to                smallint check (year_to   between 1970 and 2100),

  -- Where the file actually lives in Supabase Storage.
  storage_bucket         text not null default 'site-rasters',
  storage_path           text not null,
  format                 public.raster_format not null default 'geotiff',
  file_size_bytes        bigint check (file_size_bytes is null or file_size_bytes >= 0),

  -- Grid description, straight from the QGIS report.
  width_px               integer check (width_px  is null or width_px  > 0),
  height_px              integer check (height_px is null or height_px > 0),
  pixel_size_m           numeric(10,4) check (pixel_size_m is null or pixel_size_m > 0),
  crs                    text,

  -- Extent in the raster's own projected CRS (for Saswad: metres, UTM 43N).
  extent_min_x           numeric(18,6),
  extent_min_y           numeric(18,6),
  extent_max_x           numeric(18,6),
  extent_max_y           numeric(18,6),

  -- The same extent reprojected to WGS84. This is what Leaflet's ImageOverlay
  -- needs. Storing both means no code has to reproject at runtime — which is
  -- exactly what the three hardcoded constants in geoTiffRenderer.ts were for.
  bounds_sw_lat          double precision,
  bounds_sw_lng          double precision,
  bounds_ne_lat          double precision,
  bounds_ne_lng          double precision,

  total_pixels           bigint check (total_pixels  is null or total_pixels  >= 0),
  nodata_pixels          bigint check (nodata_pixels is null or nodata_pixels >= 0),

  -- Provenance: which file on the analyst's machine produced this layer.
  source_file            text,
  source_path            text,

  -- Which colour ramp geoTiffRenderer should apply. Matches its ColorMapType.
  colormap_key           text,
  default_opacity        numeric(3,2) not null default 0.90
                           check (default_opacity between 0 and 1),

  display_order          smallint not null default 0,
  is_visible_by_default  boolean not null default false,

  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),

  unique (site_id, layer_key),

  -- A change layer must actually span two years, in the right order.
  constraint raster_layers_year_range check (
    year_to is null or (year_from is not null and year_to > year_from)
  ),
  constraint raster_layers_bounds_coherent check (
    (bounds_sw_lat is null and bounds_sw_lng is null
     and bounds_ne_lat is null and bounds_ne_lng is null)
    or (bounds_sw_lat < bounds_ne_lat and bounds_sw_lng < bounds_ne_lng)
  )
);

comment on table  public.raster_layers is
  'One row per displayable raster. Carries its own WGS84 bounds so the map needs no hardcoded constants.';
comment on column public.raster_layers.layer_key is
  'Stable machine name unique within a site, e.g. water_mask_2023.';
comment on column public.raster_layers.colormap_key is
  'Colour ramp the client applies when decoding, matching geoTiffRenderer ColorMapType.';

create index raster_layers_site_idx  on public.raster_layers (site_id, display_order);
create index raster_layers_kind_idx  on public.raster_layers (site_id, kind, year_from);

create trigger raster_layers_set_updated_at
  before update on public.raster_layers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- raster_class_stats
-- ---------------------------------------------------------------------------
-- A direct copy of the QGIS "unique values report" table. For Saswad these
-- rows come from the five HTML files in analysed-data/.
--
-- area_ha is a generated column, so hectares can never drift from square
-- metres. Everything the UI shows is derived from these rows by
-- site_metrics_view (migration 0006).
-- ---------------------------------------------------------------------------
create table public.raster_class_stats (
  id               uuid primary key default gen_random_uuid(),
  raster_layer_id  uuid not null references public.raster_layers(id) on delete cascade,

  -- The raw raster value: 0/1 for masks, -1/0/1 for change layers.
  class_value      integer not null,

  -- Human-readable name: 'Water', 'Dry', 'Water loss'.
  class_label      text not null,

  pixel_count      bigint not null check (pixel_count >= 0),
  area_m2          numeric(18,4) not null check (area_m2 >= 0),
  area_ha          numeric(18,6) generated always as (area_m2 / 10000) stored,

  -- Marks the class that carries the meaning of the layer — value 1 on a water
  -- mask, for instance. site_metrics_view reads this to know which row is
  -- "the water area" without hardcoding the number 1.
  is_primary       boolean not null default false,

  display_order    smallint not null default 0,
  created_at       timestamptz not null default now(),

  unique (raster_layer_id, class_value)
);

comment on table public.raster_class_stats is
  'Raw QGIS pixel counts per raster class. Source of truth for every derived metric.';
comment on column public.raster_class_stats.is_primary is
  'True for the class that carries the layer meaning (e.g. value 1 on a water mask).';

create index raster_class_stats_layer_idx
  on public.raster_class_stats (raster_layer_id, display_order);

-- At most one primary class per layer, otherwise the metrics view is ambiguous.
create unique index raster_class_stats_one_primary_idx
  on public.raster_class_stats (raster_layer_id)
  where is_primary;
