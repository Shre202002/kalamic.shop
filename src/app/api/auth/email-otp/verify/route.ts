import { NextRequest, NextResponse } from 'next/server';
import { verifyOtp } from '@/lib/actions/otp-actions';
import { getOrCreateProfile } from '@/lib/actions/user-actions';
import { adminAuth, createCustomToken } from '@/lib/firebase-admin';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

/**
 * @fileOverview API to verify email OTP and return a Firebase custom token.
 * Restricted to registered users only.
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

    const cleanEmail = email.trim().toLowerCase();

    const allowed = checkRateLimit(`verify:${cleanEmail}`, 5, 5 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { message: 'Too many attempts. Wait 5 minutes.' }, 
        { status: 429 }
      );
    }

    // Step 1: Verify OTP via DB
    const result = await verifyOtp(cleanEmail, otp);
    if (!result.success) {
      return NextResponse.json(
        { message: result.message || 'Invalid OTP' }, 
        { status: 400 }
      );
    }

    // Step 2: Check if user exists in MongoDB first (Source of Truth)
    await dbConnect();
    const existingMongoUser: any = await User.findOne({ email: cleanEmail }).lean();

    if (!existingMongoUser) {
      return NextResponse.json({
        message: 'No account found with this email. Please register first.'
      }, { status: 404 });
    }

    // Step 3: Get or handle REAL Firebase Auth user
    if (!adminAuth) {
      return NextResponse.json(
        { message: 'Auth service unavailable. Check server environment variables.' }, 
        { status: 503 }
      );
    }

    let firebaseUid: string;
    
    try {
      // Try to find existing Firebase Auth user by email
      const existingUser = await adminAuth.getUserByEmail(cleanEmail);
      firebaseUid = existingUser.uid;
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        // Edge case: User exists in DB but not in Firebase Auth
        // Fix the gap by creating the Firebase user
        const newUser = await adminAuth.createUser({
          email: cleanEmail,
          emailVerified: true,
          displayName: existingMongoUser.firstName 
            ? `${existingMongoUser.firstName} ${existingMongoUser.lastName || ''}`.trim()
            : cleanEmail.split('@')[0],
        });
        firebaseUid = newUser.uid;
        
        // Update MongoDB with the newly created Firebase UID to maintain link
        await User.updateOne(
          { email: cleanEmail },
          { $set: { firebaseId: firebaseUid } }
        );
        
        console.log('[OTP] Fixed missing Firebase user:', firebaseUid);
      } else {
        throw err;
      }
    }

    // Step 4: Sync/Get profile and create custom token for client-side login
    const profile = await getOrCreateProfile(firebaseUid, cleanEmail);
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
