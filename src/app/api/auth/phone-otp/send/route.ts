import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

/**
 * @fileOverview Server-side check for phone OTP eligibility.
 * Since Firebase Phone Auth is client-side, this acts as a 
 * pre-flight check or for custom SMS integrations.
 */

export async function POST(req: NextRequest) {
  try {
    const { phone, checkExists = true } = await req.json();

    if (checkExists) {
      await dbConnect();
      const existingUser = await User.findOne({ 
        phone: phone 
      }).lean();
      
      if (!existingUser) {
        return NextResponse.json({
          message: 'No account found with this number. Please register first.'
        }, { status: 404 });
      }
    }

    // This endpoint acts as a policy gate. 
    // The actual sending is handled by the client SDK.
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
