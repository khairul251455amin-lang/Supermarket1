/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { isFirebaseConfigured, firebaseConfig } from './firebaseConfig';
import { marketplaceConfig } from '../config/marketplaceConfig';

export interface FirebaseConnectionStatus {
  isConfigured: boolean;
  projectId: string | null;
  authReady: boolean;
  firestoreReady: boolean;
  storageReady: boolean;
  mode: 'offline-local' | 'firebase-live';
  notice: string;
}

const configured = isFirebaseConfigured();

let cachedStatus: FirebaseConnectionStatus = {
  isConfigured: configured,
  projectId: configured ? firebaseConfig.projectId : null,
  authReady: configured,
  firestoreReady: configured,
  storageReady: configured,
  mode: configured ? 'firebase-live' : 'offline-local',
  notice: configured
    ? `${marketplaceConfig.marketplaceName} connected to Firebase project ${firebaseConfig.projectId}.`
    : 'Firebase is not configured.',
};

export const getFirebaseStatus = (): FirebaseConnectionStatus => {
  return cachedStatus;
};

export const setFirebaseStatus = (status: Partial<FirebaseConnectionStatus>) => {
  cachedStatus = { ...cachedStatus, ...status };
};
