
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import KalamicProduct from '@/lib/models/KalamicProduct';
import User from '@/lib/models/User';
import AdminLog from '@/lib/models/AdminLog';

/**
 * @fileOverview Secure update of existing artisan pieces.
 * Explicitly rebuilds nested objects to ensure partial updates don't strip schema fields.
 */

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  
  try {
    const { id } = await params;
    const body = await req.json();
    const { adminId, ...updateData } = body;

    const user = await User.findOne({ firebaseId: adminId });
    if (!user || !['super_admin', 'admin'].includes(user.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    console.log('[API_SAVE_DEBUG] Updating piece:', id);
    console.log('[API_SAVE_DEBUG] Received shipping:', JSON.stringify(updateData.shipping));

    // 1. Process specifications
    if (updateData.specifications) {
      updateData.specifications = updateData.specifications.map((s: any) => ({
        key: s.key?.trim() || 'Feature',
        value: s.value?.trim() || 'Standard',
        commonValue: s.commonValue?.trim() || ''
      }));
    }

    // 2. Prepare atomic update object
    const finalUpdate: any = { 
      ...updateData, 
      updated_by_admin: adminId 
    };

    // 3. Ensure nested shipping fields are explicitly included
    if (updateData.shipping) {
      finalUpdate.shipping = {
        weight_kg: updateData.shipping.weight_kg,
        shape: updateData.shipping.shape,
        package_dimensions_cm: {
          length: updateData.shipping.package_dimensions_cm?.length ?? null,
          width: updateData.shipping.package_dimensions_cm?.width ?? null,
          height: updateData.shipping.package_dimensions_cm?.height ?? null,
          diameter: updateData.shipping.package_dimensions_cm?.diameter ?? null,
        }
      };
    }

    const updated = await KalamicProduct.findByIdAndUpdate(
      id,
      { $set: finalUpdate },
      { new: true, runValidators: true }
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
