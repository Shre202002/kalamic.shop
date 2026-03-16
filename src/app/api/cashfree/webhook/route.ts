import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import OrderedItem from '@/lib/models/OrderedItem';
import KalamicProduct from '@/lib/models/KalamicProduct';
import AdminNotification from '@/lib/models/AdminNotification';
import { verifyCashfreeSignature, getCashfreeOrderStatus } from '@/lib/actions/cashfree';
import { syncOrderToFirestore } from '@/lib/firebase-admin';

// IMPORTANT: Set this URL in Cashfree Dashboard:
// https://kalamic.shop/api/cashfree/webhook (Version 2025-01-01)

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature');
    const timestamp = req.headers.get('x-webhook-timestamp');

    if (!signature || !timestamp) {
      return NextResponse.json({ message: 'Missing signature' }, { status: 401 });
    }

    const isValid = await verifyCashfreeSignature(rawBody, signature, timestamp);
    if (!isValid) {
      console.error('[WEBHOOK] Invalid cryptographic signature');
      return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const order_id = payload.data?.order?.order_id || payload.order_id;
    const payment_status = payload.data?.payment?.payment_status || payload.payment_status;

    console.log(`[WEBHOOK] Order: ${order_id}, Status: ${payment_status}`);

    if (payment_status === 'SUCCESS') {
      // Direct API check for absolute source of truth
      const cfOrder = await getCashfreeOrderStatus(order_id);

      if (cfOrder.order_status === 'PAID') {
        const updatedOrder = await OrderedItem.findOneAndUpdate(
          { 
            $or: [{ orderNumber: order_id }, { gatewayOrderId: order_id }],
            paymentVerified: { $ne: true } 
          },
          { 
            $set: {
              paymentStatus: 'paid',
              paymentVerified: true,
              paymentId: cfOrder.cf_order_id,
              transactionId: cfOrder.cf_order_id,
              paymentTimestamp: new Date(),
              orderStatus: 'Confirmed'
            }
          },
          { new: true }
        );

        if (updatedOrder) {
          await syncOrderToFirestore(updatedOrder);
          
          await AdminNotification.create({
            type: 'order_placed',
            title: 'Payment Verified',
            message: `${updatedOrder.userName} acquired ${updatedOrder.items.length} pieces.`,
            link: `/admin/orders`
          });

          for (const item of updatedOrder.items) {
            await KalamicProduct.findByIdAndUpdate(item.productId, {
              $inc: { 'analytics.total_orders': item.quantity }
            });
          }
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error('[WEBHOOK_CRITICAL]:', error.message);
    return NextResponse.json({ message: 'Processing Error' }, { status: 200 });
  }
}
