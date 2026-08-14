import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PromoCode from '@/lib/models/PromoCode';
import { requireAdmin } from '@/lib/server-auth';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(['super_admin', 'admin']);

    await dbConnect();
    const codes = await PromoCode.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(codes);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminId: _ignoredAdminId, ...promoData } = body;
    await requireAdmin(['super_admin', 'admin']);

    if (!promoData.code || !promoData.discountValue || promoData.discountValue <= 0) {
      return NextResponse.json({ message: 'Valid code and discount value required' }, { status: 400 });
    }

    if (!['flat', 'percent'].includes(promoData.discountType)) {
      return NextResponse.json({ message: 'Discount type must be flat or percent' }, { status: 400 });
    }

    await dbConnect();
    const newPromo = await PromoCode.create(promoData);
    return NextResponse.json(newPromo, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ message: 'Promo code already exists' }, { status: 409 });
    }
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
