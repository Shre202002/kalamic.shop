import crypto from 'crypto';

const getKey = () => {
  const raw = process.env.INSTAGRAM_TOKEN_ENCRYPTION_KEY;
  if (!raw) throw new Error('INSTAGRAM_TOKEN_ENCRYPTION_KEY is not configured.');
  return crypto.createHash('sha256').update(raw).digest();
};

export function encryptInstagramToken(token: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function decryptInstagramToken(payload: string) {
  const [ivPart, tagPart, encryptedPart] = payload.split('.');
  if (!ivPart || !tagPart || !encryptedPart) throw new Error('Invalid encrypted Instagram token.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivPart, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(encryptedPart, 'base64url')), decipher.final()]).toString('utf8');
}

export function instagramConfig() {
  const appId = process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
  if (!appId || !appSecret || !redirectUri) throw new Error('Instagram API configuration is incomplete.');
  return { appId, appSecret, redirectUri };
}

export const instagramApiVersion = () => process.env.INSTAGRAM_GRAPH_API_VERSION || 'v22.0';
