-- ===========================================================================
-- 0008_storage.sql — Storage buckets and their access rules
-- ---------------------------------------------------------------------------
-- Four buckets:
--
--   site-rasters      public read   the .tif and .png map layers
--   geotagged-images  public read   field photos and their thumbnails
--   satellite-images  public read   satellite plates
--   reports           PRIVATE       generated PDFs, served via signed URLs
--
-- Reads on the three media buckets are public so the map and galleries work
-- without a login. Writes everywhere require an editor.
--
-- File size limits are set per bucket. This is not tidiness — the Supabase free
-- tier allows 1 GB of storage in total, and an uncompressed phone photo is
-- 3-5 MB. The client compresses before upload; these limits are the backstop
-- for when it does not.
-- ===========================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  -- Rasters: the largest of the current set is ~1.5 MB, 25 MB leaves headroom.
  -- GeoTIFF arrives under several MIME types depending on the browser, so all
  -- the common spellings are allowed.
  ('site-rasters', 'site-rasters', true, 26214400,
    array['image/tiff', 'image/geotiff', 'application/octet-stream', 'image/png']),

  ('geotagged-images', 'geotagged-images', true, 10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic']),

  ('satellite-images', 'satellite-images', true, 26214400,
    array['image/jpeg', 'image/png', 'image/webp', 'image/tiff']),

  ('reports', 'reports', false, 52428800,
    array['application/pdf'])
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- site-rasters
-- ---------------------------------------------------------------------------
create policy "site-rasters: public read"
  on storage.objects for select
  using (bucket_id = 'site-rasters');

create policy "site-rasters: editor write"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'site-rasters' and public.is_editor());

create policy "site-rasters: editor update"
  on storage.objects for update to authenticated
  using (bucket_id = 'site-rasters' and public.is_editor());

create policy "site-rasters: editor delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'site-rasters' and public.is_editor());

-- ---------------------------------------------------------------------------
-- geotagged-images
-- ---------------------------------------------------------------------------
create policy "geotagged-images: public read"
  on storage.objects for select
  using (bucket_id = 'geotagged-images');

create policy "geotagged-images: editor write"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'geotagged-images' and public.is_editor());

create policy "geotagged-images: editor update"
  on storage.objects for update to authenticated
  using (bucket_id = 'geotagged-images' and public.is_editor());

create policy "geotagged-images: editor delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'geotagged-images' and public.is_editor());

-- ---------------------------------------------------------------------------
-- satellite-images
-- ---------------------------------------------------------------------------
create policy "satellite-images: public read"
  on storage.objects for select
  using (bucket_id = 'satellite-images');

create policy "satellite-images: editor write"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'satellite-images' and public.is_editor());

create policy "satellite-images: editor update"
  on storage.objects for update to authenticated
  using (bucket_id = 'satellite-images' and public.is_editor());

create policy "satellite-images: editor delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'satellite-images' and public.is_editor());

-- ---------------------------------------------------------------------------
-- reports  (private)
-- ---------------------------------------------------------------------------
-- No public read policy at all. The bucket is private, and the app hands out
-- short-lived signed URLs when someone with access asks to download.
create policy "reports: editor read"
  on storage.objects for select to authenticated
  using (bucket_id = 'reports' and public.is_editor());

create policy "reports: editor write"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'reports' and public.is_editor());

create policy "reports: editor delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'reports' and public.is_editor());
