
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import GalleryItem from '@/lib/models/GalleryItem';
import User from '@/lib/models/User';

async function validateAdmin(userId: string) {
  await dbConnect();
  const user = await User.findOne({ firebaseId: userId });
  return user && ['super_admin', 'admin'].includes(user.role);
}

export async function GET(req: NextRequest) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const mediaType = searchParams.get('mediaType');
    const isActive = searchParams.get('isActive');

    const query: any = {};
    if (category && category !== 'All') query.category = category;
    if (mediaType && mediaType !== 'all') query.mediaType = mediaType;
    if (isActive !== null) query.isActive = isActive === 'true';

    const items = await GalleryItem.find(query).sort({ sortOrder: 1, createdAt: -1 }).lean();
    return NextResponse.json(items);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uploadedBy, ...itemData } = body;

    const isAdmin = await validateAdmin(uploadedBy);
    if (!isAdmin) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const newItem = await GalleryItem.create({
      ...itemData,
      uploadedBy
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    console.error('[GALLERY_POST_ERROR]', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
