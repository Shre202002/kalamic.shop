import { NextRequest, NextResponse } from 'next/server';
import { verifyOtp } from '@/lib/actions/otp-actions';

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

    const result = await verifyOtp(email, otp);
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
