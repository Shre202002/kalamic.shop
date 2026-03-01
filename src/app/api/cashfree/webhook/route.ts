import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import OrderedItem from '@/lib/models/OrderedItem';
import { verifyCashfreeSignature, getCashfreeOrderStatus } from '@/lib/actions/cashfree';

/**
 * @fileOverview Secure Cashfree Webhook Handler.
 * Verifies signature and performs a proactive server-to-gateway status check.
 */

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature');

    if (!signature) {
      return NextResponse.json({ message: 'Missing signature' }, { status: 401 });
    }

    // 1. Validate Signature
    const isValid = await verifyCashfreeSignature(rawBody, signature);
    if (!isValid) {
      console.error('[WEBHOOK_INVALID_SIGNATURE]');
      return NextResponse.json({ message: 'Invalid signature' }, { status: 403 });
    }

    const payload = JSON.parse(rawBody);
    const { order_id } = payload.data.order;

    // 2. PROACTIVE VERIFICATION (Server-to-Gateway)
    // We don't trust the payload alone; we fetch the status directly from Cashfree.
    const cfOrder = await getCashfreeOrderStatus(order_id);

    if (cfOrder.order_status === 'PAID') {
      console.log(`[PAYMENT_SUCCESS] Verified order: ${order_id}`);
      
      await OrderedItem.findOneAndUpdate(
        { order_number: order_id },
        { 
          payment_status: 'paid',
          payment_verified: true,
          payment_id: cfOrder.cf_order_id || cfOrder.order_id,
          payment_timestamp: new Date(),
          transaction_id: cfOrder.cf_order_id || cfOrder.order_id // Store ref
        }
      );
    } else {
      console.log(`[PAYMENT_UPDATE] Status for ${order_id} is ${cfOrder.order_status}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('[WEBHOOK_ERROR]:', error.message);
    return NextResponse.json({ message: 'Webhook internal error' }, { status: 500 });
  }
}
