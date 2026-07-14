import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PromoCode from '@/lib/models/PromoCode';
import User from '@/lib/models/User';
import { getAuthenticatedSession } from '@/lib/server-auth';

async function validateAdmin(_adminId?: string) {
  const session = await getAuthenticatedSession();
  if (!session) return null;
  await dbConnect();
  const user = await User.findOne({ firebaseId: session.uid });
  return user && ['super_admin', 'admin'].includes(user.role);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');

    if (!adminId || !(await validateAdmin(adminId))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

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
    const { adminId, ...promoData } = body;

    if (!adminId || !(await validateAdmin(adminId))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

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
