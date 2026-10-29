import React from 'react';
import {
  Download,
  Clock,
  Scan,
  Maximize,
  Ratio,
  CheckCircle2,
  XCircle,
  Cpu,
  FileJson,
  Layers,
} from 'lucide-react';
import { AnalysisResponse } from '../types/api';

interface MetricsPanelProps {
  analysis: AnalysisResponse;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ analysis }) => {
  const {
    face_detected,
    faces_detected_count,
    processing_time_ms,
    image_width,
    image_height,
    model_identifier,
    face,
  } = analysis;

  const handleDownloadJson = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(analysis, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute(
      'download',
      `facelab_analysis_${Date.now()}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="p-4 rounded-2xl bg-dark-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {face_detected ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {faces_detected_count} Face Detected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-semibold">
                <XCircle className="w-3.5 h-3.5" />
                No Face Detected
              </span>
            )}

            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-dark-800 text-slate-300 text-xs font-mono border border-slate-700/60">
              <Clock className="w-3 h-3 text-brand-cyan" />
              {processing_time_ms.toFixed(1)} ms
            </span>
          </div>

          <button
            onClick={handleDownloadJson}
            className="px-3 py-1.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-200 text-xs font-medium border border-slate-700 hover:border-slate-600 transition-all flex items-center gap-1.5 shadow-xs"
            title="Download full analysis as JSON"
          >
            <Download className="w-3.5 h-3.5 text-brand-cyan" />
            <span className="hidden sm:inline">Export JSON</span>
          </button>
        </div>

        {/* Primary metric cards grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Card 1: Landmarks */}
          <div className="p-3 rounded-xl bg-dark-850/80 border border-slate-800/80">
            <div className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
              <Layers className="w-3.5 h-3.5 text-brand-violet" />
              Landmarks
            </div>
            <div className="text-base font-semibold text-white font-mono">
              {face ? face.landmark_count : 0}
              <span className="text-xs text-slate-500 font-normal ml-1">pts</span>
            </div>
          </div>

          {/* Card 2: Dimensions */}
          <div className="p-3 rounded-xl bg-dark-850/80 border border-slate-800/80">
            <div className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
              <Maximize className="w-3.5 h-3.5 text-brand-teal" />
              Dimensions
            </div>
            <div className="text-sm font-semibold text-white font-mono">
              {image_width} <span className="text-slate-500 font-normal">×</span> {image_height}
            </div>
          </div>

          {/* Card 3: Face Coverage */}
          <div className="p-3 rounded-xl bg-dark-850/80 border border-slate-800/80">
            <div className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
              <Scan className="w-3.5 h-3.5 text-brand-cyan" />
              Area Coverage
            </div>
            <div className="text-base font-semibold text-white font-mono">
              {face ? `${face.geometry_metrics.face_area_coverage_pct}%` : '0%'}
            </div>
          </div>

          {/* Card 4: Aspect Ratio */}
          <div className="p-3 rounded-xl bg-dark-850/80 border border-slate-800/80">
            <div className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
              <Ratio className="w-3.5 h-3.5 text-amber-400" />
              Aspect Ratio
            </div>
            <div className="text-base font-semibold text-white font-mono">
              {face ? face.geometry_metrics.face_aspect_ratio.toFixed(2) : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Spatial Geometry Details (when face detected) */}
      {face && (
        <div className="p-4 rounded-2xl bg-dark-900 border border-slate-800 space-y-3">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Scan className="w-3.5 h-3.5 text-brand-cyan" />
            Spatial Bounding Box & Coordinates
          </h4>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-dark-850 border border-slate-800 space-y-1">
              <div className="text-slate-400 text-[11px]">Normalized Bounding Box</div>
              <div className="text-slate-200">
                X: [{face.bounding_box.x_min}, {face.bounding_box.x_max}]
              </div>
              <div className="text-slate-200">
                Y: [{face.bounding_box.y_min}, {face.bounding_box.y_max}]
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-dark-850 border border-slate-800 space-y-1">
              <div className="text-slate-400 text-[11px]">Pixel Bounding Box</div>
              <div className="text-slate-200">
                W: {face.bounding_box.pixel_width} px &bull; H: {face.bounding_box.pixel_height} px
              </div>
              <div className="text-slate-200">
                Top-Left: ({face.bounding_box.pixel_x_min}, {face.bounding_box.pixel_y_min})
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <Cpu className="w-3 h-3 text-slate-500" />
              Detector: {model_identifier}
            </span>
            <span className="text-emerald-400 font-mono text-[11px]">
              Pupil Ratio: {face.geometry_metrics.interocular_distance_ratio.toFixed(3)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
