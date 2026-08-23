import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireAdmin } from '@/lib/server-auth';
import { instagramConfig } from '@/lib/instagram';
import { saveInstagramOAuthConnection } from '@/lib/actions/instagram-actions';

export async function GET(req: NextRequest) {
  const redirect = new URL('/admin/gallery', req.url);
  try {
    const { session } = await requireAdmin(['super_admin', 'admin', 'support']);
    const params = new URL(req.url).searchParams;
    const code = params.get('code');
    const state = params.get('state');
    const cookieStore = await cookies();
    const expectedState = cookieStore.get('instagram_oauth_state')?.value;
    cookieStore.delete('instagram_oauth_state');
    if (!code || !state || !expectedState || state !== expectedState || !state.startsWith(`${session.uid}.`)) throw new Error('Invalid Instagram authorization state.');
    const { appId, appSecret, redirectUri } = instagramConfig();
    const form = new URLSearchParams({ client_id: appId, client_secret: appSecret, grant_type: 'authorization_code', redirect_uri: redirectUri, code });
    const response = await fetch('https://api.instagram.com/oauth/access_token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form, cache: 'no-store' });
    const body: any = await response.json().catch(() => ({}));
    if (!response.ok || !body.access_token) throw new Error(body.error_message || 'Instagram authorization failed.');
    await saveInstagramOAuthConnection(body.access_token, session.uid);
    redirect.searchParams.set('instagram', 'connected');
  } catch (error: any) {
    redirect.searchParams.set('instagram', 'error');
    redirect.searchParams.set('message', String(error.message || 'Instagram connection failed').slice(0, 160));
  }
  return NextResponse.redirect(redirect);
}
