import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import OrderedItem from '@/lib/models/OrderedItem';
import { getAuthenticatedSession } from '@/lib/server-auth';

/**
 * @fileOverview API to fetch pending payment orders for a user within last 24 hours.
 */

export async function GET(req: NextRequest) {
  await dbConnect();

  try {
    const session = await getAuthenticatedSession();
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const userId = session.uid;

    // Look for orders from the last 24 hours that aren't verified yet
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const pendingOrders = await OrderedItem.find({
      userId,
      paymentVerified: false,
      paymentStatus: { $ne: 'paid' },
      createdAt: { $gte: dayAgo }
    })
    .select('orderNumber totalAmount createdAt')
    .sort({ createdAt: -1 })
    .lean();

    return NextResponse.json({
      count: pendingOrders.length,
      orders: JSON.parse(JSON.stringify(pendingOrders))
    });

  } catch (error: any) {
    console.error('[API_ERROR] /api/orders/pending:', error.message);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
