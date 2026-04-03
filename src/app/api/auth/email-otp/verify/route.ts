
import { NextRequest, NextResponse } from 'next/server';
import { verifyOtp } from '@/lib/actions/otp-actions';
import { getOrCreateProfile } from '@/lib/actions/user-actions';
import { createCustomToken } from '@/lib/firebase-admin';

/**
 * @fileOverview API to verify email OTP and return a Firebase custom token.
 */

const verifyLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = verifyLimitMap.get(key);
  if (!entry || entry.resetAt < now) {
    verifyLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();
    if (!email || !otp) return NextResponse.json({ message: 'Email and OTP required' }, { status: 400 });

    const allowed = checkRateLimit(`verify:${email}`, 5, 5 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json({ message: 'Too many attempts. Wait 5 minutes.' }, { status: 429 });
    }

    const result = await verifyOtp(email, otp);
    if (!result.success) {
      return NextResponse.json({ message: result.message || 'Invalid OTP' }, { status: 400 });
    }

    // OTP is valid, generate token
    // We use email as a temporary UID for the token if user doesn't exist yet, 
    // or fetch existing user profile.
    const profile = await getOrCreateProfile(email.replace(/[^a-zA-Z0-9]/g, '_'), email);
    const customToken = await createCustomToken(profile.firebaseId, { role: profile.role });

    return NextResponse.json({ success: true, token: customToken });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
