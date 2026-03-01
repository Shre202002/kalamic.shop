
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import OrderedItem from '@/lib/models/OrderedItem';
import { verifyCashfreeSignature, getCashfreeOrderStatus } from '@/lib/actions/cashfree';
import { syncOrderToFirestore } from '@/lib/firebase-admin';

/**
 * @fileOverview Secure Cashfree Webhook Handler.
 * Triggers Firestore synchronization upon successful payment reconciliation.
 */

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature');

    if (!signature) {
      return NextResponse.json({ message: 'Missing signature' }, { status: 401 });
    }

    // 1. Signature Verification
    const isValid = await verifyCashfreeSignature(rawBody, signature);
    if (!isValid) {
      console.error('[WEBHOOK_INVALID_SIGNATURE]');
      return NextResponse.json({ message: 'Invalid signature' }, { status: 403 });
    }

    const payload = JSON.parse(rawBody);
    const { order_id } = payload.data.order;

    // 2. Server-to-Gateway Confirmation (Trusted Source)
    const cfOrder = await getCashfreeOrderStatus(order_id);

    if (cfOrder.order_status === 'PAID') {
      console.log(`[PAYMENT_SUCCESS] Reconciling: ${order_id}`);
      
      // 3. Atomic Update in MongoDB
      const updatedOrder = await OrderedItem.findOneAndUpdate(
        { orderNumber: order_id },
        { 
          $set: {
            paymentStatus: 'paid',
            paymentVerified: true,
            paymentId: cfOrder.cf_order_id || cfOrder.order_id,
            paymentTimestamp: new Date(),
            transactionId: cfOrder.cf_order_id || cfOrder.order_id 
          }
        },
        { new: true }
      );

      if (updatedOrder) {
        // 4. Sync to Firestore
        await syncOrderToFirestore(updatedOrder);
      } else {
        console.warn(`[WEBHOOK_WARNING] Payment received for unknown order: ${order_id}`);
      }
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('[WEBHOOK_INTERNAL_ERROR]:', error.message);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
