-- ===========================================================================
-- 0009_open_editing.sql — open editing to everyone, no account required
-- ---------------------------------------------------------------------------
-- WHAT THIS DOES
--
-- Anyone who can open the site can now also add, edit and delete its content.
-- No sign-in, no role, no credentials. This exists so the prototype can be
-- demonstrated to judges who will not have an account.
--
-- READ THIS BEFORE DEPLOYING PUBLICLY
--
-- The Supabase anon key is compiled into the JavaScript bundle and anyone can
-- read it out of devtools. Until 0007 that was safe, because the anon key could
-- only read. After this migration it can also write and delete. Anyone who
-- finds the deployed URL can wipe every site, photo and report.
--
-- That is an acceptable trade for a hackathon prototype whose data can be
-- rebuilt from `npm run db:build` in seconds. It is not acceptable for anything
-- holding data that matters.
--
-- HOW TO REVERT
--
-- Run supabase/manual/revert-open-editing.sql. It restores the
-- editor-only rules from 0007 and 0008 exactly.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Everyone counts as an editor.
-- ---------------------------------------------------------------------------
-- Every policy condition in 0007 and 0008 is expressed in terms of these two
-- functions, so redefining them relaxes the whole schema in one place rather
-- than scattering the change across thirty policies.
create or replace function public.is_editor()
returns boolean
language sql
immutable
as $$ select true $$;

create or replace function public.is_admin()
returns boolean
language sql
immutable
as $$ select true $$;

comment on function public.is_editor() is
  'OPEN DEMO MODE: always true. Restore from 0009_revert_open_editing.sql.';
comment on function public.is_admin() is
  'OPEN DEMO MODE: always true. Restore from 0009_revert_open_editing.sql.';

-- ---------------------------------------------------------------------------
-- 2. Let the anonymous role through.
-- ---------------------------------------------------------------------------
-- The functions above are not enough on their own: the write policies are
-- declared `TO authenticated`, which excludes anon whatever the condition says.
-- Each one is recreated for both roles.
--
-- The ownership checks (`uploaded_by = auth.uid()`) also have to go. For an
-- anonymous visitor auth.uid() is null, so a row can never match, and the
-- client now sends null for those columns.
-- ---------------------------------------------------------------------------

-- sites -----------------------------------------------------------------
drop policy if exists "sites: admin insert" on public.sites;
drop policy if exists "sites: editor update" on public.sites;
drop policy if exists "sites: admin delete" on public.sites;

create policy "sites: open insert" on public.sites
  for insert to anon, authenticated with check (true);
create policy "sites: open update" on public.sites
  for update to anon, authenticated using (true) with check (true);
create policy "sites: open delete" on public.sites
  for delete to anon, authenticated using (true);

-- raster_layers ---------------------------------------------------------
drop policy if exists "raster_layers: editor write" on public.raster_layers;
create policy "raster_layers: open write" on public.raster_layers
  for all to anon, authenticated using (true) with check (true);

-- raster_class_stats ----------------------------------------------------
drop policy if exists "raster_class_stats: editor write" on public.raster_class_stats;
create policy "raster_class_stats: open write" on public.raster_class_stats
  for all to anon, authenticated using (true) with check (true);

-- geotagged_images ------------------------------------------------------
drop policy if exists "geotagged_images: editor insert" on public.geotagged_images;
drop policy if exists "geotagged_images: editor update" on public.geotagged_images;
drop policy if exists "geotagged_images: owner or admin delete" on public.geotagged_images;

create policy "geotagged_images: open write" on public.geotagged_images
  for all to anon, authenticated using (true) with check (true);

-- satellite_images ------------------------------------------------------
drop policy if exists "satellite_images: editor insert" on public.satellite_images;
drop policy if exists "satellite_images: editor update" on public.satellite_images;
drop policy if exists "satellite_images: owner or admin delete" on public.satellite_images;

create policy "satellite_images: open write" on public.satellite_images
  for all to anon, authenticated using (true) with check (true);

-- site_insights ---------------------------------------------------------
drop policy if exists "site_insights: editor write" on public.site_insights;
create policy "site_insights: open write" on public.site_insights
  for all to anon, authenticated using (true) with check (true);

-- reports ---------------------------------------------------------------
-- Reports were the one private thing. In demo mode they are readable and
-- writable by anyone, so a judge can generate one and find it in the history.
drop policy if exists "reports: authenticated read" on public.reports;
drop policy if exists "reports: editor insert" on public.reports;
drop policy if exists "reports: owner update" on public.reports;
drop policy if exists "reports: owner or admin delete" on public.reports;

create policy "reports: open read" on public.reports
  for select to anon, authenticated using (true);
create policy "reports: open write" on public.reports
  for all to anon, authenticated using (true) with check (true);

-- profiles --------------------------------------------------------------
-- Left alone. Profiles only exist for users who signed in, and nothing in the
-- demo path touches them.

-- ---------------------------------------------------------------------------
-- 3. Storage
-- ---------------------------------------------------------------------------
-- Same reasoning: the bucket write policies name `authenticated` explicitly.
-- ---------------------------------------------------------------------------
drop policy if exists "site-rasters: editor write" on storage.objects;
drop policy if exists "site-rasters: editor update" on storage.objects;
drop policy if exists "site-rasters: editor delete" on storage.objects;
drop policy if exists "geotagged-images: editor write" on storage.objects;
drop policy if exists "geotagged-images: editor update" on storage.objects;
drop policy if exists "geotagged-images: editor delete" on storage.objects;
drop policy if exists "satellite-images: editor write" on storage.objects;
drop policy if exists "satellite-images: editor update" on storage.objects;
drop policy if exists "satellite-images: editor delete" on storage.objects;
drop policy if exists "reports: editor read" on storage.objects;
drop policy if exists "reports: editor write" on storage.objects;
drop policy if exists "reports: editor delete" on storage.objects;

create policy "media: open write" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id in ('site-rasters', 'geotagged-images', 'satellite-images', 'reports'));

create policy "media: open update" on storage.objects
  for update to anon, authenticated
  using (bucket_id in ('site-rasters', 'geotagged-images', 'satellite-images', 'reports'));

create policy "media: open delete" on storage.objects
  for delete to anon, authenticated
  using (bucket_id in ('site-rasters', 'geotagged-images', 'satellite-images', 'reports'));

-- The reports bucket stays non-public, so its files are still served through
-- signed URLs rather than a guessable path — but anyone may now request one.
create policy "reports: open read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'reports');
