import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Eye,
  Layers,
  Square,
  Tag,
  Crosshair,
} from 'lucide-react';
import { LandmarkPoint, BoundingBox } from '../types/api';
import {
  FACIAL_CONTOURS_CONNECTIONS,
  KEY_LANDMARK_NAMES,
  getLandmarkRegion,
} from '../lib/faceMeshConnections';

interface LandmarkCanvasProps {
  imageUrl: string;
  landmarks: LandmarkPoint[] | null;
  boundingBox: BoundingBox | null;
  selectedLandmarkIndex: number | null;
  onSelectLandmark: (index: number | null) => void;
}

export const LandmarkCanvas: React.FC<LandmarkCanvasProps> = ({
  imageUrl,
  landmarks,
  boundingBox,
  selectedLandmarkIndex,
  onSelectLandmark,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Visualization layer toggles
  const [showContours, setShowContours] = useState(true);
  const [showDots, setShowDots] = useState(true);
  const [showIrises, setShowIrises] = useState(true);
  const [showBoundingBox, setShowBoundingBox] = useState(true);
  const [showKeyLabels, setShowKeyLabels] = useState(false);

  // Zoom & Pan state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredPoint, setHoveredPoint] = useState<LandmarkPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);

  // Load image element
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      setImageElement(img);
    };
  }, [imageUrl]);

  // Main Canvas Render
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageElement) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = containerRef.current;
    const maxW = container ? container.clientWidth : 700;
    const maxH = 550;

    // Maintain aspect ratio within container
    const imgAspect = imageElement.width / imageElement.height;
    let canvasW = maxW;
    let canvasH = maxW / imgAspect;

    if (canvasH > maxH) {
      canvasH = maxH;
      canvasW = maxH * imgAspect;
    }

    // Set high-DPI canvas
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    canvas.style.width = `${canvasW}px`;
    canvas.style.height = `${canvasH}px`;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Apply zoom around center
    if (zoomLevel !== 1) {
      ctx.translate(canvasW / 2, canvasH / 2);
      ctx.scale(zoomLevel, zoomLevel);
      ctx.translate(-canvasW / 2, -canvasH / 2);
    }

    // Draw base image
    ctx.clearRect(0, 0, canvasW, canvasH);
    ctx.drawImage(imageElement, 0, 0, canvasW, canvasH);

    // If no landmarks, return
    if (!landmarks || landmarks.length === 0) {
      ctx.restore();
      return;
    }

    // Helper to convert normalized landmark to canvas pixel coordinates
    const toPx = (pt: { x: number; y: number }) => ({
      x: pt.x * canvasW,
      y: pt.y * canvasH,
    });

    // 1. Draw Bounding Box
    if (showBoundingBox && boundingBox) {
      const bx = boundingBox.x_min * canvasW;
      const by = boundingBox.y_min * canvasH;
      const bw = boundingBox.width * canvasW;
      const bh = boundingBox.height * canvasH;

      ctx.save();
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(bx, by, bw, bh);

      // Corner markers
      ctx.setLineDash([]);
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 2.5;
      const cLen = 12;

      // Top-left
      ctx.beginPath();
      ctx.moveTo(bx, by + cLen);
      ctx.lineTo(bx, by);
      ctx.lineTo(bx + cLen, by);
      ctx.stroke();

      // Top-right
      ctx.beginPath();
      ctx.moveTo(bx + bw - cLen, by);
      ctx.lineTo(bx + bw, by);
      ctx.lineTo(bx + bw, by + cLen);
      ctx.stroke();

      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(bx, by + bh - cLen);
      ctx.lineTo(bx, by + bh);
      ctx.lineTo(bx + cLen, by + bh);
      ctx.stroke();

      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(bx + bw - cLen, by + bh);
      ctx.lineTo(bx + bw, by + bh);
      ctx.lineTo(bx + bw, by + bh - cLen);
      ctx.stroke();

      // Box Tag
      ctx.fillStyle = 'rgba(15, 17, 26, 0.85)';
      ctx.fillRect(bx, by - 18, 90, 16);
      ctx.fillStyle = '#00f2fe';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(`FACE ${Math.round(bw)}x${Math.round(bh)}`, bx + 4, by - 6);

      ctx.restore();
    }

    // 2. Draw Facial Contours
    if (showContours) {
      ctx.save();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.75)'; // Emerald
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      FACIAL_CONTOURS_CONNECTIONS.forEach(([startIdx, endIdx]) => {
        const startPt = landmarks[startIdx];
        const endPt = landmarks[endIdx];
        if (startPt && endPt) {
          const p1 = toPx(startPt);
          const p2 = toPx(endPt);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      });
      ctx.restore();
    }

    // 3. Draw Iris markers specifically
    if (showIrises && landmarks.length >= 478) {
      ctx.save();
      [468, 473].forEach((irisIdx) => {
        const iris = landmarks[irisIdx];
        if (iris) {
          const pt = toPx(iris);
          // Outer ring
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
          ctx.strokeStyle = '#00f2fe';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Center pupil dot
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }
      });
      ctx.restore();
    }

    // 4. Draw Landmark Dots
    if (showDots) {
      ctx.save();
      landmarks.forEach((lm) => {
        const pt = toPx(lm);
        const isHovered = hoveredPoint?.index === lm.index;
        const isSelected = selectedLandmarkIndex === lm.index;

        if (isSelected) {
          // Highlighted selection
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
          ctx.fill();
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        } else if (isHovered) {
          // Hover state
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 242, 254, 0.4)';
          ctx.fill();
          ctx.strokeStyle = '#00f2fe';
          ctx.lineWidth = 1.8;
          ctx.stroke();
        } else {
          // Default small dot
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(139, 92, 246, 0.7)'; // Violet
          ctx.fill();
        }
      });
      ctx.restore();
    }

    // 5. Draw Key Semantic Labels
    if (showKeyLabels) {
      ctx.save();
      ctx.font = '9px "Inter", sans-serif';
      Object.entries(KEY_LANDMARK_NAMES).forEach(([idxStr, label]) => {
        const idx = parseInt(idxStr, 10);
        const lm = landmarks[idx];
        if (lm) {
          const pt = toPx(lm);
          ctx.fillStyle = 'rgba(15, 17, 26, 0.85)';
          const textMetrics = ctx.measureText(label);
          ctx.fillRect(pt.x + 4, pt.y - 10, textMetrics.width + 6, 13);
          ctx.fillStyle = '#e2e8f0';
          ctx.fillText(label, pt.x + 7, pt.y);
        }
      });
      ctx.restore();
    }

    ctx.restore();
  }, [
    imageElement,
    landmarks,
    boundingBox,
    showContours,
    showDots,
    showIrises,
    showBoundingBox,
    showKeyLabels,
    zoomLevel,
    hoveredPoint,
    selectedLandmarkIndex,
  ]);

  // Re-render canvas on dependencies change
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Resize listener
  useEffect(() => {
    const handleResize = () => renderCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderCanvas]);

  // Interactive Mouse Move for Hover Detection
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !landmarks || landmarks.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const canvasW = canvas.clientWidth;
    const canvasH = canvas.clientHeight;

    // Find closest landmark within radius threshold
    let closest: LandmarkPoint | null = null;
    let minDistance = 16; // 16px radius threshold

    landmarks.forEach((lm) => {
      const pxX = lm.x * canvasW;
      const pxY = lm.y * canvasH;
      const dist = Math.hypot(pxX - mouseX, pxY - mouseY);
      if (dist < minDistance) {
        minDistance = dist;
        closest = lm;
      }
    });

    if (closest) {
      setHoveredPoint(closest);
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    } else {
      setHoveredPoint(null);
      setTooltipPos(null);
    }
  };

  const handleClick = () => {
    if (hoveredPoint) {
      onSelectLandmark(hoveredPoint.index);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setTooltipPos(null);
  };

  return (
    <div className="space-y-3" ref={containerRef}>
      {/* Canvas Viewport Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-dark-900 border border-slate-800 text-xs">
        {/* Layer toggles */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-400 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-brand-cyan" /> Layers:
          </span>

          <button
            type="button"
            onClick={() => setShowContours((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              showContours
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 shadow-xs'
                : 'bg-dark-800 text-slate-400 border border-transparent hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Contours
          </button>

          <button
            type="button"
            onClick={() => setShowDots((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              showDots
                ? 'bg-violet-950/60 text-violet-300 border border-violet-500/40'
                : 'bg-dark-800 text-slate-400 border border-transparent hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-violet-400" />
            478 Dots
          </button>

          <button
            type="button"
            onClick={() => setShowIrises((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              showIrises
                ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40'
                : 'bg-dark-800 text-slate-400 border border-transparent hover:text-slate-200'
            }`}
          >
            <Eye className="w-3 h-3 text-cyan-400" />
            Irises
          </button>

          <button
            type="button"
            onClick={() => setShowBoundingBox((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              showBoundingBox
                ? 'bg-teal-950/60 text-teal-300 border border-teal-500/40'
                : 'bg-dark-800 text-slate-400 border border-transparent hover:text-slate-200'
            }`}
          >
            <Square className="w-3 h-3 text-teal-400" />
            Box
          </button>

          <button
            type="button"
            onClick={() => setShowKeyLabels((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              showKeyLabels
                ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                : 'bg-dark-800 text-slate-400 border border-transparent hover:text-slate-200'
            }`}
          >
            <Tag className="w-3 h-3 text-amber-400" />
            Labels
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 3))}
            className="p-1.5 text-slate-400 hover:text-white rounded bg-dark-800 hover:bg-dark-750"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] px-1 text-slate-400 min-w-[36px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.5))}
            className="p-1.5 text-slate-400 hover:text-white rounded bg-dark-800 hover:bg-dark-750"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="p-1.5 text-slate-400 hover:text-white rounded bg-dark-800 hover:bg-dark-750"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas Viewport Frame */}
      <div className="relative rounded-2xl overflow-hidden bg-dark-950 border border-slate-800 flex items-center justify-center min-h-[420px] shadow-2xl">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          className="cursor-crosshair max-w-full block"
        />

        {/* Interactive Hover Tooltip */}
        {hoveredPoint && tooltipPos && (
          <div
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 px-3 py-2 rounded-xl bg-dark-900/95 border border-brand-cyan/50 text-white shadow-xl shadow-black/80 backdrop-blur-md text-[11px] font-mono space-y-0.5"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            <div className="text-brand-cyan font-semibold flex items-center gap-1.5 font-sans">
              <Crosshair className="w-3.5 h-3.5" />
              Landmark #{hoveredPoint.index}
              <span className="text-[10px] text-slate-400 font-normal">
                ({KEY_LANDMARK_NAMES[hoveredPoint.index] || getLandmarkRegion(hoveredPoint.index)})
              </span>
            </div>
            <div className="text-slate-300">
              x: <span className="text-emerald-400">{hoveredPoint.x.toFixed(4)}</span> &bull; y:{' '}
              <span className="text-emerald-400">{hoveredPoint.y.toFixed(4)}</span> &bull; z:{' '}
              <span className="text-violet-400">{hoveredPoint.z.toFixed(4)}</span>
            </div>
            <div className="text-[10px] text-slate-400">Click point to focus in table</div>
          </div>
        )}

        {/* Empty state hint if image loaded but no analysis run yet */}
        {(!landmarks || landmarks.length === 0) && (
          <div className="absolute inset-0 bg-dark-950/40 backdrop-blur-xs flex items-center justify-center p-6 text-center">
            <div className="max-w-xs p-4 rounded-xl bg-dark-900/80 border border-slate-800 text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-slate-200">Image Loaded</p>
              <p className="text-slate-400">
                Click <span className="text-brand-cyan font-medium">Analyze Face</span> to execute
                CPU inference and visualize 478 landmark coordinates.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
