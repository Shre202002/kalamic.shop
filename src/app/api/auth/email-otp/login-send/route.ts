import { NextRequest, NextResponse } from 'next/server';
import { sendOtp } from '@/lib/actions/otp-actions';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { consumeRateLimit, requestIp } from '@/lib/security/rate-limit';

/**
 * @fileOverview API to trigger email OTP for LOGIN.
 * Verifies that the user already exists in the database.
 */

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ message: 'Email required' }, { status: 400 });

    const cleanEmail = email.trim().toLowerCase();
    if (!await consumeRateLimit(`otp:login-send:${cleanEmail}:${requestIp(req)}`, 3, 10 * 60 * 1000)) {
      return NextResponse.json({ message: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    await dbConnect();
    const userExists = await User.findOne({ email: cleanEmail }).lean();

    if (!userExists) {
      return NextResponse.json({
        success: false,
        message: 'No account found with this email. Please sign up first.'
      }, { status: 404 });
    }

    await sendOtp(cleanEmail);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[LOGIN_OTP_SEND_ERROR]:', error);
    return NextResponse.json({ message: error.message || 'Failed to send OTP' }, { status: 500 });
  }
}
