'use server';

import dbConnect from '@/lib/db';
import GalleryItem from '@/lib/models/GalleryItem';
import InstagramConnection from '@/lib/models/InstagramConnection';
import { requireAdmin } from '@/lib/server-auth';
import { decryptInstagramToken, encryptInstagramToken, instagramApiVersion, instagramConfig } from '@/lib/instagram';
import { revalidatePath } from 'next/cache';

const apiBase = () => `https://graph.instagram.com/${instagramApiVersion()}`;

async function graphGet(path: string, token: string) {
  const response = await fetch(`${apiBase()}${path}${path.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(token)}`, { cache: 'no-store' });
  const body: any = await response.json().catch(() => ({}));
  if (!response.ok || body.error) throw new Error(body.error?.message || 'Instagram API request failed.');
  return body;
}

export async function getInstagramStatus() {
  await requireAdmin(['super_admin', 'admin', 'support']);
  await dbConnect();
  const connection: any = await InstagramConnection.findOne().select('-encryptedAccessToken').lean();
  return connection ? JSON.parse(JSON.stringify(connection)) : null;
}

export async function saveInstagramOAuthConnection(shortToken: string, connectedBy: string) {
  const { appSecret } = instagramConfig();
  const longTokenResponse = await fetch(`${apiBase()}/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(appSecret)}&access_token=${encodeURIComponent(shortToken)}`, { cache: 'no-store' });
  const longTokenBody: any = await longTokenResponse.json().catch(() => ({}));
  if (!longTokenResponse.ok || !longTokenBody.access_token) throw new Error(longTokenBody.error?.message || 'Unable to create a long-lived Instagram token.');
  const profile = await graphGet('/me?fields=id,username', longTokenBody.access_token);
  await dbConnect();
  await InstagramConnection.findOneAndUpdate(
    { instagramUserId: String(profile.id) },
    { $set: { username: profile.username || 'Instagram', encryptedAccessToken: encryptInstagramToken(longTokenBody.access_token), tokenExpiresAt: new Date(Date.now() + Number(longTokenBody.expires_in || 0) * 1000), status: 'connected', lastError: '', connectedBy } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

export async function syncInstagramMedia() {
  await dbConnect();
  const connection: any = await InstagramConnection.findOne({ status: 'connected' }).select('+encryptedAccessToken');
  if (!connection) throw new Error('Instagram is not connected.');
  if (connection.tokenExpiresAt && new Date(connection.tokenExpiresAt).getTime() < Date.now()) throw new Error('Instagram access token has expired. Reconnect the account.');
  const token = decryptInstagramToken(connection.encryptedAccessToken);
  const seen = new Set<string>();
  let nextUrl: string | null = `/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username&limit=100`;
  try {
    while (nextUrl) {
      const body = await graphGet(nextUrl, token);
      for (const media of Array.isArray(body.data) ? body.data : []) {
        if (!media.id || !media.permalink) continue;
        const mediaType = String(media.media_type || '').toUpperCase();
        const isVideo = mediaType === 'VIDEO' || mediaType === 'REELS';
        const url = media.media_url || media.permalink;
        seen.add(String(media.id));
        await GalleryItem.findOneAndUpdate(
          { source: 'instagram', instagramMediaId: String(media.id) },
          { $set: {
            name: `${isVideo ? 'Instagram Reel' : 'Instagram post'} — ${media.username || connection.username}`,
            description: media.caption || 'Kalamic Instagram media',
            mediaType: isVideo ? 'video' : 'image',
            url,
            fileId: `instagram:${media.id}`,
            thumbnailUrl: media.thumbnail_url,
            format: isVideo ? 'instagram-reel' : 'instagram-image',
            altText: media.caption?.slice(0, 160) || `${connection.username} Instagram media`,
            caption: media.caption || '',
            isActive: false,
            syncStatus: 'active',
            instagramPermalink: media.permalink,
            instagramUsername: media.username || connection.username,
            instagramCaption: media.caption || '',
            instagramTimestamp: media.timestamp ? new Date(media.timestamp) : undefined,
            uploadedBy: connection.connectedBy,
            source: 'instagram',
          }, $setOnInsert: { productIds: [], isFeatured: false, sortOrder: 0 } },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );
      }
      if (body.paging?.next) {
        const next = new URL(body.paging.next);
        nextUrl = next.pathname.replace(/^\/v\d+\.\d+/, '') + next.search;
      } else nextUrl = null;
    }
    await GalleryItem.updateMany({ source: 'instagram', instagramMediaId: { $nin: [...seen] } }, { $set: { isActive: false, syncStatus: 'unavailable' } });
    await InstagramConnection.updateOne({ _id: connection._id }, { $set: { lastSyncAt: new Date(), lastError: '', status: 'connected' } });
    revalidatePath('/gallery');
    revalidatePath('/admin/gallery');
    return { imported: seen.size };
  } catch (error: any) {
    await InstagramConnection.updateOne({ _id: connection._id }, { $set: { status: 'error', lastError: String(error?.message || 'Instagram sync failed').slice(0, 500) } });
    throw error;
  }
}

export async function syncInstagramMediaAsAdmin() {
  await requireAdmin(['super_admin', 'admin', 'support']);
  return syncInstagramMedia();
}

export async function disconnectInstagram() {
  await requireAdmin(['super_admin', 'admin', 'support']);
  await dbConnect();
  await InstagramConnection.updateMany({}, { $set: { status: 'disconnected', lastError: 'Disconnected by administrator.' } });
  revalidatePath('/admin/gallery');
}
