'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    const customAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;

    // Use an explicit config only after the custom-domain OAuth callback has
    // been deployed and authorized in Google Cloud. Until then, App Hosting's
    // automatic configuration keeps the existing production login working.
    if (customAuthDomain) {
      return getSdks(initializeApp({
        ...firebaseConfig,
        authDomain: customAuthDomain,
      }));
    }

    // Important! initializeApp() is called without any arguments because Firebase App Hosting
    // integrates with the initializeApp() function to provide the environment variables needed to
    // populate the FirebaseOptions in production. It is critical that we attempt to call initializeApp()
    // without arguments.
    let firebaseApp;
    try {
      // Attempt to initialize via Firebase App Hosting environment variables
      firebaseApp = initializeApp();
    } catch (e) {
      // Only warn in production because it's normal to use the firebaseConfig to initialize
      // during development
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
    }

    return getSdks(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    // Use initializeFirestore instead of getFirestore to enable experimentalForceLongPolling.
    // This resolves "Could not reach Cloud Firestore backend" errors in cloud IDE environments.
    firestore: initializeFirestore(firebaseApp, {
      experimentalForceLongPolling: true,
    })
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
