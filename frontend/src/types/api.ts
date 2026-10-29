export interface LandmarkPoint {
  index: number;
  x: number;
  y: number;
  z: number;
}

export interface BoundingBox {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
  width: number;
  height: number;
  pixel_x_min: number;
  pixel_y_min: number;
  pixel_x_max: number;
  pixel_y_max: number;
  pixel_width: number;
  pixel_height: number;
}

export interface GeometricMetrics {
  face_aspect_ratio: number;
  interocular_distance_ratio: number;
  face_area_coverage_pct: number;
}

export interface FaceLandmarkResult {
  face_index: number;
  landmark_count: number;
  landmarks: LandmarkPoint[];
  bounding_box: BoundingBox;
  geometry_metrics: GeometricMetrics;
}

export interface AnalysisResponse {
  status: 'success' | 'no_face_detected' | string;
  face_detected: boolean;
  faces_detected_count: number;
  image_width: number;
  image_height: number;
  processing_time_ms: number;
  model_identifier: string;
  face: FaceLandmarkResult | null;
  message: string;
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  memory_mb: number;
  version: string;
  uptime_seconds: number;
}

export interface SystemLimits {
  max_upload_size_mb: number;
  max_dimensions: number;
  max_faces: number;
  concurrency_limit: number;
  allowed_formats: string[];
}

export interface ServerSpecs {
  recommended_ram: string;
  recommended_cpu: string;
  recommended_storage: string;
  gpu_required: boolean;
  runtime: string;
}

export interface ApiInfoResponse {
  name: string;
  version: string;
  description: string;
  model: string;
  limits: SystemLimits;
  server_specs: ServerSpecs;
  landmarks_schema_info: {
    total_landmarks: number;
    coordinates: string;
    features_covered: string[];
  };
}
