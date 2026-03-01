import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import OrderedItem from '@/lib/models/OrderedItem';
import { getCashfreeOrderStatus } from '@/lib/actions/cashfree';

/**
 * @fileOverview Direct Status Reconciliation API.
 * Ensures local database matches payment gateway state using camelCase fields.
 */

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  const { id } = params;

  try {
    const order = await OrderedItem.findOne({ orderNumber: id });
    if (!order) return NextResponse.json({ message: 'Order not found' }, { status: 404 });

    // If already verified locally, return early
    if (order.paymentStatus === 'paid' && order.paymentVerified) {
      return NextResponse.json({ orderStatus: order.orderStatus, paymentStatus: 'paid' });
    }

    // Proactive check with Cashfree API
    const cfOrder = await getCashfreeOrderStatus(id);

    if (cfOrder.order_status === 'PAID') {
      await OrderedItem.findOneAndUpdate(
        { orderNumber: id },
        { 
          $set: {
            paymentStatus: 'paid',
            paymentVerified: true,
            paymentId: cfOrder.cf_order_id || cfOrder.order_id,
            paymentTimestamp: new Date(),
            transactionId: cfOrder.cf_order_id || cfOrder.order_id
          }
        }
      );
      return NextResponse.json({ orderStatus: order.orderStatus, paymentStatus: 'paid' });
    }

    return NextResponse.json({ 
      orderStatus: order.orderStatus, 
      paymentStatus: order.paymentStatus 
    });

  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
