
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * @fileOverview API to set the Firebase ID token as a secure session cookie.
 */

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    const cookieStore = await cookies();
    
    // Set cookie for 5 days
    cookieStore.set('__session', idToken, {
      maxAge: 60 * 60 * 24 * 5,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('__session');
  return NextResponse.json({ success: true });
}
