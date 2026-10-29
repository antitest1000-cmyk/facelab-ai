# FaceLab AI — Production Face Landmark Analyzer

FaceLab AI is a high-precision, production-grade Face Landmark Analysis web application built for resource-constrained Linux hosting environments (**2 GB RAM**, **1.5 vCPU**, **2 GB Storage**, **no GPU**). 

The application detects human faces and visualizes **478 3D spatial facial landmarks** with sub-pixel normalized coordinates and bounding boxes in real-time, executing entirely on CPU with zero external GPU dependencies.

---

## 1. System Specifications & Resource Budget

| Parameter | Allocated Budget | FaceLab AI Profile | Design Rationale |
| :--- | :--- | :--- | :--- |
| **RAM** | 2.0 GB | ~85 – 120 MB | In-memory stream processing; no disk caching; immediate garbage collection |
| **CPU** | 1.5 vCPU | Single worker + XNNPACK | 1 Uvicorn worker + Semaphore(1) prevents multi-thread CPU thrashing |
| **Storage** | 2.0 GB | ~150 MB total package | Single 3.75 MB Float16 model bundle; headless dependencies |
| **GPU** | None (CPU only) | TFLite XNNPACK SIMD | Headless OpenCV + MediaPipe Tasks Vision CPU delegate |
| **Port** | Configurable | `${PORT:-8000}` | Dynamically binds to any hosting provider port |

---

## 2. Technology Stack

### Backend
- **Python 3.11+**
- **FastAPI**: Asynchronous REST API framework
- **Uvicorn**: Single-worker ASGI server for deterministic resource isolation
- **MediaPipe Tasks Vision**: Real-time 478-point 3D face mesh landmarker (Float16)
- **OpenCV Headless (`opencv-python-headless`)**: High-speed, memory-safe in-memory image decoding
- **NumPy**: Vectorized landmark math and bounding box calculation
- **Pydantic V2**: Strict schema validation and serialization
- **psutil**: Process memory tracking in `/health`

### Frontend
- **React 19** with **TypeScript**
- **Vite 6**: Ultra-fast bundling (built to static files and served directly via FastAPI)
- **Tailwind CSS**: Dark-themed, glassmorphic UI design system
- **Lucide Icons**: Consistent, lightweight vector icon set
- **High-DPI HTML5 Canvas**: Real-time multi-layer rendering (mesh, contours, irises, bounding box, hover tooltips)

---

## 3. Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── analyzer.py       # MediaPipe inference engine & concurrency limiter
│   │   ├── config.py         # System limits, thresholds, and environment config
│   │   ├── main.py           # FastAPI routes, health checks, & static file serving
│   │   ├── schemas.py        # Pydantic models for request & response validation
│   │   ├── models/
│   │   │   └── face_landmarker.task   # Bundled 3.75 MB float16 model
│   │   └── static/           # Compiled frontend static files (production)
│   ├── tests/
│   │   ├── fixtures/         # Sample portrait & no-face test images
│   │   └── test_api.py       # Comprehensive pytest suite (11 test cases)
│   └── requirements.txt      # Pinned minimal Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/       # Canvas, Dropzone, MetricsPanel, Table, Navbar, Sidebar
│   │   ├── pages/            # Dashboard, Analyzer, ApiDocs, Settings
│   │   ├── lib/              # Face mesh connections & anatomical indices
│   │   ├── types/            # TypeScript API contract definitions
│   │   ├── App.tsx           # Main application shell with health polling
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── Dockerfile                # Production multi-stage Dockerfile
├── .dockerignore
├── .gitignore
└── README.md
```

---

## 4. Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### Quick Start (Full-Stack Monorepo)

#### 1. Backend Setup
```bash
# Navigate to repository root
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# Linux / macOS:
source .venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt

# Run backend API server
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Swagger documentation is available at `http://localhost:8000/docs`.

#### 2. Frontend Development Setup (with hot reload)
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`. Vite automatically proxies `/api` and `/health` requests to `http://localhost:8000`.

#### 3. Building for Single-Service Production
To test the single-service bundle locally:
```bash
cd frontend
npm run build
```
Once built, starting Uvicorn directly serves both the API and the React SPA on `http://localhost:8000/`:
```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

---

## 5. Automated Testing

Run the automated backend test suite covering endpoints, image validation, file size limits, concurrency, and detection:

```bash
# Set PYTHONPATH to backend and run pytest
# Windows (PowerShell):
$env:PYTHONPATH="backend"; pytest backend/tests/test_api.py -v

# Linux / macOS:
PYTHONPATH=backend pytest backend/tests/test_api.py -v
```

The test suite validates:
- [x] Application homepage (`GET /`)
- [x] Health monitoring endpoint (`GET /health`)
- [x] API information and limits (`GET /api/info`)
- [x] Sample portrait retrieval (`GET /api/sample`)
- [x] Valid face portrait landmark inference (478 points, bounding box, geometry metrics)
- [x] Non-face image rejection (`face_detected: false`)
- [x] Invalid file extension rejection (HTTP 400)
- [x] Fake image / corrupted magic bytes rejection (HTTP 400)
- [x] Empty 0-byte file rejection (HTTP 400)
- [x] Oversized payload rejection (> 5 MB, HTTP 413)
- [x] Excessive image dimension rejection (> 4096px, HTTP 400)

---

## 6. Production Deployment

### Option A: Docker Deployment (Recommended)

FaceLab AI provides an optimized multi-stage `Dockerfile`:
1. **Stage 1 (Node 20 Alpine)** compiles the React SPA into static assets.
2. **Stage 2 (Python 3.11 Slim)** installs minimal system libraries, sets up a non-root `appuser`, and runs Uvicorn.

```bash
# Build the container image
docker build -t facelab-ai:latest .

# Run container (supports arbitrary PORT)
docker run -d \
  --name facelab \
  -e PORT=8000 \
  -p 8000:8000 \
  --memory=2g \
  --cpus=1.5 \
  facelab-ai:latest
```

Access the application at `http://localhost:8000`.

---

### Option B: Direct Linux Host Deployment (No Docker)

For providers like **Render**, **Railway**, **Fly.io**, **Hetzner**, or a generic **Ubuntu / Debian VPS**:

#### 1. System Dependencies
Ensure minimal shared libraries required by OpenCV and MediaPipe are installed:
```bash
sudo apt-get update && sudo apt-get install -y --no-install-recommends \
  python3-pip \
  python3-venv \
  nodejs \
  npm \
  libglib2.0-0 \
  libgomp1
```

#### 2. Build Frontend
```bash
cd frontend
npm ci
npm run build
cd ..
```

#### 3. Install Python Dependencies
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --no-cache-dir -r backend/requirements.txt
```

#### 4. Startup Command
```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1
```

---

## 7. Environment Variables Reference

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `8000` | Port for the Uvicorn web server |
| `HOST` | `0.0.0.0` | Network binding interface |
| `ALLOWED_ORIGINS` | `*` | Comma-separated list of allowed CORS origins |
| `MAX_CONCURRENT_INFERENCES` | `1` | Asyncio semaphore limit (keep at 1 for 1.5 vCPU host) |
| `INFERENCE_TIMEOUT_SECONDS` | `10.0` | Maximum time allowed for single inference run |
| `CONCURRENCY_WAIT_TIMEOUT` | `2.0` | Seconds to wait before returning HTTP 429 when busy |

---

## 8. Troubleshooting Guide

### 1. Port Configuration & Bind Errors
- **Symptom:** `error: [Errno 98] Address already in use` or port mismatches on deployment platforms.
- **Fix:** Cloud hosts inject the `PORT` environment variable dynamically. The application startup script uses `uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1`. Ensure you do not hardcode port 8000 in your hosting provider's run command.

### 2. Memory Exhaustion (OOM Kills on 2 GB RAM)
- **Symptom:** Process killed with `Exit code 137` or sudden restart.
- **Cause:** Running multiple Uvicorn workers on a 2GB RAM / 1.5 vCPU machine, or allowing unconstrained concurrent inferences.
- **Fix:** Keep workers at 1 (`--workers 1`). FaceLab AI uses an `asyncio.Semaphore(1)` to process inference requests sequentially, shedding excessive concurrent requests with **HTTP 429**. High-resolution images are downscaled to 1920px during inference to protect memory.

### 3. Missing Linux System Libraries
- **Symptom:** `ImportError: libGL.so.1: cannot open shared object file` or `libgomp.so.1: cannot open shared object file`.
- **Cause:** OpenCV or TensorFlow Lite requiring standard C runtime vector extensions.
- **Fix:** Install `libglib2.0-0` and `libgomp1` (`apt-get install -y libglib2.0-0 libgomp1`). Note that `opencv-python-headless` is used to avoid heavy X11/GUI libraries.

### 4. MediaPipe API Incompatibility
- **Symptom:** `AttributeError: module 'mediapipe' has no attribute 'solutions'`.
- **Cause:** MediaPipe 1.x migrated from legacy `mp.solutions` to the `mp.tasks.python.vision.FaceLandmarker` API.
- **Fix:** FaceLab AI is natively implemented on `mediapipe.tasks.python.vision` with the bundled `face_landmarker.task` model file, avoiding legacy deprecations.
