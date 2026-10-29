import React, { useState } from 'react';
import {
  FileCode2,
  ExternalLink,
  Copy,
  Check,
  Send,
  Shield,
  Layers,
  Terminal,
} from 'lucide-react';

export const ApiDocsPage: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const endpoints = [
    {
      method: 'POST',
      path: '/api/analyze',
      title: 'Analyze Face Landmarks',
      description:
        'Upload an image to detect a human face and extract 478 normalized 3D landmarks, bounding box, and geometric spatial metrics.',
      contentType: 'multipart/form-data',
      params: [
        {
          name: 'file',
          type: 'UploadFile',
          required: true,
          description: 'JPEG, PNG, or WebP image binary (max 5 MB, max 4096px)',
        },
      ],
      curl: `curl -X POST "http://localhost:8000/api/analyze" \\
  -H "accept: application/json" \\
  -H "Content-Type: multipart/form-data" \\
  -F "file=@portrait.jpg"`,
      response: `{
  "status": "success",
  "face_detected": true,
  "faces_detected_count": 1,
  "image_width": 533,
  "image_height": 800,
  "processing_time_ms": 13.8,
  "model_identifier": "MediaPipe FaceLandmarker v2 (Tasks Vision - Float16)",
  "face": {
    "face_index": 0,
    "landmark_count": 478,
    "landmarks": [
      { "index": 0, "x": 0.5218, "y": 0.5921, "z": -0.0215 },
      { "index": 1, "x": 0.5224, "y": 0.5401, "z": -0.0489 }
    ],
    "bounding_box": {
      "x_min": 0.312,
      "y_min": 0.285,
      "x_max": 0.741,
      "y_max": 0.792,
      "pixel_width": 228,
      "pixel_height": 405
    },
    "geometry_metrics": {
      "face_aspect_ratio": 1.776,
      "interocular_distance_ratio": 0.385,
      "face_area_coverage_pct": 21.75
    }
  },
  "message": "Face landmarks successfully detected."
}`,
    },
    {
      method: 'GET',
      path: '/health',
      title: 'Service Health Check',
      description:
        'Returns current runtime operational health, memory consumption, model readiness, and uptime.',
      params: [],
      curl: `curl -X GET "http://localhost:8000/health"`,
      response: `{
  "status": "healthy",
  "model_loaded": true,
  "memory_mb": 88.42,
  "version": "1.0.0",
  "uptime_seconds": 341.2
}`,
    },
    {
      method: 'GET',
      path: '/api/info',
      title: 'Service Capabilities & Limits',
      description:
        'Returns system limits, accepted file formats, model metadata, and host specifications.',
      params: [],
      curl: `curl -X GET "http://localhost:8000/api/info"`,
      response: `{
  "name": "FaceLab AI",
  "version": "1.0.0",
  "model": "MediaPipe FaceLandmarker v2 (Tasks Vision - Float16)",
  "limits": {
    "max_upload_size_mb": 5.0,
    "max_dimensions": 4096,
    "max_faces": 1,
    "concurrency_limit": 1,
    "allowed_formats": [".jpeg", ".jpg", ".png", ".webp"]
  },
  "server_specs": {
    "recommended_ram": "2 GB",
    "recommended_cpu": "1.5 vCPU",
    "recommended_storage": "2 GB",
    "gpu_required": false
  }
}`,
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileCode2 className="w-6 h-6 text-brand-cyan" />
            FaceLab AI REST API Reference
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Complete API specification for integrating facial landmark detection into your services.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/docs"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-teal text-dark-950 font-semibold text-xs shadow-md shadow-brand-cyan/20 hover:brightness-110 transition-all flex items-center gap-1.5"
          >
            <span>Interactive Swagger UI</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <a
            href="/redoc"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 text-xs font-medium border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <span>ReDoc</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* HTTP Status Error Codes Matrix */}
      <div className="p-4 sm:p-5 rounded-2xl bg-dark-900 border border-slate-800 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-cyan" />
          Standard HTTP Response Status Codes
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
          <div className="p-2.5 rounded-lg bg-dark-850 border border-slate-800">
            <div className="text-emerald-400 font-mono font-semibold">200 OK</div>
            <div className="text-slate-400 text-[11px]">Analysis successfully completed</div>
          </div>
          <div className="p-2.5 rounded-lg bg-dark-850 border border-slate-800">
            <div className="text-amber-400 font-mono font-semibold">400 Bad Request</div>
            <div className="text-slate-400 text-[11px]">Invalid format, corrupted bytes, or excessive dims</div>
          </div>
          <div className="p-2.5 rounded-lg bg-dark-850 border border-slate-800">
            <div className="text-rose-400 font-mono font-semibold">413 Content Too Large</div>
            <div className="text-slate-400 text-[11px]">Uploaded file exceeds 5 MB limit</div>
          </div>
          <div className="p-2.5 rounded-lg bg-dark-850 border border-slate-800">
            <div className="text-purple-400 font-mono font-semibold">429 Too Many Requests</div>
            <div className="text-slate-400 text-[11px]">Server busy (concurrency limiter engaged)</div>
          </div>
        </div>
      </div>

      {/* Endpoints List */}
      <div className="space-y-6">
        {endpoints.map((ep, idx) => (
          <div
            key={ep.path}
            className="p-5 sm:p-6 rounded-2xl bg-dark-900 border border-slate-800 space-y-4"
          >
            {/* Endpoint Title & Route */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span
                  className={`px-2.5 py-1 rounded-md font-mono text-xs font-bold ${
                    ep.method === 'POST'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30'
                  }`}
                >
                  {ep.method}
                </span>
                <span className="font-mono text-sm font-semibold text-slate-100">{ep.path}</span>
              </div>
              <span className="text-xs text-slate-400">{ep.title}</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{ep.description}</p>

            {/* Parameters Table */}
            {ep.params.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Request Parameters
                </div>
                <div className="rounded-lg border border-slate-800 overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-dark-950 text-slate-400 font-mono text-[11px]">
                      <tr>
                        <th className="p-2">Name</th>
                        <th className="p-2">Type</th>
                        <th className="p-2">Required</th>
                        <th className="p-2">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {ep.params.map((p) => (
                        <tr key={p.name} className="font-mono text-[11px]">
                          <td className="p-2 font-semibold text-brand-cyan">{p.name}</td>
                          <td className="p-2 text-slate-400">{p.type}</td>
                          <td className="p-2 text-amber-400">{p.required ? 'Yes' : 'No'}</td>
                          <td className="p-2 font-sans text-slate-300">{p.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* cURL Example */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-brand-teal" />
                  cURL Request
                </span>
                <button
                  onClick={() => copyToClipboard(ep.curl, idx * 2)}
                  className="text-slate-400 hover:text-brand-cyan flex items-center gap-1 text-[11px] capitalize"
                >
                  {copiedIndex === idx * 2 ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-dark-950 border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto">
                {ep.curl}
              </pre>
            </div>

            {/* Example Response */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <span>Example 200 Response</span>
                <button
                  onClick={() => copyToClipboard(ep.response, idx * 2 + 1)}
                  className="text-slate-400 hover:text-brand-cyan flex items-center gap-1 text-[11px] capitalize"
                >
                  {copiedIndex === idx * 2 + 1 ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-dark-950 border border-slate-800 font-mono text-xs text-emerald-400/90 overflow-x-auto max-h-56">
                {ep.response}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
