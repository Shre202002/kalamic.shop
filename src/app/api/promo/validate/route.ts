import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PromoCode from '@/lib/models/PromoCode';
import { consumeApiRateLimit } from '@/lib/security/rate-limit';

/**
 * @fileOverview Public API for validating discount codes.
 * Implements strict business rules for activation, expiry, and usage limits.
 */

export async function POST(req: NextRequest) {
  try {
    if (!(await consumeApiRateLimit(req, 'promo-validate', 30))) return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
    const { code, subtotal } = await req.json();

    if (typeof code !== 'string' || code.length > 64 || !/^[A-Z0-9_-]+$/i.test(code.trim()) || typeof subtotal !== 'number' || !Number.isFinite(subtotal) || subtotal < 0 || subtotal > 10_000_000) {
      return NextResponse.json({ success: false, message: "Invalid request payload" }, { status: 400 });
    }

    await dbConnect();
    const cleanCode = code.trim().toUpperCase();

    const promo = await PromoCode.findOne({ code: cleanCode });

    // 1. Existence Check
    if (!promo) {
      return NextResponse.json({ success: false, message: "Invalid promo code" }, { status: 404 });
    }

    // 2. Active Status Check
    if (!promo.isActive) {
      return NextResponse.json({ success: false, message: "This promo code is no longer active" }, { status: 400 });
    }

    // 3. Expiry Check
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      return NextResponse.json({ success: false, message: "This promo code has expired" }, { status: 400 });
    }

    // 4. Usage Limit Check
    if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) {
      return NextResponse.json({ success: false, message: "This promo code has reached its usage limit" }, { status: 400 });
    }

    // 5. Min Order Value Check
    if (subtotal < promo.minOrderValue) {
      return NextResponse.json({ 
        success: false, 
        message: `Minimum order value for this code is ₹${promo.minOrderValue}` 
      }, { status: 400 });
    }

    // 6. Calculate Discount
    let discountAmount = 0;
    if (promo.discountType === 'percent') {
      discountAmount = Math.floor((subtotal * promo.discountValue) / 100);
    } else {
      discountAmount = promo.discountValue;
    }

    // Cap at subtotal to prevent negative totals
    if (discountAmount > subtotal) discountAmount = subtotal;

    return NextResponse.json({
      success: true,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discountAmount,
      message: `${promo.discountType === 'percent' ? promo.discountValue + '%' : '₹' + promo.discountValue} off applied! You save ₹${discountAmount}`
    });

  } catch (error: any) {
    console.error('[PROMO_VALIDATE_ERROR]', error);
    return NextResponse.json({ success: false, message: "Internal server error during validation" }, { status: 500 });
  }
}
