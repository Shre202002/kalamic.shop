import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { getOrCreateProfile } from '@/lib/actions/user-actions';

export async function POST(req: NextRequest) {
  try {
    console.log('[SESSION] Request received');
    
    const { idToken } = await req.json();
    
    if (!idToken) {
      return NextResponse.json(
        { message: 'ID token required' }, 
        { status: 400 }
      );
    }
    
    if (!adminAuth) {
      console.error('[SESSION] adminAuth is null');
      return NextResponse.json(
        { message: 'Auth service unavailable' }, 
        { status: 503 }
      );
    }
    
    // Verify the ID token
    console.log('[SESSION] Verifying token...');
    const decoded = await adminAuth.verifyIdToken(idToken);
    console.log('[SESSION] Token verified for:', decoded.email);
    
    // Get or create MongoDB profile
    const profile = await getOrCreateProfile(
      decoded.uid,
      decoded.email
    );
    console.log('[SESSION] Profile ready:', profile.role);
    
    // Set session cookie
    const response = NextResponse.json({ 
      success: true,
      role: profile.role
    });
    
    response.cookies.set('__session', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    
    return response;
    
  } catch (error: any) {
    console.error('[SESSION ERROR]:', error);
    return NextResponse.json(
      { message: error.message || 'Session creation failed' }, 
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('__session');
  return response;
}
