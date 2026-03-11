import { NextRequest, NextResponse } from 'next/server';
import ImageKit from 'imagekit';

/**
 * @fileOverview Secure and resilient visual asset upload API.
 * Handles server-side WebP conversion for images with a safe fallback.
 * Checks for both standard and NEXT_PUBLIC environment variables.
 */

const getImageKit = () => {
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

  if (!publicKey || !privateKey || !urlEndpoint) {
    console.error('[IMAGEKIT_CONFIG_ERROR] Missing variables:', {
      hasPublicKey: !!publicKey,
      hasPrivateKey: !!privateKey,
      hasUrlEndpoint: !!urlEndpoint
    });
    throw new Error('Server media configuration is missing.');
  }

  return new ImageKit({ publicKey, privateKey, urlEndpoint });
};

export async function POST(request: NextRequest) {
  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (e) {
      console.error('[GALLERY_UPLOAD] FormData parse error:', e);
      return NextResponse.json(
        { success: false, error: 'Invalid form data structure' },
        { status: 400 }
      );
    }

    const file = formData.get('file') as File | null;
    const name = formData.get('name') as string || 'gallery-item';
    const mediaType = formData.get('mediaType') as string || 'image';
    
    const folder = mediaType === 'video' 
      ? '/kalamic/gallery/videos' 
      : '/kalamic/gallery/images';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file was provided' },
        { status: 400 }
      );
    }

    // 50MB limit
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const slugName = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const timestamp = Date.now();

    let uploadBuffer = fileBuffer;
    let fileName = `${slugName}-${timestamp}`;
    let format = 'webp';
    let width: number | undefined;
    let height: number | undefined;

    if (mediaType === 'image') {
      try {
        const sharpModule = await import('sharp');
        const sharp = sharpModule.default;
        
        const sharpInstance = sharp(fileBuffer).webp({ quality: 85 });
        
        const metadata = await sharp(fileBuffer).metadata();
        if ((metadata.width || 0) > 1200 || (metadata.height || 0) > 1200) {
          sharpInstance.resize(1200, 1200, {
            fit: 'inside',
            withoutEnlargement: true,
          });
        }

        uploadBuffer = await sharpInstance.toBuffer();
        
        const finalMeta = await sharp(uploadBuffer).metadata();
        width = finalMeta.width;
        height = finalMeta.height;
        fileName = `${fileName}.webp`;
        format = 'webp';

      } catch (sharpError: any) {
        console.warn('[SHARP_FALLBACK] Processing failed, uploading original:', sharpError.message);
        uploadBuffer = fileBuffer;
        const ext = file.name.split('.').pop() || 'jpg';
        fileName = `${fileName}.${ext}`;
        format = ext;
      }

    } else if (mediaType === 'video') {
      const validVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'];
      if (!validVideoTypes.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: 'Invalid video format. Use MP4, MOV or WebM.' },
          { status: 400 }
        );
      }
      fileName = `${fileName}.mp4`;
      format = 'mp4';
    }

    let imagekit: ImageKit;
    try {
      imagekit = getImageKit();
    } catch (envError: any) {
      return NextResponse.json(
        { success: false, error: envError.message },
        { status: 500 }
      );
    }

    const uploadResponse = await imagekit.upload({
      file: uploadBuffer,
      fileName,
      folder,
      useUniqueFileName: false,
      tags: ['kalamic', 'gallery', mediaType],
    });

    return NextResponse.json({
      success: true,
      url: uploadResponse.url,
      fileId: uploadResponse.fileId,
      format,
      width: width || uploadResponse.width,
      height: height || uploadResponse.height,
    });

  } catch (error: any) {
    console.error('[GALLERY_UPLOAD_CRASH]:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'The upload server encountered an unexpected error.' 
      },
      { status: 500 }
    );
  }
}
