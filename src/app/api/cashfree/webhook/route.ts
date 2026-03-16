
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import OrderedItem from '@/lib/models/OrderedItem';
import KalamicProduct from '@/lib/models/KalamicProduct';
import AdminNotification from '@/lib/models/AdminNotification';
import { verifyCashfreeSignature } from '@/lib/actions/cashfree';
import { syncOrderToFirestore, clearCartAfterOrder } from '@/lib/firebase-admin';

/**
 * @fileOverview Official Cashfree Webhook Handler (v2025-01-01 protocol).
 * Ensures background synchronization of payment states.
 */

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature');
    const timestamp = req.headers.get('x-webhook-timestamp');

    if (!signature || !timestamp) {
      console.error('[WEBHOOK_DENIED] Missing auth headers');
      return NextResponse.json({ received: true }, { status: 200 }); // Always 200 to stop retries
    }

    const isValid = await verifyCashfreeSignature(rawBody, signature, timestamp);
    if (!isValid) {
      console.error('[WEBHOOK_DENIED] Invalid cryptographic signature');
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const payload = JSON.parse(rawBody);
    const order_id = payload.data?.order?.order_id;
    const payment_status = payload.data?.payment?.payment_status;
    const cf_payment_id = payload.data?.payment?.cf_payment_id;
    const payment_time = payload.data?.payment?.payment_time;

    console.log(`[WEBHOOK_RECEIVE] Order: ${order_id}, Status: ${payment_status}`);

    if (!order_id) return NextResponse.json({ received: true }, { status: 200 });

    const order = await OrderedItem.findOne({
      $or: [{ orderNumber: order_id }, { gatewayOrderId: order_id }]
    });

    if (!order) {
      console.warn(`[WEBHOOK_WARN] Order ${order_id} not found in DB`);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    if (payment_status === 'SUCCESS' && !order.paymentVerified) {
      const updatedOrder = await OrderedItem.findOneAndUpdate(
        { _id: order._id },
        { 
          $set: {
            paymentStatus: 'paid',
            paymentVerified: true,
            paymentId: cf_payment_id,
            transactionId: cf_payment_id,
            paymentTimestamp: new Date(payment_time || Date.now()),
            orderStatus: 'Confirmed',
            updatedAt: new Date()
          }
        },
        { new: true }
      );

      if (updatedOrder) {
        await syncOrderToFirestore(updatedOrder);
        await clearCartAfterOrder(updatedOrder.userId, updatedOrder.items);
        
        await AdminNotification.create({
          type: 'order_placed',
          title: 'Payment Verified (Webhook)',
          message: `${updatedOrder.userName} acquisition confirmed for ${updatedOrder.orderNumber}.`,
          link: `/admin/orders`
        });

        for (const item of updatedOrder.items) {
          await KalamicProduct.findByIdAndUpdate(item.productId, {
            $inc: { 'analytics.total_orders': item.quantity }
          });
        }
        console.log(`[WEBHOOK_SUCCESS] Order ${order_id} verified and cart cleared.`);
      }
    } else if (payment_status === 'FAILED') {
      await OrderedItem.updateOne(
        { _id: order._id },
        { $set: { paymentStatus: 'failed', orderStatus: 'Canceled', updatedAt: new Date() } }
      );
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error('[WEBHOOK_CRITICAL_ERROR]:', error.message);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
