
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import BlogPost from '@/lib/models/BlogPost';
import User from '@/lib/models/User';
import { getAuthenticatedSession } from '@/lib/server-auth';

async function validateAdmin(_userId?: string) {
  const session = await getAuthenticatedSession();
  if (!session) return null;
  await dbConnect();
  const user = await User.findOne({ firebaseId: session.uid });
  return user && ['super_admin', 'admin'].includes(user.role);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const adminId = searchParams.get('adminId');
  const status = searchParams.get('status');

  if (!adminId || !(await validateAdmin(adminId))) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  await dbConnect();
  const query: any = {};
  if (status) query.status = status;

  const blogs = await BlogPost.find(query).sort({ createdAt: -1 }).lean();
  return NextResponse.json(blogs);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminId, ...blogData } = body;

    if (!adminId || !(await validateAdmin(adminId))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const blog = await BlogPost.create(blogData);
    return NextResponse.json(blog, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
