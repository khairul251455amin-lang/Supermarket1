/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import {
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Loader2,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  optimizeImage,
  formatFileSize,
  OptimizedImageResult,
  validateImageType,
} from '../../services/imageCompression';

interface PhotoUploaderProps {
  label: string; // e.g. "Upload Shop Logo", "Upload Product Image 1", "Upload Product Image 2"
  sublabel?: string; // e.g. "Primary front photo • 50-200 KB auto-compressed"
  currentImageUrl?: string;
  required?: boolean;
  onImageUploaded: (result: {
    downloadUrl: string;
    blob: Blob;
    format: 'webp' | 'jpeg' | 'png';
    sizeBytes: number;
    dataUrl: string;
  }) => Promise<void> | void;
  onImageRemoved?: () => void;
  aspectRatio?: 'square' | 'wide' | 'standard'; // standard = 4:3
  disabled?: boolean;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  label,
  sublabel = 'Auto-optimized to 50–200 KB (JPG, PNG, WEBP)',
  currentImageUrl,
  required = false,
  onImageUploaded,
  onImageRemoved,
  aspectRatio = 'standard',
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: string;
    optimizedSize: string;
    format: string;
    reduction: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Sync if currentImageUrl changes externally
  React.useEffect(() => {
    if (currentImageUrl !== previewUrl && !isProcessing) {
      setPreviewUrl(currentImageUrl || null);
    }
  }, [currentImageUrl]);

  const handleFile = async (file: File) => {
    setErrorMessage(null);

    // 1. Validate MIME and extension
    const validation = validateImageType(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid file format.');
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingStep('Compressing & optimizing photo on device...');

      // 2. Perform client-side compression targeting 50-200 KB
      const optimized: OptimizedImageResult = await optimizeImage(file, {
        maxDimension: 1200,
        maxSizeBytes: 200 * 1024, // 200 KB hard ceiling
        preferWebp: true,
      });

      setCompressionStats({
        originalSize: formatFileSize(optimized.originalSize),
        optimizedSize: formatFileSize(optimized.optimizedSize),
        format: optimized.format.toUpperCase(),
        reduction: optimized.reductionPercentage,
      });

      setPreviewUrl(optimized.dataUrl);
      setProcessingStep('Storing photo asset...');
      setUploadProgress(20);

      // 3. Delegate to caller for storage assignment
      await onImageUploaded({
        downloadUrl: optimized.dataUrl,
        blob: optimized.blob,
        format: optimized.format,
        sizeBytes: optimized.optimizedSize,
        dataUrl: optimized.dataUrl,
      });

      setUploadProgress(100);
      setTimeout(() => {
        setUploadProgress(null);
        setIsProcessing(false);
        setProcessingStep('');
      }, 500);
    } catch (err) {
      setIsProcessing(false);
      setUploadProgress(null);
      setProcessingStep('');
      setErrorMessage(err instanceof Error ? err.message : 'Error optimizing photo.');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset file input so user can pick the same file again if desired
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isProcessing) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    setCompressionStats(null);
    setErrorMessage(null);
    if (onImageRemoved) {
      onImageRemoved();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerSelect = () => {
    if (disabled || isProcessing) return;
    fileInputRef.current?.click();
  };

  const getAspectClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square';
      case 'wide':
        return 'aspect-16/9';
      default:
        return 'aspect-4/3';
    }
  };

  return (
    <div className="space-y-2 w-full">
      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || isProcessing}
      />

      {/* Main Upload Box / Preview Area */}
      {previewUrl ? (
        <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-xs">
          <div className={`${getAspectClass()} w-full relative bg-slate-950 flex items-center justify-center overflow-hidden`}>
            <img
              src={previewUrl}
              alt={label}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
            />

            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-white z-20">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-2" />
                <p className="text-xs font-medium text-center">{processingStep}</p>
                {uploadProgress !== null && (
                  <div className="w-32 bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Hover Actions Bar */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-end justify-between p-3 z-10">
              <button
                type="button"
                onClick={triggerSelect}
                disabled={disabled || isProcessing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 text-slate-800 text-xs font-semibold hover:bg-white shadow-sm transition-transform active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                <span>Replace</span>
              </button>

              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled || isProcessing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/90 text-white text-xs font-semibold hover:bg-rose-600 shadow-sm transition-transform active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </div>

          {/* Metadata & Optimization Pill */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-semibold text-slate-800">{label}</span>
              {required && <span className="text-rose-500 font-bold">*</span>}
            </div>

            {compressionStats ? (
              <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-full">
                {compressionStats.optimizedSize} • {compressionStats.format}
                {compressionStats.reduction > 0 && ` (-${compressionStats.reduction}%)`}
              </span>
            ) : (
              <span className="font-mono text-[10px] bg-slate-200 text-slate-700 font-medium px-2 py-0.5 rounded-full">
                &le; 200 KB
              </span>
            )}
          </div>
        </div>
      ) : (
        /* Empty Upload Trigger */
        <div
          onClick={triggerSelect}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`group cursor-pointer rounded-2xl border-2 border-dashed transition-all p-5 flex flex-col items-center justify-center text-center ${
            isDragging
              ? 'border-blue-500 bg-blue-50/60 scale-99'
              : 'border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/20'
          } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform group-hover:bg-blue-600 group-hover:text-white shadow-xs">
            {isProcessing ? (
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1 max-w-xs">
            <div className="flex items-center justify-center gap-1">
              <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {label}
              </span>
              {required && <span className="text-rose-500 font-bold">*</span>}
            </div>
            <p className="text-[11px] text-slate-500">
              Tap to browse photo from Android gallery, file manager, or computer
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              Target 50–200 KB • Max 200 KB • JPG, PNG, WEBP
            </p>
          </div>

          {isProcessing && (
            <p className="text-xs text-blue-600 font-medium mt-3 flex items-center gap-1.5 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              {processingStep}
            </p>
          )}
        </div>
      )}

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
