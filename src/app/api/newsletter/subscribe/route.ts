import { NextRequest, NextResponse } from 'next/server';
import { consumeApiRateLimit } from '@/lib/security/rate-limit';

/**
 * @fileOverview API Route for newsletter subscriptions.
 * In a production environment, this would integrate with Mailchimp, 
 * ConvertKit, or save to the 'subscribers' collection in MongoDB.
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await consumeApiRateLimit(req, 'newsletter', 5, 10 * 60 * 1000))) return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
    const { email } = await req.json();

    if (typeof email !== 'string' || email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { message: 'A valid artisan email is required.' },
        { status: 400 }
      );
    }

    // Simulate database delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    return NextResponse.json({ 
      success: true, 
      message: 'Welcome to the inner circle! You are now subscribed.' 
    });
  } catch (error: any) {
    console.error('[NEWSLETTER_API_ERROR]:', error.message);
    return NextResponse.json(
      { message: 'The subscription vault is temporarily unavailable.' },
      { status: 500 }
    );
  }
}
