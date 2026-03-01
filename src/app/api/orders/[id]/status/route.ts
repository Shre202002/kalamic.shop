
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import OrderedItem from '@/lib/models/OrderedItem';
import { getCashfreeOrderStatus } from '@/lib/actions/cashfree';
import { syncOrderToFirestore } from '@/lib/firebase-admin';

/**
 * @fileOverview Direct Status Reconciliation API.
 * Ensures local database matches payment gateway state using camelCase fields.
 * Triggers Firestore sync on state changes.
 * Next.js 15: params must be awaited in route handlers.
 */

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const order = await OrderedItem.findOne({ orderNumber: id });
    if (!order) return NextResponse.json({ message: 'Order not found' }, { status: 404 });

    // If already verified locally, return early
    if (order.paymentStatus === 'paid' && order.paymentVerified) {
      return NextResponse.json({ orderStatus: order.orderStatus, paymentStatus: 'paid' });
    }

    // Proactive check with Cashfree API
    const cfOrder = await getCashfreeOrderStatus(id);

    if (cfOrder.order_status === 'PAID') {
      const updatedOrder = await OrderedItem.findOneAndUpdate(
        { orderNumber: id },
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
        await syncOrderToFirestore(updatedOrder);
      }

      return NextResponse.json({ orderStatus: updatedOrder?.orderStatus || order.orderStatus, paymentStatus: 'paid' });
    }

    return NextResponse.json({ 
      orderStatus: order.orderStatus, 
      paymentStatus: order.paymentStatus 
    });

  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
