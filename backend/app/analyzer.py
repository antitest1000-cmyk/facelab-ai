import asyncio
import gc
import io
import math
import time
from typing import Tuple, Optional, List
import numpy as np
from PIL import Image

import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision

from . import config
from .schemas import (
    LandmarkPoint,
    BoundingBox,
    GeometricMetrics,
    FaceLandmarkResult,
    AnalysisResponse,
)


class FaceAnalyzer:
    """Production-grade face analyzer using MediaPipe Tasks Vision on CPU."""

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or str(config.MODEL_PATH)
        self.detector: Optional[vision.FaceLandmarker] = None
        self._semaphore = asyncio.Semaphore(config.MAX_CONCURRENT_INFERENCES)
        self._load_model()

    def _load_model(self) -> None:
        """Initialize the reusable MediaPipe FaceLandmarker CPU instance."""
        if not config.MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Model file not found at {config.MODEL_PATH}. "
                "Ensure face_landmarker.task is downloaded in the models directory."
            )

        base_options = mp_python.BaseOptions(model_asset_path=str(config.MODEL_PATH))
        options = vision.FaceLandmarkerOptions(
            base_options=base_options,
            output_face_blendshapes=False,
            output_facial_transformation_matrixes=False,
            num_faces=1,
            min_face_detection_confidence=0.5,
            min_face_presence_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        self.detector = vision.FaceLandmarker.create_from_options(options)

    @staticmethod
    def validate_image_header(data: bytes) -> str:
        """
        Validate image magic bytes/signatures to prevent disguised files or exploits.
        Returns the detected format string.
        """
        if len(data) < 16:
            raise ValueError("File content is too small to be a valid image.")

        # JPEG signature: 0xFF, 0xD8, 0xFF
        if data.startswith(b"\xff\xd8\xff"):
            return "jpeg"

        # PNG signature: 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A
        if data.startswith(b"\x89PNG\r\n\x1a\n"):
            return "png"

        # WebP signature: 'RIFF' .... 'WEBP'
        if data.startswith(b"RIFF") and len(data) >= 12 and data[8:12] == b"WEBP":
            return "webp"

        raise ValueError(
            "Unsupported or invalid image format. Only standard JPEG, PNG, and WebP images are accepted."
        )

    def decode_and_validate_image(self, file_bytes: bytes) -> Tuple[np.ndarray, int, int]:
        """
        Safely decode image from memory buffer using Pillow and enforce dimension boundaries.
        Returns (rgb_image_array, original_width, original_height).
        """
        # Validate magic headers first
        self.validate_image_header(file_bytes)

        try:
            with Image.open(io.BytesIO(file_bytes)) as pil_img:
                width, height = pil_img.size

                if width <= 0 or height <= 0:
                    raise ValueError("Image has invalid zero or negative dimensions.")

                if width > config.MAX_IMAGE_DIMENSION or height > config.MAX_IMAGE_DIMENSION:
                    raise ValueError(
                        f"Image dimensions ({width}x{height}) exceed maximum allowed limit of {config.MAX_IMAGE_DIMENSION}px."
                    )

                # Convert to RGB (handles RGBA, Grayscale, CMYK safely)
                rgb_pil = pil_img.convert("RGB")
                img_rgb = np.array(rgb_pil, dtype=np.uint8)

        except Exception as e:
            if isinstance(e, ValueError):
                raise e
            raise ValueError("Corrupted or malformed image data could not be decoded.")

        return img_rgb, width, height

    def _calculate_metrics(
        self,
        landmarks: List[LandmarkPoint],
        img_width: int,
        img_height: int,
    ) -> Tuple[BoundingBox, GeometricMetrics]:
        """Compute bounding box and safe geometric metrics."""
        xs = [p.x for p in landmarks]
        ys = [p.y for p in landmarks]

        norm_x_min = max(0.0, min(xs))
        norm_y_min = max(0.0, min(ys))
        norm_x_max = min(1.0, max(xs))
        norm_y_max = min(1.0, max(ys))

        norm_w = max(0.0, norm_x_max - norm_x_min)
        norm_h = max(0.0, norm_y_max - norm_y_min)

        px_x_min = int(round(norm_x_min * img_width))
        px_y_min = int(round(norm_y_min * img_height))
        px_x_max = int(round(norm_x_max * img_width))
        px_y_max = int(round(norm_y_max * img_height))

        px_w = max(1, px_x_max - px_x_min)
        px_h = max(1, px_y_max - px_y_min)

        bbox = BoundingBox(
            x_min=round(norm_x_min, 6),
            y_min=round(norm_y_min, 6),
            x_max=round(norm_x_max, 6),
            y_max=round(norm_y_max, 6),
            width=round(norm_w, 6),
            height=round(norm_h, 6),
            pixel_x_min=px_x_min,
            pixel_y_min=px_y_min,
            pixel_x_max=px_x_max,
            pixel_y_max=px_y_max,
            pixel_width=px_w,
            pixel_height=px_h,
        )

        # Aspect ratio
        aspect_ratio = round(norm_h / max(norm_w, 1e-4), 4)

        # Area coverage percentage
        area_coverage = round((norm_w * norm_h) * 100.0, 2)

        # Interocular distance ratio (left iris 468, right iris 473 if available)
        interocular_ratio = 0.0
        if len(landmarks) >= 478:
            left_iris = landmarks[468]
            right_iris = landmarks[473]
            dx = (right_iris.x - left_iris.x) * img_width
            dy = (right_iris.y - left_iris.y) * img_height
            distance_px = math.sqrt(dx * dx + dy * dy)
            interocular_ratio = round(distance_px / max(px_w, 1), 4)

        metrics = GeometricMetrics(
            face_aspect_ratio=aspect_ratio,
            interocular_distance_ratio=interocular_ratio,
            face_area_coverage_pct=area_coverage,
        )

        return bbox, metrics

    def _run_inference_sync(self, rgb_image: np.ndarray, orig_w: int, orig_h: int) -> AnalysisResponse:
        """Run synchronous CPU inference with memory management."""
        start_time = time.perf_counter()

        # If image is larger than safety threshold, downscale for inference
        curr_h, curr_w = rgb_image.shape[:2]
        if max(curr_w, curr_h) > config.INFERENCE_MAX_DIMENSION:
            scale = config.INFERENCE_MAX_DIMENSION / max(curr_w, curr_h)
            target_w = int(round(curr_w * scale))
            target_h = int(round(curr_h * scale))
            pil_img = Image.fromarray(rgb_image)
            resized_pil = pil_img.resize((target_w, target_h), Image.Resampling.BILINEAR)
            inference_img = np.array(resized_pil, dtype=np.uint8)
        else:
            inference_img = rgb_image

        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=inference_img)

        # Perform detection
        detection_result = self.detector.detect(mp_image)

        elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        # Clean up images from memory
        del mp_image
        if inference_img is not rgb_image:
            del inference_img
        del rgb_image

        if not detection_result.face_landmarks:
            return AnalysisResponse(
                status="no_face_detected",
                face_detected=False,
                faces_detected_count=0,
                image_width=orig_w,
                image_height=orig_h,
                processing_time_ms=elapsed_ms,
                model_identifier=config.MODEL_IDENTIFIER,
                face=None,
                message="No face detected in the provided image.",
            )

        # Process the single face (MVP limits to 1 face)
        raw_landmarks = detection_result.face_landmarks[0]
        landmark_points: List[LandmarkPoint] = [
            LandmarkPoint(
                index=i,
                x=round(pt.x, 6),
                y=round(pt.y, 6),
                z=round(pt.z, 6),
            )
            for i, pt in enumerate(raw_landmarks)
        ]

        bbox, metrics = self._calculate_metrics(landmark_points, orig_w, orig_h)

        face_result = FaceLandmarkResult(
            face_index=0,
            landmark_count=len(landmark_points),
            landmarks=landmark_points,
            bounding_box=bbox,
            geometry_metrics=metrics,
        )

        return AnalysisResponse(
            status="success",
            face_detected=True,
            faces_detected_count=1,
            image_width=orig_w,
            image_height=orig_h,
            processing_time_ms=elapsed_ms,
            model_identifier=config.MODEL_IDENTIFIER,
            face=face_result,
            message="Face landmarks successfully detected.",
        )

    async def analyze_image(self, file_bytes: bytes) -> AnalysisResponse:
        """
        Analyze an image with concurrency control and non-blocking CPU offloading.
        Raises TimeoutError or 429-appropriate exceptions if server is busy.
        """
        # Acquire semaphore with timeout to enforce resource limits on 1.5 vCPU
        try:
            acquired = await asyncio.wait_for(
                self._semaphore.acquire(),
                timeout=config.CONCURRENCY_WAIT_TIMEOUT,
            )
        except asyncio.TimeoutError:
            raise TimeoutError(
                "Service is currently handling another inference request. Please retry in a moment."
            )

        try:
            # Decode and validate image in worker thread
            rgb_img, orig_w, orig_h = await asyncio.to_thread(
                self.decode_and_validate_image,
                file_bytes,
            )

            # Run inference in worker thread with timeout
            response = await asyncio.wait_for(
                asyncio.to_thread(self._run_inference_sync, rgb_img, orig_w, orig_h),
                timeout=config.INFERENCE_TIMEOUT_SECONDS,
            )
            return response
        finally:
            self._semaphore.release()
            # Force garbage collection periodically if needed to keep 2GB RAM clean
            gc.collect()


# Singleton instance placeholder
_analyzer_instance: Optional[FaceAnalyzer] = None


def get_analyzer() -> FaceAnalyzer:
    """Retrieve or initialize the global FaceAnalyzer singleton."""
    global _analyzer_instance
    if _analyzer_instance is None:
        _analyzer_instance = FaceAnalyzer()
    return _analyzer_instance
