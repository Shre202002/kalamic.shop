
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const adminId = searchParams.get('adminId');

  if (!adminId || !(await validateAdmin(adminId))) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  await dbConnect();
  const blog = await BlogPost.findById(id).lean();
  if (!blog) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  return NextResponse.json(blog);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { adminId, ...updateData } = body;

    if (!adminId || !(await validateAdmin(adminId))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const blog = await BlogPost.findById(id);
    if (!blog) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    // Slug generation and other logic handled by schema pre-save
    Object.assign(blog, updateData);
    await blog.save();

    return NextResponse.json(blog);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const adminId = searchParams.get('adminId');

  if (!adminId || !(await validateAdmin(adminId))) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  await dbConnect();
  await BlogPost.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
