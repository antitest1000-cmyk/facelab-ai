import React, { useState, useEffect } from 'react';
import { FileDropzone } from '../components/FileDropzone';
import { LandmarkCanvas } from '../components/LandmarkCanvas';
import { MetricsPanel } from '../components/MetricsPanel';
import { LandmarkTable } from '../components/LandmarkTable';
import { AnalysisResponse } from '../types/api';
import { Sparkles, ScanFace, AlertTriangle } from 'lucide-react';

export const AnalyzerPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedLandmarkIndex, setSelectedLandmarkIndex] = useState<number | null>(null);

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const handleSelectFile = (file: File) => {
    // Revoke previous blob if any
    if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setSelectedFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setAnalysisResult(null);
    setErrorMessage(null);
    setSelectedLandmarkIndex(null);
  };

  const handleClear = () => {
    if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setSelectedFile(null);
    setImagePreviewUrl(null);
    setAnalysisResult(null);
    setErrorMessage(null);
    setSelectedLandmarkIndex(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `Server error (${response.status})`);
      }

      setAnalysisResult(data as AnalysisResponse);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'An unexpected error occurred during face analysis.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ScanFace className="w-6 h-6 text-brand-cyan" />
            Face Landmark Workspace
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Upload any face portrait to extract 478 3D spatial points with sub-pixel precision.
          </p>
        </div>

        {analysisResult && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono text-slate-400">Status:</span>
            <span
              className={`px-2.5 py-1 rounded-full font-semibold ${
                analysisResult.face_detected
                  ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-950/70 text-amber-400 border border-amber-500/30'
              }`}
            >
              {analysisResult.face_detected ? '1 Face Detected' : 'No Face Detected'}
            </span>
          </div>
        )}
      </div>

      {/* Main Dual-Column Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Image Dropzone & Interactive Canvas */}
        <div className="lg:col-span-7 space-y-5">
          <FileDropzone
            selectedFile={selectedFile}
            imagePreviewUrl={imagePreviewUrl}
            onSelectFile={handleSelectFile}
            onClear={handleClear}
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
            errorMessage={errorMessage}
          />

          {imagePreviewUrl && (
            <div className="space-y-2">
              <LandmarkCanvas
                imageUrl={imagePreviewUrl}
                landmarks={analysisResult?.face?.landmarks || null}
                boundingBox={analysisResult?.face?.bounding_box || null}
                selectedLandmarkIndex={selectedLandmarkIndex}
                onSelectLandmark={setSelectedLandmarkIndex}
              />
            </div>
          )}
        </div>

        {/* Right Column: Metrics & Coordinates Inspector */}
        <div className="lg:col-span-5 space-y-5">
          {analysisResult ? (
            <>
              <MetricsPanel analysis={analysisResult} />

              {analysisResult.face && (
                <LandmarkTable
                  landmarks={analysisResult.face.landmarks}
                  selectedLandmarkIndex={selectedLandmarkIndex}
                  onSelectLandmark={setSelectedLandmarkIndex}
                />
              )}
            </>
          ) : (
            /* Standby Card when no analysis completed */
            <div className="p-8 rounded-2xl bg-dark-900 border border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-dark-800 border border-slate-700 mx-auto flex items-center justify-center text-slate-500">
                <Sparkles className="w-6 h-6 text-brand-teal" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200">Awaiting Analysis</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Choose an image on the left or click <strong className="text-brand-cyan">Try Sample Portrait</strong> to run actual backend inference and inspect coordinates.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
