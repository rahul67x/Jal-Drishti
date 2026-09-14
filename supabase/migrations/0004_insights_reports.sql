-- ===========================================================================
-- 0004_insights_reports.sql — written findings and generated PDF reports
-- ---------------------------------------------------------------------------
--   site_insights   real per-site findings written by an analyst.
--                   Replaces the aiInsightsPool in sampleData.ts, which was a
--                   static array of 10 sentences shuffled behind a fake
--                   spinner while the UI claimed a 94.2% model confidence.
--                   Here, generated content is labelled as generated.
--
--   reports         a record of every PDF produced, so reports can be listed,
--                   re-downloaded and audited rather than being throwaway files.
-- ===========================================================================

create type public.insight_severity as enum ('info', 'positive', 'watch', 'critical');

create type public.insight_source as enum (
  'analyst',    -- a person wrote this
  'computed',   -- derived deterministically from raster statistics
  'model'       -- produced by a language model
);

create type public.report_status as enum ('pending', 'ready', 'failed');

-- ---------------------------------------------------------------------------
-- site_insights
-- ---------------------------------------------------------------------------
create table public.site_insights (
  id             uuid primary key default gen_random_uuid(),
  site_id        uuid not null references public.sites(id) on delete cascade,

  body           text not null check (length(trim(body)) > 0),
  category       text,                    -- 'vegetation', 'water', 'intervention'
  severity       public.insight_severity not null default 'info',

  -- Never let generated text masquerade as analysis. If a model wrote it, the
  -- UI must be able to say so.
  source         public.insight_source not null default 'analyst',
  model_name     text,

  author         text,
  display_order  smallint not null default 0,
  is_published   boolean not null default true,

  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  -- Claiming a model wrote it means naming the model.
  constraint site_insights_model_named check (
    source <> 'model' or model_name is not null
  )
);

comment on table  public.site_insights is
  'Per-site findings. Analyst-written, computed, or model-generated — always labelled.';
comment on column public.site_insights.source is
  'Provenance of the text. Keeps generated content from being presented as analysis.';

create index site_insights_site_idx
  on public.site_insights (site_id, display_order)
  where is_published;

create trigger site_insights_set_updated_at
  before update on public.site_insights
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- reports
-- ---------------------------------------------------------------------------
create table public.reports (
  id                uuid primary key default gen_random_uuid(),
  site_id           uuid not null references public.sites(id) on delete cascade,

  title             text not null,
  status            public.report_status not null default 'pending',

  -- Populated once generation succeeds. Lives in the private 'reports' bucket
  -- and is served through short-lived signed URLs.
  storage_bucket    text not null default 'reports',
  storage_path      text,
  file_size_bytes   bigint check (file_size_bytes is null or file_size_bytes >= 0),
  page_count        integer check (page_count is null or page_count > 0),

  -- Which sections were included, so a report can be reproduced exactly.
  params            jsonb not null default '{}'::jsonb,

  -- Snapshot of the headline numbers at generation time. A report is a record
  -- of what was true then, so it must not silently change when the data does.
  metrics_snapshot  jsonb,

  error_message     text,

  generated_by      uuid references auth.users(id) on delete set null,
  generated_at      timestamptz,
  created_at        timestamptz not null default now(),

  -- A report that claims to be ready must have a file behind it.
  constraint reports_ready_has_file check (
    status <> 'ready' or (storage_path is not null and generated_at is not null)
  ),
  constraint reports_failed_has_reason check (
    status <> 'failed' or error_message is not null
  )
);

comment on table  public.reports is
  'History of generated PDF site reports, with the metric snapshot each was built from.';
comment on column public.reports.metrics_snapshot is
  'Headline figures frozen at generation time so an old report stays reproducible.';

create index reports_site_idx on public.reports (site_id, created_at desc);
