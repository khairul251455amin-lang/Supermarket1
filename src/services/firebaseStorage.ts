/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadMetadata,
} from 'firebase/storage';
import { storage, isFirebaseConfigured } from './firebaseConfig';

export interface StorageUploadResult {
  downloadUrl: string;
  storagePath: string;
  isLiveFirebase: boolean;
  fileSizeBytes: number;
  uploadedAt: string;
}

/**
 * Checks if live Firebase Storage is connected and ready.
 */
export function isStorageConfigured(): boolean {
  return isFirebaseConfigured();
}

/**
 * Local offline repository for persistent local preview when live Firebase Storage
 * is not yet provisioned.
 */
const LOCAL_STORAGE_IMAGE_MAP_KEY = 'supermarket_uploaded_images_map';

function getLocalImageMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_IMAGE_MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalImageMap(map: Record<string, string>): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_IMAGE_MAP_KEY, JSON.stringify(map));
  } catch {
    // Quota fallback
  }
}

/**
 * Uploads a shop logo to "shops/{sellerId}/logo"
 * Enforces maximum size: 200 KB
 */
export async function uploadShopLogo(
  sellerId: string,
  optimizedBlob: Blob,
  format: 'webp' | 'jpeg' | 'png',
  dataUrlPreview: string,
  onProgress?: (progress: number) => void
): Promise<StorageUploadResult> {
  const storagePath = `shops/${sellerId}/logo`;
  return executeUpload(storagePath, optimizedBlob, format, dataUrlPreview, sellerId, onProgress);
}

/**
 * Uploads a product image to:
 * - "products/{sellerId}/{productId}/image1"
 * - "products/{sellerId}/{productId}/image2"
 * Enforces maximum size: 200 KB
 */
export async function uploadProductImage(
  sellerId: string,
  productId: string,
  imageNumber: 1 | 2,
  optimizedBlob: Blob,
  format: 'webp' | 'jpeg' | 'png',
  dataUrlPreview: string,
  onProgress?: (progress: number) => void
): Promise<StorageUploadResult> {
  const storagePath = `products/${sellerId}/${productId}/image${imageNumber}`;
  return executeUpload(storagePath, optimizedBlob, format, dataUrlPreview, sellerId, onProgress);
}

/**
 * Helper to upload to Firebase Storage or local persistence fallback
 */
async function executeUpload(
  storagePath: string,
  optimizedBlob: Blob,
  format: 'webp' | 'jpeg' | 'png',
  dataUrlPreview: string,
  sellerId: string,
  onProgress?: (progress: number) => void
): Promise<StorageUploadResult> {
  if (optimizedBlob.size > 200 * 1024) {
    throw new Error('Security Error: Uploaded image exceeds the strict 200 KB maximum limit.');
  }

  const mimeType = format === 'webp' ? 'image/webp' : format === 'png' ? 'image/png' : 'image/jpeg';

  // Live Firebase Storage Upload
  if (isFirebaseConfigured()) {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, storagePath);
      const metadata: UploadMetadata = {
        contentType: mimeType,
        customMetadata: {
          sellerId,
          sizeBytes: String(optimizedBlob.size),
          optimizedAt: new Date().toISOString(),
        },
      };

      const uploadTask = uploadBytesResumable(storageRef, optimizedBlob, metadata);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          if (onProgress) onProgress(progress);
        },
        (error) => {
          reject(new Error(`Firebase Storage error: ${error.message}`));
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            // Also cache locally
            const localMap = getLocalImageMap();
            localMap[storagePath] = downloadUrl;
            saveLocalImageMap(localMap);

            resolve({
              downloadUrl,
              storagePath,
              isLiveFirebase: true,
              fileSizeBytes: optimizedBlob.size,
              uploadedAt: new Date().toISOString(),
            });
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  }

  // Pre-configured storage emulation with progress feedback
  return new Promise((resolve) => {
    let currentPct = 15;
    if (onProgress) onProgress(currentPct);

    const interval = setInterval(() => {
      currentPct += 30;
      if (currentPct >= 100) {
        clearInterval(interval);
        if (onProgress) onProgress(100);

        const localMap = getLocalImageMap();
        localMap[storagePath] = dataUrlPreview;
        saveLocalImageMap(localMap);

        resolve({
          downloadUrl: dataUrlPreview,
          storagePath,
          isLiveFirebase: false,
          fileSizeBytes: optimizedBlob.size,
          uploadedAt: new Date().toISOString(),
        });
      } else {
        if (onProgress) onProgress(currentPct);
      }
    }, 40);
  });
}

/**
 * Safely removes an image from storage
 */
export async function deleteStorageImage(storagePath: string): Promise<boolean> {
  try {
    if (isFirebaseConfigured()) {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    }
    const localMap = getLocalImageMap();
    delete localMap[storagePath];
    saveLocalImageMap(localMap);
    return true;
  } catch {
    return false;
  }
}
