-- ===========================================================================
-- 0003_images.sql — geotagged field photos and satellite imagery
-- ---------------------------------------------------------------------------
-- Two separate tables on purpose:
--
--   geotagged_images   photos taken in the field. Carry GPS from EXIF, so the
--                      map pin position is measured, not invented.
--                      Replaces the 18 fake fieldObservations in sampleData.ts
--                      (17 of which plotted outside the real study area).
--
--   satellite_images   finished imagery a human looks at in a report.
--                      Distinct from raster_layers, which is analysis data the
--                      map decodes and colour-maps. Different columns,
--                      different purpose — merging them would leave half the
--                      columns null on every row.
-- ===========================================================================

create type public.observation_category as enum (
  'vegetation',
  'water',
  'intervention',
  'degradation',
  'other'
);

create type public.gps_source as enum (
  'exif',    -- read automatically from the photo
  'manual',  -- the uploader placed the pin by hand
  'unknown'
);

-- ---------------------------------------------------------------------------
-- geotagged_images
-- ---------------------------------------------------------------------------
create table public.geotagged_images (
  id                uuid primary key default gen_random_uuid(),
  site_id           uuid not null references public.sites(id) on delete cascade,

  storage_bucket    text not null default 'geotagged-images',
  storage_path      text not null,
  thumbnail_path    text,

  -- Position. Nullable because a photo may genuinely have no EXIF GPS; the
  -- uploader is then prompted to place the pin, and gps_source records which
  -- of the two it was. Being explicit about this beats silently guessing.
  lat               double precision check (lat between -90 and 90),
  lng               double precision check (lng between -180 and 180),
  altitude_m        numeric(8,2),
  gps_accuracy_m    numeric(8,2) check (gps_accuracy_m is null or gps_accuracy_m >= 0),
  heading_deg       numeric(6,2) check (heading_deg is null or heading_deg between 0 and 360),
  gps_source        public.gps_source not null default 'unknown',

  captured_at       timestamptz,

  category          public.observation_category not null default 'other',
  status            text,          -- 'Healthy', 'Degraded', 'Functional', ...
  title             text not null,
  description       text,
  observer_name     text,

  -- Everything EXIF gave us, kept verbatim for auditability.
  exif              jsonb,

  mime_type         text,
  file_size_bytes   bigint check (file_size_bytes is null or file_size_bytes >= 0),
  width_px          integer,
  height_px         integer,

  uploaded_by       uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- Latitude and longitude only make sense together.
  constraint geotagged_images_latlng_paired check (
    (lat is null and lng is null) or (lat is not null and lng is not null)
  ),
  -- If we claim EXIF gave us a position, there must be a position.
  constraint geotagged_images_exif_has_coords check (
    gps_source <> 'exif' or (lat is not null and lng is not null)
  )
);

comment on table  public.geotagged_images is
  'Field photographs with GPS read from EXIF. Drives the real map pins.';
comment on column public.geotagged_images.gps_source is
  'Whether the coordinates came from photo EXIF or were placed by hand.';
comment on column public.geotagged_images.exif is
  'Raw EXIF payload kept verbatim so a position can always be re-verified.';

create index geotagged_images_site_idx      on public.geotagged_images (site_id, captured_at desc);
create index geotagged_images_category_idx  on public.geotagged_images (site_id, category);
create index geotagged_images_position_idx  on public.geotagged_images (site_id, lat, lng)
  where lat is not null;

create trigger geotagged_images_set_updated_at
  before update on public.geotagged_images
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- satellite_images
-- ---------------------------------------------------------------------------
create table public.satellite_images (
  id                   uuid primary key default gen_random_uuid(),
  site_id              uuid not null references public.sites(id) on delete cascade,

  storage_bucket       text not null default 'satellite-images',
  storage_path         text not null,
  thumbnail_path       text,

  title                text not null,
  caption              text,

  sensor               text,            -- 'Sentinel-2', 'Landsat-8 OLI/TIRS'
  product              text,            -- 'True Colour', 'NDVI', 'FCC'
  acquisition_date     date,
  year                 smallint check (year is null or year between 1970 and 2100),
  resolution_m         numeric(8,2) check (resolution_m is null or resolution_m > 0),
  cloud_cover_pct      numeric(5,2) check (cloud_cover_pct is null or cloud_cover_pct between 0 and 100),

  -- Set when this image can also be draped on the map as an overlay.
  is_overlay           boolean not null default false,
  bounds_sw_lat        double precision,
  bounds_sw_lng        double precision,
  bounds_ne_lat        double precision,
  bounds_ne_lng        double precision,

  -- Optional link to the analysis raster this picture was rendered from.
  raster_layer_id      uuid references public.raster_layers(id) on delete set null,

  mime_type            text,
  file_size_bytes      bigint check (file_size_bytes is null or file_size_bytes >= 0),
  width_px             integer,
  height_px            integer,

  display_order        smallint not null default 0,
  include_in_report    boolean not null default true,

  uploaded_by          uuid references auth.users(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  -- An overlay is useless without bounds to place it.
  constraint satellite_images_overlay_needs_bounds check (
    not is_overlay
    or (bounds_sw_lat is not null and bounds_sw_lng is not null
        and bounds_ne_lat is not null and bounds_ne_lng is not null
        and bounds_sw_lat < bounds_ne_lat and bounds_sw_lng < bounds_ne_lng)
  )
);

comment on table  public.satellite_images is
  'Presentation-grade satellite imagery for galleries and PDF reports.';
comment on column public.satellite_images.include_in_report is
  'Whether the report generator picks this image up by default.';

create index satellite_images_site_idx on public.satellite_images (site_id, display_order, year);

create trigger satellite_images_set_updated_at
  before update on public.satellite_images
  for each row execute function public.set_updated_at();
