import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { requireAdmin } from '@/lib/server-auth';
import { instagramConfig } from '@/lib/instagram';

export async function GET() {
  try {
    const { session } = await requireAdmin(['super_admin', 'admin', 'support']);
    const { appId, redirectUri } = instagramConfig();
    const state = `${session.uid}.${crypto.randomBytes(24).toString('base64url')}`;
    const cookieStore = await cookies();
    cookieStore.set('instagram_oauth_state', state, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 600, path: '/' });
    const url = new URL('https://www.instagram.com/oauth/authorize');
    url.searchParams.set('client_id', appId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('scope', 'instagram_business_basic');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('state', state);
    return NextResponse.redirect(url);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
