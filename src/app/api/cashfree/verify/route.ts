import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import OrderedItem from '@/lib/models/OrderedItem';
import KalamicProduct from '@/lib/models/KalamicProduct';
import { getCashfreeOrderStatus } from '@/lib/actions/cashfree';
import { syncOrderToFirestore } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');

  if (!orderId) return NextResponse.json({ message: 'Missing orderId' }, { status: 400 });

  await dbConnect();

  try {
    const order = await OrderedItem.findOne({
      $or: [{ orderNumber: orderId }, { gatewayOrderId: orderId }]
    });

    if (!order) return NextResponse.json({ message: 'Order not found' }, { status: 404 });

    if (order.paymentVerified) {
      return NextResponse.json({ success: true, status: order.orderStatus });
    }

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
            transactionId: cfOrder.cf_order_id,
            paymentTimestamp: new Date(),
            orderStatus: 'Confirmed'
          }
        },
        { new: true }
      );

      if (updatedOrder) {
        await syncOrderToFirestore(updatedOrder);
        for (const item of updatedOrder.items) {
          await KalamicProduct.findByIdAndUpdate(item.productId, {
            $inc: { 'analytics.total_orders': item.quantity }
          });
        }
        return NextResponse.json({ success: true, status: 'Confirmed' });
      }
    }

    return NextResponse.json({ success: false, status: order.orderStatus });

  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
