import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import OrderedItem from '@/lib/models/OrderedItem';
import KalamicProduct from '@/lib/models/KalamicProduct';
import { getCashfreeOrderStatus } from '@/lib/actions/cashfree';
import { syncOrderToFirestore } from '@/lib/firebase-admin';

/**
 * @fileOverview Direct Status Reconciliation API.
 * Ensures local database matches payment gateway state.
 */

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) return NextResponse.json({ message: 'Missing ID' }, { status: 400 });

    // 1. Find the order locally
    let order = await OrderedItem.findOne({
      $or: [{ orderNumber: id }, { gatewayOrderId: id }]
    });

    if (!order && /^[0-9a-fA-F]{24}$/.test(id)) {
      order = await OrderedItem.findById(id);
    }

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // If already verified, return early
    if (order.paymentVerified) {
      return NextResponse.json({ orderStatus: order.orderStatus, paymentStatus: 'paid', paymentVerified: true });
    }

    // 2. Fetch fresh status from Cashfree
    try {
      const cfOrder = await getCashfreeOrderStatus(order.orderNumber);

      if (cfOrder.order_status === 'PAID') {
        const updatedOrder = await OrderedItem.findOneAndUpdate(
          { 
            $or: [{ orderNumber: order.orderNumber }, { gatewayOrderId: order.orderNumber }], 
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
          
          // Analytics Update
          for (const item of updatedOrder.items) {
            await KalamicProduct.findByIdAndUpdate(item.productId, {
              $inc: { 'analytics.total_orders': item.quantity }
            });
          }
        }

        return NextResponse.json({ 
          orderStatus: updatedOrder?.orderStatus || order.orderStatus, 
          paymentStatus: 'paid', 
          paymentVerified: true 
        });
      }
    } catch (cfError) {
      console.warn(`[RECONCILE_STATUS] Gateway check failed for ${order.orderNumber}:`, cfError);
    }

    return NextResponse.json({ 
      orderStatus: order.orderStatus, 
      paymentStatus: order.paymentStatus,
      paymentVerified: order.paymentVerified
    });

  } catch (error: any) {
    console.error(`[API_ERROR] /api/orders/[id]/status:`, error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
