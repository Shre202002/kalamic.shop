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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminId, ...productData } = body;

    const user = await User.findOne({ firebaseId: adminId });
    if (!user || !['super_admin', 'admin'].includes(user.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    // Process specifications to ensure commonValue is explicitly included
    if (productData.specifications) {
      productData.specifications = productData.specifications.map((s: any) => ({
        key: s.key?.trim() || 'Feature',
        value: s.value?.trim() || 'Standard',
        commonValue: s.commonValue?.trim() || ''
      }));
    }

    console.log('[SPECS RECEIVED]:', JSON.stringify(productData.specifications?.slice(0, 2)));

    await dbConnect();
    const product = await KalamicProduct.create({
      ...productData,
      created_by_admin: adminId
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
