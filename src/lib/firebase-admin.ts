
import * as admin from 'firebase-admin';
import { IOrderedItem } from './models/OrderedItem';

/**
 * @fileOverview Firebase Admin SDK initialization and synchronization utilities.
 * Ensures MongoDB mutations are reflected in real-time Firestore collections.
 */

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Ensure private key is handled correctly even with newlines in env vars
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('[FIREBASE_ADMIN] Initialized successfully');
  } catch (error: any) {
    console.warn('[FIREBASE_ADMIN] Initialization failed (likely missing credentials). Sync disabled.', error.message);
  }
}

export const adminDb = admin.apps.length ? admin.firestore() : null;

/**
 * Syncs a MongoDB order record to Firestore.
 * Firestore Path: users/{userId}/orders/{orderNumber}
 */
export async function syncOrderToFirestore(order: IOrderedItem) {
  if (!adminDb) return;

  try {
    const orderRef = adminDb.collection('users').doc(order.userId).collection('orders').doc(order.orderNumber);
    
    const syncData = {
      id: order.orderNumber,
      orderNumber: order.orderNumber,
      userId: order.userId,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentVerified: order.paymentVerified,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await orderRef.set(syncData, { merge: true });
    console.log(`[SYNC] Order ${order.orderNumber} pushed to Firestore`);
  } catch (error: any) {
    console.error(`[SYNC_ERROR] Failed to sync order ${order.orderNumber}:`, error.message);
  }
}
