'use server';

/**
 * @fileOverview Server actions for secure file uploads to ImageKit.
 */

import ImageKit from 'imagekit';
import { getAuthenticatedSession, requireAdmin } from '@/lib/server-auth';
import { consumeRateLimit } from '@/lib/security/rate-limit';
import dbConnect from '@/lib/db';
import OrderedItem from '@/lib/models/OrderedItem';
import KalamicProduct from '@/lib/models/KalamicProduct';
import CustomerUpload from '@/lib/models/CustomerUpload';
import sharp from 'sharp';
import crypto from 'crypto';

/**
 * Uploads a file buffer to ImageKit and returns the optimized CDN URL.
 * @param formData The multipart form data containing the 'file' entry and an optional 'folder'.
 */
export async function uploadToImageKit(formData: FormData) {
  const { session } = await requireAdmin(['super_admin', 'admin']);
  if (!await consumeRateLimit(`upload:${session.uid}`, 30, 10 * 60 * 1000)) {
    throw new Error('Upload rate limit exceeded. Please try again later.');
  }

  const file = formData.get('file') as File;
  const requestedFolder = (formData.get('folder') as string) || '/kalamic/products';
  const allowedFolders = new Set(['/kalamic/products', '/kalamic/blogs']);
  if (!allowedFolders.has(requestedFolder)) {
    throw new Error('Invalid upload folder.');
  }
  const folder = requestedFolder;
  const seoName = formData.get('seoName') as string | null; // ← ADD THIS



  if (!file) {
    throw new Error('No file provided for upload.');
  }

  // Validate environment variables - checking both variants for robustness
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

  if (!publicKey || !privateKey || !urlEndpoint) {
    console.error('[IMAGEKIT] Missing configuration environment variables.');
    throw new Error('Server media configuration is missing. Please check ImageKit environment variables.');
  }



  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload JPG, PNG or WebP.');
  }

  // Validate file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File is too large. Maximum size is 5MB.');
  }

  try {
    const imagekit = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const slugName = seoName
      ? seoName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 80)
      : `handcrafted-ceramic-decor`;

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const seoFileName = `${slugName}.${ext}`; // e.g. "handcrafted-ceramic-owl-photo-frame.jpg"

    const uploadResponse = await imagekit.upload({
      file: buffer,
      fileName: seoFileName || `artisan-piece-${Date.now()}`,
      folder: folder,
      useUniqueFileName: true,
      tags: ['kalamic', 'ceramic', 'handcrafted', 'decor'],
    });

    // We store the URL with default transformations for optimized frontend delivery
    const baseUrl = urlEndpoint.replace(/\/$/, '');
    const filePath = uploadResponse.filePath;

    // Construct transformation-aware URL: tr:w-800,q-80 ensures optimized delivery
    const optimizedUrl = `${baseUrl}/tr:w-800,q-80${filePath}`;

    return {
      success: true,
      url: optimizedUrl,
      originalUrl: uploadResponse.url
    };
  } catch (error: any) {
    console.error('[IMAGEKIT] Upload execution failed:', error);
    throw new Error(error.message || 'The ImageKit server responded with an error.');
  }
}

const REVIEW_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const REVIEW_VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

function hasSafeMediaSignature(bytes: Uint8Array, type: string) {
  const startsWith = (...values: number[]) => values.every((value, index) => bytes[index] === value);
  if (type === 'image/jpeg') return startsWith(0xff, 0xd8, 0xff);
  if (type === 'image/png') return startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  if (type === 'image/webp') return String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  if (type === 'video/webm') return startsWith(0x1a, 0x45, 0xdf, 0xa3);
  if (type === 'video/mp4' || type === 'video/quicktime') return bytes.length > 12 && String.fromCharCode(...bytes.slice(4, 8)) === 'ftyp';
  return false;
}

/** Secure upload path for media attached to a delivered-customer review. */
export async function uploadReviewMedia(formData: FormData, productId: string) {
  const session = await getAuthenticatedSession();
  if (!session) throw new Error('Unauthorized');
  if (typeof productId !== 'string' || productId.length > 100) throw new Error('Invalid product.');
  if (!await consumeRateLimit(`review-upload:${session.uid}`, 6, 60 * 60 * 1000)) {
    throw new Error('Review upload rate limit exceeded.');
  }

  await dbConnect();
  const [product, deliveredOrder] = await Promise.all([
    KalamicProduct.findById(productId).select('_id').lean(),
    OrderedItem.findOne({ userId: session.uid, 'items.productId': productId, orderStatus: 'Delivered' }).select('_id').lean(),
  ]);
  if (!product || !deliveredOrder) throw new Error('Only verified owners can upload review media.');

  const file = formData.get('file');
  if (!(file instanceof File)) throw new Error('No media file provided.');
  const isImage = REVIEW_IMAGE_TYPES.has(file.type);
  const isVideo = REVIEW_VIDEO_TYPES.has(file.type);
  if (!isImage && !isVideo) throw new Error('Only JPG, PNG, WebP, MP4, MOV, or WebM files are allowed.');

  const maxBytes = isVideo ? 25 * 1024 * 1024 : 5 * 1024 * 1024;
  if (file.size <= 0 || file.size > maxBytes) throw new Error(`Media is too large. Maximum size is ${isVideo ? '25MB' : '5MB'}.`);

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasSafeMediaSignature(bytes, file.type)) throw new Error('The file content does not match its media type.');

  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
  if (!publicKey || !privateKey || !urlEndpoint) throw new Error('Server media configuration is missing.');

  const baseName = (formData.get('fileName') as string || 'review-media')
    .toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'review-media';
  const extension = isVideo ? (file.type === 'video/webm' ? 'webm' : file.type === 'video/quicktime' ? 'mov' : 'mp4') : file.type.split('/')[1];

  try {
    const imagekit = new ImageKit({ publicKey, privateKey, urlEndpoint });
    const uploadResponse = await imagekit.upload({
      file: Buffer.from(bytes),
      fileName: `${baseName}.${extension}`,
      folder: '/kalamic/reviews',
      useUniqueFileName: true,
      tags: ['kalamic', 'review-media'],
    });
    return { success: true, url: uploadResponse.url, mediaType: isVideo ? 'video' : 'image' };
  } catch (error: any) {
    console.error('[REVIEW_MEDIA_UPLOAD_ERROR]', error instanceof Error ? error.message : 'unknown');
    throw new Error('Review media upload failed.');
  }
}

const CUSTOMER_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
function safeName(value: string, fallback: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || fallback;
}

/** Validates, sanitizes, and stores a private customer image for a configurable product. */
export async function uploadCustomerProductImage(formData: FormData, productId: string, draftId: string) {
 try {
  const session = await getAuthenticatedSession();
  if (!session) throw new Error('Please sign in before uploading an image.');
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(draftId) || !/^[a-f\d]{24}$/i.test(productId)) throw new Error('Invalid upload request.');
  if (!await consumeRateLimit(`customer-image:${session.uid}`, 8, 60 * 60 * 1000)) throw new Error('Upload rate limit exceeded.');
  await dbConnect();
  const product: any = await KalamicProduct.findOne({ _id: productId, is_active: true, is_deleted: { $ne: true } })
    .select('name requiresCustomerImage customerImageWidth customerImageHeight customerImageMinWidth customerImageMinHeight').lean();
  if (!product || !product.requiresCustomerImage) throw new Error('This product does not require a customer image.');
  const file = formData.get('file');
  if (!(file instanceof File) || !CUSTOMER_IMAGE_TYPES.has(file.type)) throw new Error('Only JPG, PNG, or WebP images are allowed.');
  if (file.size <= 0 || file.size > 5 * 1024 * 1024) throw new Error('Image must be 5MB or smaller.');
  const bytes = Buffer.from(await file.arrayBuffer());
  let meta: sharp.Metadata;
  try { meta = await sharp(bytes, { limitInputPixels: 64_000_000 }).metadata(); } catch { throw new Error('The image is malformed or unsupported.'); }
  const width = meta.width || 0, height = meta.height || 0;
  if (!width || !height || width > 8000 || height > 8000) throw new Error('Image dimensions must be valid and no larger than 8000 × 8000 pixels.');
  if (width < (product.customerImageMinWidth || 0) || height < (product.customerImageMinHeight || 0)) throw new Error(`Image must be at least ${product.customerImageMinWidth || 0} × ${product.customerImageMinHeight || 0} pixels.`);
  if (product.customerImageWidth && product.customerImageHeight) {
    const expected = product.customerImageWidth / product.customerImageHeight;
    if (Math.abs(width / height - expected) / expected > 0.10) throw new Error(`Please upload an image close to the required ${product.customerImageWidth} × ${product.customerImageHeight} ratio.`);
  }
  const normalized = await sharp(bytes, { limitInputPixels: 64_000_000 }).rotate().webp({ quality: 88 }).toBuffer();
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
  if (!publicKey || !privateKey || !urlEndpoint) throw new Error('Server media configuration is missing.');
  const assetId = crypto.randomUUID();
  const folder = `/Product_Order/_pending/${session.uid}/${draftId}`;
  const fileName = `${safeName(file.name.replace(/\.[^.]+$/, ''), 'customer-image')}-${assetId}.webp`;
  const imagekit = new ImageKit({ publicKey, privateKey, urlEndpoint });
  const old = await CustomerUpload.findOne({ userId: session.uid, productId, draftId, status: 'pending' });
  if (old) { try { await imagekit.deleteFile(old.fileId); } catch {} await CustomerUpload.updateOne({ _id: old._id }, { $set: { status: 'deleted' } }); }
  const uploaded: any = await imagekit.upload({ file: normalized, fileName, folder, useUniqueFileName: false, isPrivateFile: true, tags: ['kalamic', 'customer-order-image'] });
  await CustomerUpload.create({ assetId, userId: session.uid, productId, draftId, fileId: uploaded.fileId, filePath: uploaded.filePath, extension: 'webp', originalName: file.name.slice(0, 180), width, height, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) });
  return { success: true as const, assetId, mediaType: 'image' as const, width, height, originalName: file.name.slice(0, 180), uploadedAt: new Date().toISOString() };
 } catch (error: any) {
  const message = error instanceof Error ? error.message : 'Image upload failed. Please try another image.';
  console.error('[CUSTOMER_IMAGE_UPLOAD_ERROR]', message);
  return { success: false as const, message };
 }
}

export async function removeCustomerProductImage(assetId: string) {
  const session = await getAuthenticatedSession(); if (!session || !/^[0-9a-f-]{36}$/i.test(assetId)) throw new Error('Unauthorized');
  await dbConnect(); const asset: any = await CustomerUpload.findOne({ assetId, userId: session.uid, status: 'pending' });
  if (!asset) return { success: true };
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY; const privateKey = process.env.IMAGEKIT_PRIVATE_KEY; const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
  if (publicKey && privateKey && urlEndpoint) { try { await new ImageKit({ publicKey, privateKey, urlEndpoint }).deleteFile(asset.fileId); } catch {} }
  await CustomerUpload.updateOne({ _id: asset._id }, { $set: { status: 'deleted', expiresAt: new Date() } }); return { success: true };
}
