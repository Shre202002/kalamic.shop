
import { NextRequest, NextResponse } from 'next/server';
import { getBlogBySlug } from '@/lib/actions/blog-actions';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const blog = await getBlogBySlug(slug);
    if (!blog) {
      return NextResponse.json({ message: 'Blog post not found' }, { status: 404 });
    }
    return NextResponse.json(blog);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
