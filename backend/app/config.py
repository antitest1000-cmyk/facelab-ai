import os
from pathlib import Path
from typing import List

# Base directory
APP_DIR = Path(__file__).resolve().parent
BACKEND_DIR = APP_DIR.parent
ROOT_DIR = BACKEND_DIR.parent

# Application metadata
PROJECT_NAME = "FaceLab AI"
VERSION = "1.0.0"
DESCRIPTION = "Lightweight, production-grade Face Landmark Analysis service powered by MediaPipe on CPU."

# Server configuration
PORT = int(os.environ.get("PORT", "8000"))
HOST = os.environ.get("HOST", "0.0.0.0")
ENVIRONMENT = os.environ.get("ENV", "production")

# CORS
cors_raw = os.environ.get("ALLOWED_ORIGINS", "*")
ALLOWED_ORIGINS: List[str] = [origin.strip() for origin in cors_raw.split(",") if origin.strip()]

# Model settings
MODEL_PATH = APP_DIR / "models" / "face_landmarker.task"
MODEL_IDENTIFIER = "MediaPipe FaceLandmarker v2 (Tasks Vision - Float16)"

# Resource and Validation constraints
# Designed specifically for 2GB RAM / 1.5 vCPU host & 1GB disk quota
MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
MAX_IMAGE_DIMENSION = 4096                # Max width or height
INFERENCE_MAX_DIMENSION = 1920            # Downscale threshold for inference safety
MAX_CONCURRENT_INFERENCES = int(os.environ.get("MAX_CONCURRENT_INFERENCES", "1"))
INFERENCE_TIMEOUT_SECONDS = float(os.environ.get("INFERENCE_TIMEOUT_SECONDS", "10.0"))
CONCURRENCY_WAIT_TIMEOUT = float(os.environ.get("CONCURRENCY_WAIT_TIMEOUT", "2.0"))

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
}

ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
}

# Static files directory
STATIC_DIR = APP_DIR / "static"
FRONTEND_DIST_DIR = ROOT_DIR / "frontend" / "dist"
