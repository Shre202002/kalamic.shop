import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Comment from '@/lib/models/Comment';
import { verifySession } from '@/lib/firebase-admin';
import { consumeApiRateLimit, consumeRateLimit, requestIp } from '@/lib/security/rate-limit';

const PROFANITY_LIST = ['spam', 'badword', 'abuse']; // Simple filter
export async function GET(req: NextRequest) {
  if (!(await consumeApiRateLimit(req, 'comments-read', 120))) return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
  const { searchParams } = new URL(req.url);
  const blogId = searchParams.get('blogId');
  
  if (!blogId || blogId.length > 100) return NextResponse.json({ message: 'Blog ID required' }, { status: 400 });

  await dbConnect();
  const comments = await Comment.find({ blogId, status: 'active' })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(comments);
}

export async function POST(req: NextRequest) {
  try {
    if (!(await consumeApiRateLimit(req, 'comments-write', 10, 60 * 60 * 1000))) return NextResponse.json({ message: 'Too many comment attempts' }, { status: 429 });
    const { blogId, content, parentId } = await req.json();

    const sessionToken = req.cookies.get('__session')?.value;
    const decodedToken = sessionToken ? await verifySession(sessionToken) : null;
    if (!decodedToken) return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    if (typeof blogId !== 'string' || blogId.length > 100 || typeof content !== 'string' || content.length > 5000) return NextResponse.json({ message: 'Invalid comment payload' }, { status: 400 });
    if (parentId !== undefined && parentId !== null && (typeof parentId !== 'string' || parentId.length > 100)) return NextResponse.json({ message: 'Invalid parent comment' }, { status: 400 });
    if (!(await consumeRateLimit(`comment-user:${decodedToken.uid}:${requestIp(req)}`, 5, 60 * 60 * 1000))) return NextResponse.json({ message: 'Too many comment attempts' }, { status: 429 });

    const userId = decodedToken.uid;
    const userName = decodedToken.name || decodedToken.email?.split('@')[0] || 'Collector';

    // Basic Spam & Profanity Filter
    let cleanContent = content.replace(/<[^>]*>/g, '').trim(); // Strip HTML
    const containsProfanity = PROFANITY_LIST.some(word => cleanContent.toLowerCase().includes(word));
    
    if (containsProfanity) {
      return NextResponse.json({ message: 'Comment contains restricted language.' }, { status: 400 });
    }

    if (cleanContent.length < 3) {
      return NextResponse.json({ message: 'Comment is too short.' }, { status: 400 });
    }

    await dbConnect();
    
    const newComment = await Comment.create({
      blogId,
      userId,
      userName,
      userAvatar: decodedToken.picture,
      content: cleanContent,
      parentId: parentId || null,
      status: 'active'
    });

    return NextResponse.json(newComment, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ message: 'You have already posted this exact comment.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Unable to post comment' }, { status: 500 });
  }
}
