
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import BlogPost from '@/lib/models/BlogPost';
import { requireAdmin } from '@/lib/server-auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  await requireAdmin(['super_admin', 'admin']);

  await dbConnect();
  const query: any = {};
  if (status) query.status = status;

  const blogs = await BlogPost.find(query).sort({ createdAt: -1 }).lean();
  return NextResponse.json(blogs);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminId: _ignoredAdminId, ...blogData } = body;
    await requireAdmin(['super_admin', 'admin']);

    await dbConnect();
    const blog = await BlogPost.create(blogData);
    return NextResponse.json(blog, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
