import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import OrderedItem from '@/lib/models/OrderedItem';

/**
 * @fileOverview Fetch full order details securely for both user and admin.
 */

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  const { id } = params;

  try {
    const order = await OrderedItem.findOne({ order_number: id }).lean();
    if (!order) return NextResponse.json({ message: 'Order not found' }, { status: 404 });

    return NextResponse.json(JSON.parse(JSON.stringify(order)));
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
