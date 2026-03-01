
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import OrderedItem, { OrderStatus } from '@/lib/models/OrderedItem';
import User from '@/lib/models/User';
import { syncOrderToFirestore } from '@/lib/firebase-admin';

/**
 * @fileOverview Secure admin API for updating order status with transition validation.
 * Supports Firestore synchronization for cross-database consistency.
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

    // 5. Sync to Firestore
    await syncOrderToFirestore(order);

    return NextResponse.json({ success: true, status: order.orderStatus });

  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
