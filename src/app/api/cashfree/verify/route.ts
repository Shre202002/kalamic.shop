import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import OrderedItem from '@/lib/models/OrderedItem';
import KalamicProduct from '@/lib/models/KalamicProduct';
import { getCashfreeOrderStatus } from '@/lib/actions/cashfree';
import { syncOrderToFirestore, clearCartAfterOrder } from '@/lib/firebase-admin';

/**
 * @fileOverview Unified Payment Verification API.
 * Reconciles local order state with Cashfree gateway state.
 */

async function handleVerify(orderId: string | null) {
  if (!orderId) {
    return NextResponse.json({ message: 'Missing orderId' }, { status: 400 });
  }

  await dbConnect();

  try {
    const order = await OrderedItem.findOne({
      $or: [{ orderNumber: orderId }, { gatewayOrderId: orderId }]
    });

    if (!order) {
      return NextResponse.json({ message: `Order ${orderId} not found.` }, { status: 404 });
    }

    // Return if already verified by webhook or previous call
    if (order.paymentVerified) {
      return NextResponse.json({
        success: true,
        paymentVerified: true,
        paymentStatus: order.paymentStatus,
        paymentId: order.paymentId,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        ecommerce: {
          transactionId: order.orderNumber,
          value: order.totalAmount,
          tax: 0,
          shipping: order.charges?.shipping || 0,
          currency: 'INR',
          items: order.items.map((item: any) => ({
            item_id: String(item.productId),
            item_name: item.name,
            item_brand: 'Kalamic',
            price: item.price,
            quantity: item.quantity,
          })),
        },
        message: 'Payment verified successfully'
      });
    }

    // Check with gateway
    const cfOrder = await getCashfreeOrderStatus(orderId);
    const cfStatus = cfOrder.order_status;

    if (cfStatus === 'PAID') {
      const updatedOrder = await OrderedItem.findOneAndUpdate(
        { _id: order._id, paymentVerified: { $ne: true } },
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
        await clearCartAfterOrder(updatedOrder.userId, updatedOrder.items);

        for (const item of updatedOrder.items) {
          await KalamicProduct.findByIdAndUpdate(item.productId, {
            $inc: { 'analytics.total_orders': item.quantity }
          });
        }

        return NextResponse.json({
          success: true,
          paymentVerified: true,
          paymentStatus: 'paid',
          paymentId: updatedOrder.paymentId,
          orderNumber: updatedOrder.orderNumber,
          orderStatus: updatedOrder.orderStatus,
          ecommerce: {
            transactionId: updatedOrder.orderNumber,
            value: updatedOrder.totalAmount,
            tax: 0,
            shipping: updatedOrder.charges?.shipping || 0,
            currency: 'INR',
            items: updatedOrder.items.map((item: any) => ({
              item_id: String(item.productId),
              item_name: item.name,
              item_brand: 'Kalamic',
              price: item.price,
              quantity: item.quantity,
            })),
          },
          message: 'Payment verified successfully'
        });
      }
    } else if (['FAILED', 'CANCELLED', 'USER_DROPPED'].includes(cfStatus)) {
      const updatedOrder = await OrderedItem.findOneAndUpdate(
        { _id: order._id },
        {
          $set: {
            paymentStatus: 'failed',
            paymentVerified: false,
            orderStatus: 'Cancelled',
            updatedAt: new Date()
          }
        },
        { new: true }
      );

      return NextResponse.json({
        success: true,
        paymentVerified: false,
        paymentStatus: 'failed',
        paymentId: null,
        orderNumber: updatedOrder?.orderNumber || order.orderNumber,
        orderStatus: 'Cancelled',
        message: 'Payment failed or was cancelled'
      });
    }

    return NextResponse.json({
      success: true,
      paymentVerified: order.paymentVerified,
      paymentStatus: order.paymentStatus,
      paymentId: order.paymentId || null,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      message: 'Payment pending verification'
    });

  } catch (error: any) {
    console.error(`[VERIFY_API_ERROR] ${error.message}`);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');
  return handleVerify(orderId);
}

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    return handleVerify(orderId);
  } catch {
    return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
  }
}
