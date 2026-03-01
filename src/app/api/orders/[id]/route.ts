import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import OrderedItem from '@/lib/models/OrderedItem';

/**
 * @fileOverview Secure Acquisition Fetch API.
 * Searches by human-readable orderNumber or internal MongoDB _id.
 * Next.js 15: params must be awaited in route handlers.
 */

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json({ message: 'Missing record identifier' }, { status: 400 });
    }

    // Attempt to find by orderNumber first (standard human-readable ref)
    let order = await OrderedItem.findOne({ orderNumber: id }).lean();
    
    // Fallback: search by _id if id looks like a valid MongoDB ObjectId (24 chars hex)
    if (!order && /^[0-9a-fA-F]{24}$/.test(id)) {
      order = await OrderedItem.findById(id).lean();
    }
    
    if (!order) {
      console.warn(`[API] Order lookup failed for ID: ${id}`);
      return NextResponse.json({ message: 'Acquisition record not found' }, { status: 404 });
    }

    return NextResponse.json(JSON.parse(JSON.stringify(order)));
  } catch (error: any) {
    console.error(`[API_ERROR] /api/orders/[id]:`, error.message);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
