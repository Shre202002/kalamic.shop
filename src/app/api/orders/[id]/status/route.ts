import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import OrderedItem from '@/lib/models/OrderedItem';
import { getCashfreeOrderStatus } from '@/lib/actions/cashfree';

/**
 * @fileOverview Direct order status reconciliation API.
 * Uses camelCase fields matching the schema.
 */

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  const { id } = params;

  try {
    const order = await OrderedItem.findOne({ orderNumber: id });
    if (!order) return NextResponse.json({ message: 'Order not found' }, { status: 404 });

    if (order.paymentStatus === 'paid') {
      return NextResponse.json({ status: order.orderStatus, paymentStatus: 'paid' });
    }

    // Check with Cashfree directly
    const cfOrder = await getCashfreeOrderStatus(id);

    if (cfOrder.order_status === 'PAID') {
      await OrderedItem.findOneAndUpdate(
        { orderNumber: id },
        { 
          paymentStatus: 'paid',
          paymentVerified: true,
          paymentId: cfOrder.cf_order_id || cfOrder.order_id,
          paymentTimestamp: new Date(),
          transactionId: cfOrder.cf_order_id || cfOrder.order_id
        }
      );
      return NextResponse.json({ status: order.orderStatus, paymentStatus: 'paid' });
    }

    return NextResponse.json({ status: order.orderStatus, paymentStatus: 'pending' });

  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
