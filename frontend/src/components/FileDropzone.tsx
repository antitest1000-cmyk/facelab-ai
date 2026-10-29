import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import {
  UploadCloud,
  FileImage,
  Sparkles,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';

interface FileDropzoneProps {
  selectedFile: File | null;
  imagePreviewUrl: string | null;
  onSelectFile: (file: File) => void;
  onClear: () => void;
  onAnalyze: () => void;
  isLoading: boolean;
  errorMessage: string | null;
}

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  selectedFile,
  imagePreviewUrl,
  onSelectFile,
  onClear,
  onAnalyze,
  isLoading,
  errorMessage,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndPassFile = (file: File) => {
    setLocalError(null);

    // Format validation
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(jpe?g|png|webp)$/i)) {
      setLocalError('Invalid file format. Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    // Size validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setLocalError(`File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the ${MAX_FILE_SIZE_MB} MB limit.`);
      return;
    }

    if (file.size === 0) {
      setLocalError('Uploaded file is empty (0 bytes).');
      return;
    }

    onSelectFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndPassFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndPassFile(e.target.files[0]);
    }
  };

  const handleLoadSample = async () => {
    try {
      setLoadingSample(true);
      setLocalError(null);
      const res = await fetch('/api/sample');
      if (!res.ok) {
        throw new Error('Failed to load sample portrait from backend.');
      }
      const blob = await res.blob();
      const sampleFile = new File([blob], 'sample_portrait.jpg', { type: 'image/jpeg' });
      validateAndPassFile(sampleFile);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Could not fetch sample portrait.');
    } finally {
      setLoadingSample(false);
    }
  };

  const activeError = localError || errorMessage;

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      {/* Drop area / Preview container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
          isDragOver
            ? 'border-brand-cyan bg-brand-cyan/5 shadow-lg shadow-brand-cyan/10'
            : selectedFile
            ? 'border-slate-700 bg-dark-900/60'
            : 'border-dashed border-slate-700/80 hover:border-slate-500 bg-dark-900/40 hover:bg-dark-900/80'
        }`}
      >
        {!selectedFile ? (
          /* Empty state - Upload guidance */
          <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-dark-800 border border-slate-700 flex items-center justify-center mb-4 text-brand-cyan shadow-inner">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-base font-semibold text-slate-200 mb-1">
              Drag & Drop your face portrait here
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mb-6">
              Supports JPEG, PNG, or WebP up to 5 MB. Analyzed strictly in memory on CPU.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-teal text-dark-950 font-semibold text-xs shadow-md shadow-brand-cyan/20 hover:brightness-110 transition-all flex items-center gap-2"
              >
                <FileImage className="w-4 h-4" />
                Browse Local Files
              </button>

              <button
                type="button"
                onClick={handleLoadSample}
                disabled={loadingSample}
                className="px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-200 font-medium text-xs border border-slate-700 hover:border-slate-600 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-brand-cyan" />
                {loadingSample ? 'Loading...' : 'Try Sample Portrait'}
              </button>
            </div>
          </div>
        ) : (
          /* Image Selected / Preview State */
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Thumbnail preview */}
              <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-xl overflow-hidden border border-slate-700 bg-dark-950 flex-shrink-0 group">
                {imagePreviewUrl ? (
                  <img
                    src={imagePreviewUrl}
                    alt="Upload Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
                {isLoading && (
                  <div className="absolute inset-0 bg-dark-950/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin" />
                    <span className="text-[11px] font-mono text-brand-cyan">Analyzing...</span>
                  </div>
                )}
              </div>

              {/* File details & actions */}
              <div className="flex-1 w-full space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-semibold text-slate-200 truncate max-w-xs">
                        {selectedFile.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Size: {(selectedFile.size / 1024).toFixed(1)} KB &bull; Type: {selectedFile.type || 'image'}
                    </p>
                  </div>
                  <button
                    onClick={onClear}
                    disabled={isLoading}
                    className="text-xs text-slate-400 hover:text-rose-400 hover:underline disabled:opacity-50"
                  >
                    Change Image
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-dark-850/80 border border-slate-800 text-xs text-slate-300">
                  <span className="text-slate-400">Ready for detection:</span> Click{' '}
                  <strong className="text-brand-cyan">Analyze Face</strong> to extract 478 3D landmarks via MediaPipe on CPU.
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={onAnalyze}
                    disabled={isLoading}
                    className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 ${
                      isLoading
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-brand-cyan to-brand-teal text-dark-950 shadow-md shadow-brand-cyan/25 hover:brightness-110 active:scale-98'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-brand-cyan" />
                        Running CPU Inference...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Analyze Face
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleLoadSample}
                    disabled={isLoading || loadingSample}
                    className="px-3.5 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 text-xs border border-slate-700 hover:border-slate-600 transition-all"
                  >
                    Load Sample
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error alert */}
      {activeError && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{activeError}</span>
        </div>
      )}
    </div>
  );
};
