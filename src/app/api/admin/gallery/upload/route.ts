import { NextRequest, NextResponse } from 'next/server';
import ImageKit from 'imagekit';

/**
 * @fileOverview Secure and resilient visual asset upload API.
 * Handles server-side WebP conversion for images with a safe fallback.
 */

const getImageKit = () => {
  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

  if (!publicKey || !privateKey || !urlEndpoint) {
    throw new Error('ImageKit environment variables are missing');
  }

  return new ImageKit({ publicKey, privateKey, urlEndpoint });
};

export async function POST(request: NextRequest) {
  console.log('[GALLERY_UPLOAD] Request received');
  
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
    
    // Aligned with home > kalamic > gallery path requirement
    const folder = mediaType === 'video' 
      ? '/kalamic/gallery/videos' 
      : '/kalamic/gallery/images';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file was provided in the request' },
        { status: 400 }
      );
    }

    console.log(`[GALLERY_UPLOAD] Processing ${mediaType}: ${file.name} (${file.size} bytes)`);

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
        console.log('[GALLERY_UPLOAD] Attempting Sharp processing');
        // Dynamic import to handle potential native module issues in some environments
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
        console.log('[GALLERY_UPLOAD] Sharp processing successful');

      } catch (sharpError: any) {
        // SAFE FALLBACK: If sharp fails (e.g. binary issues), upload original file
        console.warn('[SHARP_FALLBACK] Image processing failed, uploading original:', sharpError.message);
        uploadBuffer = fileBuffer;
        const ext = file.name.split('.').pop() || 'jpg';
        fileName = `${fileName}.${ext}`;
        format = ext;
      }

    } else if (mediaType === 'video') {
      const validVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'];
      if (!validVideoTypes.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: 'Invalid video format. Please use MP4, MOV or WebM.' },
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
      console.error('[GALLERY_UPLOAD] ImageKit Config Error:', envError.message);
      return NextResponse.json(
        { success: false, error: 'Server media configuration is missing.' },
        { status: 500 }
      );
    }

    console.log(`[GALLERY_UPLOAD] Sending to ImageKit folder: ${folder}`);
    const uploadResponse = await imagekit.upload({
      file: uploadBuffer,
      fileName,
      folder,
      useUniqueFileName: false,
      tags: ['kalamic', 'gallery', mediaType],
    });

    console.log('[GALLERY_UPLOAD] ImageKit upload complete:', uploadResponse.fileId);

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
