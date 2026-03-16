import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import OrderedItem from '@/lib/models/OrderedItem';
import KalamicProduct from '@/lib/models/KalamicProduct';
import AdminNotification from '@/lib/models/AdminNotification';
import User from '@/lib/models/User';
import { sendEmail } from '@/lib/email';
import { verifyCashfreeSignature, getCashfreeOrderStatus } from '@/lib/actions/cashfree';
import { syncOrderToFirestore } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

/**
 * @fileOverview Secure Cashfree Webhook Handler (v2025-01-01 compatible).
 * IMPORTANT: Set this URL in Cashfree Dashboard: https://kalamic.shop/api/cashfree/webhook
 */

export async function POST(req: NextRequest) {
  console.log('[WEBHOOK_RECEIVE] Incoming notification from Cashfree...');
  await dbConnect();

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature');
    const timestamp = req.headers.get('x-webhook-timestamp');

    if (!signature || !timestamp) {
      console.error('[WEBHOOK_ERROR] Missing signature or timestamp');
      return NextResponse.json({ message: 'Missing auth headers' }, { status: 401 });
    }

    // 1. Signature Verification
    const isValid = await verifyCashfreeSignature(rawBody, signature, timestamp);
    if (!isValid) {
      console.error('[WEBHOOK_ERROR] Invalid signature');
      return NextResponse.json({ message: 'Invalid signature' }, { status: 403 });
    }

    const payload = JSON.parse(rawBody);
    const order_id = payload.data?.order?.order_id || payload.order_id;
    console.log(`[WEBHOOK_PROCESSING] Order: ${order_id}, Type: ${payload.type}`);

    // 2. Fetch Source of Truth from Cashfree API
    const cfOrder = await getCashfreeOrderStatus(order_id);

    if (cfOrder.order_status === 'PAID') {
      // 3. Atomic Update in MongoDB
      const updatedOrder = await OrderedItem.findOneAndUpdate(
        { 
          $or: [{ orderNumber: order_id }, { gatewayOrderId: order_id }], 
          paymentVerified: { $ne: true } 
        },
        { 
          $set: {
            paymentStatus: 'paid',
            paymentVerified: true,
            paymentId: cfOrder.cf_order_id || 'manual_sync',
            paymentTimestamp: new Date(),
            transactionId: cfOrder.cf_order_id || 'manual_sync',
            orderStatus: 'Confirmed'
          }
        },
        { new: true }
      );

      if (updatedOrder) {
        console.log(`[WEBHOOK_SUCCESS] Order ${order_id} verified and updated.`);
        
        // 4. Create Admin Notification
        await AdminNotification.create({
          type: 'order_placed',
          title: 'Acquisition Confirmed',
          message: `${updatedOrder.userName} paid ₹${updatedOrder.totalAmount.toLocaleString()} for order ${updatedOrder.orderNumber}`,
          link: `/admin/orders`
        });

        // 5. Sync to Firestore
        await syncOrderToFirestore(updatedOrder);

        // 6. Cache Invalidation
        revalidatePath(`/orders/${updatedOrder.orderNumber}`);
        revalidatePath('/orders');

        // 7. Update Product Analytics
        for (const item of updatedOrder.items) {
          await KalamicProduct.findByIdAndUpdate(item.productId, {
            $inc: { 'analytics.total_orders': item.quantity }
          });
        }

        // 8. Admin Email
        const admins = await User.find({ role: { $in: ['super_admin', 'admin'] } });
        const adminEmails = admins.map(a => a.email).filter(Boolean) as string[];
        if (adminEmails.length > 0) {
          try {
            await sendEmail({
              to: adminEmails.join(','),
              subject: `Confirmed: Order ${updatedOrder.orderNumber} Paid`,
              text: `Payment verified for order ${updatedOrder.orderNumber}.`,
              html: `<h2>Order Confirmed</h2><p>Order <b>${updatedOrder.orderNumber}</b> has been paid.</p>`
            });
          } catch (e) { console.error('[WEBHOOK_EMAIL_ERROR]', e); }
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error('[WEBHOOK_CRITICAL_ERROR]:', error.message);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 200 }); // Return 200 to stop retries
  }
}
