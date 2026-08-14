import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import GalleryItem from '@/lib/models/GalleryItem';
import { requireAdmin } from '@/lib/server-auth';

export async function GET(req: NextRequest) {
  const { session } = await requireAdmin(['super_admin', 'admin']);

  await dbConnect();
  const items = await GalleryItem.find({ mediaType: 'image' })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  try {
    const { url, alt, adminId: _ignoredAdminId, fileId, name } = await req.json();
    const { session } = await requireAdmin(['super_admin', 'admin']);

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
      uploadedBy: session.uid
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
