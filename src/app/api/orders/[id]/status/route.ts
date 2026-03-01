import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import OrderedItem from '@/lib/models/OrderedItem';
import { getCashfreeOrderStatus } from '@/lib/actions/cashfree';

/**
 * @fileOverview Direct order status reconciliation API.
 * Used by the order detail page to verify payment without waiting for webhooks.
 */

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  const { id } = params;

  try {
    const order = await OrderedItem.findOne({ order_number: id });
    if (!order) return NextResponse.json({ message: 'Order not found' }, { status: 404 });

    // If already paid in DB, return success
    if (order.payment_status === 'paid') {
      return NextResponse.json({ status: order.status, paymentStatus: 'paid' });
    }

    // Proactively check Cashfree for final status
    const cfOrder = await getCashfreeOrderStatus(id);

    if (cfOrder.order_status === 'PAID') {
      await OrderedItem.findOneAndUpdate(
        { order_number: id },
        { 
          payment_status: 'paid',
          payment_verified: true,
          payment_id: cfOrder.cf_order_id || cfOrder.order_id,
          payment_timestamp: new Date(),
          transaction_id: cfOrder.cf_order_id || cfOrder.order_id
        }
      );
      return NextResponse.json({ status: order.status, paymentStatus: 'paid' });
    }

    return NextResponse.json({ status: order.status, paymentStatus: 'pending' });

  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
