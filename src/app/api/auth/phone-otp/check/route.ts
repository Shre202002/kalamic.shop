import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { consumeRateLimit, requestIp } from '@/lib/security/rate-limit';

/**
 * @fileOverview Pre-check API to verify if a phone number is registered.
 */

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    
    if (!phone) {
      return NextResponse.json(
        { message: 'Phone required' },
        { status: 400 }
      );
    }

    if (!await consumeRateLimit(`otp:phone-check:${requestIp(req)}`, 20, 10 * 60 * 1000)) {
      return NextResponse.json({ message: 'Too many requests. Please try again later.' }, { status: 429 });
    }
    
    await dbConnect();
    const user = await User.findOne({ 
      phone: phone 
    }).lean();
    
    if (!user) {
      return NextResponse.json({
        message: 'No account found with this number. Please register first.'
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true 
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
