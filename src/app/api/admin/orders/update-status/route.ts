import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import OrderedItem, { OrderStatus } from '@/lib/models/OrderedItem';
import User from '@/lib/models/User';
import { syncOrderToFirestore } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email';
import { requireAdmin } from '@/lib/server-auth';

/**
 * @fileOverview Secure admin API for updating order status.
 * Prevents manual transition to 'Placed' (which requires payment verification).
 */

const ALLOWED_TRANSITIONS: Record<string, OrderStatus[]> = {
  Initiated: ['Canceled'], // Admins can cancel abandoned checkouts
  Placed: ['Confirmed', 'Canceled'],
  Confirmed: ['Preparing', 'Canceled'],
  Preparing: ['Developing', 'Canceled'],
  Developing: ['Completed', 'Canceled'],
  Completed: ['Dispatched', 'Canceled'],
  Dispatched: ['Delivered', 'Canceled'],
  Delivered: [],
  Canceled: [],
};

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const { orderId, newStatus } = await req.json();

    // 1. Verify Admin
    const { user: admin } = await requireAdmin(['super_admin', 'admin']);

    // 2. Fetch Order
    const order = await OrderedItem.findById(orderId);
    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // 3. Validate Transition
    const currentStatus = order.orderStatus;
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    
    if (!allowed.includes(newStatus as OrderStatus)) {
      return NextResponse.json({ 
        message: `Invalid status transition from ${currentStatus} to ${newStatus}` 
      }, { status: 400 });
    }

    // 4. Update MongoDB
    order.orderStatus = newStatus;
    await order.save();

    // 5. Sync to Firestore for real-time UI updates
    await syncOrderToFirestore(order);

    // 6. Notify the customer after every successful admin status transition.
    // Email delivery is deliberately non-blocking: the order status must remain
    // updated even when SMTP is temporarily unavailable.
    const customerProfile: any = await User.findOne({ firebaseId: order.userId })
      .select('firstName email')
      .lean();
    const customerEmail = order.userEmail || customerProfile?.email;
    if (customerEmail) {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.kalamic.shop';
        const escapeHtml = (value: unknown) => String(value ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
        const firstName = String(customerProfile?.firstName || order.userName || 'there')
          .trim()
          .split(/\s+/)[0] || 'there';
        const statusCopy: Record<OrderStatus, { subject: string; headline: string; message: string }> = {
          Initiated: {
            subject: 'Your Kalamic order has been initiated',
            headline: 'Your order journey has begun',
            message: 'We have started preparing your order record and will keep you updated as it moves through our studio.',
          },
          Placed: {
            subject: 'Your Kalamic order is placed',
            headline: 'Your order is safely placed',
            message: 'Your payment and order details have been recorded successfully. Our artisans will take it from here.',
          },
          Confirmed: {
            subject: 'Your Kalamic order is confirmed',
            headline: 'Your order is confirmed',
            message: 'Thank you for choosing Kalamic. Your order has been reviewed and confirmed by our studio team.',
          },
          Preparing: {
            subject: 'Your Kalamic order is being prepared',
            headline: 'Your order is being prepared',
            message: 'Our studio team is carefully preparing your handcrafted pieces for the next stage of their journey.',
          },
          Developing: {
            subject: 'Your Kalamic order is in development',
            headline: 'Your handcrafted order is taking shape',
            message: 'Your order is now in the development stage, where our artisans are refining and completing the details.',
          },
          Completed: {
            subject: 'Your Kalamic order is completed',
            headline: 'Your order is ready for dispatch',
            message: 'The studio work on your order is complete. We are preparing it for careful handover to the delivery partner.',
          },
          Dispatched: {
            subject: 'Your Kalamic order is on its way',
            headline: 'Your order has been dispatched',
            message: 'Your Kalamic parcel has left our studio and is now on its way to your delivery address.',
          },
          Delivered: {
            subject: 'Your Kalamic order has been delivered',
            headline: 'Your order has arrived',
            message: 'We hope your handcrafted piece brings warmth and character to your space. Thank you for supporting Indian craft.',
          },
          Canceled: {
            subject: 'Your Kalamic order was canceled',
            headline: 'Your order has been canceled',
            message: 'The status of your order has been changed to canceled. Please contact our studio team if you need help with the next steps.',
          },
        };
        const copy = statusCopy[newStatus as OrderStatus];
        const trackingUrl = `${appUrl.replace(/\/$/, '')}/orders/${encodeURIComponent(order.orderNumber)}`;
        await sendEmail({
          to: customerEmail,
          subject: copy.subject,
          text: `Hi ${firstName}, ${copy.message} Order ${order.orderNumber} is now ${newStatus}. Track it at ${trackingUrl}`,
          html: `<div style="margin:0;background:#FAF4EB;padding:32px 16px;font-family:Arial,sans-serif;color:#271E1B;"><div style="max-width:620px;margin:0 auto;background:#fff;border-top:6px solid #EA781E;border-radius:18px;padding:32px;box-shadow:0 8px 24px rgba(39,30,27,.08);"><div style="font-family:Georgia,serif;font-size:32px;font-weight:700;color:#EA781E;margin-bottom:24px;">Kalamic</div><p style="font-size:16px;margin:0 0 12px;">Hi ${escapeHtml(firstName)},</p><h1 style="font-family:Georgia,serif;color:#4D6FAE;font-size:28px;margin:0 0 16px;">${escapeHtml(copy.headline)}</h1><p style="font-size:16px;line-height:1.65;margin:0 0 20px;">${escapeHtml(copy.message)}</p><div style="background:#FAF4EB;border-radius:12px;padding:16px;margin:20px 0;"><strong>Order:</strong> ${escapeHtml(order.orderNumber)}<br><strong>Updated status:</strong> ${escapeHtml(newStatus)}</div><a href="${escapeHtml(trackingUrl)}" style="display:inline-block;background:#EA781E;color:#fff;text-decoration:none;font-weight:700;padding:13px 20px;border-radius:10px;">Track your order</a><p style="font-size:12px;color:#765F50;margin:24px 0 0;">With care from Kanpur,<br>Kalamic Artisan Studio</p></div></div>`
        });
      } catch (emailError) {
        console.error('[NOTIFY_ERROR] Email delivery failed:', emailError);
      }
    }

    return NextResponse.json({ success: true, status: order.orderStatus });

  } catch (error: any) {
    console.error('[UPDATE_STATUS_ERROR]:', error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
