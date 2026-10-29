import React from 'react';
import {
  Cpu,
  Server,
  Shield,
  Layers,
  Sliders,
  AlertTriangle,
  Zap,
  HardDrive,
  Network,
  Clock,
} from 'lucide-react';
import { HealthResponse } from '../types/api';

interface SettingsPageProps {
  health: HealthResponse | null;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ health }) => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Title */}
      <div className="pb-4 border-b border-slate-800">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Cpu className="w-6 h-6 text-brand-cyan" />
          Model Architecture & Host Specifications
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Detailed operational design, memory constraints, and safety policies.
        </p>
      </div>

      {/* Target Server Specifications Matrix */}
      <div className="p-6 rounded-2xl bg-dark-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Server className="w-4 h-4 text-brand-cyan" />
            Host Resource Budget (Target: Small Linux VPS / Container)
          </h3>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Within Budget
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-dark-850 border border-slate-800 space-y-1">
            <div className="text-slate-400 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-brand-teal" />
              Memory Limit
            </div>
            <div className="text-lg font-bold text-white font-mono">2.0 GB</div>
            <div className="text-[11px] text-emerald-400 font-mono">
              Current: {health?.memory_mb ? `${health.memory_mb} MB` : '~85 MB'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-dark-850 border border-slate-800 space-y-1">
            <div className="text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              CPU Allocation
            </div>
            <div className="text-lg font-bold text-white font-mono">1.5 vCPU</div>
            <div className="text-[11px] text-slate-400">
              1 Uvicorn Worker + Semaphore
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-dark-850 border border-slate-800 space-y-1">
            <div className="text-slate-400 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-brand-violet" />
              Storage Limit
            </div>
            <div className="text-lg font-bold text-white font-mono">2.0 GB</div>
            <div className="text-[11px] text-slate-400">
              Model asset: 3.75 MB
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-dark-850 border border-slate-800 space-y-1">
            <div className="text-slate-400 flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-brand-cyan" />
              Configurable Port
            </div>
            <div className="text-lg font-bold text-white font-mono">$PORT</div>
            <div className="text-[11px] text-slate-400 font-mono">
              Default: 8000
            </div>
          </div>
        </div>
      </div>

      {/* Model Breakdown */}
      <div className="p-6 rounded-2xl bg-dark-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-brand-teal" />
          Detector Pipeline: Google MediaPipe Tasks FaceLandmarker
        </h3>

        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            FaceLab AI leverages the modern <strong className="text-white">MediaPipe Tasks Vision API</strong>{' '}
            with a bundled float16 quantized landmark model (<code className="text-brand-cyan">face_landmarker.task</code>, 3.75 MB).
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs">
            <li>
              <strong className="text-slate-200">Reused Instance:</strong> The detector model is loaded exactly once into memory during FastAPI startup (via lifespan context) and persists across requests.
            </li>
            <li>
              <strong className="text-slate-200">CPU-Optimized Inference:</strong> Leverages TensorFlow Lite XNNPACK acceleration. No GPU or CUDA packages (like large PyTorch/Torchvision installations) are required.
            </li>
            <li>
              <strong className="text-slate-200">Safety Downscaling:</strong> Large uploads exceeding 1,920px are scaled down during CPU inference to guard against memory spikes, while preserving scale-invariant normalized coordinates.
            </li>
          </ul>
        </div>
      </div>

      {/* Concurrency and Overload Protection */}
      <div className="p-6 rounded-2xl bg-dark-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-400" />
          Concurrency Control & Load Shedding
        </h3>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Because the target hosting environment provides 1.5 vCPU and 2 GB RAM, unthrottled concurrent
          computer vision inferences would exhaust CPU cycles and increase latency exponentially.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-dark-850 border border-slate-800 space-y-1.5">
            <div className="font-semibold text-brand-cyan flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Asyncio Semaphore (Limit = 1)
            </div>
            <p className="text-slate-400 leading-relaxed">
              Every inference request must acquire an asynchronous semaphore. If another inference is in flight, incoming requests wait up to 2.0s before the server returns an explicit <strong>HTTP 429 Too Many Requests</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-dark-850 border border-slate-800 space-y-1.5">
            <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Zero Persistent Storage
            </div>
            <p className="text-slate-400 leading-relaxed">
              Images are decoded directly from memory buffers and immediately released. No uploaded user photos are ever saved to the host filesystem, preventing disk saturation and protecting privacy.
            </p>
          </div>
        </div>
      </div>

      {/* Limitations Notice */}
      <div className="p-5 rounded-2xl bg-dark-900 border border-amber-500/30 space-y-2">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4" />
          Application Boundaries & Limitations (MVP Policy)
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          FaceLab AI is strictly an engineering tool for spatial facial geometry. In compliance with privacy best practices:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs">
          <li>Analysis is restricted to exactly <strong className="text-slate-200">one face per request</strong>.</li>
          <li><strong className="text-slate-200">No identity recognition</strong> or database biometric matching is performed.</li>
          <li><strong className="text-slate-200">No emotion inference</strong> or sensitive demographic/attribute classification.</li>
        </ul>
      </div>
    </div>
  );
};
