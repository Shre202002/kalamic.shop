import { NextRequest, NextResponse } from 'next/server';
import { sendOtp } from '@/lib/actions/otp-actions';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { consumeRateLimit, requestIp } from '@/lib/security/rate-limit';

/**
 * @fileOverview API to trigger email OTP with basic rate limiting.
 * Restricted to registered users only.
 */

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ message: 'Email required' }, { status: 400 });

    const cleanEmail = email.trim().toLowerCase();

    const allowed = await consumeRateLimit(`otp:send:${cleanEmail}:${requestIp(req)}`, 3, 10 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json({ 
        message: 'Too many requests. Please wait 10 minutes.' 
      }, { status: 429 });
    }

    // CRITICAL: Check if user exists in MongoDB before sending OTP
    await dbConnect();
    const userExists = await User.findOne({ email: cleanEmail }).lean();

    if (!userExists) {
      return NextResponse.json({
        success: false,
        message: 'No account found with this email. Please register first.'
      }, { status: 404 });
    }

    await sendOtp(cleanEmail);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
