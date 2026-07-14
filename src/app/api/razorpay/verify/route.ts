import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import OrderedItem from '@/lib/models/OrderedItem';
import {
  fetchRazorpayPayment,
  getCapturedPaymentForOrder,
  verifyRazorpayPaymentSignature,
} from '@/lib/actions/razorpay';
import { finalizePaidOrder, paymentResponse } from '@/lib/payments/order-payment';
import { verifySession } from '@/lib/firebase-admin';

function paymentMatchesOrder(payment: any, order: any) {
  return payment
    && payment.order_id === order.gatewayOrderId
    && payment.currency === 'INR'
    && Number(payment.amount) === Math.round(order.totalAmount * 100)
    && payment.status === 'captured';
}

export async function POST(req: NextRequest) {
  try {
    const {
      orderId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    } = await req.json();

    if (!orderId) {
      return NextResponse.json({ message: 'Missing Kalamic order reference' }, { status: 400 });
    }

    await dbConnect();
    const order = await OrderedItem.findOne({ orderNumber: orderId });
    if (!order || order.paymentGateway !== 'razorpay') {
      return NextResponse.json({ message: 'Razorpay order not found' }, { status: 404 });
    }

    const sessionToken = req.cookies.get('__session')?.value;
    const sessionUser = sessionToken ? await verifySession(sessionToken) : null;
    if (!sessionUser || sessionUser.uid !== order.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (order.paymentVerified) {
      return NextResponse.json(paymentResponse(order, 'Payment already verified'));
    }

    let payment: any = null;

    if (razorpayOrderId && razorpayPaymentId && razorpaySignature) {
      if (razorpayOrderId !== order.gatewayOrderId) {
        return NextResponse.json({ message: 'Payment order does not match' }, { status: 400 });
      }

      const signatureValid = verifyRazorpayPaymentSignature({
        // Razorpay requires the server-stored order id for signature verification.
        razorpayOrderId: order.gatewayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });
      if (!signatureValid) {
        return NextResponse.json({ message: 'Invalid payment signature' }, { status: 400 });
      }

      payment = await fetchRazorpayPayment(razorpayPaymentId);
    } else {
      payment = await getCapturedPaymentForOrder(order.gatewayOrderId);
    }

    if (!paymentMatchesOrder(payment, order)) {
      return NextResponse.json(paymentResponse(order, 'Payment is pending gateway confirmation'));
    }

    const paidOrder = await finalizePaidOrder({
      order,
      paymentId: payment.id,
      paidAt: payment.created_at ? new Date(payment.created_at * 1000) : new Date(),
    });

    return NextResponse.json(paymentResponse(paidOrder, 'Payment verified successfully'));
  } catch (error: any) {
    console.error('[RAZORPAY_VERIFY_ERROR]', error.message);
    return NextResponse.json(
      { message: 'Unable to verify the payment right now' },
      { status: 500 }
    );
  }
}
