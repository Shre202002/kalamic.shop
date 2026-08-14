import { NextRequest, NextResponse } from 'next/server';
import { verifyOtp } from '@/lib/actions/otp-actions';
import { consumeRateLimit, requestIp } from '@/lib/security/rate-limit';

/**
 * @fileOverview Simple OTP verification endpoint for registration setup flow.
 * Does not handle session or profile creation.
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
    if (!await consumeRateLimit(`otp:verify-code:${cleanEmail}:${requestIp(req)}`, 10, 10 * 60 * 1000)) {
      return NextResponse.json({ message: 'Too many attempts. Please try again later.' }, { status: 429 });
    }

    const result = await verifyOtp(cleanEmail, otp);
    if (!result.success) {
      return NextResponse.json(
        { message: result.message || 'Invalid OTP' }, 
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Verification failed' }, 
      { status: 500 }
    );
  }
}
