import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import OrderedItem, { OrderStatus } from '@/lib/models/OrderedItem';
import User from '@/lib/models/User';
import { syncOrderToFirestore } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email';

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
    const { adminId, orderId, newStatus } = await req.json();

    // 1. Verify Admin
    const admin = await User.findOne({ firebaseId: adminId });
    if (!admin || !['super_admin', 'admin'].includes(admin.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

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

    // 6. Notify Collector via Email
    if (order.userEmail && ['Placed', 'Confirmed', 'Dispatched', 'Delivered'].includes(newStatus)) {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kalamic.shop';
        await sendEmail({
          to: order.userEmail,
          subject: `Status Update: Order ${order.orderNumber} is now ${newStatus}`,
          text: `Your order status has changed to ${newStatus}.`,
          html: `<div style="font-family: sans-serif; padding: 20px;"><h2>Status Update</h2><p>Your order <b>${order.orderNumber}</b> is now <b>${newStatus}</b>.</p><a href="${appUrl}/orders/${order.orderNumber}">Track Here</a></div>`
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
