'use server';

import dbConnect from '@/lib/db';
import Otp from '@/lib/models/Otp';
import { sendEmail } from '@/lib/email';

/**
 * Generates and stores a 6-digit OTP for the given email and sends it via SMTP.
 */
export async function sendOtp(email: string) {
  await dbConnect();
  
  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

  try {
    // Delete existing OTPs for this email to avoid confusion
    await Otp.deleteMany({ email });
    
    await Otp.create({
      email,
      code,
      expiresAt,
    });

    // Send the OTP via SMTP with an artisan-themed template
    await sendEmail({
      to: email,
      subject: "Kalamic Artisan Shop - Verification Code",
      text: `Your 6-digit verification code is: ${code}. It will expire in 5 minutes.`,
      html: `
        <div style="font-family: 'Inter', sans-serif; padding: 40px; background-color: #FAF4EB; border-radius: 24px; max-width: 600px; margin: auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #EA781E; font-size: 32px; font-weight: 800; margin: 0;">Kalamic</h1>
            <p style="color: #666; font-size: 14px; text-transform: uppercase; tracking-widest: 2px;">Handcrafted Heritage</p>
          </div>
          <div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); text-align: center;">
            <h2 style="color: #271E1B; margin-top: 0;">Verify Your Identity</h2>
            <p style="color: #666; line-height: 1.6;">Welcome to the Kalamic collection. Use the following code to verify your account and continue your artisan journey.</p>
            <div style="background: #FAF4EB; padding: 24px; border-radius: 16px; margin: 32px 0; border: 1px dashed #EA781E;">
              <span style="font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #EA781E; display: block;">${code}</span>
            </div>
            <p style="font-size: 12px; color: #999;">This code is valid for 5 minutes. If you did not request this, please ignore this email.</p>
          </div>
          <div style="text-align: center; margin-top: 30px; font-size: 11px; color: #BDA897; text-transform: uppercase; letter-spacing: 1px;">
            Secure Artisan Acquisition System
          </div>
        </div>
      `,
    });

    console.log(`[AUTH] SMTP OTP sent to ${email}`);
    
    return { success: true, message: "A verification code has been sent to your email." };
  } catch (error) {
    console.error("Error generating or sending OTP:", error);
    throw new Error("Failed to send verification code. Please try again.");
  }
}

/**
 * Verifies the OTP provided by the user.
 */
export async function verifyOtp(email: string, code: string) {
  await dbConnect();
  
  try {
    const otpRecord = await Otp.findOne({ email }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return { success: false, message: "No active verification code found." };
    }

    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return { success: false, message: "Verification code has expired." };
    }

    if (otpRecord.code !== code) {
      await Otp.updateOne({ _id: otpRecord._id }, { $inc: { attempts: 1 } });
      console.warn(`[SECURITY] Failed OTP attempt for ${email} at ${new Date().toISOString()}`);
      return { success: false, message: "Incorrect verification code." };
    }

    await Otp.deleteOne({ _id: otpRecord._id });
    return { success: true };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    throw new Error("Verification failed.");
  }
}