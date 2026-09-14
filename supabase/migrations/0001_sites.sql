-- ===========================================================================
-- 0001_sites.sql — the master registry of study areas
-- ---------------------------------------------------------------------------
-- One row per site. Everything else in the database hangs off this table.
-- Today the only row is Saswad, but nothing here is Saswad-specific: adding a
-- second site is an INSERT, not a code change.
--
-- Replaces the hardcoded src/data/studyAreas.ts.
-- ===========================================================================

-- gen_random_uuid() is core Postgres since v13, so no extension is needed.

-- ---------------------------------------------------------------------------
-- Shared helper: keeps updated_at honest on every table that has one.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- sites
-- ---------------------------------------------------------------------------
create table public.sites (
  id                uuid primary key default gen_random_uuid(),

  -- URL identity. This is what appears in /sites/:slug, so it must be
  -- lowercase, hyphenated, and stable once published.
  slug              text not null unique
                      check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),

  name              text not null,
  district          text,
  state             text,
  country           text not null default 'India',

  -- Where the map opens before the boundary loads.
  centre_lat        double precision not null check (centre_lat between -90 and 90),
  centre_lng        double precision not null check (centre_lng between -180 and 180),
  default_zoom      smallint not null default 13 check (default_zoom between 1 and 20),

  -- Headline size of the analysis extent.
  area_km2          numeric(12,4) check (area_km2 is null or area_km2 > 0),

  -- Two coordinate systems matter and they are not the same thing:
  --   crs          = how boundary_geojson is stored (always WGS84 for web maps)
  --   analysis_crs = the projected CRS QGIS used (Saswad: EPSG:32643, UTM 43N)
  crs               text not null default 'EPSG:4326',
  analysis_crs      text,

  -- The study-area polygon as plain GeoJSON. JSONB rather than PostGIS: we only
  -- ever read this back out and hand it to Leaflet, we never query spatially.
  -- If spatial queries are ever needed, migrate this column to geometry then.
  boundary_geojson  jsonb,

  -- Bounding box in WGS84, cached so the map can fit bounds without parsing
  -- the whole polygon first.
  bbox_min_lat      double precision,
  bbox_min_lng      double precision,
  bbox_max_lat      double precision,
  bbox_max_lng      double precision,

  description       text,

  -- Lets a site be staged before it is shown publicly.
  is_published      boolean not null default true,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- A bounding box with its corners the wrong way round is always a bug.
  constraint sites_bbox_coherent check (
    (bbox_min_lat is null and bbox_min_lng is null
     and bbox_max_lat is null and bbox_max_lng is null)
    or (bbox_min_lat < bbox_max_lat and bbox_min_lng < bbox_max_lng)
  )
);

comment on table  public.sites is
  'Master registry of watershed study areas. One row per site.';
comment on column public.sites.slug is
  'URL identifier used in /sites/:slug. Stable once published.';
comment on column public.sites.analysis_crs is
  'Projected CRS the source rasters were analysed in, e.g. EPSG:32643.';
comment on column public.sites.boundary_geojson is
  'Study-area polygon as GeoJSON in WGS84, fed straight to Leaflet.';

create index sites_is_published_idx on public.sites (is_published);

create trigger sites_set_updated_at
  before update on public.sites
  for each row execute function public.set_updated_at();
