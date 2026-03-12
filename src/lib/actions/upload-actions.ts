'use server';

/**
 * @fileOverview Server actions for secure file uploads to ImageKit.
 */

import ImageKit from 'imagekit';

/**
 * Uploads a file buffer to ImageKit and returns the optimized CDN URL.
 * @param formData The multipart form data containing the 'file' entry and an optional 'folder'.
 */
export async function uploadToImageKit(formData: FormData) {
  const file = formData.get('file') as File;
  const folder = (formData.get('folder') as string) || '/kalamic/products';
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
