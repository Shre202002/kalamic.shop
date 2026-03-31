
import { NextRequest, NextResponse } from 'next/server';
import { getPublishedBlogs } from '@/lib/actions/blog-actions';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') || undefined;
  const tag = searchParams.get('tag') || undefined;
  const limit = parseInt(searchParams.get('limit') || '100');
  const featured = searchParams.get('featured') === 'true';

  try {
    const blogs = await getPublishedBlogs({
      category,
      tag,
      limit,
      featured
    });
    return NextResponse.json(blogs);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
