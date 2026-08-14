import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PromoCode from '@/lib/models/PromoCode';
import User from '@/lib/models/User';
import { getAuthenticatedSession } from '@/lib/server-auth';
import { sanitizeMongoUpdate } from '@/lib/security/rate-limit';

async function validateAdmin(_adminId?: string) {
  const session = await getAuthenticatedSession();
  if (!session) return null;
  await dbConnect();
  const user = await User.findOne({ firebaseId: session.uid });
  return user && ['super_admin', 'admin'].includes(user.role);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { adminId: _ignoredAdminId, ...rawUpdateData } = body;
    const updateData = sanitizeMongoUpdate(rawUpdateData);

    if (!(await validateAdmin())) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const updated = await PromoCode.findByIdAndUpdate(
      id, 
      { $set: { ...updateData, updatedAt: new Date() } }, 
      { new: true }
    );
    
    if (!updated) return NextResponse.json({ message: 'Code not found' }, { status: 404 });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');

    if (!(await validateAdmin())) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const deleted = await PromoCode.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ message: 'Code not found' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
