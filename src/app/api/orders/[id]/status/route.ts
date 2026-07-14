import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import OrderedItem from '@/lib/models/OrderedItem';
import { getCapturedPaymentForOrder } from '@/lib/actions/razorpay';
import { finalizePaidOrder } from '@/lib/payments/order-payment';
import { verifySession } from '@/lib/firebase-admin';

/**
 * @fileOverview Direct Status Reconciliation API.
 * Reconciles a signed-in customer's local order with Razorpay.
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

    const sessionToken = req.cookies.get('__session')?.value;
    const sessionUser = sessionToken ? await verifySession(sessionToken) : null;
    if (!sessionUser || sessionUser.uid !== order.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // If already verified, return early
    if (order.paymentVerified) {
      return NextResponse.json({ orderStatus: order.orderStatus, paymentStatus: 'paid', paymentVerified: true });
    }

    // 2. Fetch a captured payment directly from Razorpay.
    try {
      if (order.paymentGateway === 'razorpay' && order.gatewayOrderId) {
        const payment = await getCapturedPaymentForOrder(order.gatewayOrderId);
        const paymentMatches = payment
          && payment.currency === 'INR'
          && Number(payment.amount) === Math.round(order.totalAmount * 100);

        if (paymentMatches) {
          const updatedOrder = await finalizePaidOrder({
            order,
            paymentId: payment.id,
            paidAt: payment.created_at ? new Date(payment.created_at * 1000) : new Date(),
          });
          return NextResponse.json({
            orderStatus: updatedOrder.orderStatus,
            paymentStatus: 'paid',
            paymentVerified: true,
          });
        }
      }
    } catch (gatewayError) {
      console.warn(`[RECONCILE_STATUS] Razorpay check failed for ${order.orderNumber}:`, gatewayError);
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
