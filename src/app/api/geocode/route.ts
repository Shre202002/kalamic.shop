import { NextRequest, NextResponse } from 'next/server';
import { consumeApiRateLimit } from '@/lib/security/rate-limit';

const cache = new Map<string, { expiresAt: number; latitude: number; longitude: number; displayAddress: string }>();

export async function POST(request: NextRequest) {
  const allowed = await consumeApiRateLimit(request, 'geocode', 10, 60_000);
  if (!allowed) return NextResponse.json({ message: 'Too many map lookups. Please wait a moment.' }, { status: 429 });

  let query = '';
  try { query = String((await request.json()).query || '').trim().slice(0, 300); } catch { return NextResponse.json({ message: 'A valid address query is required.' }, { status: 400 }); }
  if (query.length < 5) return NextResponse.json({ message: 'Enter a fuller address before searching.' }, { status: 400 });

  const key = query.toLowerCase();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return NextResponse.json({ ...cached, source: 'geocoded' });

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', '1');
    url.searchParams.set('countrycodes', 'in');
    const response = await fetch(url, { headers: { 'User-Agent': 'Kalamic.shop delivery locator/1.0 (support@kalamic.shop)', Accept: 'application/json' }, signal: AbortSignal.timeout(8000), next: { revalidate: 86400 } });
    if (!response.ok) return NextResponse.json({ message: 'The map service is temporarily unavailable. Place the pin manually.' }, { status: 502 });
    const results = await response.json();
    const result = results?.[0];
    const latitude = Number(result?.lat);
    const longitude = Number(result?.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return NextResponse.json({ message: 'No matching address was found. Place the pin manually.' }, { status: 404 });
    const payload = { latitude, longitude, displayAddress: String(result.display_name || query), source: 'geocoded' as const };
    cache.set(key, { ...payload, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ message: 'The map service could not be reached. Place the pin manually.' }, { status: 502 });
  }
}
