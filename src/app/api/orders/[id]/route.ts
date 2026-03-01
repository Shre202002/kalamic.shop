import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import OrderedItem from '@/lib/models/OrderedItem';

/**
 * @fileOverview Secure Acquisition Fetch API.
 * Returns the order with a payment verification flag if not fully processed.
 */

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json({ message: 'Missing record identifier' }, { status: 400 });
    }

    // Attempt to find by orderNumber first
    let order = await OrderedItem.findOne({ orderNumber: id }).lean();
    
    // Fallback: search by _id if id looks like a valid MongoDB ObjectId
    if (!order && /^[0-9a-fA-F]{24}$/.test(id)) {
      order = await OrderedItem.findById(id).lean();
    }
    
    if (!order) {
      return NextResponse.json({ message: 'Acquisition record not found' }, { status: 404 });
    }

    // Check for full payment verification
    const isPaymentPending = !(
      order.paymentStatus === 'paid' && 
      order.paymentVerified === true && 
      order.transactionId && 
      order.paymentId && 
      order.paymentTimestamp
    );

    const responseData = {
      ...JSON.parse(JSON.stringify(order)),
      isPaymentPending
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error(`[API_ERROR] /api/orders/[id]:`, error.message);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
