import { NextRequest, NextResponse } from 'next/server';
import { verifyOtp } from '@/lib/actions/otp-actions';
import { adminAuth, createCustomToken } from '@/lib/firebase-admin';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

/**
 * @fileOverview API to verify email OTP and return a Firebase custom token for login.
 */

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

    // 1. Verify OTP
    const verifyResult = await verifyOtp(cleanEmail, otp);
    if (!verifyResult.success) {
      return NextResponse.json(
        { message: verifyResult.message || 'Invalid or expired OTP' }, 
        { status: 400 }
      );
    }

    // 2. Fetch User from MongoDB
    await dbConnect();
    const user: any = await User.findOne({ email: cleanEmail }).lean();

    if (!user || !user.firebaseId) {
      return NextResponse.json({
        message: 'Data integrity issue: Account exists but identity link is missing.'
      }, { status: 500 });
    }

    // 3. Generate Custom Token
    if (!adminAuth) {
      return NextResponse.json(
        { message: 'Authentication service unavailable' }, 
        { status: 503 }
      );
    }

    const customToken = await createCustomToken(user.firebaseId, { role: user.role });

    return NextResponse.json({ 
      success: true, 
      customToken 
    });

  } catch (error: any) {
    console.error('[LOGIN_OTP_VERIFY_ERROR]:', error);
    return NextResponse.json(
      { message: error.message || 'Verification failed' }, 
      { status: 500 }
    );
  }
}
