-- ===========================================================================
-- saswad.sql — seed data for the Saswad study area
-- ---------------------------------------------------------------------------
-- GENERATED FILE. Do not edit by hand.
--   node scripts/parse-analysed-data.mjs
--   node scripts/generate-seed-sql.mjs
--
-- Generated:     2026-09-13T09:12:39.160Z
-- Statistics:    analysed-data/*.html (QGIS unique values reports)
-- Boundary:      public/gis/Purandar_Saswad_Study_Area.geojson
-- Grid:          611 x 609 @ 10 m, EPSG:32643
-- Extent:        3720.99 ha (37.2099 km2)
--
-- Safe to re-run: every statement uses ON CONFLICT.
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- The site itself
-- ---------------------------------------------------------------------------
insert into public.sites (
  slug, name, district, state, country,
  centre_lat, centre_lng, default_zoom, area_km2,
  crs, analysis_crs, boundary_geojson,
  bbox_min_lat, bbox_min_lng, bbox_max_lat, bbox_max_lng,
  description, is_published
) values (
  'saswad', 'Saswad', 'Pune', 'Maharashtra', 'India',
  18.3082042, 73.9992056, 13, 37.2099,
  'EPSG:4326', 'EPSG:32643',
  $geojson${"type":"FeatureCollection","name":"Purandar_Saswad_Study_Area","crs":{"type":"name","properties":{"name":"urn:ogc:def:crs:OGC:1.3:CRS84"}},"features":[{"type":"Feature","properties":{"fid":1,"MINX":391180,"MINY":2021530,"MAXX":397290,"MAXY":2027620,"CNTX":394235,"CNTY":2024575,"AREA":37209900,"PERIM":24400,"HEIGHT":6090,"WIDTH":6110},"geometry":{"type":"Polygon","coordinates":[[[73.9704684914161,18.280535114462015],[74.02826808655631,18.280837623172783],[74.02796102950519,18.335873214679406],[73.97014317794749,18.335569732393353],[73.9704684914161,18.280535114462015]]]}}]}$geojson$::jsonb,
  18.2805351, 73.9701432, 18.3358732, 74.0282681,
  'Purandar-Saswad watershed study area. Sentinel-2 derived analysis at 10 m resolution, EPSG:32643.', true
)
on conflict (slug) do update set
  name = excluded.name, district = excluded.district, state = excluded.state,
  centre_lat = excluded.centre_lat, centre_lng = excluded.centre_lng,
  area_km2 = excluded.area_km2, analysis_crs = excluded.analysis_crs,
  boundary_geojson = excluded.boundary_geojson,
  bbox_min_lat = excluded.bbox_min_lat, bbox_min_lng = excluded.bbox_min_lng,
  bbox_max_lat = excluded.bbox_max_lat, bbox_max_lng = excluded.bbox_max_lng,
  description = excluded.description;

-- ---------------------------------------------------------------------------
-- NDVI 2023  (NDVI_2023_float.tif)
-- ---------------------------------------------------------------------------
insert into public.raster_layers (
  site_id, layer_key, kind, title, description, year_from, year_to,
  storage_bucket, storage_path, format, file_size_bytes,
  width_px, height_px, pixel_size_m, crs,
  extent_min_x, extent_min_y, extent_max_x, extent_max_y,
  bounds_sw_lat, bounds_sw_lng, bounds_ne_lat, bounds_ne_lng,
  total_pixels, nodata_pixels, source_file, source_path,
  colormap_key, default_opacity, display_order, is_visible_by_default
) values (
  (select id from public.sites where slug = 'saswad'),
  'ndvi_2023', 'ndvi', 'NDVI 2023',
  'Float32 NDVI raster rendered as a greyscale linear min-max stretch, matching QGIS.', 2023, null,
  'site-rasters', 'saswad/NDVI_2023_float.tif', 'geotiff', 1492057,
  611, 609, 10, 'EPSG:32643',
  391180, 2021530,
  397290, 2027620,
  18.2805351, 73.9701432, 18.3358732, 74.0282681,
  372099, null,
  'NDVI_2023_float.tif', null,
  'ndvi', 0.85, 10, false
)
on conflict (site_id, layer_key) do update set
  kind = excluded.kind, title = excluded.title, description = excluded.description,
  year_from = excluded.year_from, year_to = excluded.year_to,
  storage_path = excluded.storage_path, format = excluded.format,
  file_size_bytes = excluded.file_size_bytes,
  width_px = excluded.width_px, height_px = excluded.height_px,
  pixel_size_m = excluded.pixel_size_m, crs = excluded.crs,
  extent_min_x = excluded.extent_min_x, extent_min_y = excluded.extent_min_y,
  extent_max_x = excluded.extent_max_x, extent_max_y = excluded.extent_max_y,
  bounds_sw_lat = excluded.bounds_sw_lat, bounds_sw_lng = excluded.bounds_sw_lng,
  bounds_ne_lat = excluded.bounds_ne_lat, bounds_ne_lng = excluded.bounds_ne_lng,
  total_pixels = excluded.total_pixels, nodata_pixels = excluded.nodata_pixels,
  source_file = excluded.source_file, source_path = excluded.source_path,
  colormap_key = excluded.colormap_key, default_opacity = excluded.default_opacity,
  display_order = excluded.display_order,
  is_visible_by_default = excluded.is_visible_by_default;

-- ---------------------------------------------------------------------------
-- Vegetation Mask 2023  (veg_positive_2023.tif)
-- ---------------------------------------------------------------------------
insert into public.raster_layers (
  site_id, layer_key, kind, title, description, year_from, year_to,
  storage_bucket, storage_path, format, file_size_bytes,
  width_px, height_px, pixel_size_m, crs,
  extent_min_x, extent_min_y, extent_max_x, extent_max_y,
  bounds_sw_lat, bounds_sw_lng, bounds_ne_lat, bounds_ne_lng,
  total_pixels, nodata_pixels, source_file, source_path,
  colormap_key, default_opacity, display_order, is_visible_by_default
) values (
  (select id from public.sites where slug = 'saswad'),
  'veg_positive_2023', 'vegetation_mask', 'Vegetation Mask 2023',
  'Binary positive-NDVI vegetation mask. Source of the 2023 vegetation area figure.', 2023, null,
  'site-rasters', 'saswad/veg_positive_2023.tif', 'geotiff', 1492024,
  611, 609, 10, 'EPSG:32643',
  391180, 2021530,
  397290, 2027620,
  18.2805351, 73.9701432, 18.3358732, 74.0282681,
  372099, 0,
  'veg_positive_2023.tif', 'C:/SIH Satellite data/veg_positive_2023.tif (band 1)',
  'vegetation', 0.7, 20, false
)
on conflict (site_id, layer_key) do update set
  kind = excluded.kind, title = excluded.title, description = excluded.description,
  year_from = excluded.year_from, year_to = excluded.year_to,
  storage_path = excluded.storage_path, format = excluded.format,
  file_size_bytes = excluded.file_size_bytes,
  width_px = excluded.width_px, height_px = excluded.height_px,
  pixel_size_m = excluded.pixel_size_m, crs = excluded.crs,
  extent_min_x = excluded.extent_min_x, extent_min_y = excluded.extent_min_y,
  extent_max_x = excluded.extent_max_x, extent_max_y = excluded.extent_max_y,
  bounds_sw_lat = excluded.bounds_sw_lat, bounds_sw_lng = excluded.bounds_sw_lng,
  bounds_ne_lat = excluded.bounds_ne_lat, bounds_ne_lng = excluded.bounds_ne_lng,
  total_pixels = excluded.total_pixels, nodata_pixels = excluded.nodata_pixels,
  source_file = excluded.source_file, source_path = excluded.source_path,
  colormap_key = excluded.colormap_key, default_opacity = excluded.default_opacity,
  display_order = excluded.display_order,
  is_visible_by_default = excluded.is_visible_by_default;

-- Class statistics from veg_info_big23.html
insert into public.raster_class_stats (
  raster_layer_id, class_value, class_label, pixel_count, area_m2, is_primary, display_order
) values (
  (select rl.id from public.raster_layers rl
     join public.sites s on s.id = rl.site_id
    where s.slug = 'saswad' and rl.layer_key = 'veg_positive_2023'),
  0, 'Non-vegetation', 1533, 153300, false, 1
)
on conflict (raster_layer_id, class_value) do update set
  class_label = excluded.class_label, pixel_count = excluded.pixel_count,
  area_m2 = excluded.area_m2, is_primary = excluded.is_primary,
  display_order = excluded.display_order;
insert into public.raster_class_stats (
  raster_layer_id, class_value, class_label, pixel_count, area_m2, is_primary, display_order
) values (
  (select rl.id from public.raster_layers rl
     join public.sites s on s.id = rl.site_id
    where s.slug = 'saswad' and rl.layer_key = 'veg_positive_2023'),
  1, 'Vegetation', 370566, 37056600, true, 2
)
on conflict (raster_layer_id, class_value) do update set
  class_label = excluded.class_label, pixel_count = excluded.pixel_count,
  area_m2 = excluded.area_m2, is_primary = excluded.is_primary,
  display_order = excluded.display_order;

-- ---------------------------------------------------------------------------
-- Vegetation Mask 2026  (veg_positive_2026.tif)
-- ---------------------------------------------------------------------------
insert into public.raster_layers (
  site_id, layer_key, kind, title, description, year_from, year_to,
  storage_bucket, storage_path, format, file_size_bytes,
  width_px, height_px, pixel_size_m, crs,
  extent_min_x, extent_min_y, extent_max_x, extent_max_y,
  bounds_sw_lat, bounds_sw_lng, bounds_ne_lat, bounds_ne_lng,
  total_pixels, nodata_pixels, source_file, source_path,
  colormap_key, default_opacity, display_order, is_visible_by_default
) values (
  (select id from public.sites where slug = 'saswad'),
  'veg_positive_2026', 'vegetation_mask', 'Vegetation Mask 2026',
  'Binary positive-NDVI vegetation mask. Source of the 2026 vegetation area figure.', 2026, null,
  'site-rasters', 'saswad/veg_positive_2026.tif', 'geotiff', 1492024,
  611, 609, 10, 'EPSG:32643',
  391180, 2021530,
  397290, 2027620,
  18.2805351, 73.9701432, 18.3358732, 74.0282681,
  372099, 0,
  'veg_positive_2026.tif', 'C:/SIH Satellite data/veg_positive_2026.tif (band 1)',
  'vegetation', 0.7, 21, false
)
on conflict (site_id, layer_key) do update set
  kind = excluded.kind, title = excluded.title, description = excluded.description,
  year_from = excluded.year_from, year_to = excluded.year_to,
  storage_path = excluded.storage_path, format = excluded.format,
  file_size_bytes = excluded.file_size_bytes,
  width_px = excluded.width_px, height_px = excluded.height_px,
  pixel_size_m = excluded.pixel_size_m, crs = excluded.crs,
  extent_min_x = excluded.extent_min_x, extent_min_y = excluded.extent_min_y,
  extent_max_x = excluded.extent_max_x, extent_max_y = excluded.extent_max_y,
  bounds_sw_lat = excluded.bounds_sw_lat, bounds_sw_lng = excluded.bounds_sw_lng,
  bounds_ne_lat = excluded.bounds_ne_lat, bounds_ne_lng = excluded.bounds_ne_lng,
  total_pixels = excluded.total_pixels, nodata_pixels = excluded.nodata_pixels,
  source_file = excluded.source_file, source_path = excluded.source_path,
  colormap_key = excluded.colormap_key, default_opacity = excluded.default_opacity,
  display_order = excluded.display_order,
  is_visible_by_default = excluded.is_visible_by_default;

-- Class statistics from veg_info_big26.html
insert into public.raster_class_stats (
  raster_layer_id, class_value, class_label, pixel_count, area_m2, is_primary, display_order
) values (
  (select rl.id from public.raster_layers rl
     join public.sites s on s.id = rl.site_id
    where s.slug = 'saswad' and rl.layer_key = 'veg_positive_2026'),
  0, 'Non-vegetation', 6931, 693100, false, 1
)
on conflict (raster_layer_id, class_value) do update set
  class_label = excluded.class_label, pixel_count = excluded.pixel_count,
  area_m2 = excluded.area_m2, is_primary = excluded.is_primary,
  display_order = excluded.display_order;
insert into public.raster_class_stats (
  raster_layer_id, class_value, class_label, pixel_count, area_m2, is_primary, display_order
) values (
  (select rl.id from public.raster_layers rl
     join public.sites s on s.id = rl.site_id
    where s.slug = 'saswad' and rl.layer_key = 'veg_positive_2026'),
  1, 'Vegetation', 365168, 36516800, true, 2
)
on conflict (raster_layer_id, class_value) do update set
  class_label = excluded.class_label, pixel_count = excluded.pixel_count,
  area_m2 = excluded.area_m2, is_primary = excluded.is_primary,
  display_order = excluded.display_order;

-- ---------------------------------------------------------------------------
-- Surface Water 2023  (water_mask_2023.tif)
-- ---------------------------------------------------------------------------
insert into public.raster_layers (
  site_id, layer_key, kind, title, description, year_from, year_to,
  storage_bucket, storage_path, format, file_size_bytes,
  width_px, height_px, pixel_size_m, crs,
  extent_min_x, extent_min_y, extent_max_x, extent_max_y,
  bounds_sw_lat, bounds_sw_lng, bounds_ne_lat, bounds_ne_lng,
  total_pixels, nodata_pixels, source_file, source_path,
  colormap_key, default_opacity, display_order, is_visible_by_default
) values (
  (select id from public.sites where slug = 'saswad'),
  'water_mask_2023', 'water_mask', 'Surface Water 2023',
  'Binary surface water mask for 2023.', 2023, null,
  'site-rasters', 'saswad/water_mask_2023.tif', 'geotiff', 1492027,
  611, 609, 10, 'EPSG:32643',
  391180, 2021530,
  397290, 2027620,
  18.2805351, 73.9701432, 18.3358732, 74.0282681,
  372099, 0,
  'water_mask_2023.tif', 'C:/SIH Satellite data/water_mask_2023.tif (band 1)',
  'water_2023', 0.9, 30, true
)
on conflict (site_id, layer_key) do update set
  kind = excluded.kind, title = excluded.title, description = excluded.description,
  year_from = excluded.year_from, year_to = excluded.year_to,
  storage_path = excluded.storage_path, format = excluded.format,
  file_size_bytes = excluded.file_size_bytes,
  width_px = excluded.width_px, height_px = excluded.height_px,
  pixel_size_m = excluded.pixel_size_m, crs = excluded.crs,
  extent_min_x = excluded.extent_min_x, extent_min_y = excluded.extent_min_y,
  extent_max_x = excluded.extent_max_x, extent_max_y = excluded.extent_max_y,
  bounds_sw_lat = excluded.bounds_sw_lat, bounds_sw_lng = excluded.bounds_sw_lng,
  bounds_ne_lat = excluded.bounds_ne_lat, bounds_ne_lng = excluded.bounds_ne_lng,
  total_pixels = excluded.total_pixels, nodata_pixels = excluded.nodata_pixels,
  source_file = excluded.source_file, source_path = excluded.source_path,
  colormap_key = excluded.colormap_key, default_opacity = excluded.default_opacity,
  display_order = excluded.display_order,
  is_visible_by_default = excluded.is_visible_by_default;

-- Class statistics from water_info_big23.html
insert into public.raster_class_stats (
  raster_layer_id, class_value, class_label, pixel_count, area_m2, is_primary, display_order
) values (
  (select rl.id from public.raster_layers rl
     join public.sites s on s.id = rl.site_id
    where s.slug = 'saswad' and rl.layer_key = 'water_mask_2023'),
  0, 'Dry', 370846, 37084600, false, 1
)
on conflict (raster_layer_id, class_value) do update set
  class_label = excluded.class_label, pixel_count = excluded.pixel_count,
  area_m2 = excluded.area_m2, is_primary = excluded.is_primary,
  display_order = excluded.display_order;
insert into public.raster_class_stats (
  raster_layer_id, class_value, class_label, pixel_count, area_m2, is_primary, display_order
) values (
  (select rl.id from public.raster_layers rl
     join public.sites s on s.id = rl.site_id
    where s.slug = 'saswad' and rl.layer_key = 'water_mask_2023'),
  1, 'Water', 1253, 125300, true, 2
)
on conflict (raster_layer_id, class_value) do update set
  class_label = excluded.class_label, pixel_count = excluded.pixel_count,
  area_m2 = excluded.area_m2, is_primary = excluded.is_primary,
  display_order = excluded.display_order;

-- ---------------------------------------------------------------------------
-- Surface Water 2026  (water_mask.tif)
-- ---------------------------------------------------------------------------
insert into public.raster_layers (
  site_id, layer_key, kind, title, description, year_from, year_to,
  storage_bucket, storage_path, format, file_size_bytes,
  width_px, height_px, pixel_size_m, crs,
  extent_min_x, extent_min_y, extent_max_x, extent_max_y,
  bounds_sw_lat, bounds_sw_lng, bounds_ne_lat, bounds_ne_lng,
  total_pixels, nodata_pixels, source_file, source_path,
  colormap_key, default_opacity, display_order, is_visible_by_default
) values (
  (select id from public.sites where slug = 'saswad'),
  'water_mask_2026', 'water_mask', 'Surface Water 2026',
  'Binary surface water mask for 2026.', 2026, null,
  'site-rasters', 'saswad/water_mask.tif', 'geotiff', 1492028,
  611, 609, 10, 'EPSG:32643',
  391180, 2021530,
  397290, 2027620,
  18.2805351, 73.9701432, 18.3358732, 74.0282681,
  372099, 0,
  'water_mask.tif', 'C:/SIH Satellite data/water_mask.tif (band 1)',
  'water_2026', 0.9, 31, true
)
on conflict (site_id, layer_key) do update set
  kind = excluded.kind, title = excluded.title, description = excluded.description,
  year_from = excluded.year_from, year_to = excluded.year_to,
  storage_path = excluded.storage_path, format = excluded.format,
  file_size_bytes = excluded.file_size_bytes,
  width_px = excluded.width_px, height_px = excluded.height_px,
  pixel_size_m = excluded.pixel_size_m, crs = excluded.crs,
  extent_min_x = excluded.extent_min_x, extent_min_y = excluded.extent_min_y,
  extent_max_x = excluded.extent_max_x, extent_max_y = excluded.extent_max_y,
  bounds_sw_lat = excluded.bounds_sw_lat, bounds_sw_lng = excluded.bounds_sw_lng,
  bounds_ne_lat = excluded.bounds_ne_lat, bounds_ne_lng = excluded.bounds_ne_lng,
  total_pixels = excluded.total_pixels, nodata_pixels = excluded.nodata_pixels,
  source_file = excluded.source_file, source_path = excluded.source_path,
  colormap_key = excluded.colormap_key, default_opacity = excluded.default_opacity,
  display_order = excluded.display_order,
  is_visible_by_default = excluded.is_visible_by_default;

-- Class statistics from water_info_big26.html
insert into public.raster_class_stats (
  raster_layer_id, class_value, class_label, pixel_count, area_m2, is_primary, display_order
) values (
  (select rl.id from public.raster_layers rl
     join public.sites s on s.id = rl.site_id
    where s.slug = 'saswad' and rl.layer_key = 'water_mask_2026'),
  0, 'Dry', 371796, 37179600, false, 1
)
on conflict (raster_layer_id, class_value) do update set
  class_label = excluded.class_label, pixel_count = excluded.pixel_count,
  area_m2 = excluded.area_m2, is_primary = excluded.is_primary,
  display_order = excluded.display_order;
insert into public.raster_class_stats (
  raster_layer_id, class_value, class_label, pixel_count, area_m2, is_primary, display_order
) values (
  (select rl.id from public.raster_layers rl
     join public.sites s on s.id = rl.site_id
    where s.slug = 'saswad' and rl.layer_key = 'water_mask_2026'),
  1, 'Water', 303, 30300, true, 2
)
on conflict (raster_layer_id, class_value) do update set
  class_label = excluded.class_label, pixel_count = excluded.pixel_count,
  area_m2 = excluded.area_m2, is_primary = excluded.is_primary,
  display_order = excluded.display_order;

-- ---------------------------------------------------------------------------
-- Water Change 2023 to 2026  (Water_Change_2023_2026.tif)
-- ---------------------------------------------------------------------------
insert into public.raster_layers (
  site_id, layer_key, kind, title, description, year_from, year_to,
  storage_bucket, storage_path, format, file_size_bytes,
  width_px, height_px, pixel_size_m, crs,
  extent_min_x, extent_min_y, extent_max_x, extent_max_y,
  bounds_sw_lat, bounds_sw_lng, bounds_ne_lat, bounds_ne_lng,
  total_pixels, nodata_pixels, source_file, source_path,
  colormap_key, default_opacity, display_order, is_visible_by_default
) values (
  (select id from public.sites where slug = 'saswad'),
  'water_change_2023_2026', 'change', 'Water Change 2023 to 2026',
  'Ternary change raster: -1 water loss, 0 stable, +1 water gain.', 2023, 2026,
  'site-rasters', 'saswad/Water_Change_2023_2026.tif', 'geotiff', 1492029,
  611, 609, 10, 'EPSG:32643',
  391180, 2021530,
  397290, 2027620,
  18.2805351, 73.9701432, 18.3358732, 74.0282681,
  372099, 0,
  'Water_Change_2023_2026.tif', 'C:/SIH Satellite data/Water_Change_2023_2026.tif (band 1)',
  'water_change', 0.95, 40, false
)
on conflict (site_id, layer_key) do update set
  kind = excluded.kind, title = excluded.title, description = excluded.description,
  year_from = excluded.year_from, year_to = excluded.year_to,
  storage_path = excluded.storage_path, format = excluded.format,
  file_size_bytes = excluded.file_size_bytes,
  width_px = excluded.width_px, height_px = excluded.height_px,
  pixel_size_m = excluded.pixel_size_m, crs = excluded.crs,
  extent_min_x = excluded.extent_min_x, extent_min_y = excluded.extent_min_y,
  extent_max_x = excluded.extent_max_x, extent_max_y = excluded.extent_max_y,
  bounds_sw_lat = excluded.bounds_sw_lat, bounds_sw_lng = excluded.bounds_sw_lng,
  bounds_ne_lat = excluded.bounds_ne_lat, bounds_ne_lng = excluded.bounds_ne_lng,
  total_pixels = excluded.total_pixels, nodata_pixels = excluded.nodata_pixels,
  source_file = excluded.source_file, source_path = excluded.source_path,
  colormap_key = excluded.colormap_key, default_opacity = excluded.default_opacity,
  display_order = excluded.display_order,
  is_visible_by_default = excluded.is_visible_by_default;

-- Class statistics from waterchange_info_big26-23.html
insert into public.raster_class_stats (
  raster_layer_id, class_value, class_label, pixel_count, area_m2, is_primary, display_order
) values (
  (select rl.id from public.raster_layers rl
     join public.sites s on s.id = rl.site_id
    where s.slug = 'saswad' and rl.layer_key = 'water_change_2023_2026'),
  -1, 'Water loss', 954, 95400, false, 1
)
on conflict (raster_layer_id, class_value) do update set
  class_label = excluded.class_label, pixel_count = excluded.pixel_count,
  area_m2 = excluded.area_m2, is_primary = excluded.is_primary,
  display_order = excluded.display_order;
insert into public.raster_class_stats (
  raster_layer_id, class_value, class_label, pixel_count, area_m2, is_primary, display_order
) values (
  (select rl.id from public.raster_layers rl
     join public.sites s on s.id = rl.site_id
    where s.slug = 'saswad' and rl.layer_key = 'water_change_2023_2026'),
  0, 'Stable', 371141, 37114100, false, 2
)
on conflict (raster_layer_id, class_value) do update set
  class_label = excluded.class_label, pixel_count = excluded.pixel_count,
  area_m2 = excluded.area_m2, is_primary = excluded.is_primary,
  display_order = excluded.display_order;
insert into public.raster_class_stats (
  raster_layer_id, class_value, class_label, pixel_count, area_m2, is_primary, display_order
) values (
  (select rl.id from public.raster_layers rl
     join public.sites s on s.id = rl.site_id
    where s.slug = 'saswad' and rl.layer_key = 'water_change_2023_2026'),
  1, 'Water gain', 4, 400, false, 3
)
on conflict (raster_layer_id, class_value) do update set
  class_label = excluded.class_label, pixel_count = excluded.pixel_count,
  area_m2 = excluded.area_m2, is_primary = excluded.is_primary,
  display_order = excluded.display_order;

-- ---------------------------------------------------------------------------
-- NDVI Change 2023 to 2026  (NDVI_Change_2023_2026.png)
-- ---------------------------------------------------------------------------
insert into public.raster_layers (
  site_id, layer_key, kind, title, description, year_from, year_to,
  storage_bucket, storage_path, format, file_size_bytes,
  width_px, height_px, pixel_size_m, crs,
  extent_min_x, extent_min_y, extent_max_x, extent_max_y,
  bounds_sw_lat, bounds_sw_lng, bounds_ne_lat, bounds_ne_lng,
  total_pixels, nodata_pixels, source_file, source_path,
  colormap_key, default_opacity, display_order, is_visible_by_default
) values (
  (select id from public.sites where slug = 'saswad'),
  'ndvi_change_2023_2026', 'ndvi_change', 'NDVI Change 2023 to 2026',
  'Pre-rendered vegetation change overlay. Green is gain, red is loss.', 2023, 2026,
  'site-rasters', 'saswad/NDVI_Change_2023_2026.png', 'png', 714478,
  null, null, 10, 'EPSG:32643',
  391180, 2021530,
  397290, 2027620,
  18.2804925, 73.9701841, 18.335834, 74.0283418,
  null, null,
  'NDVI_Change_2023_2026.png', null,
  null, 0.8, 41, false
)
on conflict (site_id, layer_key) do update set
  kind = excluded.kind, title = excluded.title, description = excluded.description,
  year_from = excluded.year_from, year_to = excluded.year_to,
  storage_path = excluded.storage_path, format = excluded.format,
  file_size_bytes = excluded.file_size_bytes,
  width_px = excluded.width_px, height_px = excluded.height_px,
  pixel_size_m = excluded.pixel_size_m, crs = excluded.crs,
  extent_min_x = excluded.extent_min_x, extent_min_y = excluded.extent_min_y,
  extent_max_x = excluded.extent_max_x, extent_max_y = excluded.extent_max_y,
  bounds_sw_lat = excluded.bounds_sw_lat, bounds_sw_lng = excluded.bounds_sw_lng,
  bounds_ne_lat = excluded.bounds_ne_lat, bounds_ne_lng = excluded.bounds_ne_lng,
  total_pixels = excluded.total_pixels, nodata_pixels = excluded.nodata_pixels,
  source_file = excluded.source_file, source_path = excluded.source_path,
  colormap_key = excluded.colormap_key, default_opacity = excluded.default_opacity,
  display_order = excluded.display_order,
  is_visible_by_default = excluded.is_visible_by_default;

-- ---------------------------------------------------------------------------
-- Drainage Network  (purandar_streams_raster.tif)
-- ---------------------------------------------------------------------------
insert into public.raster_layers (
  site_id, layer_key, kind, title, description, year_from, year_to,
  storage_bucket, storage_path, format, file_size_bytes,
  width_px, height_px, pixel_size_m, crs,
  extent_min_x, extent_min_y, extent_max_x, extent_max_y,
  bounds_sw_lat, bounds_sw_lng, bounds_ne_lat, bounds_ne_lng,
  total_pixels, nodata_pixels, source_file, source_path,
  colormap_key, default_opacity, display_order, is_visible_by_default
) values (
  (select id from public.sites where slug = 'saswad'),
  'streams', 'streams', 'Drainage Network',
  'Stream channels derived from the SRTM 30 m digital elevation model.', null, null,
  'site-rasters', 'saswad/purandar_streams_raster.tif', 'geotiff', 169571,
  205, 205, 30, 'EPSG:32643',
  391180, 2021530,
  397290, 2027620,
  18.2805182, 73.969951, 18.3358316, 74.0285009,
  42025, null,
  'purandar_streams_raster.tif', null,
  'streams', 0.95, 50, true
)
on conflict (site_id, layer_key) do update set
  kind = excluded.kind, title = excluded.title, description = excluded.description,
  year_from = excluded.year_from, year_to = excluded.year_to,
  storage_path = excluded.storage_path, format = excluded.format,
  file_size_bytes = excluded.file_size_bytes,
  width_px = excluded.width_px, height_px = excluded.height_px,
  pixel_size_m = excluded.pixel_size_m, crs = excluded.crs,
  extent_min_x = excluded.extent_min_x, extent_min_y = excluded.extent_min_y,
  extent_max_x = excluded.extent_max_x, extent_max_y = excluded.extent_max_y,
  bounds_sw_lat = excluded.bounds_sw_lat, bounds_sw_lng = excluded.bounds_sw_lng,
  bounds_ne_lat = excluded.bounds_ne_lat, bounds_ne_lng = excluded.bounds_ne_lng,
  total_pixels = excluded.total_pixels, nodata_pixels = excluded.nodata_pixels,
  source_file = excluded.source_file, source_path = excluded.source_path,
  colormap_key = excluded.colormap_key, default_opacity = excluded.default_opacity,
  display_order = excluded.display_order,
  is_visible_by_default = excluded.is_visible_by_default;

commit;

-- ---------------------------------------------------------------------------
-- Verify: these should match the QGIS reports exactly.
-- ---------------------------------------------------------------------------
--   select vegetation_change_ha, vegetation_change_pct,
--          water_change_ha, water_change_pct,
--          water_loss_ha, water_gain_ha, water_net_change_ha,
--          water_change_cross_check_ok, total_area_ha
--     from public.site_metrics_view where slug = 'saswad';
--
-- Expected: -53.98 / -1.46 / -9.50 / -75.82 / 9.54 / 0.04 / -9.50 / true / 3720.99
