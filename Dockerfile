# ==========================================
# Stage 1: Build Frontend Assets
# ==========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /build/frontend

# Copy package definitions and install dependencies
COPY frontend/package.json ./
RUN npm install

# Copy frontend source and build static bundle
COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Production Python Runtime
# Target: 2GB RAM / 1.5 vCPU Linux Environment
# ==========================================
FROM python:3.11-slim AS runtime

# Prevents Python from writing .pyc files & enables unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    PYTHONPATH=/app/backend

WORKDIR /app

# Install minimal OS runtime libraries required by OpenCV and MediaPipe (glib, gomp)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend application source code and bundled model
COPY backend/ ./backend/

# Copy built frontend assets into static distribution directories
COPY --from=frontend-builder /build/frontend/dist /app/backend/app/static
COPY --from=frontend-builder /build/frontend/dist /app/frontend/dist

# Create a non-privileged user for container security
RUN groupadd -r appuser && useradd -r -g appuser -d /app appuser && \
    chown -R appuser:appuser /app

USER appuser

# Document default port
EXPOSE 8000

# Container healthcheck using lightweight Python one-liner
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request, os; port = os.environ.get('PORT', '8000'); urllib.request.urlopen(f'http://127.0.0.1:{port}/health')" || exit 1

# Launch Uvicorn with exactly 1 worker for the 1.5 vCPU constraint
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]
