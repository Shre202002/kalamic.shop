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
 * @fileOverview Secure Cashfree Webhook Handler.
 * Transitions order from 'Initiated' to 'Placed' upon successful reconciliation.
 */

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature');

    if (!signature) {
      return NextResponse.json({ message: 'Missing signature' }, { status: 401 });
    }

    // 1. Signature Verification
    const isValid = await verifyCashfreeSignature(rawBody, signature);
    if (!isValid) {
      console.error('[WEBHOOK_INVALID_SIGNATURE]');
      return NextResponse.json({ message: 'Invalid signature' }, { status: 403 });
    }

    const payload = JSON.parse(rawBody);
    const { order_id } = payload.data.order;

    // 2. Server-to-Gateway Confirmation (Trusted Source)
    const cfOrder = await getCashfreeOrderStatus(order_id);

    if (cfOrder.order_status === 'PAID') {
      console.log(`[PAYMENT_SUCCESS] Reconciling: ${order_id}`);
      
      // 3. Atomic Update in MongoDB - only update if not already verified
      const updatedOrder = await OrderedItem.findOneAndUpdate(
        { orderNumber: order_id, paymentVerified: { $ne: true } },
        { 
          $set: {
            paymentStatus: 'paid',
            paymentVerified: true,
            paymentId: cfOrder.cf_order_id || cfOrder.order_id,
            paymentTimestamp: new Date(),
            transactionId: cfOrder.cf_order_id || cfOrder.order_id,
            orderStatus: 'Placed'
          }
        },
        { new: true }
      );

      if (updatedOrder) {
        // 4. Create Admin Notification
        await AdminNotification.create({
          type: 'order_placed',
          title: 'Acquisition Confirmed',
          message: `${updatedOrder.userName} finalized payment for order ${updatedOrder.orderNumber} (₹${updatedOrder.totalAmount.toLocaleString()})`,
          link: `/admin/orders`
        });

        // 5. Sync to Firestore
        await syncOrderToFirestore(updatedOrder);

        // 6. Next.js Cache Invalidation
        revalidatePath(`/orders/${updatedOrder.orderNumber}`);
        revalidatePath('/orders');

        // 7. Update Product Analytics (Acquisitions)
        for (const item of updatedOrder.items) {
          await KalamicProduct.findByIdAndUpdate(item.productId, {
            $inc: { 'analytics.total_orders': item.quantity }
          });
        }

        // 8. Notify Admins via Email
        const admins = await User.find({ role: { $in: ['super_admin', 'admin'] } });
        const adminEmails = admins.map(a => a.email).filter(Boolean) as string[];

        if (adminEmails.length > 0) {
          try {
            await sendEmail({
              to: adminEmails.join(','),
              subject: `Confirmed: New Order ${updatedOrder.orderNumber} Paid`,
              text: `Payment verified for order ${updatedOrder.orderNumber}. Collector: ${updatedOrder.userName}. Total: ₹${updatedOrder.totalAmount}.`,
              html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;"><h2>Payment Verified</h2><p>Order <b>${updatedOrder.orderNumber}</b> has been successfully paid and moved to the workshop queue.</p></div>`
            });
          } catch (e) {
            console.error('[NOTIFY_ADMIN_ERROR] Email failed:', e);
          }
        }
      } else {
        console.warn(`[WEBHOOK_WARNING] Payment received for already verified or unknown order: ${order_id}`);
      }
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('[WEBHOOK_INTERNAL_ERROR]:', error.message);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
