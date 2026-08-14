import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db';
import OrderedItem from '@/lib/models/OrderedItem';
import KalamicProduct from '@/lib/models/KalamicProduct';
import CustomerUpload from '@/lib/models/CustomerUpload';
import ImageKit from 'imagekit';

export const runtime = 'nodejs';

function isAuthorized(request: NextRequest) {
  const configured = process.env.CRON_SECRET?.trim();
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  if (!configured || !supplied) return false;
  const expected = Buffer.from(configured);
  const actual = Buffer.from(supplied);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

/** Releases inventory held by abandoned, unpaid checkout orders. */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    await dbConnect();
    const cutoff = new Date(Date.now() - 30 * 60 * 1000);
    const candidates: any[] = await OrderedItem.find({
      paymentStatus: 'pending',
      paymentVerified: false,
      orderStatus: 'Initiated',
      inventoryReserved: true,
      inventoryReleased: false,
      createdAt: { $lt: cutoff },
    }).select('_id orderNumber items').limit(100).lean();

    let releasedOrders = 0;
    for (const order of candidates) {
      const claimed: any = await OrderedItem.findOneAndUpdate(
        { _id: order._id, paymentStatus: 'pending', paymentVerified: false, inventoryReleased: false },
        { $set: { orderStatus: 'Canceled', paymentStatus: 'failed', inventoryReleased: true, updatedAt: new Date() } },
        { new: true }
      );
      if (!claimed) continue;

      await Promise.all((order.items || []).map((item: any) => KalamicProduct.updateOne(
        { _id: item.productId },
        { $inc: { stock: item.quantity } }
      )));
      releasedOrders++;
    }

    const staleAssets: any[] = await CustomerUpload.find({ status: 'pending', expiresAt: { $lt: new Date() } }).select('_id fileId').limit(200).lean();
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
    if (publicKey && privateKey && urlEndpoint) {
      const imagekit = new ImageKit({ publicKey, privateKey, urlEndpoint });
      for (const asset of staleAssets) { try { await imagekit.deleteFile(asset.fileId); } catch {} }
    }
    if (staleAssets.length) await CustomerUpload.updateMany({ _id: { $in: staleAssets.map((asset) => asset._id) } }, { $set: { status: 'deleted' } });

    return NextResponse.json({ success: true, scanned: candidates.length, releasedOrders, deletedCustomerAssets: staleAssets.length });
  } catch (error: any) {
    console.error('[ORDER_CLEANUP_ERROR]', error.message);
    return NextResponse.json({ message: 'Cleanup failed' }, { status: 500 });
  }
}
