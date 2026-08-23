import { NextRequest, NextResponse } from 'next/server';
import { syncInstagramMedia } from '@/lib/actions/instagram-actions';

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  if (!secret && process.env.NODE_ENV === 'production') return NextResponse.json({ message: 'CRON_SECRET is not configured.' }, { status: 503 });
  if (secret && auth !== `Bearer ${secret}`) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  try { return NextResponse.json({ success: true, ...(await syncInstagramMedia()) }); }
  catch (error: any) { return NextResponse.json({ message: error.message }, { status: 500 }); }
}
