import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import KalamicProduct from '@/lib/models/KalamicProduct';
import User from '@/lib/models/User';
import AdminLog from '@/lib/models/AdminLog';

async function validateAdmin(userId: string) {
  await dbConnect();
  const user = await User.findOne({ firebaseId: userId });
  return user && ['super_admin', 'admin'].includes(user.role);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { adminId, ...updateData } = body;

    const user = await User.findOne({ firebaseId: adminId });
    if (!user || !['super_admin', 'admin'].includes(user.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    // Process specifications to ensure commonValue is explicitly included
    if (updateData.specifications) {
      updateData.specifications = updateData.specifications.map((s: any) => ({
        key: s.key?.trim() || 'Feature',
        value: s.value?.trim() || 'Standard',
        commonValue: s.commonValue?.trim() || ''
      }));
    }

    console.log('[SPECS RECEIVED]:', JSON.stringify(updateData.specifications?.slice(0, 2)));

    await dbConnect();
    const updated = await KalamicProduct.findByIdAndUpdate(
      id,
      { $set: { ...updateData, updated_by_admin: adminId } },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    await AdminLog.create({
      adminId,
      adminName: `${user.firstName || 'Admin'} ${user.lastName || ''}`,
      role: user.role,
      action: 'UPDATE_PRODUCT',
      entityType: 'Product',
      entityId: id,
      details: `Updated piece: ${updated.name}`
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[API_PRODUCT_PATCH_ERROR]', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
