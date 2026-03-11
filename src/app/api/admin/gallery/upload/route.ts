
import { NextRequest, NextResponse } from 'next/server';
import ImageKit from 'imagekit';
import sharp from 'sharp';
import { Readable } from 'stream';
import { getVideoDurationInSeconds } from 'get-video-duration';

const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const type = formData.get('type') as 'image' | 'video';

    if (!file) return NextResponse.json({ message: 'No file provided' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const slugifiedName = (name || 'gallery-item').toLowerCase().replace(/[^a-z0-9]/g, '-');

    if (type === 'image') {
      // Process with Sharp: Resize and convert to WebP
      const webpBuffer = await sharp(buffer)
        .webp({ quality: 85 })
        .resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .toBuffer();

      const metadata = await sharp(webpBuffer).metadata();

      const uploadResponse = await imagekit.upload({
        file: webpBuffer,
        fileName: `${slugifiedName}-${Date.now()}.webp`,
        folder: '/kalamic/gallery/images/',
        useUniqueFileName: true,
      });

      return NextResponse.json({
        url: uploadResponse.url,
        fileId: uploadResponse.fileId,
        format: 'webp',
        width: metadata.width,
        height: metadata.height
      });

    } else if (type === 'video') {
      // Validate video: size and duration
      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json({ message: 'Video exceeds 50MB limit' }, { status: 400 });
      }

      // get-video-duration needs a stream
      const stream = Readable.from(buffer);
      const duration = await getVideoDurationInSeconds(stream);

      if (duration > 40) {
        return NextResponse.json({ message: 'Reel must be under 40 seconds' }, { status: 400 });
      }

      const uploadResponse = await imagekit.upload({
        file: buffer,
        fileName: `${slugifiedName}-${Date.now()}.mp4`,
        folder: '/kalamic/gallery/videos/',
        useUniqueFileName: true,
      });

      return NextResponse.json({
        url: uploadResponse.url,
        fileId: uploadResponse.fileId,
        format: 'mp4',
        duration: Math.round(duration),
        thumbnailUrl: uploadResponse.thumbnailUrl
      });
    }

    return NextResponse.json({ message: 'Invalid media type' }, { status: 400 });

  } catch (error: any) {
    console.error('[UPLOAD_API_ERROR]', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
