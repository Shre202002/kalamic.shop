import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Comment from '@/lib/models/Comment';
import { adminAuth } from '@/lib/firebase-admin';

const PROFANITY_LIST = ['spam', 'badword', 'abuse']; // Simple filter
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const rateLimitMap = new Map<string, number>();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const blogId = searchParams.get('blogId');
  
  if (!blogId) return NextResponse.json({ message: 'Blog ID required' }, { status: 400 });

  await dbConnect();
  const comments = await Comment.find({ blogId, status: 'active' })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(comments);
}

export async function POST(req: NextRequest) {
  try {
    const { blogId, content, parentId, idToken } = await req.json();

    if (!idToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    // Verify Firebase User
    const decodedToken = await adminAuth?.verifyIdToken(idToken);
    if (!decodedToken) return NextResponse.json({ message: 'Invalid token' }, { status: 401 });

    const userId = decodedToken.uid;
    const userName = decodedToken.name || decodedToken.email?.split('@')[0] || 'Collector';

    // Rate Limiting
    const now = Date.now();
    const lastComment = rateLimitMap.get(userId) || 0;
    if (now - lastComment < RATE_LIMIT_WINDOW) {
      return NextResponse.json({ message: 'Slow down! Max 1 comment per minute.' }, { status: 429 });
    }

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

    rateLimitMap.set(userId, now);

    return NextResponse.json(newComment, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ message: 'You have already posted this exact comment.' }, { status: 409 });
    }
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
