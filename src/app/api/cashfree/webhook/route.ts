import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import OrderedItem from '@/lib/models/OrderedItem';
import { verifyCashfreeSignature, getCashfreeOrderStatus } from '@/lib/actions/cashfree';

/**
 * @fileOverview Secure Cashfree Webhook Handler.
 * Synchronized with camelCase OrderedItem schema.
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

    // 2. Server-to-Gateway Confirmation
    const cfOrder = await getCashfreeOrderStatus(order_id);

    if (cfOrder.order_status === 'PAID') {
      console.log(`[PAYMENT_SUCCESS] Reconciled order: ${order_id}`);
      
      // 3. Update using correct camelCase fields
      await OrderedItem.findOneAndUpdate(
        { orderNumber: order_id },
        { 
          paymentStatus: 'paid',
          paymentVerified: true,
          paymentId: cfOrder.cf_order_id || cfOrder.order_id,
          paymentTimestamp: new Date(),
          transactionId: cfOrder.cf_order_id || cfOrder.order_id 
        }
      );
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('[WEBHOOK_INTERNAL_ERROR]:', error.message);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}