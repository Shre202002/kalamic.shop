import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import GalleryItem from '@/lib/models/GalleryItem';
import User from '@/lib/models/User';
import { getAuthenticatedSession } from '@/lib/server-auth';

async function validateAdmin(_userId?: string) {
  const session = await getAuthenticatedSession();
  if (!session) return null;
  await dbConnect();
  const user = await User.findOne({ firebaseId: session.uid });
  return user && ['super_admin', 'admin'].includes(user.role);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const adminId = searchParams.get('adminId');

  if (!adminId || !(await validateAdmin(adminId))) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  await dbConnect();
  const items = await GalleryItem.find({ mediaType: 'image' })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  try {
    const { url, alt, adminId, fileId, name } = await req.json();

    if (!adminId || !(await validateAdmin(adminId))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    // Prevent duplicates by URL or FileID
    const existing = await GalleryItem.findOne({ $or: [{ url }, { fileId }] });
    if (existing) {
      return NextResponse.json(existing);
    }

    const newItem = await GalleryItem.create({
      name: name || 'Gallery Item',
      url,
      altText: alt || 'Artisan visual',
      fileId,
      mediaType: 'image',
      format: 'webp',
      uploadedBy: adminId
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
