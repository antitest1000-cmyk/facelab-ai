from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class LandmarkPoint(BaseModel):
    """Normalized 3D facial landmark coordinate."""
    index: int = Field(..., description="Landmark index (0-477)")
    x: float = Field(..., description="Normalized horizontal coordinate [0.0, 1.0]")
    y: float = Field(..., description="Normalized vertical coordinate [0.0, 1.0]")
    z: float = Field(..., description="Normalized depth coordinate relative to midpoint")


class BoundingBox(BaseModel):
    """Face bounding box in both normalized and pixel space."""
    x_min: float = Field(..., description="Normalized minimum X")
    y_min: float = Field(..., description="Normalized minimum Y")
    x_max: float = Field(..., description="Normalized maximum X")
    y_max: float = Field(..., description="Normalized maximum Y")
    width: float = Field(..., description="Normalized width")
    height: float = Field(..., description="Normalized height")
    pixel_x_min: int = Field(..., description="Pixel minimum X")
    pixel_y_min: int = Field(..., description="Pixel minimum Y")
    pixel_x_max: int = Field(..., description="Pixel maximum X")
    pixel_y_max: int = Field(..., description="Pixel maximum Y")
    pixel_width: int = Field(..., description="Pixel width")
    pixel_height: int = Field(..., description="Pixel height")


class GeometricMetrics(BaseModel):
    """Safe, purely geometric measurements derived from landmark coordinates."""
    face_aspect_ratio: float = Field(..., description="Height-to-width ratio of the face bounding box")
    interocular_distance_ratio: float = Field(..., description="Distance between pupils relative to face width")
    face_area_coverage_pct: float = Field(..., description="Face bounding box area as percentage of image area")


class FaceLandmarkResult(BaseModel):
    """Detailed facial landmark data for a single detected face."""
    face_index: int = 0
    landmark_count: int = Field(..., description="Total landmarks detected for this face (typically 478)")
    landmarks: List[LandmarkPoint] = Field(..., description="Full list of normalized landmark coordinates")
    bounding_box: BoundingBox = Field(..., description="Computed face bounding box")
    geometry_metrics: GeometricMetrics = Field(..., description="Geometric spatial metrics")


class AnalysisResponse(BaseModel):
    """Complete image analysis response from FaceLab AI."""
    status: str = Field("success", description="Status code string ('success', 'no_face_detected')")
    face_detected: bool = Field(..., description="Whether a face was detected")
    faces_detected_count: int = Field(..., description="Number of detected faces (0 or 1 for this MVP)")
    image_width: int = Field(..., description="Original image width in pixels")
    image_height: int = Field(..., description="Original image height in pixels")
    processing_time_ms: float = Field(..., description="Server-side inference and processing latency in ms")
    model_identifier: str = Field(..., description="Underlying model / detector version")
    face: Optional[FaceLandmarkResult] = Field(None, description="Landmarks and metrics if face detected")
    message: str = Field(..., description="Human-readable summary or status message")


class HealthResponse(BaseModel):
    """Service health response."""
    status: str = Field(..., json_schema_extra={"example": "healthy"})
    model_loaded: bool = Field(..., json_schema_extra={"example": True})
    memory_mb: float = Field(..., json_schema_extra={"example": 85.4})
    version: str = Field(..., json_schema_extra={"example": "1.0.0"})
    uptime_seconds: float = Field(...)


class SystemLimits(BaseModel):
    max_upload_size_mb: float
    max_dimensions: int
    max_faces: int
    concurrency_limit: int
    allowed_formats: List[str]


class ServerSpecs(BaseModel):
    recommended_ram: str = "2 GB"
    recommended_cpu: str = "1.5 vCPU"
    recommended_storage: str = "2 GB"
    gpu_required: bool = False
    runtime: str = "FastAPI + Uvicorn (1 worker) on Python 3.11+"


class ApiInfoResponse(BaseModel):
    """Supported features and operational limits."""
    name: str
    version: str
    description: str
    model: str
    limits: SystemLimits
    server_specs: ServerSpecs
    landmarks_schema_info: Dict[str, Any]
