import { NextRequest, NextResponse } from 'next/server';
import BlogPost from '@/lib/models/BlogPost';
import { requireAdmin } from '@/lib/server-auth';
import dbConnect from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(['super_admin', 'admin']);
    const { searchParams } = new URL(request.url);
    const slug = String(searchParams.get('slug') || '').trim().toLowerCase();
    const excludeId = String(searchParams.get('excludeId') || '').trim();
    if (!/^[a-z0-9-]{1,180}$/.test(slug)) return NextResponse.json({ exists: false });
    await dbConnect();
    const query: any = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    const exists = Boolean(await BlogPost.exists(query));
    return NextResponse.json({ exists });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Unable to check slug' }, { status: 500 });
  }
}
