import os
import sys
import time
import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from fastapi import (
    FastAPI,
    File,
    UploadFile,
    HTTPException,
    status,
    Request,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, Response
from fastapi.staticfiles import StaticFiles

from . import config
from .schemas import (
    AnalysisResponse,
    HealthResponse,
    ApiInfoResponse,
    SystemLimits,
    ServerSpecs,
)
from .analyzer import get_analyzer, FaceAnalyzer

# Configure structured logging without sensitive image payload dumps
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("facelab.api")

# Track startup timestamp
STARTUP_TIME = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager: preload model once at application start."""
    logger.info("Initializing FaceLab AI service...")
    try:
        analyzer = get_analyzer()
        logger.info("MediaPipe FaceLandmarker model loaded successfully.")
    except Exception as e:
        logger.critical(f"Failed to initialize FaceAnalyzer: {e}", exc_info=True)
        raise e

    yield

    logger.info("Shutting down FaceLab AI service.")


app = FastAPI(
    title=config.PROJECT_NAME,
    version=config.VERSION,
    description=config.DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Explicit CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Service health and resource usage endpoint."""
    memory_mb = 0.0
    try:
        import psutil

        process = psutil.Process(os.getpid())
        memory_mb = round(process.memory_info().rss / (1024 * 1024), 2)
    except Exception:
        pass

    analyzer = get_analyzer()
    model_ready = analyzer.detector is not None

    return HealthResponse(
        status="healthy" if model_ready else "degraded",
        model_loaded=model_ready,
        memory_mb=memory_mb,
        version=config.VERSION,
        uptime_seconds=round(time.time() - STARTUP_TIME, 2),
    )


@app.get("/api/info", response_model=ApiInfoResponse, tags=["Information"])
async def get_api_info():
    """Retrieve service capabilities, constraints, and resource limits."""
    return ApiInfoResponse(
        name=config.PROJECT_NAME,
        version=config.VERSION,
        description=config.DESCRIPTION,
        model=config.MODEL_IDENTIFIER,
        limits=SystemLimits(
            max_upload_size_mb=round(config.MAX_UPLOAD_SIZE_BYTES / (1024 * 1024), 1),
            max_dimensions=config.MAX_IMAGE_DIMENSION,
            max_faces=1,
            concurrency_limit=config.MAX_CONCURRENT_INFERENCES,
            allowed_formats=sorted(list(config.ALLOWED_EXTENSIONS)),
        ),
        server_specs=ServerSpecs(),
        landmarks_schema_info={
            "total_landmarks": 478,
            "coordinates": "Normalized [0.0, 1.0] for X and Y; depth scale for Z",
            "features_covered": [
                "face_oval",
                "left_eye",
                "right_eye",
                "left_eyebrow",
                "right_eyebrow",
                "nose",
                "lips",
                "left_iris",
                "right_iris",
                "tessellation_mesh",
            ],
        },
    )


@app.get("/api/sample", tags=["Testing"])
async def get_sample_image():
    """Provide a verified public sample face image for quick frontend testing."""
    fixture_path = config.BACKEND_DIR / "tests" / "fixtures" / "sample_face.jpg"
    if fixture_path.exists():
        return FileResponse(fixture_path, media_type="image/jpeg", filename="sample_portrait.jpg")
    raise HTTPException(status_code=404, detail="Sample fixture not available.")


@app.post("/api/analyze", response_model=AnalysisResponse, tags=["Face Analysis"])
async def analyze_face(file: UploadFile = File(...)):
    """
    Analyze an uploaded image for face landmarks.

    - Validates file size (max 5 MB)
    - Validates magic bytes / MIME type
    - Safe CPU inference with concurrency control (1 at a time for 1.5 vCPU host)
    - Returns normalized 3D landmark coordinates and geometric metrics
    """
    # 1. Quick extension check
    filename = file.filename or ""
    ext = Path(filename).suffix.lower()
    if ext and ext not in config.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Allowed extensions: {', '.join(sorted(config.ALLOWED_EXTENSIONS))}",
        )

    # 2. Size-guarded streaming read to prevent memory exhaustion
    # Read in chunks up to MAX_UPLOAD_SIZE_BYTES + 1
    chunk_size = 64 * 1024  # 64 KB
    total_read = 0
    chunks = []

    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        total_read += len(chunk)
        if total_read > config.MAX_UPLOAD_SIZE_BYTES:
            # Immediate rejection before buffering entire malicious payload
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail=f"Uploaded file exceeds maximum size limit of {config.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)} MB.",
            )
        chunks.append(chunk)

    if total_read == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes).",
        )

    file_bytes = b"".join(chunks)
    del chunks

    # 3. Process analysis via analyzer
    analyzer = get_analyzer()
    try:
        result = await analyzer.analyze_image(file_bytes)
        return result
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except TimeoutError as timeout_err:
        # Concurrency queue timeout (Server overloaded / 429)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(timeout_err),
        )
    except Exception as exc:
        logger.error(f"Inference error: {exc}", exc_info=True)
        # Avoid leaking internal stack trace details to client
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing the image. Please try again with a valid photo.",
        )
    finally:
        del file_bytes


# Static files and frontend SPA handling
static_dist = config.FRONTEND_DIST_DIR if config.FRONTEND_DIST_DIR.exists() else config.STATIC_DIR

if static_dist.exists() and (static_dist / "index.html").exists():
    # Mount built assets
    assets_dir = static_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    # Serve index.html for root and SPA paths
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # Don't intercept API or docs routes
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("redoc") or full_path.startswith("openapi.json") or full_path == "health":
            raise HTTPException(status_code=404, detail="Not Found")

        file_candidate = static_dist / full_path
        if file_candidate.is_file():
            return FileResponse(file_candidate)

        return FileResponse(static_dist / "index.html")
else:
    # Development or API-only mode fallback
    @app.get("/", include_in_schema=False)
    async def root():
        return {
            "name": config.PROJECT_NAME,
            "version": config.VERSION,
            "status": "online",
            "message": "FaceLab AI Backend is running. Frontend static build will be served here once compiled.",
            "docs": "/docs",
            "health": "/health",
            "info": "/api/info",
        }
