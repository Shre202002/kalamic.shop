
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import OrderedItem, { OrderStatus } from '@/lib/models/OrderedItem';
import User from '@/lib/models/User';
import { syncOrderToFirestore } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email';

/**
 * @fileOverview Secure admin API for updating order status with transition validation.
 * Supports Firestore synchronization and automated email notifications to collectors.
 */

const ALLOWED_TRANSITIONS: Record<string, OrderStatus[]> = {
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
        message: `Invalid status jump from ${currentStatus} to ${newStatus}` 
      }, { status: 400 });
    }

    // 4. Update MongoDB
    order.orderStatus = newStatus;
    await order.save();

    // 5. Sync to Firestore for real-time UI updates
    await syncOrderToFirestore(order);

    // 6. Notify Collector via Email
    if (order.userEmail) {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kalamic.shop';
        await sendEmail({
          to: order.userEmail,
          subject: `Status Update: Order ${order.orderNumber} is now ${newStatus}`,
          text: `Your Order ${order.orderNumber} status is being updated from ${currentStatus} to ${newStatus}. Please visit the website to view your order status.`,
          html: `
            <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 40px; background-color: #FAF4EB; border-radius: 24px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #C97A40; font-size: 28px; font-weight: 900; margin: 0; letter-spacing: -1px;">Kalamic</h1>
                <p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Artisanal Logistics</p>
              </div>
              
              <div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                <h2 style="color: #271E1B; font-size: 20px; margin-top: 0; font-weight: 800;">Logistics Milestone Reached</h2>
                <p style="color: #444; line-height: 1.6; font-size: 15px;">Hello <strong>${order.userName}</strong>,</p>
                <p style="color: #666; line-height: 1.6; font-size: 14px;">The journey of your handcrafted acquisition <strong>${order.orderNumber}</strong> has progressed to a new stage.</p>
                
                <div style="background: #FAF4EB; padding: 24px; border-radius: 16px; margin: 32px 0; border: 1px solid rgba(201, 122, 64, 0.1);">
                  <div style="margin-bottom: 12px;">
                    <span style="font-size: 10px; font-weight: 800; color: #999; text-transform: uppercase; letter-spacing: 1px;">Previous State</span>
                    <p style="margin: 4px 0 0 0; color: #666; text-decoration: line-through; font-weight: 600;">${currentStatus}</p>
                  </div>
                  <div>
                    <span style="font-size: 10px; font-weight: 800; color: #C97A40; text-transform: uppercase; letter-spacing: 1px;">Current State</span>
                    <p style="margin: 4px 0 0 0; color: #C97A40; font-size: 20px; font-weight: 900;">${newStatus}</p>
                  </div>
                </div>
                
                <div style="text-align: center;">
                  <a href="${appUrl}/orders/${order.orderNumber}" style="display: inline-block; background-color: #C97A40; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 14px; box-shadow: 0 8px 20px rgba(201, 122, 64, 0.2);">Track Acquisition</a>
                </div>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <p style="font-size: 11px; color: #999; line-height: 1.5;">
                  This is an automated update from the Kalamic Studio. <br/>
                  If you have questions, please reach out to our artisans at contact@kalamic.shop
                </p>
              </div>
            </div>
          `
        });
        console.log(`[NOTIFY] Status update email sent to ${order.userEmail}`);
      } catch (emailError: any) {
        console.error('[NOTIFY_ERROR] Email delivery failed:', emailError.message);
        // We continue the response even if email fails to avoid blocking the UI
      }
    }

    return NextResponse.json({ success: true, status: order.orderStatus });

  } catch (error: any) {
    console.error('[UPDATE_STATUS_ERROR]:', error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
