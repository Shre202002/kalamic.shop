import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import GalleryItem from '@/lib/models/GalleryItem';
import User from '@/lib/models/User';
import ImageKit from 'imagekit';

const getImageKit = () => {
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

  if (!publicKey || !privateKey || !urlEndpoint) {
    throw new Error('ImageKit environment variables are missing');
  }

  return new ImageKit({ publicKey, privateKey, urlEndpoint });
};

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

    const isAdmin = await validateAdmin(adminId);
    if (!isAdmin) return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });

    await dbConnect();
    const updated = await GalleryItem.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    
    if (!updated) return NextResponse.json({ message: 'Item not found' }, { status: 404 });

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

    if (!adminId) return NextResponse.json({ message: 'Admin ID required' }, { status: 400 });

    const isAdmin = await validateAdmin(adminId);
    if (!isAdmin) return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });

    await dbConnect();
    const item = await GalleryItem.findById(id);
    if (!item) return NextResponse.json({ message: 'Item not found' }, { status: 404 });

    // Delete from ImageKit
    try {
      const imagekit = getImageKit();
      await imagekit.deleteFile(item.fileId);
    } catch (ikError) {
      console.warn('[IMAGEKIT_DELETE_WARNING]', ikError);
    }

    // Delete from MongoDB
    await GalleryItem.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
