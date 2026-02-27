import nodemailer from 'nodemailer';

/**
 * Configures the SMTP transporter using environment variables.
 * Includes diagnostic logging to help identify configuration issues.
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    // This allows connection even if the server uses a self-signed certificate,
    // which is common for some SMTP providers.
    rejectUnauthorized: false
  },
  // Increase timeout for slow relays
  connectionTimeout: 10000,
  greetingTimeout: 10000,
});

/**
 * Utility function to send an email via SMTP.
 */
export async function sendEmail({ to, subject, text, html }: { to: string; subject: string; text: string; html?: string }) {
  console.log(`[SMTP] Attempting to send email to: ${to}`);
  
  // Debug check for missing env vars
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error("[SMTP] CRITICAL: Missing SMTP environment variables.");
    throw new Error("SMTP configuration is incomplete. Check your environment variables.");
  }

  try {
    // Verify connection configuration
    await transporter.verify();
    console.log("[SMTP] Connection verified successfully.");

    const info = await transporter.sendMail({
      from: `"Kalamic Artisan Shop" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });
    
    console.log("[SMTP] Email sent successfully. MessageID:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("[SMTP] FAILED to send email:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      stack: error.stack
    });
    
    // Provide a more helpful error message based on common failure codes
    if (error.code === 'EAUTH') {
      throw new Error("SMTP Authentication failed. Please check your SMTP_USER and SMTP_PASSWORD.");
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new Error("SMTP Server connection failed. Check your SMTP_HOST and SMTP_PORT.");
    }
    
    throw new Error(`SMTP Delivery Failed: ${error.message}`);
  }
}
