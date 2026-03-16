import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import OrderedItem from '@/lib/models/OrderedItem';
import KalamicProduct from '@/lib/models/KalamicProduct';
import { getCashfreeOrderStatus } from '@/lib/actions/cashfree';
import { syncOrderToFirestore } from '@/lib/firebase-admin';

/**
 * @fileOverview Direct Payment Verification API.
 * Called by the frontend checkout page after redirect from gateway.
 */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json({ message: 'Missing orderId parameter' }, { status: 400 });
  }

  console.log(`[VERIFY_API] Request received for Order: ${orderId}`);
  await dbConnect();

  try {
    // 1. Check local DB first
    const order = await OrderedItem.findOne({
      $or: [{ orderNumber: orderId }, { gatewayOrderId: orderId }]
    });

    if (!order) {
      console.error(`[VERIFY_API] Order ${orderId} not found in database.`);
      return NextResponse.json({ message: `Order ${orderId} not found` }, { status: 404 });
    }

    // If already verified by webhook, return early
    if (order.paymentVerified) {
      console.log(`[VERIFY_API] Order ${orderId} already verified by webhook.`);
      return NextResponse.json({ success: true, status: order.orderStatus, alreadyVerified: true });
    }

    // 2. Proactive check with Cashfree
    const cfOrder = await getCashfreeOrderStatus(orderId);

    if (cfOrder.order_status === 'PAID') {
      const updatedOrder = await OrderedItem.findOneAndUpdate(
        { 
          $or: [{ orderNumber: orderId }, { gatewayOrderId: orderId }],
          paymentVerified: { $ne: true }
        },
        { 
          $set: {
            paymentStatus: 'paid',
            paymentVerified: true,
            paymentId: cfOrder.cf_order_id,
            paymentTimestamp: new Date(),
            transactionId: cfOrder.cf_order_id,
            orderStatus: 'Confirmed'
          }
        },
        { new: true }
      );

      if (updatedOrder) {
        await syncOrderToFirestore(updatedOrder);
        
        // Update Analytics
        for (const item of updatedOrder.items) {
          await KalamicProduct.findByIdAndUpdate(item.productId, {
            $inc: { 'analytics.total_orders': item.quantity }
          });
        }
        
        console.log(`[VERIFY_API] Order ${orderId} confirmed via direct API check.`);
        return NextResponse.json({ success: true, status: 'Confirmed' });
      }
    }

    console.log(`[VERIFY_API] Order ${orderId} status remains: ${cfOrder.order_status}`);
    return NextResponse.json({ success: false, status: order.orderStatus });

  } catch (error: any) {
    console.error('[VERIFY_API_ERROR]:', error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
