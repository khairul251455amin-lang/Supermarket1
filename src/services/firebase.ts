/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Supermarket Firebase Integration Architecture
 * 
 * This service layer is architected to seamlessly connect with:
 * - Firebase Authentication (email/password sign-in, user state observers)
 * - Cloud Firestore (real-time collections: 'products', 'orders', 'users', 'conversations', 'notifications')
 * - Firebase Storage (product image gallery and user avatar uploads)
 * 
 * Status:
 * Currently in Phase 1 Prototype Mode. Local storage provides interactive state management
 * until Firebase configuration is provisioned.
 */

import { isFirebaseConfigured, firebaseConfig } from './firebaseConfig';

export interface FirebaseConnectionStatus {
  isConfigured: boolean;
  projectId: string | null;
  authReady: boolean;
  firestoreReady: boolean;
  storageReady: boolean;
  mode: 'prototype-local' | 'firebase-live';
  notice: string;
}

const configured = isFirebaseConfigured();

let cachedStatus: FirebaseConnectionStatus = {
  isConfigured: configured,
  projectId: configured ? firebaseConfig.projectId : null,
  authReady: configured,
  firestoreReady: configured,
  storageReady: configured,
  mode: configured ? 'firebase-live' : 'prototype-local',
  notice: configured
    ? `Firebase is configured and live on project ${firebaseConfig.projectId}.`
    : 'Firebase is not yet configured. The app is running in Phase 1 Prototype Mode with local state.',
};

export const getFirebaseStatus = (): FirebaseConnectionStatus => {
  return cachedStatus;
};

export const setFirebaseStatus = (status: Partial<FirebaseConnectionStatus>) => {
  cachedStatus = { ...cachedStatus, ...status };
};

