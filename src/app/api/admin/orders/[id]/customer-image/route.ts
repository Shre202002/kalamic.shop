import { NextRequest, NextResponse } from 'next/server';
import ImageKit from 'imagekit';
import dbConnect from '@/lib/db';
import OrderedItem from '@/lib/models/OrderedItem';
import { requireAdmin } from '@/lib/server-auth';
import { consumeRateLimit } from '@/lib/security/rate-limit';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { session } = await requireAdmin(['super_admin', 'admin', 'support']);
    if (!await consumeRateLimit(`customer-image-download:${session.uid}`, 30, 10 * 60 * 1000)) return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
    await dbConnect();
    const { id } = await params;
    const order: any = await OrderedItem.findById(id).select('items').lean();
    if (!order) return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    const assetId = String(new URL(req.url).searchParams.get('assetId') || '');
    const item = order.items?.find((entry: any) => entry.customerImage?.assetId === assetId);
    if (!item?.customerImage?.filePath) return NextResponse.json({ message: 'Image not found' }, { status: 404 });
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
    if (!publicKey || !privateKey || !urlEndpoint) return NextResponse.json({ message: 'Media configuration unavailable' }, { status: 503 });
    const imagekit = new ImageKit({ publicKey, privateKey, urlEndpoint });
    const url = imagekit.url({ path: item.customerImage.filePath, signed: true, expireSeconds: 600 });
    return NextResponse.json({ url, expiresIn: 600 });
  } catch (error: any) { return NextResponse.json({ message: error.message || 'Unauthorized' }, { status: 401 }); }
}
