import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import OrderedItem from '@/lib/models/OrderedItem';
import { verifyRazorpayWebhookSignature } from '@/lib/actions/razorpay';
import { finalizePaidOrder, markOrderPaymentFailed } from '@/lib/payments/order-payment';
import { consumeApiRateLimit } from '@/lib/security/rate-limit';

export async function POST(req: NextRequest) {
  try {
    if (!(await consumeApiRateLimit(req, 'razorpay-webhook', 120))) return NextResponse.json({ message: 'Too many webhook requests' }, { status: 429 });
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature || !verifyRazorpayWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ message: 'Invalid webhook signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const payment = event.payload?.payment?.entity;
    const gatewayOrderId = payment?.order_id || event.payload?.order?.entity?.id;

    if (!gatewayOrderId) return NextResponse.json({ received: true });

    await dbConnect();
    const order = await OrderedItem.findOne({ gatewayOrderId, paymentGateway: 'razorpay' });
    if (!order) return NextResponse.json({ received: true });

    if (['payment.captured', 'order.paid'].includes(event.event) && payment?.status === 'captured') {
      const expectedAmount = Math.round(order.totalAmount * 100);
      if (payment.currency !== 'INR' || Number(payment.amount) !== expectedAmount) {
        console.error(`[RAZORPAY_WEBHOOK_MISMATCH] ${order.orderNumber}`);
        return NextResponse.json({ received: true });
      }

      await finalizePaidOrder({
        order,
        paymentId: payment.id,
        paidAt: payment.created_at ? new Date(payment.created_at * 1000) : new Date(),
      });
    } else if (payment?.status === 'failed' || event.event === 'payment.failed') {
      await markOrderPaymentFailed(order);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[RAZORPAY_WEBHOOK_ERROR]', error.message);
    return NextResponse.json({ message: 'Webhook processing failed' }, { status: 500 });
  }
}
