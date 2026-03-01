import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import OrderedItem, { OrderStatus } from '@/lib/models/OrderedItem';
import User from '@/lib/models/User';

/**
 * @fileOverview Secure admin API for updating order status with transition validation.
 */

const ALLOWED_TRANSITIONS: Record<string, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
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
    const currentStatus = order.status;
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    
    if (!allowed.includes(newStatus as OrderStatus)) {
      return NextResponse.json({ 
        message: `Invalid status jump from ${currentStatus} to ${newStatus}` 
      }, { status: 400 });
    }

    // 4. Update
    order.status = newStatus;
    await order.save();

    return NextResponse.json({ success: true, status: order.status });

  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
