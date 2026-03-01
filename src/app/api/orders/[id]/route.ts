
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import OrderedItem from '@/lib/models/OrderedItem';

/**
 * @fileOverview Secure Acquisition Fetch API.
 * Uses the camelCase OrderedItem model.
 * Next.js 15: params must be awaited in route handlers.
 */

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Find by unique orderNumber from the Ordered_Items collection
    const order = await OrderedItem.findOne({ orderNumber: id }).lean();
    
    if (!order) {
      return NextResponse.json({ message: 'Acquisition record not found' }, { status: 404 });
    }

    return NextResponse.json(JSON.parse(JSON.stringify(order)));
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
