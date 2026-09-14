-- ===========================================================================
-- 0007_rls.sql — Row Level Security
-- ---------------------------------------------------------------------------
-- The rule, decided up front:
--
--   ANYONE, logged in or not, can READ published content.
--     Judges must be able to browse the prototype without an account.
--
--   ONLY editors and admins can WRITE.
--
-- This matters more than it looks. The Supabase anon key is compiled into the
-- JavaScript bundle and is readable by anyone who opens devtools. That is fine
-- and by design — but ONLY because these policies exist. Without RLS the anon
-- key would be a public write key to the whole database.
--
-- RLS is enabled on every table. A table with RLS on and no policy denies
-- everything, which is the safe direction to fail.
-- ===========================================================================

alter table public.sites              enable row level security;
alter table public.raster_layers      enable row level security;
alter table public.raster_class_stats enable row level security;
alter table public.geotagged_images   enable row level security;
alter table public.satellite_images   enable row level security;
alter table public.site_insights      enable row level security;
alter table public.reports            enable row level security;
alter table public.profiles           enable row level security;

-- ---------------------------------------------------------------------------
-- sites
-- ---------------------------------------------------------------------------
-- Unpublished sites stay hidden from the public but remain visible to editors,
-- so a site can be staged before launch.
create policy "sites: public read published"
  on public.sites for select
  using (is_published or public.is_editor());

-- Creating and deleting a site is an admin action; editing details is not.
create policy "sites: admin insert"
  on public.sites for insert to authenticated
  with check (public.is_admin());

create policy "sites: editor update"
  on public.sites for update to authenticated
  using (public.is_editor()) with check (public.is_editor());

create policy "sites: admin delete"
  on public.sites for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- raster_layers
-- ---------------------------------------------------------------------------
create policy "raster_layers: public read"
  on public.raster_layers for select
  using (
    exists (
      select 1 from public.sites s
      where s.id = raster_layers.site_id
        and (s.is_published or public.is_editor())
    )
  );

create policy "raster_layers: editor write"
  on public.raster_layers for all to authenticated
  using (public.is_editor()) with check (public.is_editor());

-- ---------------------------------------------------------------------------
-- raster_class_stats
-- ---------------------------------------------------------------------------
-- Visibility follows the parent layer, which in turn follows the site.
create policy "raster_class_stats: public read"
  on public.raster_class_stats for select
  using (
    exists (
      select 1
      from public.raster_layers rl
      join public.sites s on s.id = rl.site_id
      where rl.id = raster_class_stats.raster_layer_id
        and (s.is_published or public.is_editor())
    )
  );

create policy "raster_class_stats: editor write"
  on public.raster_class_stats for all to authenticated
  using (public.is_editor()) with check (public.is_editor());

-- ---------------------------------------------------------------------------
-- geotagged_images
-- ---------------------------------------------------------------------------
create policy "geotagged_images: public read"
  on public.geotagged_images for select
  using (
    exists (
      select 1 from public.sites s
      where s.id = geotagged_images.site_id
        and (s.is_published or public.is_editor())
    )
  );

create policy "geotagged_images: editor insert"
  on public.geotagged_images for insert to authenticated
  with check (public.is_editor() and uploaded_by = auth.uid());

-- An editor may correct anyone's photo metadata; a GPS fix is a shared concern,
-- not the private property of whoever happened to upload the file.
create policy "geotagged_images: editor update"
  on public.geotagged_images for update to authenticated
  using (public.is_editor()) with check (public.is_editor());

-- Deletion is narrower: your own uploads, or an admin clearing up.
create policy "geotagged_images: owner or admin delete"
  on public.geotagged_images for delete to authenticated
  using (public.is_admin() or (public.is_editor() and uploaded_by = auth.uid()));

-- ---------------------------------------------------------------------------
-- satellite_images
-- ---------------------------------------------------------------------------
create policy "satellite_images: public read"
  on public.satellite_images for select
  using (
    exists (
      select 1 from public.sites s
      where s.id = satellite_images.site_id
        and (s.is_published or public.is_editor())
    )
  );

create policy "satellite_images: editor insert"
  on public.satellite_images for insert to authenticated
  with check (public.is_editor() and uploaded_by = auth.uid());

create policy "satellite_images: editor update"
  on public.satellite_images for update to authenticated
  using (public.is_editor()) with check (public.is_editor());

create policy "satellite_images: owner or admin delete"
  on public.satellite_images for delete to authenticated
  using (public.is_admin() or (public.is_editor() and uploaded_by = auth.uid()));

-- ---------------------------------------------------------------------------
-- site_insights
-- ---------------------------------------------------------------------------
create policy "site_insights: public read published"
  on public.site_insights for select
  using (
    is_published
    and exists (
      select 1 from public.sites s
      where s.id = site_insights.site_id and s.is_published
    )
    or public.is_editor()
  );

create policy "site_insights: editor write"
  on public.site_insights for all to authenticated
  using (public.is_editor()) with check (public.is_editor());

-- ---------------------------------------------------------------------------
-- reports
-- ---------------------------------------------------------------------------
-- Reports are the one thing that is NOT public. They bundle everything about a
-- site into a single downloadable file, so they stay behind a login and are
-- served through short-lived signed URLs.
create policy "reports: authenticated read"
  on public.reports for select to authenticated
  using (public.is_editor() or generated_by = auth.uid());

create policy "reports: editor insert"
  on public.reports for insert to authenticated
  with check (public.is_editor() and generated_by = auth.uid());

create policy "reports: owner update"
  on public.reports for update to authenticated
  using (public.is_editor() and generated_by = auth.uid())
  with check (public.is_editor() and generated_by = auth.uid());

create policy "reports: owner or admin delete"
  on public.reports for delete to authenticated
  using (public.is_admin() or generated_by = auth.uid());

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
-- Readable so the UI can show "uploaded by" names.
create policy "profiles: authenticated read"
  on public.profiles for select to authenticated
  using (true);

-- You may edit your own profile, but the role column is deliberately NOT
-- self-editable: the check below pins role to whatever it already is, so a
-- viewer cannot promote themselves to admin. Role changes happen in the
-- Supabase dashboard or through a service-role script.
create policy "profiles: update own except role"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );
