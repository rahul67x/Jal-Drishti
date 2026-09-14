-- ===========================================================================
-- revert-open-editing.sql — put the editor-only rules back
-- ---------------------------------------------------------------------------
-- Undoes 0009_open_editing.sql, restoring the access model from 0007 and 0008:
--
--   anyone           can read published content
--   editor / admin   can write
--   reports          readable only to signed-in users
--
-- It lives in supabase/manual/ rather than supabase/migrations/ on purpose.
-- The migration runner applies every file in migrations/ in sorted order, so a
-- revert sitting beside the thing it reverts would be applied immediately
-- after it and quietly undo the change. Run this by hand when the demo is over:
--
--   Supabase dashboard > SQL Editor > New query > paste > Run
--
-- After running it, promote at least one account or nobody can edit anything:
--   update public.profiles set role = 'admin' where id = '<your-user-id>';
-- ===========================================================================

-- 1. Roles mean something again -------------------------------------------
create or replace function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('editor', 'admin')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

comment on function public.is_editor() is
  'True when the current user may manage site content. Used by RLS write policies.';
comment on function public.is_admin() is
  'True when the current user may create or delete sites.';

-- 2. Drop the open policies -----------------------------------------------
drop policy if exists "sites: open insert" on public.sites;
drop policy if exists "sites: open update" on public.sites;
drop policy if exists "sites: open delete" on public.sites;
drop policy if exists "raster_layers: open write" on public.raster_layers;
drop policy if exists "raster_class_stats: open write" on public.raster_class_stats;
drop policy if exists "geotagged_images: open write" on public.geotagged_images;
drop policy if exists "satellite_images: open write" on public.satellite_images;
drop policy if exists "site_insights: open write" on public.site_insights;
drop policy if exists "reports: open read" on public.reports;
drop policy if exists "reports: open write" on public.reports;

drop policy if exists "media: open write" on storage.objects;
drop policy if exists "media: open update" on storage.objects;
drop policy if exists "media: open delete" on storage.objects;
drop policy if exists "reports: open read" on storage.objects;

-- 3. Restore the editor-only policies --------------------------------------
create policy "sites: admin insert" on public.sites
  for insert to authenticated with check (public.is_admin());
create policy "sites: editor update" on public.sites
  for update to authenticated using (public.is_editor()) with check (public.is_editor());
create policy "sites: admin delete" on public.sites
  for delete to authenticated using (public.is_admin());

create policy "raster_layers: editor write" on public.raster_layers
  for all to authenticated using (public.is_editor()) with check (public.is_editor());

create policy "raster_class_stats: editor write" on public.raster_class_stats
  for all to authenticated using (public.is_editor()) with check (public.is_editor());

create policy "geotagged_images: editor insert" on public.geotagged_images
  for insert to authenticated with check (public.is_editor() and uploaded_by = auth.uid());
create policy "geotagged_images: editor update" on public.geotagged_images
  for update to authenticated using (public.is_editor()) with check (public.is_editor());
create policy "geotagged_images: owner or admin delete" on public.geotagged_images
  for delete to authenticated
  using (public.is_admin() or (public.is_editor() and uploaded_by = auth.uid()));

create policy "satellite_images: editor insert" on public.satellite_images
  for insert to authenticated with check (public.is_editor() and uploaded_by = auth.uid());
create policy "satellite_images: editor update" on public.satellite_images
  for update to authenticated using (public.is_editor()) with check (public.is_editor());
create policy "satellite_images: owner or admin delete" on public.satellite_images
  for delete to authenticated
  using (public.is_admin() or (public.is_editor() and uploaded_by = auth.uid()));

create policy "site_insights: editor write" on public.site_insights
  for all to authenticated using (public.is_editor()) with check (public.is_editor());

create policy "reports: authenticated read" on public.reports
  for select to authenticated using (public.is_editor() or generated_by = auth.uid());
create policy "reports: editor insert" on public.reports
  for insert to authenticated with check (public.is_editor() and generated_by = auth.uid());
create policy "reports: owner update" on public.reports
  for update to authenticated
  using (public.is_editor() and generated_by = auth.uid())
  with check (public.is_editor() and generated_by = auth.uid());
create policy "reports: owner or admin delete" on public.reports
  for delete to authenticated using (public.is_admin() or generated_by = auth.uid());

-- Storage
create policy "site-rasters: editor write" on storage.objects
  for insert to authenticated with check (bucket_id = 'site-rasters' and public.is_editor());
create policy "site-rasters: editor update" on storage.objects
  for update to authenticated using (bucket_id = 'site-rasters' and public.is_editor());
create policy "site-rasters: editor delete" on storage.objects
  for delete to authenticated using (bucket_id = 'site-rasters' and public.is_editor());

create policy "geotagged-images: editor write" on storage.objects
  for insert to authenticated with check (bucket_id = 'geotagged-images' and public.is_editor());
create policy "geotagged-images: editor update" on storage.objects
  for update to authenticated using (bucket_id = 'geotagged-images' and public.is_editor());
create policy "geotagged-images: editor delete" on storage.objects
  for delete to authenticated using (bucket_id = 'geotagged-images' and public.is_editor());

create policy "satellite-images: editor write" on storage.objects
  for insert to authenticated with check (bucket_id = 'satellite-images' and public.is_editor());
create policy "satellite-images: editor update" on storage.objects
  for update to authenticated using (bucket_id = 'satellite-images' and public.is_editor());
create policy "satellite-images: editor delete" on storage.objects
  for delete to authenticated using (bucket_id = 'satellite-images' and public.is_editor());

create policy "reports: editor read" on storage.objects
  for select to authenticated using (bucket_id = 'reports' and public.is_editor());
create policy "reports: editor write" on storage.objects
  for insert to authenticated with check (bucket_id = 'reports' and public.is_editor());
create policy "reports: editor delete" on storage.objects
  for delete to authenticated using (bucket_id = 'reports' and public.is_editor());
