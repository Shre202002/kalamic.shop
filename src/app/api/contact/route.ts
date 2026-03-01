import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

/**
 * @fileOverview API Route to handle contact form submissions.
 * Sends an email notification to the studio admin using SMTP.
 */

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, message } = await req.json();

    if (!firstName || !email || !message) {
      return NextResponse.json(
        { message: 'Please provide all required fields (Name, Email, Message).' },
        { status: 400 }
      );
    }

    const adminEmail = process.env.SMTP_USER;
    if (!adminEmail) {
      throw new Error('SMTP_USER environment variable is not configured.');
    }

    // Send notification to the studio
    await sendEmail({
      to: adminEmail,
      subject: `New Artisan Inquiry: ${firstName} ${lastName}`,
      text: `Name: ${firstName} ${lastName}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
        <div style="font-family: sans-serif; padding: 30px; background-color: #FAF4EB; border-radius: 20px;">
          <h2 style="color: #EA781E; margin-top: 0;">New Studio Inquiry</h2>
          <p style="color: #444; font-size: 16px;">A collector has sent a message through the Kalamic contact form.</p>
          
          <div style="background: white; padding: 25px; border-radius: 15px; border: 1px solid #eee; margin-top: 20px;">
            <p style="margin: 0 0 10px 0;"><strong>Collector:</strong> ${firstName} ${lastName}</p>
            <p style="margin: 0 0 10px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #EA781E; text-decoration: none;">${email}</a></p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="margin: 0; white-space: pre-wrap; line-height: 1.6; color: #271E1B;">${message}</p>
          </div>
          
          <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
            This inquiry was generated from your website contact form.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: 'Message delivered successfully.' });
  } catch (error: any) {
    console.error('[CONTACT_API_ERROR]:', error.message);
    return NextResponse.json(
      { message: 'Failed to send message. Please try again later.' },
      { status: 500 }
    );
  }
}
