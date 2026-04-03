import { NextRequest, NextResponse } from 'next/server';
import { verifyOtp } from '@/lib/actions/otp-actions';
import { getOrCreateProfile } from '@/lib/actions/user-actions';
import { adminAuth, createCustomToken } from '@/lib/firebase-admin';

/**
 * @fileOverview API to verify email OTP and return a Firebase custom token.
 * Uses Firebase Admin to find or create a real user account for the email.
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
    
    if (!email || !otp) {
      return NextResponse.json(
        { message: 'Email and OTP required' }, 
        { status: 400 }
      );
    }

    const allowed = checkRateLimit(`verify:${email}`, 5, 5 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { message: 'Too many attempts. Wait 5 minutes.' }, 
        { status: 429 }
      );
    }

    // Step 1: Verify OTP via DB
    const result = await verifyOtp(email, otp);
    if (!result.success) {
      return NextResponse.json(
        { message: result.message || 'Invalid OTP' }, 
        { status: 400 }
      );
    }

    // Step 2: Get or create REAL Firebase Auth user
    if (!adminAuth) {
      return NextResponse.json(
        { message: 'Auth service unavailable. Check server environment variables.' }, 
        { status: 503 }
      );
    }

    let firebaseUid: string;
    
    try {
      // Try to find existing Firebase Auth user by email
      const existingUser = await adminAuth.getUserByEmail(email);
      firebaseUid = existingUser.uid;
      console.log('[OTP] Found existing Firebase user:', firebaseUid);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        // Create new Firebase Auth user for this verified email
        const newUser = await adminAuth.createUser({
          email: email.trim().toLowerCase(),
          emailVerified: true, // Verification via OTP counts as verified
          displayName: email.split('@')[0],
        });
        firebaseUid = newUser.uid;
        console.log('[OTP] Created new Firebase user:', firebaseUid);
      } else {
        throw err;
      }
    }

    // Step 3: Get or create MongoDB profile with REAL Firebase UID
    const profile = await getOrCreateProfile(firebaseUid, email);

    // Step 4: Create custom token for client-side login
    const customToken = await createCustomToken(firebaseUid, { role: profile.role });

    return NextResponse.json({ 
      success: true, 
      token: customToken 
    });

  } catch (error: any) {
    console.error('[OTP_VERIFY_ERROR]:', error);
    return NextResponse.json(
      { message: error.message || 'Verification failed' }, 
      { status: 500 }
    );
  }
}
