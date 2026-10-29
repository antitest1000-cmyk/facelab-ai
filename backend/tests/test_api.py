import io
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app import config

client = TestClient(app)

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def test_homepage_endpoint():
    """Verify homepage endpoint returns the HTML application."""
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")
    assert "FaceLab" in response.text


def test_health_endpoint():
    """Verify health endpoint returns healthy status and model is loaded."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True
    assert "memory_mb" in data
    assert data["memory_mb"] >= 0
    assert "uptime_seconds" in data
    assert data["version"] == config.VERSION


def test_api_info_endpoint():
    """Verify info endpoint returns system constraints and limits."""
    response = client.get("/api/info")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == config.PROJECT_NAME
    assert data["limits"]["max_faces"] == 1
    assert data["limits"]["max_upload_size_mb"] == 5.0
    assert data["limits"]["concurrency_limit"] == 1
    assert ".jpg" in data["limits"]["allowed_formats"]
    assert data["landmarks_schema_info"]["total_landmarks"] == 478


def test_sample_image_endpoint():
    """Verify the sample image endpoint returns a valid JPEG."""
    response = client.get("/api/sample")
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/jpeg"
    assert len(response.content) > 1000


def test_analyze_with_valid_face():
    """Verify detection on a real face portrait fixture."""
    fixture_path = FIXTURES_DIR / "sample_face.jpg"
    assert fixture_path.exists(), "Sample face fixture must exist"

    with open(fixture_path, "rb") as f:
        file_bytes = f.read()

    response = client.post(
        "/api/analyze",
        files={"file": ("portrait.jpg", file_bytes, "image/jpeg")},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["face_detected"] is True
    assert data["faces_detected_count"] == 1
    assert data["image_width"] > 0
    assert data["image_height"] > 0
    assert data["processing_time_ms"] > 0
    assert data["face"] is not None
    assert data["face"]["landmark_count"] == 478
    assert len(data["face"]["landmarks"]) == 478

    # Verify first landmark structure
    pt0 = data["face"]["landmarks"][0]
    assert "x" in pt0 and 0.0 <= pt0["x"] <= 1.0
    assert "y" in pt0 and 0.0 <= pt0["y"] <= 1.0
    assert "z" in pt0
    assert pt0["index"] == 0

    # Verify bounding box
    bbox = data["face"]["bounding_box"]
    assert 0.0 <= bbox["x_min"] < bbox["x_max"] <= 1.0
    assert 0.0 <= bbox["y_min"] < bbox["y_max"] <= 1.0
    assert bbox["pixel_width"] > 0
    assert bbox["pixel_height"] > 0

    # Verify geometric metrics
    metrics = data["face"]["geometry_metrics"]
    assert metrics["face_aspect_ratio"] > 0
    assert metrics["face_area_coverage_pct"] > 0


def test_analyze_with_no_face():
    """Verify detection on an image containing no face."""
    fixture_path = FIXTURES_DIR / "no_face.jpg"
    assert fixture_path.exists(), "No-face fixture must exist"

    with open(fixture_path, "rb") as f:
        file_bytes = f.read()

    response = client.post(
        "/api/analyze",
        files={"file": ("no_face.jpg", file_bytes, "image/jpeg")},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "no_face_detected"
    assert data["face_detected"] is False
    assert data["faces_detected_count"] == 0
    assert data["face"] is None
    assert "No face detected" in data["message"]


def test_reject_unsupported_file_extension():
    """Verify rejection of files with invalid extensions."""
    response = client.post(
        "/api/analyze",
        files={"file": ("document.pdf", b"%PDF-1.4...", "application/pdf")},
    )
    assert response.status_code == 400
    assert "Unsupported file extension" in response.json()["detail"]


def test_reject_fake_image_magic_bytes():
    """Verify rejection of non-image data masquerading as a JPEG."""
    fake_data = b"This is a text file renamed to portrait.jpg with fake data"
    response = client.post(
        "/api/analyze",
        files={"file": ("fake.jpg", fake_data, "image/jpeg")},
    )
    assert response.status_code == 400
    assert "Unsupported or invalid image format" in response.json()["detail"]


def test_reject_empty_file():
    """Verify rejection of 0-byte file."""
    response = client.post(
        "/api/analyze",
        files={"file": ("empty.png", b"", "image/png")},
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_reject_oversized_file():
    """Verify rejection of files exceeding 5MB limit."""
    oversized_data = b"\xff\xd8\xff\xe0" + b"\x00" * (5 * 1024 * 1024 + 1024)
    response = client.post(
        "/api/analyze",
        files={"file": ("huge.jpg", oversized_data, "image/jpeg")},
    )
    assert response.status_code == 413
    assert "exceeds maximum size limit" in response.json()["detail"]


def test_reject_excessive_dimensions():
    """Verify rejection of images exceeding MAX_IMAGE_DIMENSION (4096)."""
    img = Image.new("RGB", (4200, 100), color=(100, 100, 100))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    file_bytes = buf.getvalue()

    response = client.post(
        "/api/analyze",
        files={"file": ("wide.jpg", file_bytes, "image/jpeg")},
    )
    assert response.status_code == 400
    assert "exceed maximum allowed limit" in response.json()["detail"]
