import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { consumeApiRateLimit } from '@/lib/security/rate-limit';

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char));

/**
 * @fileOverview API Route to handle contact form submissions.
 * Sends an email notification to the studio admin using SMTP.
 */

export async function POST(req: NextRequest) {
  try {
    if (!(await consumeApiRateLimit(req, 'contact', 5, 10 * 60 * 1000))) return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
    const formData = await req.json();
    const { firstName, lastName, email, message } = formData;

    if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email) || typeof message !== 'string' || message.length < 1 || message.length > 5000) {
      return NextResponse.json(
        { message: 'Please provide all required fields.' },
        { status: 400 }
      );
    }

    const safeFirstName = escapeHtml(typeof firstName === 'string' ? firstName.slice(0, 100) : '');
    const safeLastName = escapeHtml(typeof lastName === 'string' ? lastName.slice(0, 100) : '');
    const safeEmail = escapeHtml(email.slice(0, 254));
    const safeMessage = escapeHtml(message);
    const adminEmail = 'kalamicshop@gmail.com';

    // Send notification to the studio
    await sendEmail({
      to: adminEmail,
      subject: `New Artisan Inquiry: ${safeFirstName || 'Subscriber'} ${safeLastName}`,
      text: `Name: ${safeFirstName} ${safeLastName}\nEmail: ${safeEmail}\n\nMessage:\n${safeMessage}`,
      html: `
        <div style="font-family: sans-serif; padding: 30px; background-color: #FAF4EB; border-radius: 20px;">
          <h2 style="color: #EA781E; margin-top: 0;">New Studio Inquiry</h2>
          <p style="color: #444; font-size: 16px;">A collector has sent a message through the Kalamic contact form.</p>
          
          <div style="background: white; padding: 25px; border-radius: 15px; border: 1px solid #eee; margin-top: 20px;">
            <p style="margin: 0 0 10px 0;"><strong>Collector:</strong> ${safeFirstName || 'N/A'} ${safeLastName}</p>
            <p style="margin: 0 0 10px 0;"><strong>Email:</strong> <a href="mailto:${safeEmail}" style="color: #EA781E; text-decoration: none;">${safeEmail}</a></p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="margin: 0; white-space: pre-wrap; line-height: 1.6; color: #271E1B;">${safeMessage}</p>
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
