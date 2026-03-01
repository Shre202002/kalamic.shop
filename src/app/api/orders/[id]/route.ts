import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import OrderedItem from '@/lib/models/OrderedItem';

/**
 * @fileOverview Secure Acquisition Fetch API.
 * Uses the camelCase OrderedItem model.
 */

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  const { id } = params;

  try {
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