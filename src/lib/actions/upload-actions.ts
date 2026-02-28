'use server';

/**
 * @fileOverview Server actions for secure file uploads to ImageKit.
 */

import ImageKit from 'imagekit';

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
});

/**
 * Uploads a file buffer to ImageKit and returns the optimized CDN URL.
 * @param formData The multipart form data containing the 'file' entry.
 */
export async function uploadToImageKit(formData: FormData) {
  const file = formData.get('file') as File;
  
  if (!file) {
    throw new Error('No file provided for upload.');
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
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResponse = await imagekit.upload({
      file: buffer,
      fileName: file.name,
      folder: '/kalamic/products',
      useUniqueFileName: true,
    });

    // We store the URL with default transformations for optimized frontend delivery
    // tr:w-800,q-80 provides a good balance of quality and file size
    const baseUrl = process.env.IMAGEKIT_URL_ENDPOINT || '';
    const filePath = uploadResponse.filePath;
    
    // Construct transformation-aware URL
    // Format: endpoint/tr:transformation/path
    const optimizedUrl = `${baseUrl.replace(/\/$/, '')}/tr:w-800,q-80${filePath}`;

    return { 
      success: true, 
      url: optimizedUrl,
      originalUrl: uploadResponse.url 
    };
  } catch (error: any) {
    console.error('[IMAGEKIT] Upload failed:', error);
    throw new Error(error.message || 'Media upload failed. Check server configuration.');
  }
}
