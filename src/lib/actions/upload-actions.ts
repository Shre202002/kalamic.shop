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
