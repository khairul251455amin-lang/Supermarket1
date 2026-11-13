/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface OptimizedImageResult {
  file: File;
  blob: Blob;
  dataUrl: string;
  originalSize: number;
  optimizedSize: number;
  format: 'webp' | 'jpeg' | 'png';
  width: number;
  height: number;
  reductionPercentage: number;
}

export interface CompressionOptions {
  maxDimension?: number; // e.g. 1200px max width or height
  targetMinBytes?: number; // 50 KB = 50 * 1024
  maxSizeBytes?: number; // 200 KB = 200 * 1024 (Hard ceiling)
  preferWebp?: boolean;
}

const MAX_ALLOWED_BYTES = 160 * 1024; // <= 160 KB ceiling (strictly under 200 KB hard limit)
const MIN_TARGET_BYTES = 50 * 1024; // 50 KB target floor

/**
 * Validates image file type.
 * Supports JPG, JPEG, PNG, WEBP.
 */
export function validateImageType(file: File): { valid: boolean; error?: string } {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

  const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

  const isMimeValid = allowedMimeTypes.includes(file.type);
  const isExtValid = allowedExtensions.includes(extension);

  if (!isMimeValid && !isExtValid) {
    return {
      valid: false,
      error: 'Invalid file type. Supported formats are JPG, JPEG, PNG, and WEBP.',
    };
  }

  return { valid: true };
}

/**
 * Checks if browser canvas supports WebP export.
 */
function checkWebpSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  } catch {
    return false;
  }
}

/**
 * Reads a File into an HTMLImageElement
 */
function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for processing.'));
    };
    img.src = url;
  });
}

/**
 * Converts a Blob to a Base64 data URL for offline fallback & preview.
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Optimizes an image to stay strictly within 50 KB – 200 KB.
 * Never exceeds 200 KB.
 * Does not artificially inflate images already under 50 KB.
 */
export async function optimizeImage(
  file: File,
  options: CompressionOptions = {}
): Promise<OptimizedImageResult> {
  const typeValidation = validateImageType(file);
  if (!typeValidation.valid) {
    throw new Error(typeValidation.error);
  }

  const maxDimension = options.maxDimension || 1200;
  const maxSizeBytes = options.maxSizeBytes || MAX_ALLOWED_BYTES;
  const originalSize = file.size;

  // Case 1: Image is already under 200 KB AND smaller than 50 KB
  // "Do not artificially increase the size of images that are already smaller than 50 KB"
  if (originalSize <= maxSizeBytes && originalSize < MIN_TARGET_BYTES) {
    const img = await loadImageFromFile(file);
    const dataUrl = await blobToDataUrl(file);
    const isWebp = file.type === 'image/webp';
    const isPng = file.type === 'image/png';
    const format = isWebp ? 'webp' : isPng ? 'png' : 'jpeg';

    return {
      file,
      blob: file,
      dataUrl,
      originalSize,
      optimizedSize: originalSize,
      format,
      width: img.width,
      height: img.height,
      reductionPercentage: 0,
    };
  }

  // Load the image into canvas for intelligent compression & resizing
  const img = await loadImageFromFile(file);
  let targetWidth = img.width;
  let targetHeight = img.height;

  // Calculate scaled dimensions if exceeding maxDimension
  if (targetWidth > maxDimension || targetHeight > maxDimension) {
    if (targetWidth > targetHeight) {
      targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
      targetWidth = maxDimension;
    } else {
      targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
      targetHeight = maxDimension;
    }
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable.');
  }

  const isWebpSupported = checkWebpSupport();
  const targetMime = isWebpSupported ? 'image/webp' : 'image/jpeg';
  const formatName = isWebpSupported ? 'webp' : 'jpeg';

  let currentQuality = 0.85;
  let currentWidth = targetWidth;
  let currentHeight = targetHeight;
  let bestBlob: Blob | null = null;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    attempts++;
    canvas.width = currentWidth;
    canvas.height = currentHeight;

    // High quality bicubic interpolation
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Clear and draw
    ctx.clearRect(0, 0, currentWidth, currentHeight);
    ctx.drawImage(img, 0, 0, currentWidth, currentHeight);

    const blob: Blob | null = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), targetMime, currentQuality);
    });

    if (!blob) {
      throw new Error('Image rendering failed during compression.');
    }

    // Check size
    if (blob.size <= maxSizeBytes) {
      bestBlob = blob;
      // If we are in the sweet spot (50 KB – 200 KB), or original was already smaller than 50 KB, stop!
      if (blob.size <= maxSizeBytes) {
        break;
      }
    }

    // If exceeding 200 KB, reduce quality or scale down further
    if (currentQuality > 0.45) {
      currentQuality -= 0.12;
    } else {
      // Scale down dimensions by 15%
      currentWidth = Math.round(currentWidth * 0.85);
      currentHeight = Math.round(currentHeight * 0.85);
      currentQuality = 0.70;
    }
  }

  if (!bestBlob || bestBlob.size > maxSizeBytes) {
    throw new Error(
      `Image could not be compressed under 200 KB (${formatFileSize(bestBlob ? bestBlob.size : originalSize)}). Please select a clearer or smaller photo.`
    );
  }

  const optimizedSize = bestBlob.size;
  const reductionPercentage =
    originalSize > optimizedSize
      ? Math.round(((originalSize - optimizedSize) / originalSize) * 100)
      : 0;

  const dataUrl = await blobToDataUrl(bestBlob);

  const cleanFilename = file.name.substring(0, file.name.lastIndexOf('.')) + `.${formatName}`;
  const optimizedFile = new File([bestBlob], cleanFilename, { type: targetMime });

  return {
    file: optimizedFile,
    blob: bestBlob,
    dataUrl,
    originalSize,
    optimizedSize,
    format: formatName,
    width: currentWidth,
    height: currentHeight,
    reductionPercentage,
  };
}

/**
 * Format bytes to human-readable string (e.g. 118 KB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}
