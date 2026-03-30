import { NextRequest, NextResponse } from 'next/server';
import { calculateOrderCharges } from '@/lib/utils/calculateShipping';

/**
 * @fileOverview Pure API for real-time charge calculation on the checkout page.
 */

export async function POST(req: NextRequest) {
  try {
    const { subtotal, city } = await req.json();

    if (typeof subtotal !== 'number' || subtotal < 0) {
      return NextResponse.json({ message: "Invalid subtotal" }, { status: 400 });
    }

    const result = calculateOrderCharges(subtotal, city || "");

    return NextResponse.json({
      charges: {
        shipping: result.shipping,
        handling: result.handling,
        premium: result.premium
      },
      total: result.total,
      freeDelivery: result.freeDelivery
    });

  } catch (error: any) {
    console.error('[CALCULATE_CHARGES_ERROR]', error);
    return NextResponse.json({ message: "Calculation failed" }, { status: 500 });
  }
}
