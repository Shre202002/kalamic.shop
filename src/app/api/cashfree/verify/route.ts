import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import OrderedItem from '@/lib/models/OrderedItem';
import KalamicProduct from '@/lib/models/KalamicProduct';
import { getCashfreeOrderStatus } from '@/lib/actions/cashfree';
import { syncOrderToFirestore } from '@/lib/firebase-admin';

/**
 * @fileOverview Ground Truth Verification API.
 * Proactively checks with Cashfree when a user returns to the success page.
 */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json({ message: 'Missing orderId' }, { status: 400 });
  }

  await dbConnect();

  try {
    console.log(`[VERIFY_START] Checking order: ${orderId}`);

    // Lookup using robust $or query
    const order = await OrderedItem.findOne({
      $or: [{ orderNumber: orderId }, { gatewayOrderId: orderId }]
    });

    if (!order) {
      console.error(`[VERIFY_ERROR] Order ${orderId} not found in database.`);
      return NextResponse.json({ message: `Order ${orderId} not found.` }, { status: 404 });
    }

    // Return early if already reconciled by webhook
    if (order.paymentVerified) {
      console.log(`[VERIFY_SKIP] Order ${orderId} already verified.`);
      return NextResponse.json({ success: true, status: order.orderStatus });
    }

    // Direct server-to-server check
    const cfOrder = await getCashfreeOrderStatus(orderId);
    console.log(`[VERIFY_GATEWAY_RESPONSE] Status: ${cfOrder.order_status}`);

    if (cfOrder.order_status === 'PAID') {
      const updatedOrder = await OrderedItem.findOneAndUpdate(
        { 
          _id: order._id,
          paymentVerified: { $ne: true }
        },
        { 
          $set: {
            paymentStatus: 'paid',
            paymentVerified: true,
            paymentId: cfOrder.cf_order_id,
            transactionId: cfOrder.cf_order_id,
            paymentTimestamp: new Date(),
            orderStatus: 'Confirmed',
            updatedAt: new Date()
          }
        },
        { new: true }
      );

      if (updatedOrder) {
        await syncOrderToFirestore(updatedOrder);
        
        // Sync product sales analytics
        for (const item of updatedOrder.items) {
          await KalamicProduct.findByIdAndUpdate(item.productId, {
            $inc: { 'analytics.total_orders': item.quantity }
          });
        }
        console.log(`[VERIFY_SUCCESS] Order ${orderId} confirmed.`);
        return NextResponse.json({ success: true, status: 'Confirmed' });
      }
    }

    return NextResponse.json({ success: false, status: order.orderStatus });

  } catch (error: any) {
    console.error(`[VERIFY_CRITICAL] ${error.message}`);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
