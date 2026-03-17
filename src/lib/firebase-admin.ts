
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

/**
 * Purges purchased items from the collector's Firestore cart.
 * Matches cart documents by productVariantId field to ensure precise deletion.
 */
export async function clearCartAfterOrder(userId: string, items: any[]) {
  if (!adminDb) return;

  try {
    const cartRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('cart')
      .doc('cart')
      .collection('items');

    // 1. Fetch current cart state
    const snapshot = await cartRef.get();
    const batch = adminDb.batch();
    let matchCount = 0;

    // 2. Iterate and match by internal product field
    for (const cartDoc of snapshot.docs) {
      const cartItem = cartDoc.data();
      
      // In Firestore, we use 'productVariantId' or 'productId'
      const firestorePid = cartItem.productVariantId || cartItem.productId;
      
      const isOrdered = items.some(
        (orderedItem) => orderedItem.productId === firestorePid
      );

      if (isOrdered) {
        batch.delete(cartDoc.ref);
        matchCount++;
      }
    }

    if (matchCount > 0) {
      await batch.commit();
      console.log(`[CART_PURGE] Successfully removed ${matchCount} items for user ${userId}`);
    } else {
      console.log(`[CART_PURGE] No matching cart items found for user ${userId}`);
    }
  } catch (error: any) {
    console.error(`[CART_PURGE_ERROR]:`, error.message);
  }
}
