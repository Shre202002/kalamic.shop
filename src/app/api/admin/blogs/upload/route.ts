
import { NextRequest, NextResponse } from 'next/server';
import { uploadToImageKit } from '@/lib/actions/upload-actions';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || '/kalamic/blogs';

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    const result = await uploadToImageKit(formData);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
