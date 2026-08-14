import { NextRequest, NextResponse } from 'next/server';
import { sendOtp } from '@/lib/actions/otp-actions';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { consumeRateLimit, requestIp } from '@/lib/security/rate-limit';

/**
 * @fileOverview API to trigger email OTP for NEW registrations.
 * Checks if email is already taken before sending.
 */

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ message: 'Email required' }, { status: 400 });

    const cleanEmail = email.trim().toLowerCase();

    const allowed = await consumeRateLimit(`otp:registration:${cleanEmail}:${requestIp(req)}`, 3, 10 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json({ 
        message: 'Too many requests. Please wait 10 minutes.' 
      }, { status: 429 });
    }

    // Block already registered emails
    await dbConnect();
    const exists = await User.findOne({ email: cleanEmail }).lean();

    if (exists) {
      return NextResponse.json({
        message: 'This email is already registered. Please sign in instead.'
      }, { status: 409 });
    }

    await sendOtp(cleanEmail);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
