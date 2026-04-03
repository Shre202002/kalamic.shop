import * as admin from 'firebase-admin';
import { IOrderedItem } from './models/OrderedItem';

/**
 * @fileOverview Firebase Admin SDK initialization and synchronization utilities.
 * Includes session verification and custom token helpers.
 */

if (!admin.apps.length) {
  try {
    const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '')
      .replace(/\\n/g, '\n')
      .replace(/^"|"$/g, '');
    
    if (!privateKey || !process.env.FIREBASE_PROJECT_ID) {
      console.warn('[FIREBASE_ADMIN] Missing credentials');
    } else {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      });
      console.log('[FIREBASE_ADMIN] Initialized successfully');
    }
  } catch (error: any) {
    console.warn('[FIREBASE_ADMIN] Init failed:', error.message);
  }
}

export const adminDb = admin.apps.length ? admin.firestore() : null;
export const adminAuth = admin.apps.length ? admin.auth() : null;

/**
 * Verifies a session cookie or ID token.
 */
export async function verifySession(token: string) {
  if (!adminAuth) return null;
  try {
    return await adminAuth.verifyIdToken(token);
  } catch (e) {
    console.error('[ADMIN_AUTH] Token verification failed');
    return null;
  }
}

/**
 * Creates a custom token for client-side sign-in (used for OTP flows).
 */
export async function createCustomToken(uid: string, claims?: any) {
  if (!adminAuth) throw new Error('Auth service unavailable');
  return await adminAuth.createCustomToken(uid, claims);
}

/**
 * Syncs a MongoDB order record to Firestore.
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

/**
 * Purges purchased items from the collector's Firestore cart.
 */
export async function clearCartAfterOrder(userId: string, items: any[]) {
  if (!adminDb) return;
  try {
    const cartRef = adminDb.collection('users').doc(userId).collection('cart').doc('cart').collection('items');
    const snapshot = await cartRef.get();
    if (snapshot.empty) return;
    const batch = adminDb.batch();
    let matchCount = 0;
    for (const cartDoc of snapshot.docs) {
      const cartItem = cartDoc.data();
      const cartPid = cartItem.productVariantId || cartItem.productId || cartItem.id;
      const isOrdered = items.some((orderedItem) => orderedItem.productId === cartPid);
      if (isOrdered) {
        batch.delete(cartDoc.ref);
        matchCount++;
      }
    }
    if (matchCount > 0) await batch.commit();
  } catch (error: any) {
    console.error(`[CART_PURGE_ERROR]:`, error.message);
  }
}
