import { NextRequest, NextResponse } from 'next/server';
import { calculateOrderCharges } from '@/lib/utils/calculateShipping';
import { consumeApiRateLimit } from '@/lib/security/rate-limit';

/**
 * @fileOverview Pure API for real-time charge calculation on the checkout page.
 * Accepts product-level flags to toggle handling and premium protection fees.
 */

export async function POST(req: NextRequest) {
  try {
    if (!(await consumeApiRateLimit(req, 'calculate-charges', 60))) return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
    const { 
      subtotal, 
      city,
      requiresHandling = true,
      requiresPremiumProtection = true
    } = await req.json();

    if (typeof subtotal !== 'number' || !Number.isFinite(subtotal) || subtotal < 0 || subtotal > 10_000_000 || typeof requiresHandling !== 'boolean' || typeof requiresPremiumProtection !== 'boolean') {
      return NextResponse.json({ message: "Invalid subtotal" }, { status: 400 });
    }

    const result = calculateOrderCharges(subtotal, city || "", {
      requiresHandling,
      requiresPremiumProtection
    });

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
