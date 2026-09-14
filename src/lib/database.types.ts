/**
 * Database types for the JalDrishti Supabase schema.
 *
 * HAND-WRITTEN to match supabase/migrations/*.sql, because generating them
 * requires a linked CLI (`supabase login` is an interactive browser flow).
 *
 * Once the CLI is linked, replace this file with the generated version:
 *
 *   npm run db:types
 *
 * Until then, if you change a migration, change this file too.
 */

export type RasterKind =
  | 'ndvi'
  | 'ndvi_change'
  | 'vegetation_mask'
  | 'water_mask'
  | 'change'
  | 'streams'
  | 'lulc'
  | 'other';

export type RasterFormat = 'geotiff' | 'png';

export type ObservationCategory =
  | 'vegetation'
  | 'water'
  | 'intervention'
  | 'degradation'
  | 'other';

export type GpsSource = 'exif' | 'manual' | 'unknown';
export type InsightSeverity = 'info' | 'positive' | 'watch' | 'critical';
export type InsightSource = 'analyst' | 'computed' | 'model';
export type ReportStatus = 'pending' | 'ready' | 'failed';
export type UserRole = 'viewer' | 'editor' | 'admin';

export type SiteRow = {
  id: string;
  slug: string;
  name: string;
  district: string | null;
  state: string | null;
  country: string;
  centre_lat: number;
  centre_lng: number;
  default_zoom: number;
  area_km2: number | null;
  crs: string;
  analysis_crs: string | null;
  boundary_geojson: GeoJSON.FeatureCollection | null;
  bbox_min_lat: number | null;
  bbox_min_lng: number | null;
  bbox_max_lat: number | null;
  bbox_max_lng: number | null;
  description: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export type RasterLayerRow = {
  id: string;
  site_id: string;
  layer_key: string;
  kind: RasterKind;
  title: string;
  description: string | null;
  year_from: number | null;
  year_to: number | null;
  storage_bucket: string;
  storage_path: string;
  format: RasterFormat;
  file_size_bytes: number | null;
  width_px: number | null;
  height_px: number | null;
  pixel_size_m: number | null;
  crs: string | null;
  extent_min_x: number | null;
  extent_min_y: number | null;
  extent_max_x: number | null;
  extent_max_y: number | null;
  bounds_sw_lat: number | null;
  bounds_sw_lng: number | null;
  bounds_ne_lat: number | null;
  bounds_ne_lng: number | null;
  total_pixels: number | null;
  nodata_pixels: number | null;
  source_file: string | null;
  source_path: string | null;
  colormap_key: string | null;
  default_opacity: number;
  display_order: number;
  is_visible_by_default: boolean;
  created_at: string;
  updated_at: string;
}

export type RasterClassStatRow = {
  id: string;
  raster_layer_id: string;
  class_value: number;
  class_label: string;
  pixel_count: number;
  area_m2: number;
  area_ha: number;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export type GeotaggedImageRow = {
  id: string;
  site_id: string;
  storage_bucket: string;
  storage_path: string;
  thumbnail_path: string | null;
  lat: number | null;
  lng: number | null;
  altitude_m: number | null;
  gps_accuracy_m: number | null;
  heading_deg: number | null;
  gps_source: GpsSource;
  captured_at: string | null;
  category: ObservationCategory;
  status: string | null;
  title: string;
  description: string | null;
  observer_name: string | null;
  exif: Record<string, unknown> | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  width_px: number | null;
  height_px: number | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export type SatelliteImageRow = {
  id: string;
  site_id: string;
  storage_bucket: string;
  storage_path: string;
  thumbnail_path: string | null;
  title: string;
  caption: string | null;
  sensor: string | null;
  product: string | null;
  acquisition_date: string | null;
  year: number | null;
  resolution_m: number | null;
  cloud_cover_pct: number | null;
  is_overlay: boolean;
  bounds_sw_lat: number | null;
  bounds_sw_lng: number | null;
  bounds_ne_lat: number | null;
  bounds_ne_lng: number | null;
  raster_layer_id: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  width_px: number | null;
  height_px: number | null;
  display_order: number;
  include_in_report: boolean;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export type SiteInsightRow = {
  id: string;
  site_id: string;
  body: string;
  category: string | null;
  severity: InsightSeverity;
  source: InsightSource;
  model_name: string | null;
  author: string | null;
  display_order: number;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ReportRow = {
  id: string;
  site_id: string;
  title: string;
  status: ReportStatus;
  storage_bucket: string;
  storage_path: string | null;
  file_size_bytes: number | null;
  page_count: number | null;
  params: Record<string, unknown>;
  metrics_snapshot: Record<string, unknown> | null;
  error_message: string | null;
  generated_by: string | null;
  generated_at: string | null;
  created_at: string;
}

export type ProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

/** Computed by site_metrics_view. Every field is derived, never stored. */
export type SiteMetricsRow = {
  site_id: string;
  slug: string;
  name: string;
  vegetation_baseline_year: number | null;
  vegetation_current_year: number | null;
  vegetation_baseline_ha: number | null;
  vegetation_current_ha: number | null;
  vegetation_change_ha: number | null;
  vegetation_change_pct: number | null;
  water_baseline_year: number | null;
  water_current_year: number | null;
  water_baseline_ha: number | null;
  water_current_ha: number | null;
  water_change_ha: number | null;
  water_change_pct: number | null;
  change_year_from: number | null;
  change_year_to: number | null;
  water_loss_ha: number | null;
  water_gain_ha: number | null;
  water_net_change_ha: number | null;
  /** True when the change raster agrees with the two independent water masks. */
  water_change_cross_check_ok: boolean | null;
  total_area_ha: number | null;
  total_area_km2: number | null;
}

/** Computed by site_lulc_view. Three rows per site. */
export type SiteLulcRow = {
  site_id: string;
  slug: string;
  year: number | null;
  class_name: string;
  area_ha: number;
  share_pct: number | null;
  colour: string;
  display_order: number;
}

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type View<Row> = { Row: Row; Relationships: [] };

export interface Database {
  public: {
    Tables: {
      sites: Table<SiteRow>;
      raster_layers: Table<RasterLayerRow>;
      raster_class_stats: Table<RasterClassStatRow>;
      geotagged_images: Table<GeotaggedImageRow>;
      satellite_images: Table<SatelliteImageRow>;
      site_insights: Table<SiteInsightRow>;
      reports: Table<ReportRow>;
      profiles: Table<ProfileRow>;
    };
    Views: {
      site_metrics_view: View<SiteMetricsRow>;
      site_lulc_view: View<SiteLulcRow>;
    };
    Functions: Record<string, never>;
    Enums: {
      raster_kind: RasterKind;
      raster_format: RasterFormat;
      observation_category: ObservationCategory;
      gps_source: GpsSource;
      insight_severity: InsightSeverity;
      insight_source: InsightSource;
      report_status: ReportStatus;
      user_role: UserRole;
    };
    CompositeTypes: Record<string, never>;
  };
}
