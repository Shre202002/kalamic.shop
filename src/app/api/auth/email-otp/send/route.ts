
import { NextRequest, NextResponse } from 'next/server';
import { sendOtp } from '@/lib/actions/otp-actions';

/**
 * @fileOverview API to trigger email OTP with basic rate limiting.
 */

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ message: 'Email required' }, { status: 400 });

    const allowed = checkRateLimit(`email-otp:${email}`, 3, 10 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json({ 
        message: 'Too many requests. Please wait 10 minutes.' 
      }, { status: 429 });
    }

    await sendOtp(email);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
