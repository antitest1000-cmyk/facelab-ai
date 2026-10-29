import React from 'react';
import {
  ScanFace,
  Cpu,
  Layers,
  Zap,
  ShieldCheck,
  Server,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { HealthResponse } from '../types/api';
import { NavTab } from '../components/Sidebar';

interface DashboardPageProps {
  health: HealthResponse | null;
  onNavigate: (tab: NavTab) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ health, onNavigate }) => {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-10 bg-gradient-to-br from-dark-900 via-dark-850 to-dark-900 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-cyan/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-brand-violet/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Production-Grade Computer Vision on CPU</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            High-Precision Face Landmark Detection
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            FaceLab AI delivers real-time 478-point 3D facial mesh inference optimized for
            constrained Linux hosting environments with <strong className="text-white">2 GB RAM</strong> and{' '}
            <strong className="text-white">1.5 vCPU</strong>.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('analyzer')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-teal text-dark-950 font-bold text-xs sm:text-sm shadow-lg shadow-brand-cyan/25 hover:brightness-110 active:scale-98 transition-all flex items-center gap-2"
            >
              <ScanFace className="w-4 h-4" />
              Launch Face Analyzer
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={() => onNavigate('docs')}
              className="px-5 py-3 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-200 font-semibold text-xs sm:text-sm border border-slate-700 hover:border-slate-600 transition-all"
            >
              View API Reference
            </button>
          </div>
        </div>
      </div>

      {/* Live System Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Engine Status */}
        <div className="p-5 rounded-2xl bg-dark-900 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
            <span>Inference Engine</span>
            <Cpu className="w-4 h-4 text-brand-cyan" />
          </div>
          <div className="text-xl font-bold text-white mb-1">
            {health?.status === 'healthy' ? 'Active & Healthy' : 'Initializing...'}
          </div>
          <div className="text-xs text-slate-400">
            MediaPipe Tasks Vision (Float16)
          </div>
        </div>

        {/* Card 2: Memory Footprint */}
        <div className="p-5 rounded-2xl bg-dark-900 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
            <span>Process Memory</span>
            <Server className="w-4 h-4 text-brand-teal" />
          </div>
          <div className="text-xl font-bold text-white mb-1 font-mono">
            {health?.memory_mb ? `${health.memory_mb} MB` : 'Estimating...'}
          </div>
          <div className="text-xs text-emerald-400">
            Budget: 2,048 MB Limit
          </div>
        </div>

        {/* Card 3: Model Landmark Resolution */}
        <div className="p-5 rounded-2xl bg-dark-900 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
            <span>Mesh Resolution</span>
            <Layers className="w-4 h-4 text-brand-violet" />
          </div>
          <div className="text-xl font-bold text-white mb-1 font-mono">
            478 Points
          </div>
          <div className="text-xs text-slate-400">
            468 Facial + 10 Iris landmarks
          </div>
        </div>

        {/* Card 4: Concurrency & Privacy */}
        <div className="p-5 rounded-2xl bg-dark-900 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
            <span>Privacy & Storage</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white mb-1">
            Zero Storage
          </div>
          <div className="text-xs text-slate-400">
            In-memory stream & immediate cleanup
          </div>
        </div>
      </div>

      {/* How the Pipeline Works */}
      <div className="p-6 sm:p-8 rounded-3xl bg-dark-900 border border-slate-800 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">
            Engineered for Lightweight Linux Hosts
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">
            How FaceLab AI maintains sub-50ms CPU inference while strictly respecting memory limits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-dark-850/70 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-brand-cyan/10 text-brand-cyan flex items-center justify-center font-bold text-xs">
              1
            </div>
            <h4 className="text-sm font-semibold text-slate-200">Pre-Flight Byte Validation</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Files are streamed in 64 KB chunks up to 5 MB with instant header magic byte checks
              (JPEG, PNG, WebP) to reject corrupt uploads before full decoding.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-dark-850/70 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-brand-teal/10 text-brand-teal flex items-center justify-center font-bold text-xs">
              2
            </div>
            <h4 className="text-sm font-semibold text-slate-200">Asynchronous Concurrency Gate</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Inference is controlled by an asyncio semaphore set to 1 worker to protect the 1.5 vCPU host
              from thread contention, shedding excess load with HTTP 429 when saturated.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-dark-850/70 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <h4 className="text-sm font-semibold text-slate-200">XNNPACK CPU Delegate</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              MediaPipe utilizes TensorFlow Lite XNNPACK acceleration for high-throughput SIMD vector
              math on standard x86_64 / ARM64 CPUs with zero GPU requirement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
