import { NextRequest, NextResponse } from 'next/server';
import { calculateOrderCharges, isEligibleForFreeDelivery } from '@/lib/utils/calculateShipping';

/**
 * @fileOverview Pure API for real-time charge calculation on the checkout page.
 */

export async function POST(req: NextRequest) {
  try {
    const { subtotal, city } = await req.json();

    if (typeof subtotal !== 'number' || subtotal < 0) {
      return NextResponse.json({ message: "Invalid subtotal" }, { status: 400 });
    }

    const charges = calculateOrderCharges(subtotal, city || "");
    const freeDelivery = isEligibleForFreeDelivery(subtotal, city || "");

    return NextResponse.json({
      charges: {
        shipping: charges.shipping,
        handling: charges.handling,
        premium: charges.premium
      },
      total: charges.total,
      freeDelivery
    });

  } catch (error: any) {
    return NextResponse.json({ message: "Calculation failed" }, { status: 500 });
  }
}
