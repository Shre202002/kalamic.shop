
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import KalamicProduct from '@/lib/models/KalamicProduct';
import User from '@/lib/models/User';
import AdminLog from '@/lib/models/AdminLog';

/**
 * @fileOverview Secure creation of new artisan pieces.
 * Ensures database connection is ready before any model operation to avoid timeouts.
 */

export async function POST(req: NextRequest) {
  await dbConnect();
  
  try {
    const body = await req.json();
    const { adminId, ...productData } = body;

    // 1. Verify Admin
    const user = await User.findOne({ firebaseId: adminId });
    if (!user || !['super_admin', 'admin'].includes(user.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    console.log('[API_SAVE_DEBUG] Incoming shipping data:', JSON.stringify(productData.shipping));

    // 2. Clean specifications
    if (productData.specifications) {
      productData.specifications = productData.specifications.map((s: any) => ({
        key: s.key?.trim() || 'Feature',
        value: s.value?.trim() || 'Standard',
        commonValue: s.commonValue?.trim() || ''
      }));
    }

    // 3. Construct clean product object with explicit shape handling
    const product = await KalamicProduct.create({
      ...productData,
      created_by_admin: adminId,
      shipping: {
        weight_kg: productData.shipping?.weight_kg || 0,
        shape: productData.shipping?.shape || 'rectangular',
        package_dimensions_cm: {
          length: productData.shipping?.package_dimensions_cm?.length ?? null,
          width: productData.shipping?.package_dimensions_cm?.width ?? null,
          height: productData.shipping?.package_dimensions_cm?.height ?? null,
          diameter: productData.shipping?.package_dimensions_cm?.diameter ?? null,
        }
      }
    });

    await AdminLog.create({
      adminId,
      adminName: `${user.firstName || 'Admin'} ${user.lastName || ''}`,
      role: user.role,
      action: 'CREATE_PRODUCT',
      entityType: 'Product',
      entityId: product._id,
      details: `Created new piece: ${product.name}`
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('[API_PRODUCT_POST_ERROR]', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
